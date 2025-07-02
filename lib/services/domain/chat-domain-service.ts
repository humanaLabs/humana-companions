import { TenantService } from '../base/tenant-service';
import type { Repository } from '../repositories/base-repository';
import type { ServiceContext, OperationResult } from '../types/service-context';

// Domain Types
export interface Chat {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  companionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  organizationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
  tokenCount?: number;
  createdAt: Date;
}

export interface CreateChatRequest {
  userId: string;
  title: string;
  companionId?: string;
  initialMessage?: string;
  metadata?: Record<string, any>;
}

export interface AddMessageRequest {
  chatId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
}

export interface ChatContext {
  messages: Message[];
  companion?: any; // Will be properly typed later
  userPreferences?: Record<string, any>;
  organizationSettings?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  tokenCount: number;
  model: string;
  metadata?: Record<string, any>;
}

// Domain Service Interface
export interface ChatDomainService {
  // Core chat operations
  createChat(request: CreateChatRequest): Promise<OperationResult<Chat>>;
  getChat(chatId: string, userId: string): Promise<OperationResult<Chat>>;
  getUserChats(userId: string, limit?: number): Promise<OperationResult<Chat[]>>;
  deleteChat(chatId: string, userId: string): Promise<OperationResult<void>>;
  
  // Message operations
  addMessage(request: AddMessageRequest): Promise<OperationResult<Message>>;
  getChatMessages(chatId: string, userId: string): Promise<OperationResult<Message[]>>;
  generateResponse(chatId: string, context: ChatContext): Promise<OperationResult<AIResponse>>;
  
  // Business rules
  validateChatAccess(userId: string, chatId: string): Promise<boolean>;
  calculateTokenUsage(messages: Message[]): number;
  applyChatPolicies(chat: Partial<Chat>): Partial<Chat>;
  checkChatQuota(userId: string): Promise<boolean>;
}

// Domain Service Implementation
export class ChatDomainServiceImpl extends TenantService<Chat> implements ChatDomainService {
  constructor(
    organizationId: string,
    private chatRepository: Repository<Chat>,
    private messageRepository: Repository<Message>,
    private quotaService?: any, // Will be properly typed when QuotaService is implemented
    private aiProvider?: any, // Will be properly typed when AI providers are implemented
    config = {}
  ) {
    super(organizationId, chatRepository, config);
  }

