import type { ServiceContext, OperationResult } from '../types/service-context';

/**
 * @description Chat pessoal do usuário (sem organizationId)
 */
export interface PersonalChat {
  id: string;
  title: string;
  userId: string;
  visibility: 'private' | 'public';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description Repository para conversas pessoais
 */
export interface PersonalChatRepository {
  findById(id: string, userId?: string): Promise<PersonalChat | null>;
  findByUserId(userId: string, limit?: number): Promise<PersonalChat[]>;
  create(chat: Omit<PersonalChat, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalChat>;
  update(id: string, userId: string, updates: Partial<PersonalChat>): Promise<PersonalChat>;
  delete(id: string, userId: string): Promise<void>;
  getUserStats(userId: string): Promise<{ totalChats: number; totalMessages: number; }>;
}

/**
 * @description Requisição para criar conversa pessoal
 */
export interface CreatePersonalChatRequest {
  title?: string;
  userId: string;
  visibility?: 'private' | 'public';
}

/**
 * @description Service para gerenciar conversas pessoais do usuário
 */
export class PersonalChatDomainService {
  constructor(
    private context: ServiceContext,
    private chatRepo: PersonalChatRepository
  ) {}

  /**
   * @description Criar nova conversa pessoal
   */
  async createChat(request: CreatePersonalChatRequest): Promise<OperationResult<PersonalChat>> {
    try {
      const chatData = {
        title: request.title || 'Nova Conversa',
        userId: request.userId,
        visibility: request.visibility || 'private'
      };

      const chat = await this.chatRepo.create(chatData);

      return {
        success: true,
        data: chat,
        metadata: { action: 'chat_created' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao criar conversa: ${(error as Error).message}`,
        code: 'CREATE_CHAT_FAILED'
      };
    }
  }

  /**
   * @description Obter conversa por ID (deve pertencer ao usuário)
   */
  async getChatById(id: string, userId: string): Promise<OperationResult<PersonalChat>> {
    try {
      const chat = await this.chatRepo.findById(id, userId);
      
      if (!chat) {
        return {
          success: false,
          error: 'Conversa não encontrada ou acesso negado',
          code: 'CHAT_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: chat
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao buscar conversa: ${(error as Error).message}`,
        code: 'GET_CHAT_FAILED'
      };
    }
  }

  /**
   * @description Obter histórico de conversas do usuário
   */
  async getChatHistory(userId: string, limit = 20): Promise<OperationResult<PersonalChat[]>> {
    try {
      const chats = await this.chatRepo.findByUserId(userId, limit);

      return {
        success: true,
        data: chats,
        metadata: { count: chats.length, limit }
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao buscar histórico: ${(error as Error).message}`,
        code: 'GET_HISTORY_FAILED'
      };
    }
  }

  /**
   * @description Atualizar conversa (apenas se for do usuário)
   */
  async updateChat(
    id: string, 
    userId: string, 
    updates: Partial<PersonalChat>
  ): Promise<OperationResult<PersonalChat>> {
    try {
      const updatedChat = await this.chatRepo.update(id, userId, updates);

      return {
        success: true,
        data: updatedChat,
        metadata: { action: 'chat_updated' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao atualizar conversa: ${(error as Error).message}`,
        code: 'UPDATE_CHAT_FAILED'
      };
    }
  }

  /**
   * @description Deletar conversa (apenas se for do usuário)
   */
  async deleteChat(id: string, userId: string): Promise<OperationResult<void>> {
    try {
      await this.chatRepo.delete(id, userId);

      return {
        success: true,
        data: undefined,
        metadata: { action: 'chat_deleted' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao deletar conversa: ${(error as Error).message}`,
        code: 'DELETE_CHAT_FAILED'
      };
    }
  }

  /**
   * @description Obter estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<OperationResult<{ totalChats: number; totalMessages: number; }>> {
    try {
      const stats = await this.chatRepo.getUserStats(userId);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: `Falha ao obter estatísticas: ${(error as Error).message}`,
        code: 'GET_STATS_FAILED'
      };
    }
  }
} 