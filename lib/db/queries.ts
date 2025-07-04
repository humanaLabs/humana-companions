// @ts-nocheck - Temporarily disable type checking due to drizzle-orm version conflicts
import 'server-only';

import { and, asc, count, desc, eq, gt, gte, inArray, lt, sql } from 'drizzle-orm';
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
  mcpServer,
  organization,
  type Organization,
  companionFeedback,
  companionInteraction,
  companionPerformance,
  mcpCycleReport,
  userQuotas,
  usageTracking,
  quotaAlerts,
} from './schema';
import { generateHashedPassword, generateUUID } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import {
  GUEST_ORGANIZATION_ID,
  DEFAULT_ORGANIZATION_ID,
  SYSTEM_USER_ID,
} from '@/lib/constants';

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
  organizationId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  organizationId: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      organizationId,
    });
  } catch (error) {
    console.error('❌ Erro ao salvar chat:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ 
  id, 
  organizationId 
}: { 
  id: string;
  organizationId: string;
}) {
  try {
    // Aplicar padrão de segurança unificado - verificar se o chat pertence à organização
    const [chatToDelete] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.organizationId, organizationId)));

    if (!chatToDelete) {
      throw new ChatSDKError(
        'not_found:database',
        'Chat not found or access denied',
      );
    }

    // Deletar com isolamento de segurança
    await db.delete(vote).where(and(eq(vote.chatId, id), eq(vote.organizationId, organizationId)));
    await db.delete(message).where(and(eq(message.chatId, id), eq(message.organizationId, organizationId)));
    await db.delete(stream).where(and(eq(stream.chatId, id), eq(stream.organizationId, organizationId)));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(and(eq(chat.id, id), eq(chat.organizationId, organizationId)))
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
  organizationId,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  organizationId: string;
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
            ? (and(
                whereCondition,
                eq(chat.userId, id),
                eq(chat.organizationId, organizationId)
              ) as any)
            : (and(
                eq(chat.userId, id),
                eq(chat.organizationId, organizationId)
              ) as any),
        )
        .orderBy(desc(chat.createdAt) as any)
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(
          and(
            eq(chat.id, startingAfter),
            eq(chat.organizationId, organizationId)
          )
        )
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
        .where(
          and(
            eq(chat.id, endingBefore),
            eq(chat.organizationId, organizationId)
          )
        )
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

