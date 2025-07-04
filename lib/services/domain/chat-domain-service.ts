import { TenantService, type OperationResult } from '../base/tenant-service';
import type { ServiceContext } from '../types/service-context';

/**
 * @description Request types para ChatDomainService
 */
export interface CreateChatRequest {
  title?: string;
  userId: string;
  visibility?: 'private' | 'public' | 'shared';
  companionId?: string;
  metadata?: Record<string, any>;
}

export interface MessageRequest {
  content: string;
  role: 'user' | 'assistant' | 'system';
  userId: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: string;
  metadata?: Record<string, any>;
}

/**
 * @description Core entities
 */
export interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: 'private' | 'public';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  userId: string;
  tokens: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * @description Repository interfaces para dependency injection
 */
export interface ChatRepository {
  findById(id: string, userId?: string): Promise<Chat | null>;
  findByUserId(userId: string, limit?: number): Promise<Chat[]>;
  create(chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat>;
  update(id: string, userId: string, updates: Partial<Chat>): Promise<Chat>;
  delete(id: string, userId: string): Promise<void>;
  getUserStats(userId: string): Promise<{ totalChats: number; totalMessages: number; }>;
}

export interface MessageRepository {
  findByChatId(chatId: string, limit?: number): Promise<Message[]>;
  create(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  deleteByChat(chatId: string): Promise<void>;
}

export interface AIProvider {
  generateResponse(context: ChatContext): Promise<AIResponse>;
  generateStream(context: ChatContext): AsyncGenerator<string>;
  validateConfig(): Promise<boolean>;
  getModels(): Promise<string[]>;
}

export interface QuotaService {
  checkUserQuota(userId: string, resource: 'chats' | 'messages' | 'tokens'): Promise<boolean>;
  incrementUsage(userId: string, resource: string, amount: number): Promise<void>;
  getUserUsage(userId: string): Promise<Record<string, number>>;
}

/**
 * @description Interface principal do ChatDomainService
 */
export interface IChatDomainService {
  createChat(request: CreateChatRequest): Promise<OperationResult<Chat>>;
  addMessage(chatId: string, message: MessageRequest): Promise<OperationResult<Message>>;
  generateResponse(chatId: string, context: ChatContext): Promise<OperationResult<AIResponse>>;
  
  // Business rules
  validateChatAccess(userId: string, chatId: string): Promise<boolean>;
  calculateTokenUsage(messages: Message[]): number;
  applyChatPolicies(chat: Partial<Chat>): Partial<Chat>;
  
  // Chat management
  getChatHistory(userId: string, limit?: number): Promise<OperationResult<Chat[]>>;
  getMessages(chatId: string, userId: string): Promise<OperationResult<Message[]>>;
  deleteChat(chatId: string, userId: string): Promise<OperationResult<void>>;
}

/**
 * @description Implementação do ChatDomainService com business logic isolada
 */
export class ChatDomainService extends TenantService implements IChatDomainService {
  constructor(
    context: ServiceContext,
    private chatRepo: ChatRepository,
    private messageRepo: MessageRepository,
    private aiProvider: AIProvider,
    private quotaService: QuotaService
  ) {
    super(context);
  }

  /**
   * @description Criar novo chat com validações de negócio
   */
  async createChat(request: CreateChatRequest): Promise<OperationResult<Chat>> {
    try {
      return await this.executeWithValidation(
        request.userId,
        'create_chat',
        async () => {
          // 1. Validar quota do usuário
          const hasQuota = await this.quotaService.checkUserQuota(request.userId, 'chats');
          if (!hasQuota) {
            throw new Error('Chat quota exceeded for user');
          }

          // 2. Aplicar políticas de negócio
          const chatData = this.applyChatPolicies({
            title: request.title || 'New Chat',
            userId: request.userId,
            organizationId: this.organizationId,
            visibility: request.visibility || 'private',
            companionId: request.companionId,
            messageCount: 0,
            tokenUsage: 0,
            metadata: request.metadata
          });

          // 3. Persistir no banco
          const chat = await this.chatRepo.create(chatData as Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>);

          // 4. Incrementar quota de uso
          await this.quotaService.incrementUsage(request.userId, 'chats', 1);

          // 5. Log de auditoria
          this.auditLog('create_chat', chat.id, request.userId, {
            title: chat.title,
            visibility: chat.visibility
          });

          return this.success(chat, { action: 'chat_created' });
        },
        'chat'
      );
    } catch (error) {
                return this.failure<Chat>(`Failed to create chat: ${(error as Error).message}`);
    }
  }

