import { 
  BaseProvider, 
  type ProviderConfiguration, 
  type ProviderFactory as BaseProviderFactory,
  providerFactoryRegistry 
} from '../base/base-provider';
import { 
  LLMProvider,
  llmProviderRegistry,
  type LLMProviderConfig 
} from '../llm/llm-provider-interface';
import { 
  AzureOpenAIProvider,
  AzureOpenAIProviderFactory,
  createAzureOpenAIConfig 
} from '../llm/azure-openai-provider';

/**
 * @description Resultado de criação de provider
 */
export interface ProviderCreationResult<T extends BaseProvider = BaseProvider> {
  success: boolean;
  provider?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * @description Configuração de fallback strategy
 */
export interface FallbackStrategy {
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
  healthCheckIntervalMs: number;
  autoSwitchOnFailure: boolean;
}

/**
 * @description Manager principal de providers
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private organizationProviders: Map<string, Map<string, BaseProvider[]>> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.registerDefaultFactories();
  }

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * @description Criar provider baseado na configuração
   */
  async createProvider<T extends BaseProvider>(
    config: ProviderConfiguration
  ): Promise<ProviderCreationResult<T>> {
    try {
      const provider = providerFactoryRegistry.createProvider<T>(
        config.providerType,
        config.organizationId,
        config
      );

      await provider.initialize();

      // Registrar provider específico se for LLM
      if (config.providerType === 'llm' && provider instanceof LLMProvider) {
        llmProviderRegistry.register(config.organizationId, provider);
      }

      // Armazenar no manager
      this.storeProvider(config.organizationId, config.providerType, provider);

      // Iniciar health checking se habilitado
      this.startHealthChecking(config.organizationId, provider);

      this.auditLog('create_provider', config.providerName, config.organizationId, {
        providerType: config.providerType,
        isPrimary: config.isPrimary,
        isFallback: config.isFallback
      });

      return {
        success: true,
        provider,
        metadata: {
          providerType: config.providerType,
          providerName: config.providerName,
          initialized: true
        }
      };
    } catch (error) {
      this.auditLog('create_provider_failed', config.providerName, config.organizationId, {
        error: (error as Error).message,
        providerType: config.providerType
      });

      return {
        success: false,
        error: (error as Error).message,
        metadata: {
          providerType: config.providerType,
          providerName: config.providerName
        }
      };
    }
  }

