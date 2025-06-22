import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
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
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
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
    return await db.select().from(user).where(eq(user.email, email));
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
    return await db.insert(user).values({ email, password }).returning({
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

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
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
      .where(
        and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)),
      );

    // Depois, exclui a mensagem
    return await db
      .delete(message)
      .where(
        and(eq(message.id, messageId), eq(message.chatId, chatId)),
      );
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
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

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
  expertises: Array<{area: string; topics: string[]}>;
  sources: Array<{type: string; description: string}>;
  rules: Array<{type: string; description: string}>;
  contentPolicy: {allowed: string[]; disallowed: string[]};
  skills?: Array<any>;
  fallbacks?: {ambiguous?: string; out_of_scope?: string; unknown?: string};
  organizationId?: string;
  positionId?: string;
  linkedTeamId?: string;
  userId: string;
}) {
  try {
    return await db.insert(companion).values({
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
    }).returning();
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

export async function getCompanionsByOrganizationId({ organizationId, userId }: { organizationId: string; userId: string }) {
  try {
    return await db
      .select()
      .from(companion)
      .where(and(
        eq(companion.organizationId, organizationId),
        eq(companion.userId, userId)
      ))
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
  expertises: Array<{area: string; topics: string[]}>;
  sources: Array<{type: string; description: string}>;
  rules: Array<{type: string; description: string}>;
  contentPolicy: {allowed: string[]; disallowed: string[]};
  skills?: Array<any>;
  fallbacks?: {ambiguous?: string; out_of_scope?: string; unknown?: string};
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
    return await db.insert(mcpServer).values({
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
    }).returning();
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

export async function getActiveMcpServersByUserId({ userId }: { userId: string }) {
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

export async function getOrganizationsByUserId(userId: string): Promise<Organization[]> {
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

export async function getOrganizationById(id: string, userId: string): Promise<Organization | null> {
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

export async function deleteOrganization(id: string, userId: string): Promise<void> {
  try {
    await db
      .delete(organization)
      .where(and(eq(organization.id, id), eq(organization.userId, userId)));
  } catch (error) {
    console.error('Failed to delete organization:', error);
    throw new ChatSDKError('bad_request:database');
  }
}
