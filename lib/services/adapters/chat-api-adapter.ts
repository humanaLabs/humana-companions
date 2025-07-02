import { type Session } from 'next-auth';
import { ChatDomainServiceImpl, type CreateChatRequest, type AddMessageRequest } from '../domain/chat-domain-service';
import { serviceContainer, resolveService } from '../container/service-container';
import { type PostRequestBody } from '@/app/(chat)/api/chat/schema';
import { getOrganizationId } from '@/lib/tenant-context';
import { getOrganizationForUser } from '@/lib/db/queries';

/**
 * Chat API Adapter
 * 
 * This adapter bridges the existing API routes with the new Domain Service architecture.
 * It shows how to gradually migrate from mixed API logic to clean service isolation.
 * 
 * Usage in API routes:
 * ```typescript
 * const adapter = new ChatApiAdapter(session, organizationId);
 * const result = await adapter.createChatFromRequest(requestBody);
 * ```
 */
export class ChatApiAdapter {
  private chatService: ChatDomainServiceImpl;
  private organizationId: string;
  private session: Session;

  constructor(session: Session, organizationId: string) {
    this.session = session;
    this.organizationId = organizationId;
    
    // Resolve the ChatDomainService for this organization
    // This will be properly registered when we implement the full DI container
    try {
      this.chatService = resolveService<ChatDomainServiceImpl>('chatService', organizationId);
    } catch (error) {
      // Fallback: create instance directly (temporary until DI is fully set up)
      console.warn('ChatService not registered in DI container, creating direct instance');
      // This will be replaced with proper repository and service dependencies
      this.chatService = new ChatDomainServiceImpl(
        organizationId,
        null as any, // Will be resolved from DI container
        null as any, // Will be resolved from DI container
      );
    }
  }

  /**
   * Create a new chat from API request body
   */
  async createChatFromRequest(requestBody: PostRequestBody): Promise<{
    success: boolean;
    chatId?: string;
    error?: string;
  }> {
    try {
      const { message, selectedCompanionId } = requestBody;
      
      const createRequest: CreateChatRequest = {
        userId: this.session.user!.id,
        title: await this.generateChatTitle(message),
        companionId: selectedCompanionId,
        initialMessage: message,
        metadata: {
          createdVia: 'api',
          userAgent: 'web',
          timestamp: new Date().toISOString()
        }
      };

      const result = await this.chatService.createChat(createRequest);
      
      if (result.success && result.data) {
        return {
          success: true,
          chatId: result.data.id
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create chat'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add a message to existing chat
   */
  async addMessageToChat(chatId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user'): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const addRequest: AddMessageRequest = {
        chatId,
        userId: this.session.user!.id,
        content,
        role,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'api'
        }
      };

      const result = await this.chatService.addMessage(addRequest);
      
      if (result.success && result.data) {
        return {
          success: true,
          messageId: result.data.id
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to add message'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user's chats with proper domain service
   */
  async getUserChats(limit = 50): Promise<{
    success: boolean;
    chats?: any[];
    error?: string;
  }> {
    try {
      const result = await this.chatService.getUserChats(this.session.user!.id, limit);
      
      if (result.success) {
        return {
          success: true,
          chats: result.data || []
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get chats'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate user has access to chat
   */
  async validateChatAccess(chatId: string): Promise<boolean> {
    try {
      return await this.chatService.validateChatAccess(this.session.user!.id, chatId);
    } catch (error) {
      console.error('Error validating chat access:', error);
      return false;
    }
  }

  /**
   * Delete chat with proper domain logic
   */
  async deleteChat(chatId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await this.chatService.deleteChat(chatId, this.session.user!.id);
      
      return {
        success: result.success,
        error: result.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate AI response through domain service
   */
  async generateResponse(chatId: string): Promise<{
    success: boolean;
    response?: string;
    tokenCount?: number;
    error?: string;
  }> {
    try {
      // Get chat messages first
      const messagesResult = await this.chatService.getChatMessages(chatId, this.session.user!.id);
      if (!messagesResult.success) {
        throw new Error(messagesResult.error || 'Failed to get chat messages');
      }

      // Create chat context
      const chatContext = {
        messages: messagesResult.data || [],
        // TODO: Add companion, user preferences, organization settings
      };

      const result = await this.chatService.generateResponse(chatId, chatContext);
      
      if (result.success && result.data) {
        return {
          success: true,
          response: result.data.content,
          tokenCount: result.data.tokenCount
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to generate response'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user can create more chats (quota validation)
   */
  async canCreateChat(): Promise<boolean> {
    try {
      return await this.chatService.checkChatQuota(this.session.user!.id);
    } catch (error) {
      console.error('Error checking chat quota:', error);
      return false;
    }
  }

  // Private helper methods
  private async generateChatTitle(message: string): Promise<string> {
    // TODO: Implement proper title generation using AI service
    // For now, create a simple title from the first few words
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (message.split(' ').length > 5 ? '...' : '');
  }
}

/**
 * Factory function to create ChatApiAdapter with proper organization context
 */
export async function createChatApiAdapter(session: Session): Promise<ChatApiAdapter> {
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  // Get appropriate organization based on user type
  const finalOrgId = await getOrganizationForUser(
    session.user!.id,
    session.user!.type,
    organizationId
  );

  return new ChatApiAdapter(session, finalOrgId);
}

/**
 * Migration helper: convert existing API route to use domain service
 * 
 * Example usage in API route:
 * ```typescript
 * export async function POST(request: Request) {
 *   const session = await auth();
 *   if (!session?.user) {
 *     return new ChatSDKError('unauthorized:chat').toResponse();
 *   }
 * 
 *   try {
 *     const adapter = await createChatApiAdapter(session);
 *     const requestBody = await request.json();
 *     const result = await adapter.createChatFromRequest(requestBody);
 *     
 *     if (result.success) {
 *       return Response.json({ chatId: result.chatId });
 *     } else {
 *       return Response.json({ error: result.error }, { status: 400 });
 *     }
 *   } catch (error) {
 *     return Response.json({ error: 'Internal server error' }, { status: 500 });
 *   }
 * }
 * ```
 */ 