  /**
   * @description Criar providers a partir de variáveis de ambiente
   */
  async createProvidersFromEnvironment(
    organizationId: string,
    envVars: Record<string, string | undefined>
  ): Promise<ProviderCreationResult[]> {
    const results: ProviderCreationResult[] = [];

    // Azure OpenAI
    if (envVars.AZURE_API_KEY && envVars.AZURE_RESOURCE_NAME && envVars.AZURE_DEPLOYMENT_NAME) {
      try {
        const config = createAzureOpenAIConfig(organizationId, {
          AZURE_API_KEY: envVars.AZURE_API_KEY,
          AZURE_RESOURCE_NAME: envVars.AZURE_RESOURCE_NAME,
          AZURE_DEPLOYMENT_NAME: envVars.AZURE_DEPLOYMENT_NAME,
          AZURE_API_VERSION: envVars.AZURE_API_VERSION
        }, {
          isPrimary: true,
          priority: 100
        });

        const result = await this.createProvider<AzureOpenAIProvider>(config);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to create Azure OpenAI provider: ${(error as Error).message}`,
          metadata: { providerType: 'llm', providerName: 'azure-openai' }
        });
      }
    }

    // OpenAI Fallback
    if (envVars.OPENAI_API_KEY) {
      try {
        const config: LLMProviderConfig = {
          id: `openai-fallback-${organizationId}`,
          organizationId,
          providerType: 'llm',
          providerName: 'openai',
          enabled: true,
          isPrimary: false,
          isFallback: true,
          priority: 50,
          credentials: {
            apiKey: envVars.OPENAI_API_KEY
          },
          settings: {
            defaultModel: 'gpt-3.5-turbo',
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
            retryAttempts: 3,
            supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
          },
          metadata: {
            name: 'OpenAI (Fallback)',
            description: 'OpenAI fallback provider',
            provider: 'openai'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // TODO: Implementar OpenAI provider quando necessário
        results.push({
          success: false,
          error: 'OpenAI provider not implemented yet',
          metadata: { providerType: 'llm', providerName: 'openai' }
        });
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to create OpenAI provider: ${(error as Error).message}`,
          metadata: { providerType: 'llm', providerName: 'openai' }
        });
      }
    }

    this.auditLog('create_from_environment', 'batch', organizationId, {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * @description Obter provider primário por tipo
   */
  getPrimaryProvider<T extends BaseProvider>(
    organizationId: string,
    providerType: string
  ): T | null {
    if (providerType === 'llm') {
      return llmProviderRegistry.getPrimary(organizationId) as T | null;
    }

    const orgProviders = this.organizationProviders.get(organizationId);
    if (!orgProviders) return null;

    const providers = orgProviders.get(providerType) || [];
    return providers.find(p => p.isPrimary() && p.isEnabled()) as T | null;
  }

  /**
   * @description Obter providers de fallback por tipo
   */
  getFallbackProviders<T extends BaseProvider>(
    organizationId: string,
    providerType: string
  ): T[] {
    if (providerType === 'llm') {
      return llmProviderRegistry.getFallbacks(organizationId) as unknown as T[];
    }

    const orgProviders = this.organizationProviders.get(organizationId);
    if (!orgProviders) return [];

    const providers = orgProviders.get(providerType) || [];
    return providers
      .filter(p => p.isFallback() && p.isEnabled())
      .sort((a, b) => b.getPriority() - a.getPriority()) as T[];
  }

  /**
   * @description Executar operação com fallback automático
   */
  async executeWithFallback<T>(
    organizationId: string,
    providerType: string,
    operation: (provider: BaseProvider) => Promise<T>,
    strategy: FallbackStrategy = this.getDefaultFallbackStrategy()
  ): Promise<T> {
    const primary = this.getPrimaryProvider(organizationId, providerType);
    const fallbacks = this.getFallbackProviders(organizationId, providerType);

    const providers = primary ? [primary, ...fallbacks] : fallbacks;

    if (providers.length === 0) {
      throw new Error(`No providers available for type: ${providerType}`);
    }

    let lastError: Error;

    for (const provider of providers) {
      try {
        const result = await this.executeWithTimeout(
          () => operation(provider),
          strategy.timeoutMs
        );

        this.auditLog('operation_success', provider.getName(), organizationId, {
          providerType,
          isPrimary: provider.isPrimary(),
          isFallback: provider.isFallback()
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        
        this.auditLog('operation_failed', provider.getName(), organizationId, {
          providerType,
          error: lastError.message,
          isPrimary: provider.isPrimary(),
          isFallback: provider.isFallback()
        });

        // Se é o provider primário que falhou, marcar como degraded
        if (provider.isPrimary() && strategy.autoSwitchOnFailure) {
          this.markProviderDegraded(organizationId, provider);
        }
      }
    }

    throw lastError!;
  }

  /**
   * @description Health check de todos os providers da organização
   */
  async healthCheckOrganization(organizationId: string): Promise<{
    [providerType: string]: {
      [providerName: string]: {
        status: 'healthy' | 'unhealthy' | 'degraded';
        responseTime: number;
        error?: string;
      };
    };
  }> {
    const result: any = {};

    // LLM providers
    const llmProviders = llmProviderRegistry.getAll(organizationId);
    if (llmProviders.length > 0) {
      result.llm = {};
      
      for (const provider of llmProviders) {
        try {
          const healthResult = await provider.healthCheck();
          result.llm[provider.getName()] = {
            status: healthResult.status,
            responseTime: healthResult.responseTime,
            error: healthResult.error
          };
        } catch (error) {
          result.llm[provider.getName()] = {
            status: 'unhealthy',
            responseTime: 0,
            error: (error as Error).message
          };
        }
      }
    }

    // Outros tipos de providers...
    const orgProviders = this.organizationProviders.get(organizationId);
    if (orgProviders) {
      for (const [providerType, providers] of orgProviders.entries()) {
        if (providerType !== 'llm' && providers.length > 0) {
          result[providerType] = {};
          
          for (const provider of providers) {
            try {
              const healthResult = await provider.healthCheck();
              result[providerType][provider.getName()] = {
                status: healthResult.status,
                responseTime: healthResult.responseTime,
                error: healthResult.error
              };
            } catch (error) {
              result[providerType][provider.getName()] = {
                status: 'unhealthy',
                responseTime: 0,
                error: (error as Error).message
              };
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * @description Limpar providers da organização
   */
  async clearOrganization(organizationId: string): Promise<void> {
    // Limpar LLM providers
    llmProviderRegistry.clear(organizationId);

    // Limpar outros providers
    const orgProviders = this.organizationProviders.get(organizationId);
    if (orgProviders) {
      for (const providers of orgProviders.values()) {
        for (const provider of providers) {
          await provider.dispose();
        }
      }
      this.organizationProviders.delete(organizationId);
    }

    // Limpar health check intervals
    const intervalKey = `health-${organizationId}`;
    const interval = this.healthCheckIntervals.get(intervalKey);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(intervalKey);
    }

    this.auditLog('clear_organization', 'all', organizationId);
  }

  /**
   * @description Registrar factories padrão
   */
  private registerDefaultFactories(): void {
    // Registrar Azure OpenAI factory
    providerFactoryRegistry.register('azure-openai', new AzureOpenAIProviderFactory());

    console.log('✅ Default provider factories registered');
  }

  /**
   * @description Armazenar provider no manager
   */
  private storeProvider(
    organizationId: string,
    providerType: string,
    provider: BaseProvider
  ): void {
    if (!this.organizationProviders.has(organizationId)) {
      this.organizationProviders.set(organizationId, new Map());
    }

    const orgProviders = this.organizationProviders.get(organizationId)!;
    
    if (!orgProviders.has(providerType)) {
      orgProviders.set(providerType, []);
    }

    orgProviders.get(providerType)!.push(provider);
  }

  /**
   * @description Iniciar health checking periódico
   */
  private startHealthChecking(organizationId: string, provider: BaseProvider): void {
    const intervalKey = `health-${organizationId}-${provider.getId()}`;
    
    // Evitar múltiplos intervals para o mesmo provider
    if (this.healthCheckIntervals.has(intervalKey)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await provider.healthCheck();
      } catch (error) {
        this.auditLog('health_check_failed', provider.getName(), organizationId, {
          error: (error as Error).message
        });
      }
    }, 60000); // 1 minuto

    this.healthCheckIntervals.set(intervalKey, interval);
  }

  /**
   * @description Marcar provider como degraded
   */
  private markProviderDegraded(organizationId: string, provider: BaseProvider): void {
    this.auditLog('provider_degraded', provider.getName(), organizationId, {
      providerType: provider.getType(),
      isPrimary: provider.isPrimary()
    });
  }

  /**
   * @description Executar operação com timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * @description Fallback strategy padrão
   */
  private getDefaultFallbackStrategy(): FallbackStrategy {
    return {
      enabled: true,
      maxRetries: 3,
      timeoutMs: 30000,
      healthCheckIntervalMs: 60000,
      autoSwitchOnFailure: true
    };
  }

  /**
   * @description Log de auditoria
   */
  private auditLog(
    action: string,
    providerName: string,
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`🏭 PROVIDER_MANAGER: ${action} ${providerName} (org: ${organizationId})`, {
      action,
      providerName,
      organizationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

/**
 * @description Helper functions para uso simplificado
 */
export class ProviderHelper {
  private static manager = ProviderManager.getInstance();

  /**
   * @description Inicializar providers para organização
   */
  static async initializeForOrganization(
    organizationId: string,
    envVars?: Record<string, string | undefined>
  ): Promise<{
    success: boolean;
    providers: ProviderCreationResult[];
    errors: string[];
  }> {
    try {
      const env = envVars || process.env;
      const providers = await this.manager.createProvidersFromEnvironment(organizationId, env);
      
      const errors = providers
        .filter(p => !p.success)
        .map(p => p.error!)
        .filter(Boolean);

      return {
        success: providers.some(p => p.success),
        providers,
        errors
      };
    } catch (error) {
      return {
        success: false,
        providers: [],
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * @description Obter provider LLM para organização
   */
  static getLLMProvider(organizationId: string): LLMProvider | null {
    return this.manager.getPrimaryProvider<LLMProvider>(organizationId, 'llm');
  }

  /**
   * @description Executar operação LLM com fallback
   */
  static async executeLLMOperation<T>(
    organizationId: string,
    operation: (provider: LLMProvider) => Promise<T>
  ): Promise<T> {
    return this.manager.executeWithFallback(
      organizationId,
      'llm',
      operation as (provider: BaseProvider) => Promise<T>
    );
  }

  /**
   * @description Health check rápido para organização
   */
  static async quickHealthCheck(organizationId: string): Promise<boolean> {
    try {
      const results = await this.manager.healthCheckOrganization(organizationId);
      
      // Verificar se pelo menos um provider de cada tipo está healthy
      for (const providerType of Object.keys(results)) {
        const providers = results[providerType];
        const hasHealthy = Object.values(providers).some(p => p.status === 'healthy');
        
        if (!hasHealthy) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * @description Singleton do provider manager
 */
export const providerManager = ProviderManager.getInstance();

/**
 * @description Check health of a provider configuration
 */
export async function checkProviderHealth(
  type: string,
  config: any
): Promise<{
  healthy: boolean;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // TODO: Implement actual health check based on provider type
    // For now, return a basic validation
    
    if (!config || !config.type) {
      return {
        healthy: false,
        error: 'Invalid provider configuration',
        responseTime: Date.now() - startTime
      };
    }

    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      healthy: true,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

export class ServiceProviderFactory {
  private readonly providerRegistry = new Map<string, any>();

  constructor() {
    this.registerProviders();
  }

  private registerProviders(): void {
    // LLM Providers - Apenas Azure por enquanto
    this.providerRegistry.set('llm:azure-openai', AzureOpenAIProvider);
    
    console.log('✅ Default provider factories registered');
  }

  getAvailableProviders(type: string): string[] {
    const prefix = `${type}:`;
    return Array.from(this.providerRegistry.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
  }

  // Provider Management Methods
  registerProvider(key: string, providerClass: any): void {
    this.providerRegistry.set(key, providerClass);
  }

  unregisterProvider(key: string): void {
    this.providerRegistry.delete(key);
  }

  isProviderRegistered(type: string, providerType: string): boolean {
    return this.providerRegistry.has(`${type}:${providerType}`);
  }

  getProviderInfo(): Array<{type: string; provider: string; available: boolean}> {
    const info: Array<{type: string; provider: string; available: boolean}> = [];
    
    for (const [key, _] of this.providerRegistry) {
      const [type, provider] = key.split(':');
      info.push({
        type,
        provider,
        available: true
      });
    }

    return info;
  }
}

// Singleton instance
export const providerFactory = new ServiceProviderFactory(); 