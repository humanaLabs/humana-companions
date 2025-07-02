// Provider Base Interfaces para Sistema BYOC
export interface ProviderConfig {
  type: string;
  enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  metadata?: {
    name: string;
    version: string;
    description?: string;
  };
}

export interface ProviderHealth {
  type: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BaseProvider {
  readonly type: string;
  readonly name: string;
  
  initialize(config: ProviderConfig): Promise<void>;
  checkHealth(): Promise<ProviderHealth>;
  destroy(): Promise<void>;
}

// LLM Provider Interface
export interface LLMModel {
  id: string;
  name: string;
  maxTokens: number;
  supportsFunctions: boolean;
  supportsStreaming: boolean;
  costPer1kTokens: {
    input: number;
    output: number;
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'function_call';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface LLMProvider extends BaseProvider {
  type: 'llm';
  
  listModels(): Promise<LLMModel[]>;
  generateResponse(request: LLMRequest): Promise<LLMResponse>;
  generateStream(request: LLMRequest): AsyncIterable<LLMResponse>;
  estimateCost(request: LLMRequest): Promise<number>;
}

// Storage Provider Interface
export interface StorageFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageUploadRequest {
  file: File | Buffer;
  filename: string;
  mimeType: string;
  organizationId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface StorageProvider extends BaseProvider {
  type: 'storage';
  
  upload(request: StorageUploadRequest): Promise<StorageFile>;
  download(fileId: string, organizationId: string): Promise<Buffer>;
  delete(fileId: string, organizationId: string): Promise<void>;
  getFileInfo(fileId: string, organizationId: string): Promise<StorageFile>;
  listFiles(organizationId: string, limit?: number): Promise<StorageFile[]>;
}

// Database Provider Interface
export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(operation: (conn: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DatabaseProvider extends BaseProvider {
  type: 'database';
  
  getConnection(organizationId: string): Promise<DatabaseConnection>;
  beginTransaction(organizationId: string): Promise<DatabaseConnection>;
  migrate(organizationId: string): Promise<void>;
  backup(organizationId: string): Promise<string>;
}

// Vector Database Provider Interface
export interface VectorEmbedding {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  organizationId: string;
}

export interface VectorSearchRequest {
  vector: number[];
  organizationId: string;
  limit?: number;
  filter?: Record<string, any>;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorProvider extends BaseProvider {
  type: 'vector';
  
  upsert(embeddings: VectorEmbedding[]): Promise<void>;
  search(request: VectorSearchRequest): Promise<VectorSearchResult[]>;
  delete(ids: string[], organizationId: string): Promise<void>;
  createIndex(organizationId: string, dimensions: number): Promise<void>;
}

// Email Provider Interface
export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    mimeType: string;
  }>;
}

export interface EmailProvider extends BaseProvider {
  type: 'email';
  
  sendEmail(message: EmailMessage, organizationId: string): Promise<void>;
  sendTemplate(templateId: string, data: Record<string, any>, to: string[], organizationId: string): Promise<void>;
}

// Provider Factory Interface
export interface ProviderFactory {
  createLLMProvider(config: ProviderConfig): Promise<LLMProvider>;
  createStorageProvider(config: ProviderConfig): Promise<StorageProvider>;
  createDatabaseProvider(config: ProviderConfig): Promise<DatabaseProvider>;
  createVectorProvider(config: ProviderConfig): Promise<VectorProvider>;
  createEmailProvider(config: ProviderConfig): Promise<EmailProvider>;
  
  getAvailableProviders(type: string): string[];
  validateConfig(type: string, config: ProviderConfig): Promise<boolean>;
} 