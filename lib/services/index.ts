// Base Service Layer
export { TenantService, type ServiceConfig } from './base/tenant-service';

// Types and Contexts
export type { 
  ServiceContext, 
  OperationResult, 
  PaginationContext, 
  SearchContext 
} from './types/service-context';

// Repository Layer
export type { 
  Repository, 
  TransactionalRepository 
} from './repositories/base-repository';
export { BaseRepositoryImpl } from './repositories/base-repository';

// Domain Services
export { 
  ChatDomainServiceImpl,
  type ChatDomainService,
  type Chat,
  type Message,
  type CreateChatRequest,
  type AddMessageRequest,
  type ChatContext,
  type AIResponse
} from './domain/chat-domain-service';

// Dependency Injection
export { 
  ServiceContainerImpl,
  ServiceRegistrar,
  serviceContainer,
  resolveService,
  resolveChatService,
  resolveDocumentService,
  resolveCompanionService,
  type ServiceContainer,
  type ServiceDefinition
} from './container/service-container';

// API Adapters
export { 
  ChatApiAdapter, 
  createChatApiAdapter 
} from './adapters/chat-api-adapter'; 