export async function getChatById({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  try {
    console.log(
      `🔍 DEBUG: Buscando chat com ID: ${id}`,
      organizationId ? `e orgId: ${organizationId}` : '',
    );

    const [selectedChat] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.organizationId, organizationId)));

    if (!selectedChat) {
      console.log(`⚠️ DEBUG: Chat ${id} não encontrado no banco`);
      return null;
    }

    console.log(`✅ DEBUG: Chat ${id} encontrado:`, {
      id: selectedChat.id,
      title: selectedChat.title,
      userId: selectedChat.userId,
      organizationId: selectedChat.organizationId,
      visibility: selectedChat.visibility,
    });

    return selectedChat;
  } catch (error) {
    console.error(`❌ DEBUG: Erro ao buscar chat ${id}:`, error);
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

export async function getMessagesByChatId({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(message)
      .where(
        and(eq(message.chatId, id), eq(message.organizationId, organizationId)),
      )
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
  organizationId,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
  organizationId: string;
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(
        and(
          eq(vote.messageId, messageId),
          eq(vote.organizationId, organizationId),
        ),
      );

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(
          and(
            eq(vote.messageId, messageId),
            eq(vote.chatId, chatId),
            eq(vote.organizationId, organizationId),
          ),
        );
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
      organizationId,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(vote)
      .where(and(eq(vote.chatId, id), eq(vote.organizationId, organizationId)));
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
  organizationId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  organizationId: string;
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
        organizationId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ 
  id, 
  organizationId 
}: { 
  id: string;
  organizationId: string;
}) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(
        and(
          eq(document.id, id),
          eq(document.organizationId, organizationId)
        )
      )
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(
        and(eq(document.id, id), eq(document.organizationId, organizationId)),
      )
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
  organizationId,
}: {
  id: string;
  timestamp: Date;
  organizationId: string;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
          eq(suggestion.organizationId, organizationId)
        ),
      );

    return await db
      .delete(document)
      .where(
        and(
          eq(document.id, id), 
          gt(document.createdAt, timestamp),
          eq(document.organizationId, organizationId)
        )
      )
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
  organizationId,
}: {
  documentId: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(
        and(
          eq(suggestion.documentId, documentId),
          eq(suggestion.organizationId, organizationId),
        ),
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(message)
      .where(
        and(eq(message.id, id), eq(message.organizationId, organizationId)),
      );
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
  organizationId,
}: {
  chatId: string;
  timestamp: Date;
  organizationId: string;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(
          eq(message.chatId, chatId),
          gte(message.createdAt, timestamp),
          eq(message.organizationId, organizationId),
        ),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(
            eq(vote.chatId, chatId),
            inArray(vote.messageId, messageIds),
            eq(vote.organizationId, organizationId),
          ),
        );

      return await db
        .delete(message)
        .where(
          and(
            eq(message.chatId, chatId),
            inArray(message.id, messageIds),
            eq(message.organizationId, organizationId),
          ),
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
  organizationId,
}: {
  messageId: string;
  chatId: string;
  organizationId: string;
}) {
  try {
    // Primeiro, exclui os votos relacionados à mensagem
    await db
      .delete(vote)
      .where(
        and(
          eq(vote.messageId, messageId),
          eq(vote.chatId, chatId),
          eq(vote.organizationId, organizationId),
        ),
      );

    // Depois, exclui a mensagem
    return await db
      .delete(message)
      .where(
        and(
          eq(message.id, messageId),
          eq(message.chatId, chatId),
          eq(message.organizationId, organizationId),
        ),
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
  organizationId,
}: {
  chatId: string;
  visibility: 'private' | 'public';
  organizationId: string;
}) {
  try {
    return await db
      .update(chat)
      .set({ visibility })
      .where(and(eq(chat.id, chatId), eq(chat.organizationId, organizationId)));
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
  organizationId,
}: {
  streamId: string;
  chatId: string;
  organizationId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, organizationId, createdAt: new Date() });
  } catch (error) {
    console.error('❌ Erro ao criar stream ID:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ 
  chatId, 
  organizationId 
}: { 
  chatId: string;
  organizationId: string;
}) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(and(eq(stream.chatId, chatId), eq(stream.organizationId, organizationId)))
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

