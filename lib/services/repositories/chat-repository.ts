import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chat as chatTable, message as messageTable } from '@/lib/db/schema';
import { BaseRepository, createFilters } from './base-repository';
import type { ChatRepository } from '../domain/chat-domain-service';

/**
 * @description Chat entity tipo do Drizzle
 */
type ChatEntity = typeof chatTable.$inferSelect;

/**
 * @description Implementação concreta do ChatRepository usando Drizzle ORM
 */
export class ChatRepositoryImpl extends BaseRepository<ChatEntity> implements ChatRepository {
  constructor(organizationId: string) {
    super('chats', organizationId);
  }

  /**
   * @description Buscar chat por ID com isolamento de tenant
   */
  async findById(id: string, organizationId?: string): Promise<ChatEntity | null> {
    const targetOrgId = organizationId || this.organizationId;
    
    return this.executeQuery(async () => {
      const result = await db
        .select()
        .from(chatTable)
        .where(and(
          eq(chatTable.id, id),
          eq(chatTable.organizationId, targetOrgId)
        ))
        .limit(1);

      const foundChat = result[0] || null;
      if (foundChat) {
        this.auditLog('find_by_id', id, { found: true });
      }

      return foundChat;
    }, 'findById');
  }

  /**
   * @description Buscar chats do usuário com paginação
   */
  async findByUserId(
    userId: string, 
    organizationId?: string, 
    limit = 20
  ): Promise<ChatEntity[]> {
    const targetOrgId = organizationId || this.organizationId;
    
    return this.executeQuery(async () => {
      const result = await db
        .select()
        .from(chatTable)
        .where(and(
          eq(chatTable.userId, userId),
          eq(chatTable.organizationId, targetOrgId)
        ))
        .orderBy(desc(chatTable.updatedAt))
        .limit(limit);

      this.auditLog('find_by_user', userId, { 
        count: result.length, 
        limit 
      });

      return result;
    }, 'findByUserId');
  }

  /**
   * @description Buscar múltiplos chats com filtros
   */
  async findMany(
    filters: Record<string, any> = {}, 
    limit = 50
  ): Promise<ChatEntity[]> {
    return this.executeQuery(async () => {
      const conditions = createFilters(chatTable, filters, this.organizationId);
      
      const result = await db
        .select()
        .from(chatTable)
        .where(conditions)
        .orderBy(desc(chatTable.updatedAt))
        .limit(limit);

      this.auditLog('find_many', 'multiple', { 
        filters, 
        count: result.length 
      });

      return result;
    }, 'findMany');
  }

  /**
   * @description Criar novo chat
   */
  async create(
    data: Omit<ChatEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ChatEntity> {
    return this.executeQuery(async () => {
      const result = await db
        .insert(chatTable)
        .values({
          ...data,
          organizationId: this.organizationId, // Force tenant isolation
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const chat = result[0];
      this.auditLog('create', chat.id, { 
        title: chat.title,
        visibility: chat.visibility 
      });

      return chat;
    }, 'create');
  }

  /**
   * @description Atualizar chat existente
   */
  async update(id: string, updates: Partial<ChatEntity>): Promise<ChatEntity> {
    return this.executeQuery(async () => {
      // Primeiro verificar se existe e pertence à org
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Chat not found');
      }

      this.validateTenantAccess(existing);

      const result = await db
        .update(chatTable)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(chatTable.id, id),
          eq(chatTable.organizationId, this.organizationId)
        ))
        .returning();

      const updated = result[0];
      if (!updated) {
        throw new Error('Failed to update chat');
      }

      this.auditLog('update', id, { updates: Object.keys(updates) });
      return updated;
    }, 'update');
  }

  /**
   * @description Deletar chat
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    const targetOrgId = organizationId || this.organizationId;
    
    return this.executeQuery(async () => {
      // Verificar se existe antes de deletar
      const existing = await this.findById(id, targetOrgId);
      if (!existing) {
        throw new Error('Chat not found');
      }

      // Deletar o chat
      await db
        .delete(chatTable)
        .where(and(
          eq(chatTable.id, id),
          eq(chatTable.organizationId, targetOrgId)
        ));

      this.auditLog('delete', id, { title: existing.title });
    }, 'delete');
  }

  /**
   * @description Incrementar usage do chat (tokens/mensagens)
   */
  async incrementUsage(id: string, tokens: number): Promise<void> {
    return this.executeQuery(async () => {
      await db
        .update(chatTable)
        .set({
          tokenUsage: chatTable.tokenUsage + tokens,
          messageCount: chatTable.messageCount + 1,
          updatedAt: new Date()
        })
        .where(and(
          eq(chatTable.id, id),
          eq(chatTable.organizationId, this.organizationId)
        ));

      this.auditLog('increment_usage', id, { tokens });
    }, 'incrementUsage');
  }

  /**
   * @description Contar chats com filtros
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    return this.executeQuery(async () => {
      const conditions = createFilters(chatTable, filters, this.organizationId);
      
      const result = await db
        .select({ count: count() })
        .from(chatTable)
        .where(conditions);

      return result[0]?.count || 0;
    }, 'count');
  }

  /**
   * @description Buscar chats por visibility
   */
  async findByVisibility(
    visibility: 'private' | 'public' | 'shared',
    limit = 20
  ): Promise<ChatEntity[]> {
    return this.findMany({ visibility }, limit);
  }

  /**
   * @description Buscar chats por companion
   */
  async findByCompanion(companionId: string, limit = 20): Promise<ChatEntity[]> {
    return this.findMany({ companionId }, limit);
  }

  /**
   * @description Estatísticas de uso por usuário
   */
  async getUserStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    totalTokens: number;
  }> {
    return this.executeQuery(async () => {
      const result = await db
        .select({
          totalChats: count(),
          totalMessages: chatTable.messageCount,
          totalTokens: chatTable.tokenUsage
        })
        .from(chatTable)
        .where(and(
          eq(chatTable.userId, userId),
          eq(chatTable.organizationId, this.organizationId)
        ));

      return {
        totalChats: result.length,
        totalMessages: result.reduce((sum, r) => sum + r.totalMessages, 0),
        totalTokens: result.reduce((sum, r) => sum + r.totalTokens, 0)
      };
    }, 'getUserStats');
  }
} 