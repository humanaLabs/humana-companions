import type { ServiceContext } from '../types/service-context';
import { ChatDomainService, type IChatDomainService } from '../domain/chat-domain-service';
import { ProviderConfigurationService } from '../domain/provider-configuration-service';
import { OrganizationDomainService, type IOrganizationDomainService } from '../domain/organization-domain-service';
import { OrganizationRepositoryImpl } from '../repositories/organization-repository';
import { CompanionDomainServiceImpl, type CompanionDomainService } from '../domain/companion-domain-service';
import { CompanionRepositoryImpl } from '../repositories/companion-repository';
import type { TenantService } from '../base/tenant-service';
import { ProviderManager, ProviderHelper } from '../providers/factory/provider-manager';
import { LLMProvider } from '../providers/llm/llm-provider-interface';

/**
 * @description Registry de services para dependency injection
 */
type ServiceFactory<T = any> = (context: ServiceContext) => T;
type ServiceInstance<T = any> = T;

/**
 * @description Singleton per organization
 */
interface ServiceRegistry {
  [organizationId: string]: {
    [serviceName: string]: ServiceInstance;
  };
}

/**
 * @description Service metadata para container
 */
interface ServiceDefinition {
  factory: ServiceFactory;
  singleton: boolean;
  dependencies?: string[];
}