export async function getCompanionsByUserId({ 
  userId, 
  organizationId 
}: { 
  userId: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(companion)
      .where(and(eq(companion.userId, userId), eq(companion.organizationId, organizationId)))
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

export async function getCompanionById({ 
  id, 
  organizationId 
}: { 
  id: string;
  organizationId: string;
}) {
  try {
    const [companionResult] = await db
      .select()
      .from(companion)
      .where(
        and(
          eq(companion.id, id),
          eq(companion.organizationId, organizationId)
        )
      )
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

export async function getMcpServersByUserId({ 
  userId, 
  organizationId 
}: { 
  userId: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(mcpServer)
      .where(and(eq(mcpServer.userId, userId), eq(mcpServer.organizationId, organizationId)))
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
  organizationId,
}: { 
  userId: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(mcpServer)
      .where(and(
        eq(mcpServer.userId, userId), 
        eq(mcpServer.isActive, true),
        eq(mcpServer.organizationId, organizationId)
      ))
      .orderBy(desc(mcpServer.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active MCP servers by user id',
    );
  }
}

export async function getMcpServerById({ 
  id, 
  organizationId 
}: { 
  id: string;
  organizationId: string;
}) {
  try {
    const [mcpServerResult] = await db
      .select()
      .from(mcpServer)
      .where(
        and(
          eq(mcpServer.id, id),
          eq(mcpServer.organizationId, organizationId)
        )
      )
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
  organizationId,
}: {
  id: string;
  isConnected: boolean;
  connectionError?: string | null;
  organizationId: string;
}) {
  try {
    // Verificar se o server existe e pertence à organização
    const [serverToUpdate] = await db
      .select()
      .from(mcpServer)
      .where(and(eq(mcpServer.id, id), eq(mcpServer.organizationId, organizationId)));

    if (!serverToUpdate) {
      throw new ChatSDKError(
        'not_found:database',
        'MCP Server not found or access denied',
      );
    }

    const [updatedServer] = await db
      .update(mcpServer)
      .set({
        isConnected,
        connectionError,
        lastConnectionAt: new Date(),
      })
      .where(and(eq(mcpServer.id, id), eq(mcpServer.organizationId, organizationId)))
      .returning();

    return updatedServer;
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

export async function getCompanionFeedback(
  companionId: string, 
  organizationId: string
) {
  try {
    return await db
      .select()
      .from(companionFeedback)
      .where(and(
        eq(companionFeedback.companionId, companionId),
        eq(companionFeedback.organizationId, organizationId)
      ))
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

export async function getCompanionInteractions(
  companionId: string, 
  organizationId: string
) {
  try {
    return await db
      .select()
      .from(companionInteraction)
      .where(and(
        eq(companionInteraction.companionId, companionId),
        eq(companionInteraction.organizationId, organizationId)
      ))
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

export async function getCompanionPerformance(
  companionId: string, 
  organizationId: string
) {
  try {
    const [performance] = await db
      .select()
      .from(companionPerformance)
      .where(and(
        eq(companionPerformance.companionId, companionId),
        eq(companionPerformance.organizationId, organizationId)
      ));

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

export async function getMCPCycleReports(
  companionId: string, 
  organizationId: string
) {
  try {
    return await db
      .select()
      .from(mcpCycleReport)
      .where(and(
        eq(mcpCycleReport.companionId, companionId),
        eq(mcpCycleReport.organizationId, organizationId)
      ))
      .orderBy(desc(mcpCycleReport.cycleDate));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP cycle reports',
    );
  }
}

export async function getLatestMCPCycleReport(
  companionId: string, 
  organizationId: string
) {
  try {
    const [report] = await db
      .select()
      .from(mcpCycleReport)
      .where(and(
        eq(mcpCycleReport.companionId, companionId),
        eq(mcpCycleReport.organizationId, organizationId)
      ))
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

export async function getCompanionAnalytics(
  companionId: string, 
  organizationId: string
) {
  try {
    // Buscar dados de performance
    const performance = await getCompanionPerformance(companionId, organizationId);

    // Buscar feedback recente
    const feedback = await db
      .select()
      .from(companionFeedback)
      .where(and(
        eq(companionFeedback.companionId, companionId),
        eq(companionFeedback.organizationId, organizationId)
      ))
      .orderBy(desc(companionFeedback.createdAt))
      .limit(10);

    // Buscar interações recentes
    const interactions = await db
      .select()
      .from(companionInteraction)
      .where(and(
        eq(companionInteraction.companionId, companionId),
        eq(companionInteraction.organizationId, organizationId)
      ))
      .orderBy(desc(companionInteraction.createdAt))
      .limit(20);

    // Buscar último relatório MCP
    const latestMcpReport = await getLatestMCPCycleReport(companionId, organizationId);

    return {
      performance,
      recentFeedback: feedback,
      recentInteractions: interactions,
      latestMcpReport,
      analyticsGeneratedAt: new Date(),
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

export async function ensureGuestOrganization(): Promise<string> {
  const guestOrgId = GUEST_ORGANIZATION_ID;

  try {
    // Check if guest org exists
    const [existingOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, guestOrgId));

    if (existingOrg) {
      return guestOrgId;
    }

    // Create guest org if it doesn't exist
    await db
      .insert(organization)
      .values({
        id: guestOrgId,
        name: 'Guest Organization',
        description: 'Organização padrão para usuários guest e temporários',
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
        values: [],
        teams: [],
        positions: [],
        orgUsers: [],
        userId: SYSTEM_USER_ID,
      })
      .onConflictDoNothing();

    return guestOrgId;
  } catch (error) {
    console.error('Error ensuring guest organization:', error);
    return guestOrgId; // Return ID even if creation fails
  }
}

export async function ensureDefaultOrganization(): Promise<string> {
  const defaultOrgId = DEFAULT_ORGANIZATION_ID;

  try {
    // Check if default org exists
    const [existingOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, defaultOrgId));

    if (existingOrg) {
      return defaultOrgId;
    }

    // Create default org if it doesn't exist
    await db
      .insert(organization)
      .values({
        id: defaultOrgId,
        name: 'Organização Padrão',
        description:
          'Organização padrão para usuários cadastrados que não possuem organização específica',
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
        values: [
          {
            name: 'Colaboração',
            description: 'Trabalhar em equipe de forma eficiente',
          },
          { name: 'Inovação', description: 'Buscar sempre novas soluções' },
          {
            name: 'Qualidade',
            description: 'Entregar o melhor resultado possível',
          },
        ],
        teams: [
          {
            id: 'general',
            name: 'Geral',
            description: 'Equipe geral da organização',
          },
        ],
        positions: [
          {
            id: 'member',
            name: 'Membro',
            description: 'Membro da organização',
          },
          {
            id: 'admin',
            name: 'Administrador',
            description: 'Administrador da organização',
          },
        ],
        orgUsers: [],
        userId: SYSTEM_USER_ID,
      })
      .onConflictDoNothing();

    return defaultOrgId;
  } catch (error) {
    console.error('Error ensuring default organization:', error);
    return defaultOrgId; // Return ID even if creation fails
  }
}

export async function getOrganizationForUser(
  userId: string,
  userType: 'guest' | 'regular' | 'free' | 'pro',
  currentOrgId?: string | null,
): Promise<string> {
  try {
    // 1. Se já tem uma organização válida no contexto, usa ela
    if (
      currentOrgId &&
      currentOrgId !== GUEST_ORGANIZATION_ID &&
      currentOrgId !== DEFAULT_ORGANIZATION_ID
    ) {
      const [org] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, currentOrgId));

      if (org) {
        console.log(
          `✅ Usuário ${userId} usando organização específica: ${currentOrgId}`,
        );
        return currentOrgId;
      }
    }

    // 2. Usuários guest sempre usam organização guest
    if (userType === 'guest') {
      const guestOrgId = await ensureGuestOrganization();
      console.log(
        `👥 Usuário guest ${userId} usando organização guest: ${guestOrgId}`,
      );
      return guestOrgId;
    }

    // 3. Verificar se usuário tem suas próprias organizações
    const userOrganizations = await db
      .select()
      .from(organization)
      .where(eq(organization.userId, userId))
      .limit(1);

    if (userOrganizations.length > 0) {
      console.log(
        `🏢 Usuário ${userId} usando sua própria organização: ${userOrganizations[0].id}`,
      );
      return userOrganizations[0].id;
    }

    // 4. Usuários cadastrados sem organização específica usam organização padrão
    const defaultOrgId = await ensureDefaultOrganization();
    console.log(
      `🏛️ Usuário cadastrado ${userId} usando organização padrão: ${defaultOrgId}`,
    );
    return defaultOrgId;
  } catch (error) {
    console.error('Error getting organization for user:', error);
    // Fallback: guest users -> guest org, others -> default org
    if (userType === 'guest') {
      return await ensureGuestOrganization();
    } else {
      return await ensureDefaultOrganization();
    }
  }
}

// ========================================
// QUOTA SYSTEM QUERIES
// ========================================

/**
 * Get user quota by user and organization
 */
export async function getUserQuota({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  try {
    const [quota] = await db
      .select()
      .from(userQuotas)
      .where(
        and(
          eq(userQuotas.userId, userId),
          eq(userQuotas.organizationId, organizationId)
        )
      )
      .limit(1);

    return quota;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user quota',
    );
  }
}

/**
 * Create or update user quota
 */
export async function upsertUserQuota({
  userId,
  organizationId,
  monthlyMessagesLimit,
  dailyMessagesLimit,
  maxCompanions,
  maxCustomCompanions,
  maxDocuments,
  maxDocumentSizeMb,
  totalStorageMb,
  maxMcpServers,
  quotaType,
}: {
  userId: string;
  organizationId: string;
  monthlyMessagesLimit?: number;
  dailyMessagesLimit?: number;
  maxCompanions?: number;
  maxCustomCompanions?: number;
  maxDocuments?: number;
  maxDocumentSizeMb?: number;
  totalStorageMb?: number;
  maxMcpServers?: number;
  quotaType?: string;
}) {
  try {
    // First try to get existing quota
    const existingQuota = await getUserQuota({ userId, organizationId });

    if (existingQuota) {
      // Update existing quota
      const [updatedQuota] = await db
        .update(userQuotas)
        .set({
          monthlyMessagesLimit: monthlyMessagesLimit ?? existingQuota.monthlyMessagesLimit,
          dailyMessagesLimit: dailyMessagesLimit ?? existingQuota.dailyMessagesLimit,
          maxCompanions: maxCompanions ?? existingQuota.maxCompanions,
          maxCustomCompanions: maxCustomCompanions ?? existingQuota.maxCustomCompanions,
          maxDocuments: maxDocuments ?? existingQuota.maxDocuments,
          maxDocumentSizeMb: maxDocumentSizeMb ?? existingQuota.maxDocumentSizeMb,
          totalStorageMb: totalStorageMb ?? existingQuota.totalStorageMb,
          maxMcpServers: maxMcpServers ?? existingQuota.maxMcpServers,
          quotaType: quotaType ?? existingQuota.quotaType,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userQuotas.userId, userId),
            eq(userQuotas.organizationId, organizationId)
          )
        )
        .returning();

      return updatedQuota;
    } else {
      // Create new quota with defaults
      const [newQuota] = await db
        .insert(userQuotas)
        .values({
          userId,
          organizationId,
          monthlyMessagesLimit: monthlyMessagesLimit ?? 1000,
          dailyMessagesLimit: dailyMessagesLimit ?? 100,
          maxCompanions: maxCompanions ?? 5,
          maxCustomCompanions: maxCustomCompanions ?? 2,
          maxDocuments: maxDocuments ?? 100,
          maxDocumentSizeMb: maxDocumentSizeMb ?? 10,
          totalStorageMb: totalStorageMb ?? 500,
          maxMcpServers: maxMcpServers ?? 3,
          quotaType: quotaType ?? 'standard',
        })
        .returning();

      return newQuota;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to upsert user quota',
    );
  }
}

/**
 * Get current usage tracking for user
 */
export async function getUserUsage({
  userId,
  organizationId,
  month,
  year,
}: {
  userId: string;
  organizationId: string;
  month?: number;
  year?: number;
}) {
  try {
    const currentMonth = month ?? new Date().getMonth() + 1;
    const currentYear = year ?? new Date().getFullYear();

    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.currentMonth, currentMonth),
          eq(usageTracking.currentYear, currentYear)
        )
      )
      .limit(1);

    return usage;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user usage',
    );
  }
}

/**
 * Initialize or reset usage tracking for user
 */
export async function initializeUserUsage({
  userId,
  organizationId,
  month,
  year,
}: {
  userId: string;
  organizationId: string;
  month?: number;
  year?: number;
}) {
  try {
    const currentMonth = month ?? new Date().getMonth() + 1;
    const currentYear = year ?? new Date().getFullYear();

    const [usage] = await db
      .insert(usageTracking)
      .values({
        userId,
        organizationId,
        currentMonth,
        currentYear,
        monthlyMessagesUsed: 0,
        dailyMessagesUsed: 0,
        companionsCount: 0,
        documentsCount: 0,
        totalStorageUsedMb: 0,
        mcpServersCount: 0,
      })
      .onConflictDoUpdate({
        target: [
          usageTracking.userId,
          usageTracking.organizationId,
          usageTracking.currentMonth,
          usageTracking.currentYear,
        ],
        set: {
          lastUpdated: new Date(),
        },
      })
      .returning();

    return usage;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to initialize user usage',
    );
  }
}

/**
 * Increment message usage for user
 */
export async function incrementMessageUsage({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    // First ensure usage tracking exists
    await initializeUserUsage({ userId, organizationId, month: currentMonth, year: currentYear });

    // Get current usage
    const currentUsage = await getUserUsage({ userId, organizationId, month: currentMonth, year: currentYear });

    if (!currentUsage) {
      throw new Error('Failed to initialize usage tracking');
    }

    // Check if we need to reset daily counter
    const shouldResetDaily = currentUsage.lastDailyReset !== today;

    const [updatedUsage] = await db
      .update(usageTracking)
      .set({
        monthlyMessagesUsed: currentUsage.monthlyMessagesUsed + 1,
        dailyMessagesUsed: shouldResetDaily ? 1 : currentUsage.dailyMessagesUsed + 1,
        lastMessageDate: today,
        lastDailyReset: shouldResetDaily ? today : currentUsage.lastDailyReset,
        lastUpdated: new Date(),
      })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.currentMonth, currentMonth),
          eq(usageTracking.currentYear, currentYear)
        )
      )
      .returning();

    return updatedUsage;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment message usage',
    );
  }
}

/**
 * Update resource counts in usage tracking
 */
export async function updateResourceUsage({
  userId,
  organizationId,
  companionsCount,
  documentsCount,
  totalStorageUsedMb,
  mcpServersCount,
}: {
  userId: string;
  organizationId: string;
  companionsCount?: number;
  documentsCount?: number;
  totalStorageUsedMb?: number;
  mcpServersCount?: number;
}) {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Ensure usage tracking exists
    await initializeUserUsage({ userId, organizationId, month: currentMonth, year: currentYear });

    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (companionsCount !== undefined) updateData.companionsCount = companionsCount;
    if (documentsCount !== undefined) updateData.documentsCount = documentsCount;
    if (totalStorageUsedMb !== undefined) updateData.totalStorageUsedMb = totalStorageUsedMb;
    if (mcpServersCount !== undefined) updateData.mcpServersCount = mcpServersCount;

    const [updatedUsage] = await db
      .update(usageTracking)
      .set(updateData)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.currentMonth, currentMonth),
          eq(usageTracking.currentYear, currentYear)
        )
      )
      .returning();

    return updatedUsage;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update resource usage',
    );
  }
}

