// @ts-nocheck - Temporarily disable type checking due to drizzle-orm version conflicts
import 'server-only';

import { and, asc, count, desc, eq, gt, gte, inArray, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  companion,
  type Companion,
  mcpServer,
  type McpServer,
  organization,
  type Organization,
  companionFeedback,
  companionInteraction,
  companionPerformance,
  mcpCycleReport,
} from './schema';
import { generateHashedPassword, generateUUID } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db
      .select()
      .from(user)
      .where(eq(user.email, email) as any);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db
      .insert(user)
      .values({ email, password, plan: 'guest' })
      .returning({
        id: user.id,
        email: user.email,
      });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: any) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? (and(whereCondition, eq(chat.userId, id) as any) as any)
            : (eq(chat.userId, id) as any),
        )
        .orderBy(desc(chat.createdAt) as any)
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function deleteMessageById({
  messageId,
  chatId,
}: {
  messageId: string;
  chatId: string;
}) {
  try {
    // Primeiro, exclui os votos relacionados à mensagem
    await db
      .delete(vote)
      .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));

    // Depois, exclui a mensagem
    return await db
      .delete(message)
      .where(and(eq(message.id, messageId), eq(message.chatId, chatId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete message by id',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const hours =
      typeof differenceInHours === 'string'
        ? Number.parseInt(differenceInHours)
        : differenceInHours;
    const twentyFourHoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Companions CRUD operations
export async function createCompanion({
  name,
  role,
  responsibilities,
  expertises,
  sources,
  rules,
  contentPolicy,
  skills,
  fallbacks,
  organizationId,
  positionId,
  linkedTeamId,
  userId,
}: {
  name: string;
  role: string;
  responsibilities: string[];
  expertises: Array<{ area: string; topics: string[] }>;
  sources: Array<{ type: string; description: string }>;
  rules: Array<{ type: string; description: string }>;
  contentPolicy: { allowed: string[]; disallowed: string[] };
  skills?: Array<any>;
  fallbacks?: { ambiguous?: string; out_of_scope?: string; unknown?: string };
  organizationId?: string;
  positionId?: string;
  linkedTeamId?: string;
  userId: string;
}) {
  try {
    return await db
      .insert(companion)
      .values({
        name,
        role,
        responsibilities,
        expertises,
        sources,
        rules,
        contentPolicy,
        skills,
        fallbacks,
        organizationId,
        positionId,
        linkedTeamId,
        userId,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create companion',
    );
  }
}

export async function getCompanionsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(companion)
      .where(eq(companion.userId, userId))
      .orderBy(desc(companion.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companions by user id',
    );
  }
}

export async function getCompanionsByOrganizationId({
  organizationId,
  userId,
}: { organizationId: string; userId: string }) {
  try {
    return await db
      .select()
      .from(companion)
      .where(
        and(
          eq(companion.organizationId, organizationId),
          eq(companion.userId, userId),
        ),
      )
      .orderBy(desc(companion.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companions by organization id',
    );
  }
}

export async function getCompanionById({ id }: { id: string }) {
  try {
    const [companionResult] = await db
      .select()
      .from(companion)
      .where(eq(companion.id, id))
      .limit(1);

    return companionResult;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companion by id',
    );
  }
}

export async function updateCompanion({
  id,
  name,
  role,
  responsibilities,
  expertises,
  sources,
  rules,
  contentPolicy,
  skills,
  fallbacks,
  organizationId,
  positionId,
  linkedTeamId,
  userId,
}: {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  expertises: Array<{ area: string; topics: string[] }>;
  sources: Array<{ type: string; description: string }>;
  rules: Array<{ type: string; description: string }>;
  contentPolicy: { allowed: string[]; disallowed: string[] };
  skills?: Array<any>;
  fallbacks?: { ambiguous?: string; out_of_scope?: string; unknown?: string };
  organizationId?: string;
  positionId?: string;
  linkedTeamId?: string;
  userId: string;
}) {
  try {
    return await db
      .update(companion)
      .set({
        name,
        role,
        responsibilities,
        expertises,
        sources,
        rules,
        contentPolicy,
        skills,
        fallbacks,
        organizationId,
        positionId,
        linkedTeamId,
        updatedAt: new Date(),
      })
      .where(and(eq(companion.id, id), eq(companion.userId, userId)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update companion',
    );
  }
}

export async function deleteCompanion({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    return await db
      .delete(companion)
      .where(and(eq(companion.id, id), eq(companion.userId, userId)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete companion',
    );
  }
}

// MCP Servers CRUD operations
export async function createMcpServer({
  name,
  url,
  transport,
  description,
  authType,
  authToken,
  authUsername,
  authPassword,
  authHeaderName,
  userId,
}: {
  name: string;
  url: string;
  transport: 'sse' | 'stdio';
  description?: string;
  authType?: 'none' | 'bearer' | 'basic' | 'apikey';
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authHeaderName?: string;
  userId: string;
}) {
  try {
    return await db
      .insert(mcpServer)
      .values({
        name,
        url,
        transport,
        description,
        authType: authType || 'none',
        authToken,
        authUsername,
        authPassword,
        authHeaderName,
        userId,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create MCP server',
    );
  }
}

export async function getMcpServersByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.userId, userId))
      .orderBy(desc(mcpServer.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP servers by user id',
    );
  }
}

export async function getActiveMcpServersByUserId({
  userId,
}: { userId: string }) {
  try {
    return await db
      .select()
      .from(mcpServer)
      .where(and(eq(mcpServer.userId, userId), eq(mcpServer.isActive, true)))
      .orderBy(desc(mcpServer.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active MCP servers by user id',
    );
  }
}

export async function getMcpServerById({ id }: { id: string }) {
  try {
    const [mcpServerResult] = await db
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.id, id))
      .limit(1);

    return mcpServerResult;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP server by id',
    );
  }
}

export async function updateMcpServer({
  id,
  name,
  url,
  transport,
  description,
  isActive,
  authType,
  authToken,
  authUsername,
  authPassword,
  authHeaderName,
  userId,
}: {
  id: string;
  name: string;
  url: string;
  transport: 'sse' | 'stdio';
  description?: string;
  isActive: boolean;
  authType?: 'none' | 'bearer' | 'basic' | 'apikey';
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authHeaderName?: string;
  userId: string;
}) {
  try {
    return await db
      .update(mcpServer)
      .set({
        name,
        url,
        transport,
        description,
        isActive,
        authType,
        authToken,
        authUsername,
        authPassword,
        authHeaderName,
        updatedAt: new Date(),
      })
      .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update MCP server',
    );
  }
}