  async createChat(request: CreateChatRequest): Promise<OperationResult<Chat>> {
    const context = this.createContext(request.userId);
    
    try {
      // 1. Check permissions
      await this.checkPermissions(request.userId, 'create_chat');
      
      // 2. Validate quota
      const hasQuota = await this.checkChatQuota(request.userId);
      if (!hasQuota) {
        throw new Error('Chat quota exceeded');
      }
      
      // 3. Apply business rules
      const chatData = this.applyChatPolicies({
        userId: request.userId,
        organizationId: this.organizationId,
        title: request.title || 'New Chat',
        companionId: request.companionId,
        metadata: request.metadata
      });
      
      // 4. Create chat with transaction
      const chat = await this.withTransaction(async () => {
        const createdChat = await this.chatRepository.create(
          chatData as Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>,
          this.organizationId
        );
        
        // 5. Add initial message if provided
        if (request.initialMessage) {
          await this.messageRepository.create({
            chatId: createdChat.id,
            userId: request.userId,
            organizationId: this.organizationId,
            content: request.initialMessage,
            role: 'user'
          }, this.organizationId);
        }
        
        return createdChat;
      });
      
      // 6. Update quota (if service is available)
      if (this.quotaService) {
        await this.quotaService.incrementUsage(request.userId, 'chats', 1);
      }
      
      return {
        success: true,
        data: chat,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  async getChat(chatId: string, userId: string): Promise<OperationResult<Chat>> {
    const context = this.createContext(userId);
    
    try {
      await this.checkPermissions(userId, 'read_chat', chatId);
      
      const chat = await this.chatRepository.findById(chatId, this.organizationId);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      // Validate user access
      const hasAccess = await this.validateChatAccess(userId, chatId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }
      
      return {
        success: true,
        data: chat,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  async getUserChats(userId: string, limit = 50): Promise<OperationResult<Chat[]>> {
    const context = this.createContext(userId);
    
    try {
      await this.checkPermissions(userId, 'read_chats');
      
      const chats = await this.chatRepository.findByUserId(userId, this.organizationId);
      
      // Apply limit and sorting
      const sortedChats = chats
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, limit);
      
      return {
        success: true,
        data: sortedChats,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  async addMessage(request: AddMessageRequest): Promise<OperationResult<Message>> {
    const context = this.createContext(request.userId);
    
    try {
      await this.checkPermissions(request.userId, 'add_message', request.chatId);
      
      // Validate chat access
      const hasAccess = await this.validateChatAccess(request.userId, request.chatId);
      if (!hasAccess) {
        throw new Error('Chat access denied');
      }
      
      const message = await this.messageRepository.create({
        chatId: request.chatId,
        userId: request.userId,
        organizationId: this.organizationId,
        content: request.content,
        role: request.role,
        metadata: request.metadata,
        tokenCount: this.calculateTokenUsage([{ content: request.content } as Message])
      }, this.organizationId);
      
      return {
        success: true,
        data: message,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  async getChatMessages(chatId: string, userId: string): Promise<OperationResult<Message[]>> {
    const context = this.createContext(userId);
    
    try {
      await this.checkPermissions(userId, 'read_messages', chatId);
      
      const hasAccess = await this.validateChatAccess(userId, chatId);
      if (!hasAccess) {
        throw new Error('Chat access denied');
      }
      
      // TODO: Implement proper message repository method
      // For now, this is a placeholder
      const messages: Message[] = [];
      
      return {
        success: true,
        data: messages,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  async generateResponse(chatId: string, context: ChatContext): Promise<OperationResult<AIResponse>> {
    const serviceContext = this.createContext();
    
    try {
      // This will be implemented when AI provider abstraction is ready
      // For now, return a placeholder
      const response: AIResponse = {
        content: 'AI response placeholder',
        tokenCount: 10,
        model: 'placeholder-model'
      };
      
      return {
        success: true,
        data: response,
        context: serviceContext
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: serviceContext
      };
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<OperationResult<void>> {
    const context = this.createContext(userId);
    
    try {
      await this.checkPermissions(userId, 'delete_chat', chatId);
      
      const hasAccess = await this.validateChatAccess(userId, chatId);
      if (!hasAccess) {
        throw new Error('Chat access denied');
      }
      
      await this.withTransaction(async () => {
        // Delete all messages first (will be implemented with proper cascade)
        // await this.messageRepository.deleteByChatId(chatId, this.organizationId);
        
        // Delete the chat
        await this.chatRepository.delete(chatId, this.organizationId);
      });
      
      return {
        success: true,
        context
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      };
    }
  }

  // Business Rules Implementation
  async validateChatAccess(userId: string, chatId: string): Promise<boolean> {
    try {
      const chat = await this.chatRepository.findById(chatId, this.organizationId);
      if (!chat) return false;
      
      // User can access their own chats
      if (chat.userId === userId) return true;
      
      // TODO: Check if user has admin permissions for organization
      // For now, deny access to other users' chats
      return false;
      
    } catch (error) {
      return false;
    }
  }

  calculateTokenUsage(messages: Message[]): number {
    // Simple token calculation - will be improved with proper tokenization
    return messages.reduce((total, message) => {
      return total + Math.ceil(message.content.length / 4); // Rough estimate: 1 token = 4 chars
    }, 0);
  }

  applyChatPolicies(chat: Partial<Chat>): Partial<Chat> {
    // Apply organization-specific policies
    const policies = {
      maxTitleLength: 100,
      allowedMetadataKeys: ['tags', 'priority', 'category']
    };
    
    // Enforce title length
    if (chat.title && chat.title.length > policies.maxTitleLength) {
      chat.title = chat.title.substring(0, policies.maxTitleLength);
    }
    
    // Filter metadata keys
    if (chat.metadata) {
      const filteredMetadata: Record<string, any> = {};
      for (const key of policies.allowedMetadataKeys) {
        if (chat.metadata[key] !== undefined) {
          filteredMetadata[key] = chat.metadata[key];
        }
      }
      chat.metadata = filteredMetadata;
    }
    
    return chat;
  }

  async checkChatQuota(userId: string): Promise<boolean> {
    if (!this.quotaService) {
      return true; // If no quota service, allow creation
    }
    
    try {
      const quotaStatus = await this.quotaService.checkUserQuota(userId, 'chats');
      return quotaStatus.allowed;
    } catch (error) {
      // If quota check fails, err on the side of caution and deny
      return false;
    }
  }
} 