/**
 * @description Container principal para gerenciamento de serviços
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private registry: ServiceRegistry = {};
  private definitions: Map<string, ServiceDefinition> = new Map();

  private constructor() {
    this.registerCoreServices();
  }

  /**
   * @description Singleton global do container
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * @description Resolver serviço com contexto organizacional
   */
  resolve<T>(
    serviceName: string, 
    context: ServiceContext
  ): T {
    const { organizationId } = context;
    
    // Inicializar registry da organização se não existir
    if (!this.registry[organizationId]) {
      this.registry[organizationId] = {};
    }

    const orgRegistry = this.registry[organizationId];
    
    // Verificar se já existe instância (singleton)
    if (orgRegistry[serviceName]) {
      return orgRegistry[serviceName] as T;
    }

    // Buscar definição do serviço
    const definition = this.definitions.get(serviceName);
    if (!definition) {
      throw new Error(`Service '${serviceName}' not registered`);
    }

    // Resolver dependências primeiro
    const resolvedDependencies = this.resolveDependencies(
      definition.dependencies || [], 
      context
    );

    // Criar instância
    const instance = definition.factory(context);

    // Armazenar se singleton
    if (definition.singleton) {
      orgRegistry[serviceName] = instance;
    }

    // Log para debug
    this.auditLog('resolve', serviceName, context.organizationId, {
      singleton: definition.singleton,
      dependencies: definition.dependencies?.length || 0
    });

    return instance as T;
  }

  /**
   * @description Registrar novo serviço
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    options: {
      singleton?: boolean;
      dependencies?: string[];
    } = {}
  ): void {
    this.definitions.set(name, {
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies || []
    });

    console.log(`📋 Service registered: ${name} (singleton: ${options.singleton ?? true})`);
  }

  /**
   * @description Criar contexto de serviço para organização
   */
  createContext(organizationId: string, requestId?: string): ServiceContext {
    return {
      organizationId,
      requestId: requestId || crypto.randomUUID(),
      timestamp: new Date()
    };
  }

  /**
   * @description Limpar cache de organização (para testes)
   */
  clearOrganization(organizationId: string): void {
    delete this.registry[organizationId];
    
    this.auditLog('clear_org', 'all', organizationId);
  }

  /**
   * @description Limpar todo o cache (para testes)
   */
  clearAll(): void {
    this.registry = {};
    
    console.log('🧹 Service container cleared');
  }

  /**
   * @description Health check de todos os serviços
   */
  async healthCheck(organizationId: string): Promise<{
    [serviceName: string]: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      error?: string;
    };
  }> {
    const context = this.createContext(organizationId);
    const results: Record<string, any> = {};

    for (const [serviceName, definition] of this.definitions.entries()) {
      try {
        const service = this.resolve(serviceName, context);
        
        // Verificar se serviço tem método de health check
        if (typeof (service as any).healthCheck === 'function') {
          const isHealthy = await (service as any).healthCheck();
          results[serviceName] = {
            status: isHealthy ? 'healthy' : 'unhealthy'
          };
        } else {
          results[serviceName] = {
            status: 'unknown'
          };
        }
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          error: (error as Error).message
        };
      }
    }

    return results;
  }

  /**
   * @description Resolver dependências recursivamente
   */
  private resolveDependencies(
    dependencies: string[], 
    context: ServiceContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const dependency of dependencies) {
      resolved[dependency] = this.resolve(dependency, context);
    }

    return resolved;
  }

  /**
   * @description Registrar serviços core do sistema
   */
  private registerCoreServices(): void {
    // Provider Manager (singleton global)
    this.register('ProviderManager', () => {
      return ProviderManager.getInstance();
    }, { singleton: true });

    // LLM Provider (organization-scoped)
    this.register('LLMProvider', (context) => {
      const provider = ProviderHelper.getLLMProvider(context.organizationId);
      if (!provider) {
        // Se não há provider, usar stub para desenvolvimento
        return this.createStubAiProvider();
      }
      return provider;
    }, { singleton: true });

    // Chat Domain Service with real LLM provider
    this.register('ChatDomainService', (context) => {
      const chatRepo = this.createStubRepository('chat');
      const messageRepo = this.createStubRepository('message');
      const llmProvider = this.resolve<LLMProvider>('LLMProvider', context);
      const quotaService = this.createStubQuotaService();

      // Adapter para compatibilidade com AIProvider interface
      const aiProviderAdapter = this.createLLMProviderAdapter(llmProvider);

      return new ChatDomainService(
        context,
        chatRepo,
        messageRepo,
        aiProviderAdapter,
        quotaService
      );
    }, {
      singleton: true,
      dependencies: ['LLMProvider']
    });

    // Provider Configuration Service
    this.register('ProviderConfigurationService', (context) => {
      return new ProviderConfigurationService(context);
    }, {
      singleton: true
    });

    // Organization Domain Service
    this.register('OrganizationDomainService', (context) => {
      const orgRepo = new OrganizationRepositoryImpl();
      const userRepo = this.createStubRepository('user');
      const permissionService = null; // Will be replaced with real implementation
      const quotaService = this.createStubQuotaService();

      return new OrganizationDomainService(
        context.organizationId,
        orgRepo,
        userRepo,
        permissionService,
        quotaService
      );
    }, {
      singleton: true
    });

    // Companion Domain Service
    this.register('CompanionDomainService', (context) => {
      const companionRepo = new CompanionRepositoryImpl();
      const quotaService = this.createStubQuotaService();

      return new CompanionDomainServiceImpl(
        context.organizationId,
        companionRepo,
        quotaService
      );
    }, {
      singleton: true
    });

    console.log('✅ Core services registered with Provider System integration');
  }

  /**
   * @description Criar stub repository para demo
   */
  private createStubRepository(type: string): any {
    return {
      findById: async (id: string) => null,
      findByUserId: async (userId: string) => [],
      findMany: async () => [],
      create: async (data: any) => ({ id: crypto.randomUUID(), ...data }),
      update: async (id: string, data: any) => ({ id, ...data }),
      delete: async (id: string) => {},
      incrementUsage: async (id: string, tokens: number) => {},
      count: async () => 0
    };
  }

  /**
   * @description Criar stub AI provider para demo
   */
  private createStubAiProvider(): any {
    return {
      generateResponse: async (context: any) => ({
        content: 'AI response placeholder',
        model: 'demo-model',
        tokens: { prompt: 10, completion: 20, total: 30 },
        finishReason: 'stop'
      }),
      generateStream: async function* (context: any) {
        yield 'Demo streaming response';
      },
      validateConfig: async () => true,
      getModels: async () => ['demo-model']
    };
  }

  /**
   * @description Criar stub quota service para demo
   */
  private createStubQuotaService(): any {
    return {
      checkQuota: async (organizationId: string, resource: string) => true,
      incrementUsage: async (organizationId: string, resource: string) => {},
      // Legacy methods for backward compatibility
      checkUserQuota: async (userId: string, resource: string) => true,
      getUserUsage: async (userId: string) => ({ chats: 0, messages: 0, tokens: 0 })
    };
  }

  /**
   * @description Adapter LLMProvider -> AIProvider para compatibilidade
   */
  private createLLMProviderAdapter(llmProvider: LLMProvider | any): any {
    // Se é um LLMProvider real, criar adapter
    if (llmProvider && typeof llmProvider.generateResponse === 'function') {
      return {
        generateResponse: async (context: any) => {
          const response = await llmProvider.generateResponse(context);
          return {
            content: response.content,
            model: response.model,
            tokens: {
              prompt: response.usage.promptTokens,
              completion: response.usage.completionTokens,
              total: response.usage.totalTokens
            },
            finishReason: response.finishReason
          };
        },
        generateStream: llmProvider.generateStream?.bind(llmProvider),
        validateConfig: llmProvider.validateConfig?.bind(llmProvider),
        getModels: async () => {
          if (typeof llmProvider.getAvailableModels === 'function') {
            const models = await llmProvider.getAvailableModels();
            return models.map((m: any) => m.id);
          }
          return ['default-model'];
        }
      };
    }

    // Se é stub, retornar como está
    return llmProvider;
  }

  /**
   * @description Log de auditoria para container
   */
  private auditLog(
    operation: string,
    serviceName: string,
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`🏗️ CONTAINER: ${operation} ${serviceName} (org: ${organizationId})`, {
      operation,
      serviceName,
      organizationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

/**
 * @description Helper para resolver serviços de forma mais limpa
 */
export class ServiceResolver {
  constructor(private container: ServiceContainer) {}

  /**
   * @description Resolver chat domain service
   */
  chatDomainService(context: ServiceContext): IChatDomainService {
    return this.container.resolve<IChatDomainService>('ChatDomainService', context);
  }

  /**
   * @description Resolver provider configuration service
   */
  providerConfigurationService(context: ServiceContext): ProviderConfigurationService {
    return this.container.resolve<ProviderConfigurationService>('ProviderConfigurationService', context);
  }

  organizationDomainService(context: ServiceContext): IOrganizationDomainService {
    return this.container.resolve<IOrganizationDomainService>('OrganizationDomainService', context);
  }

  companionDomainService(context: ServiceContext): CompanionDomainService {
    return this.container.resolve<CompanionDomainService>('CompanionDomainService', context);
  }

  /**
   * @description Factory method para criar resolver
   */
  static create(): ServiceResolver {
    return new ServiceResolver(ServiceContainer.getInstance());
  }

  /**
   * @description Create resolver instance
   */
  createResolver(): ServiceResolver {
    return ServiceResolver.create();
  }
}

/**
 * @description Singleton global do container
 */
export const serviceContainer = ServiceContainer.getInstance();

/**
 * @description Helper para resolver serviços
 */
export const services = ServiceResolver.create();

 