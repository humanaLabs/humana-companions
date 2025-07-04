import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chat as chatTable, message as messageTable } from '@/lib/db/schema';
import type { PersonalChatRepository, PersonalChat } from '../domain/personal-chat-domain-service';

/**
 * @description Chat entity do Drizzle
 */
type ChatEntity = typeof chatTable.$inferSelect;

/**
 * @description Implementação do PersonalChatRepository para conversas pessoais
 */
export class PersonalChatRepositoryImpl implements PersonalChatRepository {
  
  /**
   * @description Buscar conversa por ID (opcionalmente verificar userId)
   */
  async findById(id: string, userId?: string): Promise<PersonalChat | null> {
    const conditions = userId 
      ? and(eq(chatTable.id, id), eq(chatTable.userId, userId))
      : eq(chatTable.id, id);

    const result = await db
      .select()
      .from(chatTable)
      .where(conditions)
      .limit(1);

    return result[0] || null;
  }

  /**
   * @description Buscar todas as conversas do usuário
   */
  async findByUserId(userId: string, limit = 20): Promise<PersonalChat[]> {
    const result = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.userId, userId))
      .orderBy(desc(chatTable.updatedAt))
      .limit(limit);

    return result;
  }

  /**
   * @description Criar nova conversa pessoal
   */
  async create(data: Omit<PersonalChat, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalChat> {
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
   * @description Atualizar conversa (verificar se pertence ao usuário)
   */
  async update(id: string, userId: string, updates: Partial<PersonalChat>): Promise<PersonalChat> {
    // Verificar se a conversa existe e pertence ao usuário
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Conversa não encontrada ou acesso negado');
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
      throw new Error('Falha ao atualizar conversa');
    }

    return updated;
  }

  /**
   * @description Deletar conversa (verificar se pertence ao usuário)
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verificar se a conversa existe e pertence ao usuário
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Conversa não encontrada ou acesso negado');
    }

    await db
      .delete(chatTable)
      .where(and(
        eq(chatTable.id, id),
        eq(chatTable.userId, userId)
      ));
  }

  /**
   * @description Obter estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<{ totalChats: number; totalMessages: number; }> {
    const [chatCount, messageCount] = await Promise.all([
      // Contar conversas do usuário
      db
        .select({ count: count() })
        .from(chatTable)
        .where(eq(chatTable.userId, userId))
        .then(result => result[0]?.count || 0),
      
      // Contar mensagens do usuário (via conversas)
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