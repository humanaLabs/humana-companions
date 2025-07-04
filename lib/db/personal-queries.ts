import { and, asc, desc, eq, gt, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  chat, 
  message, 
  vote, 
  stream, 
  document, 
  suggestion,
  type Chat,
  type DBMessage,
  type Document
} from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';

/**
 * @description Queries para dados PESSOAIS do usuário (conversas e documentos)
 * Sem isolamento de organização - dados pertencem ao usuário
 */

// ========================================
// QUERIES DE CHAT PESSOAL
// ========================================

export async function savePersonalChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: 'public' | 'private';
}) {
  try {
    const [newChat] = await db
      .insert(chat)
      .values({
        id,
        userId,
        title,
        visibility,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newChat;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save personal chat',
    );
  }
}

export async function getPersonalChatById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  try {
    const conditions = userId 
      ? and(eq(chat.id, id), eq(chat.userId, userId))
      : eq(chat.id, id);

    const [selectedChat] = await db
      .select()
      .from(chat)
      .where(conditions)
      .limit(1);

    return selectedChat || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get personal chat by id');
  }
}

export async function getPersonalChatsByUserId({
  userId,
  limit = 20,
  startingAfter,
  endingBefore,
}: {
  userId: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: any) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, userId))
            : eq(chat.userId, userId)
        )
        .orderBy(desc(chat.updatedAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, startingAfter), eq(chat.userId, userId)))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.updatedAt, selectedChat.updatedAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, endingBefore), eq(chat.userId, userId)))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.updatedAt, selectedChat.updatedAt));
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
      'Failed to get personal chats by user id',
    );
  }
}

export async function deletePersonalChatById({ 
  id, 
  userId 
}: { 
  id: string;
  userId: string;
}) {
  try {
    // Verificar se o chat existe e pertence ao usuário
    const [chatToDelete] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, userId)));

    if (!chatToDelete) {
      throw new ChatSDKError(
        'not_found:database',
        'Chat not found or access denied',
      );
    }

    // Deletar dados relacionados (sem organizationId)
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    // Deletar o chat
    const [chatsDeleted] = await db
      .delete(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, userId)))
      .returning();
      
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete personal chat by id',
    );
  }
}

export async function updatePersonalChatVisibilityById({
  chatId,
  userId,
  visibility,
}: {
  chatId: string;
  userId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const [updatedChat] = await db
      .update(chat)
      .set({ 
        visibility,
        updatedAt: new Date()
      })
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .returning();

    return updatedChat;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update personal chat visibility',
    );
  }
}

// ========================================
// QUERIES DE MENSAGENS PESSOAIS
// ========================================

export async function getPersonalMessagesByChatId({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}) {
  try {
    // Verificar se o chat pertence ao usuário
    const chatExists = await getPersonalChatById({ id: chatId, userId });
    if (!chatExists) {
      throw new ChatSDKError('not_found:database', 'Chat not found or access denied');
    }

    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get personal messages by chat id',
    );
  }
}

export async function savePersonalMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save personal messages');
  }
}

export async function deletePersonalMessageById({
  messageId,
  chatId,
  userId,
}: {
  messageId: string;
  chatId: string;
  userId: string;
}) {
  try {
    // Verificar se o chat pertence ao usuário
    const chatExists = await getPersonalChatById({ id: chatId, userId });
    if (!chatExists) {
      throw new ChatSDKError('not_found:database', 'Chat not found or access denied');
    }

    const [deletedMessage] = await db
      .delete(message)
      .where(and(eq(message.id, messageId), eq(message.chatId, chatId)))
      .returning();

    return deletedMessage;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete personal message',
    );
  }
}

// ========================================
// QUERIES DE DOCUMENTOS PESSOAIS
// ========================================

export async function savePersonalDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
  content: string;
  userId: string;
}) {
  try {
    const timestamp = new Date();
    const [newDocument] = await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: timestamp,
      })
      .returning();

    return newDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save personal document',
    );
  }
}

export async function getPersonalDocumentsByUserId({ 
  userId 
}: { 
  userId: string;
}) {
  try {
    return await db
      .select()
      .from(document)
      .where(eq(document.userId, userId))
      .orderBy(desc(document.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get personal documents by user id',
    );
  }
}

export async function getPersonalDocumentById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  try {
    const conditions = userId 
      ? and(eq(document.id, id), eq(document.userId, userId))
      : eq(document.id, id);

    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(conditions)
      .limit(1);

    return selectedDocument || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get personal document by id',
    );
  }
}

export async function deletePersonalDocumentsByIdAfterTimestamp({
  id,
  timestamp,
  userId,
}: {
  id: string;
  timestamp: Date;
  userId: string;
}) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(and(eq(document.id, id), eq(document.userId, userId)))
      .limit(1);

    if (!selectedDocument) {
      throw new ChatSDKError(
        'not_found:database',
        'Document not found or access denied',
      );
    }

    return await db
      .delete(document)
      .where(
        and(
          eq(document.id, id),
          eq(document.userId, userId),
          gt(document.createdAt, timestamp)
        )
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete personal documents by id after timestamp',
    );
  }
}

// ========================================
// QUERIES DE STREAMS PESSOAIS
// ========================================

export async function createPersonalStreamId({
  streamId,
  chatId,
  userId,
}: {
  streamId: string;
  chatId: string;
  userId: string;
}) {
  try {
    // Verificar se o chat pertence ao usuário
    const chatExists = await getPersonalChatById({ id: chatId, userId });
    if (!chatExists) {
      throw new ChatSDKError('not_found:database', 'Chat not found or access denied');
    }

    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create personal stream id',
    );
  }
}

export async function getPersonalStreamIdsByChatId({ 
  chatId, 
  userId 
}: { 
  chatId: string;
  userId: string;
}) {
  try {
    // Verificar se o chat pertence ao usuário
    const chatExists = await getPersonalChatById({ id: chatId, userId });
    if (!chatExists) {
      throw new ChatSDKError('not_found:database', 'Chat not found or access denied');
    }

    return await db
      .select()
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(desc(stream.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get personal stream ids by chat id',
    );
  }
} 