  /**
   * @description Adicionar mensagem ao chat
   */
  async addMessage(chatId: string, request: MessageRequest): Promise<OperationResult<Message>> {
    try {
      return await this.executeWithValidation(
        request.userId,
        'add_message',
        async () => {
          // 1. Validar acesso ao chat
          const hasAccess = await this.validateChatAccess(request.userId, chatId);
          if (!hasAccess) {
            throw new Error('Access denied to chat');
          }

          // 2. Validar quota de mensagens
          const hasQuota = await this.quotaService.checkUserQuota(request.userId, 'messages');
          if (!hasQuota) {
            throw new Error('Message quota exceeded for user');
          }

          // 3. Calcular tokens da mensagem
          const tokens = this.calculateMessageTokens(request.content);

          // 4. Criar mensagem
          const message = await this.messageRepo.create({
            chatId,
            content: request.content,
            role: request.role,
            userId: request.userId,
            tokens,
            metadata: request.metadata
          });

          // 5. Atualizar usage do chat
          await this.chatRepo.incrementUsage(chatId, tokens);

          // 6. Incrementar quotas
          await Promise.all([
            this.quotaService.incrementUsage(request.userId, 'messages', 1),
            this.quotaService.incrementUsage(request.userId, 'tokens', tokens)
          ]);

          // 7. Log de auditoria
          this.auditLog('add_message', message.id, request.userId, {
            chatId,
            role: request.role,
            tokens
          });

          return this.success(message, { action: 'message_added', tokens });
        },
        `chat:${chatId}`
      );
    } catch (error) {
      return this.failure(`Failed to add message: ${(error as Error).message}`);
    }
  }

