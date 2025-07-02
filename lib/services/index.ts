// Service Layer Architecture Exports
// Phase 1: Service Layer Pattern
export { TenantService } from './base/tenant-service';
export { ChatDomainService, type IChatDomainService } from './domain/chat-domain-service';
export { BaseRepository } from './repositories/base-repository';
export { ServiceContainer, ServiceResolver, serviceContainer, services } from './container/service-container';
export { type ServiceContext, type OperationResult } from './types/service-context';

// Phase 2: Provider Abstraction System
export { 
  BaseProvider, 
  ProviderFactoryRegistry, 
  providerFactoryRegistry,
  type ProviderHealthStatus,
  type ProviderConfig,
  type ProviderCredentials,
  type ProviderConfiguration,
  type HealthCheckResult,
  type ProviderMetrics,
  type ProviderFactory
} from './providers/base/base-provider';

export {
  LLMProvider,
  LLMProviderRegistry,
  llmProviderRegistry,
  type LLMMessage,
  type LLMGenerationContext,
  type LLMResponse,
  type LLMStreamChunk,
  type LLMModel,
  type LLMProviderConfig
} from './providers/llm/llm-provider-interface';

export {
  AzureOpenAIProvider,
  AzureOpenAIProviderFactory,
  createAzureOpenAIConfig,
  type AzureOpenAICredentials
} from './providers/llm/azure-openai-provider';

export {
  ProviderManager,
  ProviderHelper,
  providerManager,
  type ProviderCreationResult,
  type FallbackStrategy
} from './providers/factory/provider-manager'; 