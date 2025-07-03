// TODO: Fix chat adapter after domain service refactoring is complete
// Temporary stub implementation during refactoring

export interface ChatCreationResult {
  id: string;
  title: string;
  organizationId: string;
  userId: string;
  messages: any[];
  createdAt: Date;
}

export interface AIResponse {
  id: string;
  role: 'assistant';
  content: string;
  tokenCount?: number;
  reasoning?: string;
  citations?: string[];
  metadata?: Record<string, any>;
}

export interface UserChatsResult {
  chats: Array<{
    id: string;
    title: string;
    updatedAt: Date;
    messageCount: number;
  }>;
  total: number;
}

export class ChatApiAdapter {
  private organizationId: string;
  private session: any;

  constructor(session: any, organizationId: string) {
    this.session = session;
    this.organizationId = organizationId;
  }
  
  async createChat(data: any): Promise<ChatCreationResult> {
    throw new Error('Chat adapter temporarily disabled during refactoring');
  }
  
  async addMessage(chatId: string, message: any): Promise<{
    userMessage: any;
    aiResponse: AIResponse;
  }> {
    throw new Error('Chat adapter temporarily disabled during refactoring');
  }
  
  async getUserChats(): Promise<UserChatsResult> {
    return { chats: [], total: 0 };
  }
  
  async getChatHistory(chatId: string): Promise<{
    chat: any;
    messages: any[];
  }> {
    return { chat: null, messages: [] };
  }
  
  async checkQuota(): Promise<boolean> {
    return true;
  }
} 