export async function deleteMcpServer({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    return await db
      .delete(mcpServer)
      .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete MCP server',
    );
  }
}

export async function updateMcpServerConnectionStatus({
  id,
  isConnected,
  connectionError,
}: {
  id: string;
  isConnected: boolean;
  connectionError?: string | null;
}) {
  try {
    return await db
      .update(mcpServer)
      .set({
        isConnected,
        lastConnectionTest: new Date(),
        connectionError,
        updatedAt: new Date(),
      })
      .where(eq(mcpServer.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update MCP server connection status',
    );
  }
}

// Organization queries
export async function createOrganization(
  name: string,
  description: string,
  tenantConfig: any,
  values: any[],
  teams: any[],
  positions: any[],
  orgUsers: any[],
  userId: string,
): Promise<Organization> {
  try {
    const [newOrganization] = await db
      .insert(organization)
      .values({
        name,
        description,
        tenantConfig,
        values,
        teams,
        positions,
        orgUsers,
        userId,
      })
      .returning();

    return newOrganization;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getOrganizationsByUserId(
  userId: string,
): Promise<Organization[]> {
  try {
    return await db
      .select()
      .from(organization)
      .where(eq(organization.userId, userId))
      .orderBy(desc(organization.createdAt));
  } catch (error) {
    console.error('Failed to get organizations by user ID:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getOrganizationById(
  id: string,
  userId: string,
): Promise<Organization | null> {
  try {
    const [org] = await db
      .select()
      .from(organization)
      .where(and(eq(organization.id, id), eq(organization.userId, userId)));

    return org || null;
  } catch (error) {
    console.error('Failed to get organization by ID:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function updateOrganization(
  id: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    tenantConfig?: any;
    values?: any[];
    teams?: any[];
    positions?: any[];
    orgUsers?: any[];
  },
): Promise<Organization | null> {
  try {
    const [updatedOrganization] = await db
      .update(organization)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(organization.id, id), eq(organization.userId, userId)))
      .returning();

    return updatedOrganization || null;
  } catch (error) {
    console.error('Failed to update organization:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function deleteOrganization(
  id: string,
  userId: string,
): Promise<void> {
  try {
    // Primeiro, deletar todos os companions vinculados a esta organização
    await db.delete(companion).where(eq(companion.organizationId, id));

    // Depois, deletar a organização
    const result = await db
      .delete(organization)
      .where(and(eq(organization.id, id), eq(organization.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new ChatSDKError(
        'not_found:database',
        'Organization not found or access denied',
      );
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    console.error('Error deleting organization:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete organization',
    );
  }
}

// Novas funções para lógica de primeiro login e master admin

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [foundUser] = await db.select().from(user).where(eq(user.id, id));
    return foundUser || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by id');
  }
}

export async function updateUserEmail(
  currentEmail: string,
  newEmail: string,
): Promise<User | null> {
  try {
    const [updatedUser] = await db
      .update(user)
      .set({ email: newEmail })
      .where(eq(user.email, currentEmail))
      .returning();

    return updatedUser || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user email',
    );
  }
}

export async function checkUserHasOrganization(
  userId: string,
): Promise<boolean> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(organization)
      .where(eq(organization.userId, userId));

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check user organizations',
    );
  }
}

export async function createDefaultOrganization(
  userId: string,
  userEmail: string,
): Promise<Organization> {
  try {
    const orgName = `org_${userEmail}`;
    const defaultTenantConfig = {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      llm_provider: 'azure-openai',
      default_model: 'gpt-4o',
    };

    const [newOrganization] = await db
      .insert(organization)
      .values({
        name: orgName,
        description:
          'Organização criada automaticamente. Você pode editar o nome e descrição.',
        tenantConfig: defaultTenantConfig,
        values: [],
        teams: [],
        positions: [],
        orgUsers: [
          {
            user_id: userId,
            position_id: 'admin',
            role: 'admin',
            permissions: [
              'read_org',
              'write_org',
              'manage_companions',
              'manage_users',
            ],
          },
        ],
        userId,
      })
      .returning();

    return newOrganization;
  } catch (error) {
    console.error('Error creating default organization:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create default organization',
    );
  }
}

export async function getOrganizationsForUser(
  userId: string,
  isMasterAdmin: boolean,
): Promise<Organization[]> {
  try {
    if (isMasterAdmin) {
      // Master admin vê todas as organizações
      return await db
        .select()
        .from(organization)
        .orderBy(desc(organization.createdAt));
    } else {
      // Usuário normal vê apenas suas organizações
      return await db
        .select()
        .from(organization)
        .where(eq(organization.userId, userId))
        .orderBy(desc(organization.createdAt));
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get organizations for user',
    );
  }
}

export async function checkCanCreateOrganization(
  userId: string,
): Promise<boolean> {
  try {
    const [foundUser] = await db
      .select({ isMasterAdmin: user.isMasterAdmin })
      .from(user)
      .where(eq(user.id, userId));

    return foundUser?.isMasterAdmin || false;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check user permissions',
    );
  }
}

// ==================== COMPANION FEEDBACK FUNCTIONS ====================

export async function createCompanionFeedback({
  companionId,
  userId,
  type,
  category,
  rating,
  comment,
  interactionId,
  metadata,
}: {
  companionId: string;
  userId: string;
  type: 'positive' | 'negative' | 'suggestion';
  category: 'accuracy' | 'helpfulness' | 'relevance' | 'tone' | 'completeness';
  rating: number;
  comment: string;
  interactionId?: string;
  metadata?: any;
}) {
  try {
    const [feedback] = await db
      .insert(companionFeedback)
      .values({
        companionId,
        userId,
        type,
        category,
        rating: rating.toString(),
        comment,
        interactionId,
        metadata,
      })
      .returning();

    return feedback;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create companion feedback',
    );
  }
}

export async function getCompanionFeedback(companionId: string) {
  try {
    return await db
      .select()
      .from(companionFeedback)
      .where(eq(companionFeedback.companionId, companionId))
      .orderBy(desc(companionFeedback.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companion feedback',
    );
  }
}

// ==================== COMPANION INTERACTION FUNCTIONS ====================

export async function createCompanionInteraction({
  companionId,
  userId,
  chatId,
  messageId,
  type,
  context,
  response,
  duration,
  tokensUsed,
  success = true,
}: {
  companionId: string;
  userId: string;
  chatId?: string;
  messageId?: string;
  type: 'question' | 'task' | 'consultation' | 'feedback_request';
  context?: any;
  response?: any;
  duration?: string;
  tokensUsed?: string;
  success?: boolean;
}) {
  try {
    const [interaction] = await db
      .insert(companionInteraction)
      .values({
        companionId,
        userId,
        chatId,
        messageId,
        type,
        context,
        response,
        duration,
        tokens_used: tokensUsed,
        success,
      })
      .returning();

    return interaction;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create companion interaction',
    );
  }
}

export async function getCompanionInteractions(companionId: string) {
  try {
    return await db
      .select()
      .from(companionInteraction)
      .where(eq(companionInteraction.companionId, companionId))
      .orderBy(desc(companionInteraction.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companion interactions',
    );
  }
}

// ==================== COMPANION PERFORMANCE FUNCTIONS ====================

export async function updateCompanionPerformance(
  companionId: string,
  updates: {
    averageRating?: number;
    totalFeedback?: number;
    positiveFeedbackRate?: number;
    lastFeedbackAt?: Date;
    totalInteractions?: number;
    averageResponseTime?: number;
    successRate?: number;
    lastInteractionAt?: Date;
    lastMcpCycleAt?: Date;
    mcpScore?: number;
    improvementTrend?: 'improving' | 'stable' | 'declining' | 'unknown';
  },
) {
  try {
    // Verificar se já existe registro de performance
    const [existingPerformance] = await db
      .select()
      .from(companionPerformance)
      .where(eq(companionPerformance.companionId, companionId));

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.averageRating !== undefined) {
      updateData.averageRating = updates.averageRating.toString();
    }
    if (updates.totalFeedback !== undefined) {
      updateData.totalFeedback = updates.totalFeedback.toString();
    }
    if (updates.positiveFeedbackRate !== undefined) {
      updateData.positiveFeedbackRate = updates.positiveFeedbackRate.toString();
    }
    if (updates.lastFeedbackAt) {
      updateData.lastFeedbackAt = updates.lastFeedbackAt;
    }
    if (updates.totalInteractions !== undefined) {
      updateData.totalInteractions = updates.totalInteractions.toString();
    }
    if (updates.averageResponseTime !== undefined) {
      updateData.averageResponseTime = updates.averageResponseTime.toString();
    }
    if (updates.successRate !== undefined) {
      updateData.successRate = updates.successRate.toString();
    }
    if (updates.lastInteractionAt) {
      updateData.lastInteractionAt = updates.lastInteractionAt;
    }
    if (updates.lastMcpCycleAt) {
      updateData.lastMcpCycleAt = updates.lastMcpCycleAt;
    }
    if (updates.mcpScore !== undefined) {
      updateData.mcpScore = updates.mcpScore.toString();
    }
    if (updates.improvementTrend) {
      updateData.improvementTrend = updates.improvementTrend;
    }

    if (existingPerformance) {
      // Atualizar registro existente
      const [updated] = await db
        .update(companionPerformance)
        .set(updateData)
        .where(eq(companionPerformance.companionId, companionId))
        .returning();

      return updated;
    } else {
      // Criar novo registro
      const [created] = await db
        .insert(companionPerformance)
        .values({
          companionId,
          ...updateData,
        })
        .returning();

      return created;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update companion performance',
    );
  }
}

export async function getCompanionPerformance(companionId: string) {
  try {
    const [performance] = await db
      .select()
      .from(companionPerformance)
      .where(eq(companionPerformance.companionId, companionId));

    return performance;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companion performance',
    );
  }
}

