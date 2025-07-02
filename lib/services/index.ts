// Service Layer Architecture Exports
// Phase 1: Service Layer Pattern
export * from './base/tenant-service';
export * from './domain/chat-domain-service';
export * from './repositories/base-repository';
export * from './container/service-container';
export * from './adapters/chat-api-adapter';
export * from './types/service-context';

// Phase 2: Provider Abstraction System
// Base Interfaces
export * from './providers/base/provider-interface';

// Provider Factory
export * from './providers/factory/provider-factory';

// LLM Providers
export * from './providers/llm/openai-provider';
export * from './providers/llm/azure-openai-provider';

// Storage Providers
export * from './providers/storage/vercel-blob-provider';
export * from './providers/storage/aws-s3-provider';

// Health Check System
export * from './providers/health/health-check-service';

// Convenience re-exports for common patterns
export type {
  // Core service types
  ServiceContext,
  OperationResult
} from './types/service-context';

export type {
  // Provider types
  ProviderConfig,
  ProviderHealth,
  LLMProvider,
  StorageProvider,
  DatabaseProvider,
  VectorProvider,
  EmailProvider
} from './providers/base/provider-interface';

export type {
  // Health check types
  HealthStatus,
  OrganizationProviderConfig
} from './providers/health/health-check-service';

// Provider creation helpers
export {
  providerFactory,
  createLLMProviderWithFallback,
  createStorageProviderWithFallback,
  checkProviderHealth
} from './providers/factory/provider-factory'; 