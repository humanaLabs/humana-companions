// ========================================
// Phase 1: Service Layer Pattern (Complete)
// ========================================

// Base Services
export { TenantService } from './base/tenant-service';

// Service Container
export { ServiceContainer } from './container/service-container';

// Domain Services
export { ChatDomainService } from './domain/chat-domain-service';
export { ProviderConfigurationService } from './domain/provider-configuration-service';

// Repositories
export { BaseRepository } from './repositories/base-repository';
export { ChatRepositoryImpl } from './repositories/chat-repository';

// Types
export type { ServiceContext } from './types/service-context';

// ========================================
// Phase 2: Provider Abstraction System (Complete)
// ========================================

// Base Provider
export { BaseProvider } from './providers/base/base-provider';
export type { 
  ProviderConfiguration, 
  ProviderMetrics,
  HealthCheckResult 
} from './providers/base/base-provider';

// Provider Factory
export { ProviderManager, ProviderHelper, ServiceProviderFactory } from './providers/factory/provider-factory';
export type { ProviderCreationResult, FallbackStrategy } from './providers/factory/provider-factory';

// LLM Providers
export { LLMProvider, LLMProviderRegistry } from './providers/llm/llm-provider-interface';
export type { 
  LLMMessage, 
  LLMGenerationContext,
  LLMResponse, 
  LLMStreamChunk, 
  LLMModel,
  LLMProviderConfig,
  LLMTool,
  LLMToolCall
} from './providers/llm/llm-provider-interface';

// Azure OpenAI Provider
export { AzureOpenAIProvider, AzureOpenAIProviderFactory, createAzureOpenAIConfig } from './providers/llm/azure-openai-provider';
export type { AzureOpenAICredentials } from './providers/llm/azure-openai-provider';

// Health Provider
export { HealthCheckServiceImpl } from './providers/health/health-check-service';
export type { HealthStatus, HealthCheckService, OrganizationProviderConfig } from './providers/health/health-check-service';

// ========================================
// Phase 3: Advanced Provider Features (Complete)
// ========================================

// 3.1 Storage Providers
export { StorageProvider } from './providers/storage/storage-provider-interface';
export type {
  StorageObjectMetadata,
  StorageUploadOptions,
  StorageDownloadOptions,
  StorageListOptions,
  StorageListResult,
  StorageUrlOptions
} from './providers/storage/storage-provider-interface';

// Vercel Blob Provider
export { VercelBlobProvider, VercelBlobProviderFactory, createVercelBlobConfig } from './providers/storage/vercel-blob-provider';
export type { VercelBlobCredentials } from './providers/storage/vercel-blob-provider';

// Local Storage Provider
export { LocalStorageProvider, LocalStorageProviderFactory, createLocalStorageConfig } from './providers/storage/local-storage-provider';

// Storage Manager
export { StorageProviderManager, StorageProviderHelper } from './providers/factory/storage-provider-manager';

// 3.2 Cache Providers
export { CacheProvider, CacheProviderRegistry } from './providers/cache/cache-provider-interface';
export type {
  CacheEntry,
  CacheSetOptions,
  CacheGetOptions,
  CacheListOptions,
  CacheListResult,
  CacheStats
} from './providers/cache/cache-provider-interface';

// Redis Cache Provider
export { RedisCacheProvider, RedisCacheProviderFactory, createRedisCacheConfig } from './providers/cache/redis-cache-provider';
export type { RedisCacheCredentials } from './providers/cache/redis-cache-provider';

// Memory Cache Provider
export { MemoryCacheProvider, MemoryCacheProviderFactory, createMemoryCacheConfig } from './providers/cache/memory-cache-provider';

// Cache Manager
export { CacheProviderManager, CacheProviderHelper } from './providers/factory/cache-provider-manager';

// 3.3 Vector Providers
export { VectorProvider, VectorProviderRegistry } from './providers/vector/vector-provider-interface';
export type {
  VectorEmbedding,
  VectorSearchResult,
  VectorSearchOptions,
  VectorUpsertOptions,
  VectorDeleteOptions,
  VectorStats,
  EmbeddingResult
} from './providers/vector/vector-provider-interface';

// PostgreSQL Vector Provider
export { PostgresVectorProvider, PostgresVectorProviderFactory, createPostgresVectorConfig } from './providers/vector/postgresql-vector-provider';
export type { PostgresVectorCredentials } from './providers/vector/postgresql-vector-provider';

// Local Vector Provider
export { LocalVectorProvider, LocalVectorProviderFactory, createLocalVectorConfig } from './providers/vector/local-vector-provider';

// Vector Manager
export { VectorProviderManager, VectorProviderHelper } from './providers/factory/vector-provider-manager';

// 3.4 Email Providers
export { EmailProvider, EmailProviderRegistry } from './providers/email/email-provider-interface';
export type {
  EmailAddress,
  EmailOptions,
  BulkEmailOptions,
  EmailTemplate,
  EmailSendResult,
  BulkEmailSendResult,
  EmailStats,
  EmailValidationResult,
  EmailAttachment
} from './providers/email/email-provider-interface';

// SendGrid Email Provider
export { SendGridEmailProvider, SendGridEmailProviderFactory, createSendGridEmailConfig } from './providers/email/sendgrid-email-provider';
export type { SendGridCredentials } from './providers/email/sendgrid-email-provider';

// SMTP Email Provider
export { SMTPEmailProvider, SMTPEmailProviderFactory, createSMTPEmailConfig } from './providers/email/smtp-email-provider';
export type { SMTPCredentials } from './providers/email/smtp-email-provider';

// Email Manager
export { EmailProviderManager, EmailProviderHelper } from './providers/factory/email-provider-manager';

// 3.5 Database Providers
export { DatabaseProvider, DatabaseProviderRegistry } from './providers/database/database-provider-interface';
export type {
  DatabaseConnection,
  QueryResult,
  Transaction,
  DatabaseStats,
  Migration,
  SchemaInfo
} from './providers/database/database-provider-interface';

// ========================================
// Phase 4: BYOC Interface (Complete)
// ========================================

// Provider Configuration Schema
export type { 
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
  MigrationRequest,
  MigrationResult
} from './domain/provider-configuration-service'; 