// ==================== MCP CYCLE FUNCTIONS ====================

export async function createMCPCycleReport(reportData: {
  companionId: string;
  cycleDate: Date;
  metrics: any;
  analysis: any;
  recommendations: any[];
  nextSteps: any[];
  improvementSuggestions?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedBy?: string;
}) {
  try {
    const [report] = await db
      .insert(mcpCycleReport)
      .values(reportData)
      .returning();

    return report;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create MCP cycle report',
    );
  }
}

export async function getMCPCycleReports(companionId: string) {
  try {
    return await db
      .select()
      .from(mcpCycleReport)
      .where(eq(mcpCycleReport.companionId, companionId))
      .orderBy(desc(mcpCycleReport.cycleDate));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP cycle reports',
    );
  }
}

export async function getLatestMCPCycleReport(companionId: string) {
  try {
    const [report] = await db
      .select()
      .from(mcpCycleReport)
      .where(eq(mcpCycleReport.companionId, companionId))
      .orderBy(desc(mcpCycleReport.cycleDate))
      .limit(1);

    return report;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get latest MCP cycle report',
    );
  }
}

// ==================== ANALYTICS FUNCTIONS ====================

export async function getCompanionAnalytics(companionId: string) {
  try {
    // Buscar dados de performance
    const performance = await getCompanionPerformance(companionId);

    // Buscar feedback recente
    const recentFeedback = await db
      .select()
      .from(companionFeedback)
      .where(eq(companionFeedback.companionId, companionId))
      .orderBy(desc(companionFeedback.createdAt))
      .limit(10);

    // Buscar interações recentes
    const recentInteractions = await db
      .select()
      .from(companionInteraction)
      .where(eq(companionInteraction.companionId, companionId))
      .orderBy(desc(companionInteraction.createdAt))
      .limit(20);

    // Buscar último relatório MCP
    const latestMcpReport = await getLatestMCPCycleReport(companionId);

    return {
      performance,
      recentFeedback,
      recentInteractions,
      latestMcpReport,
      summary: {
        totalFeedback: recentFeedback.length,
        averageRating:
          recentFeedback.length > 0
            ? recentFeedback.reduce(
                (sum, f) => sum + Number.parseInt(f.rating),
                0,
              ) / recentFeedback.length
            : 0,
        totalInteractions: recentInteractions.length,
        lastActivity: recentInteractions[0]?.createdAt || null,
      },
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get companion analytics',
    );
  }
}

export async function getUserPlanAndMessagesSent(
  userId: string,
): Promise<{ plan: string; messagesSent: number }> {
  try {
    const [result] = await db
      .select({ plan: user.plan, messagesSent: user.messagesSent })
      .from(user)
      .where(eq(user.id, userId));
    if (!result) throw new Error('Usuário não encontrado');
    return result;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user plan/messagesSent',
    );
  }
}

export async function incrementUserMessagesSent(userId: string): Promise<void> {
  try {
    // Buscar valor atual
    const [result] = await db
      .select({ messagesSent: user.messagesSent })
      .from(user)
      .where(eq(user.id, userId));
    const current = result?.messagesSent ?? 0;
    await db
      .update(user)
      .set({ messagesSent: current + 1 })
      .where(eq(user.id, userId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment user messagesSent',
    );
  }
}