/**
 * Check if user is within quota limits
 */
export async function checkQuotaLimits({
  userId,
  organizationId,
  resourceType,
}: {
  userId: string;
  organizationId: string;
  resourceType: 'messages_daily' | 'messages_monthly' | 'companions' | 'documents' | 'storage' | 'mcp_servers';
}) {
  try {
    const quota = await getUserQuota({ userId, organizationId });
    const usage = await getUserUsage({ userId, organizationId });

    if (!quota) {
      // No quota defined - create default quota
      await upsertUserQuota({ userId, organizationId });
      return { allowed: true, remaining: Infinity };
    }

    if (!usage) {
      // No usage tracked yet - initialize
      await initializeUserUsage({ userId, organizationId });
      return { allowed: true, remaining: getQuotaLimit(quota, resourceType) };
    }

    const limit = getQuotaLimit(quota, resourceType);
    const used = getUsageAmount(usage, resourceType);
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      used,
      limit,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check quota limits',
    );
  }
}

function getQuotaLimit(quota: any, resourceType: string): number {
  switch (resourceType) {
    case 'messages_daily':
      return quota.dailyMessagesLimit;
    case 'messages_monthly':
      return quota.monthlyMessagesLimit;
    case 'companions':
      return quota.maxCompanions;
    case 'documents':
      return quota.maxDocuments;
    case 'storage':
      return quota.totalStorageMb;
    case 'mcp_servers':
      return quota.maxMcpServers;
    default:
      return 0;
  }
}

