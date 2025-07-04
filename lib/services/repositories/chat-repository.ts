import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chat as chatTable, message as messageTable } from '@/lib/db/schema';
import type { ChatRepository } from '../domain/chat-domain-service';

/**
 * @description Chat entity tipo do Drizzle
 */
type ChatEntity = typeof chatTable.$inferSelect;

/**
 * @description Implementação do ChatRepository para dados PESSOAIS do usuário
 * Conversas pertencem ao usuário, não à organização
 */
export class ChatRepositoryImpl implements ChatRepository {
  
  /**
   * @description Buscar chat por ID (deve pertencer ao usuário)
   */
  async findById(id: string, userId?: string): Promise<ChatEntity | null> {
    const result = await db
      .select()
      .from(chatTable)
      .where(and(
        eq(chatTable.id, id),
        userId ? eq(chatTable.userId, userId) : undefined
      ))
      .limit(1);

    return result[0] || null;
  }

  /**
   * @description Buscar todas as conversas do usuário
   */
  async findByUserId(
    userId: string, 
    limit = 20
  ): Promise<ChatEntity[]> {
    const result = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.userId, userId))
      .orderBy(desc(chatTable.updatedAt))
      .limit(limit);

    return result;
  }

  /**
   * @description Buscar conversas com filtros (apenas do usuário)
   */
  async findMany(
    userId: string,
    filters: { visibility?: 'public' | 'private'; search?: string } = {}, 
    limit = 50
  ): Promise<ChatEntity[]> {
    let conditions = eq(chatTable.userId, userId);
    
    if (filters.visibility) {
      conditions = and(conditions, eq(chatTable.visibility, filters.visibility));
    }
    
    const result = await db
      .select()
      .from(chatTable)
      .where(conditions)
      .orderBy(desc(chatTable.updatedAt))
      .limit(limit);

    return result;
  }

  /**
   * @description Criar nova conversa pessoal
   */
  async create(
    data: Omit<ChatEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ChatEntity> {
    const result = await db
      .insert(chatTable)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return result[0];
  }

  /**
   * @description Atualizar conversa (apenas se for do usuário)
   */
  async update(
    id: string, 
    userId: string, 
    updates: Partial<ChatEntity>
  ): Promise<ChatEntity> {
    // Verificar se a conversa pertence ao usuário
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Chat not found or access denied');
    }

    const result = await db
      .update(chatTable)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(chatTable.id, id),
        eq(chatTable.userId, userId)
      ))
      .returning();

    const updated = result[0];
    if (!updated) {
      throw new Error('Failed to update chat');
    }

    return updated;
  }

  /**
   * @description Deletar conversa (apenas se for do usuário)
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verificar se a conversa pertence ao usuário
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Chat not found or access denied');
    }

    // Deletar a conversa
    await db
      .delete(chatTable)
      .where(and(
        eq(chatTable.id, id),
        eq(chatTable.userId, userId)
      ));
  }

  /**
   * @description Contar conversas do usuário
   */
  async count(userId: string, filters: Record<string, any> = {}): Promise<number> {
    let conditions = eq(chatTable.userId, userId);
    
    if (filters.visibility) {
      conditions = and(conditions, eq(chatTable.visibility, filters.visibility));
    }

    const result = await db
      .select({ count: count() })
      .from(chatTable)
      .where(conditions);

    return result[0]?.count || 0;
  }

  /**
   * @description Buscar conversas por visibilidade
   */
  async findByVisibility(
    userId: string,
    visibility: 'private' | 'public',
    limit = 20
  ): Promise<ChatEntity[]> {
    const result = await db
      .select()
      .from(chatTable)
      .where(and(
        eq(chatTable.userId, userId),
        eq(chatTable.visibility, visibility)
      ))
      .orderBy(desc(chatTable.updatedAt))
      .limit(limit);

    return result;
  }

  /**
   * @description Estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
  }> {
    const [chatCount, messageCount] = await Promise.all([
      this.count(userId),
      db
        .select({ count: count() })
        .from(messageTable)
        .leftJoin(chatTable, eq(messageTable.chatId, chatTable.id))
        .where(eq(chatTable.userId, userId))
        .then(result => result[0]?.count || 0)
    ]);

    return {
      totalChats: chatCount,
      totalMessages: messageCount,
    };
  }
} 