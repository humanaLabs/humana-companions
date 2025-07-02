import type { ServiceContext } from '../types/service-context';

export interface ServiceDefinition<T = any> {
  factory: () => T;
  singleton?: boolean;
  instance?: T;
}

export interface ServiceContainer {
  register<T>(key: string, factory: () => T, singleton?: boolean): void;
  registerSingleton<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
  resolveWithContext<T>(key: string, context: ServiceContext): T;
  has(key: string): boolean;
  clear(): void;
}

export class ServiceContainerImpl implements ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();

  register<T>(key: string, factory: () => T, singleton = false): void {
    this.services.set(key, {
      factory,
      singleton
    });
  }

  registerSingleton<T>(key: string, factory: () => T): void {
    this.register(key, factory, true);
  }

  resolve<T>(key: string): T {
    const definition = this.services.get(key);
    if (!definition) {
      throw new Error(`Service ${key} not registered`);
    }

    // Return cached instance for singletons
    if (definition.singleton && this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Create new instance
    const instance = definition.factory();

    // Cache if singleton
    if (definition.singleton) {
      this.instances.set(key, instance);
    }

    return instance;
  }

  resolveWithContext<T>(key: string, context: ServiceContext): T {
    // Try organization-specific service first
    const organizationKey = `${key}:${context.organizationId}`;
    
    if (this.services.has(organizationKey)) {
      return this.resolve(organizationKey);
    }

    // Fall back to default service
    return this.resolve(key);
  }

  has(key: string): boolean {
    return this.services.has(key);
  }

  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}

// Global service container instance
export const serviceContainer = new ServiceContainerImpl();

// Service registration utilities
export class ServiceRegistrar {
  static registerCoreServices(
    container: ServiceContainer,
    organizationId?: string
  ): void {
    // Register default services that don't require organization context
    // These will be expanded as we implement more services
    
    // Example placeholder registrations
    // These will be replaced with actual implementations
    
    if (organizationId) {
      // Organization-specific services
      this.registerOrganizationServices(container, organizationId);
    }
  }

  static registerOrganizationServices(
    container: ServiceContainer,
    organizationId: string
  ): void {
    // This will be populated as we implement more services
    // Example structure:
    
    // container.register(`chatService:${organizationId}`, () => 
    //   new ChatDomainServiceImpl(
    //     organizationId,
    //     container.resolve(`chatRepository:${organizationId}`),
    //     container.resolve(`messageRepository:${organizationId}`),
    //     container.resolve(`quotaService:${organizationId}`),
    //     container.resolve(`aiProvider:${organizationId}`)
    //   )
    // );
  }

  static registerRepositories(
    container: ServiceContainer,
    organizationId: string,
    dbConnection: any // Will be properly typed when DB abstraction is implemented
  ): void {
    // Register repositories with database connection
    // This will be implemented when we create concrete repository implementations
  }

  static registerProviders(
    container: ServiceContainer,
    organizationId: string,
    providerConfigs: any // Will be properly typed when provider abstraction is implemented
  ): void {
    // Register LLM, Storage, and other providers based on organization configuration
    // This will be implemented in Phase 2 (Provider Abstraction)
  }
}

// Helper function to resolve services with automatic context
export function resolveService<T>(
  serviceKey: string,
  organizationId: string,
  userId?: string
): T {
  const context: ServiceContext = {
    organizationId,
    userId,
    timestamp: new Date(),
    requestId: crypto.randomUUID()
  };
  
  return serviceContainer.resolveWithContext<T>(serviceKey, context);
}

// Type-safe service resolution helpers
export function resolveChatService(organizationId: string) {
  return resolveService<any>('chatService', organizationId);
}

export function resolveDocumentService(organizationId: string) {
  return resolveService<any>('documentService', organizationId);
}

export function resolveCompanionService(organizationId: string) {
  return resolveService<any>('companionService', organizationId);
} 