function getUsageAmount(usage: any, resourceType: string): number {
  switch (resourceType) {
    case 'messages_daily':
      return usage.dailyMessagesUsed;
    case 'messages_monthly':
      return usage.monthlyMessagesUsed;
    case 'companions':
      return usage.companionsCount;
    case 'documents':
      return usage.documentsCount;
    case 'storage':
      return usage.totalStorageUsedMb;
    case 'mcp_servers':
      return usage.mcpServersCount;
    default:
      return 0;
  }
}

/**
 * Get quota alerts for user
 */
export async function getUserQuotaAlerts({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  try {
    return await db
      .select()
      .from(quotaAlerts)
      .where(
        and(
          eq(quotaAlerts.userId, userId),
          eq(quotaAlerts.organizationId, organizationId),
          eq(quotaAlerts.isEnabled, true)
        )
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get quota alerts',
    );
  }
}

/**
 * Create or update quota alert
 */
export async function upsertQuotaAlert({
  userId,
  organizationId,
  alertType,
  thresholdPercentage,
  isEnabled = true,
}: {
  userId: string;
  organizationId: string;
  alertType: string;
  thresholdPercentage: number;
  isEnabled?: boolean;
}) {
  try {
    const [alert] = await db
      .insert(quotaAlerts)
      .values({
        userId,
        organizationId,
        alertType,
        thresholdPercentage,
        isEnabled,
      })
      .onConflictDoUpdate({
        target: [quotaAlerts.userId, quotaAlerts.organizationId, quotaAlerts.alertType],
        set: {
          thresholdPercentage,
          isEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();

    return alert;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to upsert quota alert',
    );
  }
}

/**
 * Incrementar uso genérico - função usada pelo middleware de enforcement
 */
export async function incrementUsage({
  userId,
  organizationId,
  usageType,
  amount = 1,
}: {
  userId: string;
  organizationId: string;
  usageType: 'messages_daily' | 'messages_monthly' | 'companions' | 'documents' | 'storage' | 'mcp_servers';
  amount?: number;
}) {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Garantir que existe um registro de uso para este usuário/organização/mês
    await initializeUserUsage({ userId, organizationId, month, year });

    // Usar abordagem mais simples para evitar erros de SQL - buscar valor atual e incrementar
    const currentUsage = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.month, month),
          eq(usageTracking.year, year)
        )
      )
      .limit(1);

    if (currentUsage.length === 0) {
      throw new Error('Registro de uso não encontrado após inicialização');
    }

    const current = currentUsage[0];
    const updateFields: any = {};
    
    switch (usageType) {
      case 'messages_daily':
        // Para mensagens diárias, incrementar ambos daily e monthly
        updateFields.dailyMessagesUsed = current.dailyMessagesUsed + 1;
        updateFields.monthlyMessagesUsed = current.monthlyMessagesUsed + 1;
        break;
      case 'messages_monthly':
        updateFields.monthlyMessagesUsed = current.monthlyMessagesUsed + amount;
        break;
      case 'companions':
        updateFields.companionsCount = current.companionsCount + amount;
        break;
      case 'documents':
        updateFields.documentsCount = current.documentsCount + amount;
        break;
      case 'storage':
        updateFields.totalStorageUsedMb = current.totalStorageUsedMb + amount;
        break;
      case 'mcp_servers':
        updateFields.mcpServersCount = current.mcpServersCount + amount;
        break;
      default:
        throw new Error(`Tipo de uso não suportado: ${usageType}`);
    }

    updateFields.updatedAt = new Date();

    // Atualizar o registro de uso
    await db
      .update(usageTracking)
      .set(updateFields)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.month, month),
          eq(usageTracking.year, year)
        )
      );

    return true;
  } catch (error) {
    console.error('Erro ao incrementar uso:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment usage',
    );
  }
}

// ✅ NOVA FUNÇÃO: Busca TODOS os companions da organização (sem filtro de userId)
export async function getAllCompanionsByOrganization({
  organizationId,
}: { organizationId: string }) {
  try {
    return await db
      .select()
      .from(companion)
      .where(eq(companion.organizationId, organizationId))
      .orderBy(desc(companion.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all companions by organization',
    );
  }
}