  /**
   * @description Gerar resposta do AI com context
   */
  async generateResponse(chatId: string, context: ChatContext): Promise<OperationResult<AIResponse>> {
    try {
      // Validar acesso antes de gerar resposta
      const chat = await this.chatRepo.findById(chatId, this.organizationId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      this.validateTenantAccess(chat.organizationId);

      // Aplicar limites de contexto
      const limitedContext = this.applyContextLimits(context);

      // Gerar resposta via AI provider
      const response = await this.aiProvider.generateResponse(limitedContext);

      // Log performance
      this.auditLog('generate_response', chatId, chat.userId, {
        model: response.model,
        tokens: response.tokens,
        finishReason: response.finishReason
      });

      return this.success(response, { 
        action: 'response_generated',
        model: response.model,
        tokens: response.tokens.total
      });
    } catch (error) {
      return this.failure(`Failed to generate response: ${(error as Error).message}`);
    }
  }

  /**
   * @description Validar acesso do usuário ao chat
   */
  async validateChatAccess(userId: string, chatId: string): Promise<boolean> {
    try {
      const chat = await this.chatRepo.findById(chatId, this.organizationId);
      if (!chat) {
        return false;
      }

      // Validar tenant
      this.validateTenantAccess(chat.organizationId);

      // Validar ownership ou visibility
      if (chat.userId === userId) {
        return true; // Owner sempre tem acesso
      }

      if (chat.visibility === 'public') {
        return true; // Chats públicos são acessíveis
      }

      if (chat.visibility === 'shared') {
        // TODO: Implementar lógica de shared access
        return true;
      }

      return false; // Private chats só para owner
    } catch (error) {
      console.error('Error validating chat access:', error);
      return false;
    }
  }

  /**
   * @description Calcular uso de tokens das mensagens
   */
  calculateTokenUsage(messages: Message[]): number {
    return messages.reduce((total, msg) => total + msg.tokens, 0);
  }

  /**
   * @description Aplicar políticas de negócio aos chats
   */
  applyChatPolicies(chat: Partial<Chat>): Partial<Chat> {
    // 1. Sanitizar título
    if (chat.title) {
      chat.title = chat.title.trim().substring(0, 100);
    }

    // 2. Garantir visibility válida
    const validVisibilities = ['private', 'public', 'shared'];
    if (!chat.visibility || !validVisibilities.includes(chat.visibility)) {
      chat.visibility = 'private';
    }

    // 3. Inicializar contadores
    chat.messageCount = chat.messageCount || 0;
    chat.tokenUsage = chat.tokenUsage || 0;

    return chat;
  }

  /**
   * @description Buscar histórico de chats do usuário
   */
  async getChatHistory(userId: string, limit = 20): Promise<OperationResult<Chat[]>> {
    try {
      await this.checkPermissions(userId, 'read_chats');
      
      const chats = await this.chatRepo.findByUserId(userId, this.organizationId, limit);
      
      return this.success(chats, { action: 'chat_history_fetched', count: chats.length });
    } catch (error) {
      return this.failure(`Failed to fetch chat history: ${(error as Error).message}`);
    }
  }

  /**
   * @description Buscar mensagens do chat
   */
  async getMessages(chatId: string, userId: string): Promise<OperationResult<Message[]>> {
    try {
      const hasAccess = await this.validateChatAccess(userId, chatId);
      if (!hasAccess) {
        throw new Error('Access denied to chat');
      }

      const messages = await this.messageRepo.findByChatId(chatId);
      
      return this.success(messages, { action: 'messages_fetched', count: messages.length });
    } catch (error) {
      return this.failure(`Failed to fetch messages: ${(error as Error).message}`);
    }
  }

  /**
   * @description Deletar chat e mensagens
   */
  async deleteChat(chatId: string, userId: string): Promise<OperationResult<void>> {
    try {
      return await this.executeWithValidation(
        userId,
        'delete_chat',
        async () => {
          // Validar ownership
          const hasAccess = await this.validateChatAccess(userId, chatId);
          if (!hasAccess) {
            throw new Error('Access denied to delete chat');
          }

          // Deletar mensagens primeiro
          await this.messageRepo.deleteByChat(chatId);

          // Deletar chat
          await this.chatRepo.delete(chatId, this.organizationId);

          this.auditLog('delete_chat', chatId, userId);

          return this.success(undefined, { action: 'chat_deleted' });
        },
        `chat:${chatId}`
      );
    } catch (error) {
      return this.failure(`Failed to delete chat: ${(error as Error).message}`);
    }
  }

  /**
   * @description Calcular tokens de uma mensagem (simplificado)
   */
  private calculateMessageTokens(content: string): number {
    // Estimativa simples: ~4 characters = 1 token
    return Math.ceil(content.length / 4);
  }

  /**
   * @description Aplicar limites de contexto para AI
   */
  private applyContextLimits(context: ChatContext): ChatContext {
    const maxTokens = context.maxTokens || 4000;
    const maxMessages = 50;

    // Limitar número de mensagens
    const limitedMessages = context.messages.slice(-maxMessages);

    // Calcular tokens e truncar se necessário
    let totalTokens = this.calculateTokenUsage(limitedMessages);
    let messages = limitedMessages;

    if (totalTokens > maxTokens) {
      // Manter system prompt e algumas mensagens recentes
      const systemMessages = messages.filter(m => m.role === 'system');
      const recentMessages = messages.filter(m => m.role !== 'system').slice(-10);
      messages = [...systemMessages, ...recentMessages];
    }

    return {
      ...context,
      messages,
      maxTokens
    };
  }
} 