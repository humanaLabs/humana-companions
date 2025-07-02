import {
  ProviderFactory,
  ProviderConfig,
  LLMProvider,
  StorageProvider,
  DatabaseProvider,
  VectorProvider,
  EmailProvider
} from '../base/provider-interface';

// LLM Providers
import { OpenAIProvider } from '../llm/openai-provider';
import { AzureOpenAIProvider } from '../llm/azure-openai-provider';

// Storage Providers
import { VercelBlobProvider } from '../storage/vercel-blob-provider';
import { AWSS3Provider } from '../storage/aws-s3-provider';

export class ServiceProviderFactory implements ProviderFactory {
  private readonly providerRegistry = new Map<string, any>();

  constructor() {
    this.registerProviders();
  }

  private registerProviders(): void {
    // LLM Providers
    this.providerRegistry.set('llm:openai', OpenAIProvider);
    this.providerRegistry.set('llm:azure-openai', AzureOpenAIProvider);

    // Storage Providers
    this.providerRegistry.set('storage:vercel-blob', VercelBlobProvider);
    this.providerRegistry.set('storage:aws-s3', AWSS3Provider);

    // TODO: Add more providers as they're implemented
    // this.providerRegistry.set('database:postgresql', PostgreSQLProvider);
    // this.providerRegistry.set('vector:pinecone', PineconeProvider);
    // this.providerRegistry.set('email:sendgrid', SendGridProvider);
  }

  async createLLMProvider(config: ProviderConfig): Promise<LLMProvider> {
    const providerKey = `llm:${config.type}`;
    const ProviderClass = this.providerRegistry.get(providerKey);

    if (!ProviderClass) {
      throw new Error(`LLM provider '${config.type}' not found. Available: ${this.getAvailableProviders('llm').join(', ')}`);
    }

    const provider = new ProviderClass() as LLMProvider;
    await provider.initialize(config);
    return provider;
  }

  async createStorageProvider(config: ProviderConfig): Promise<StorageProvider> {
    const providerKey = `storage:${config.type}`;
    const ProviderClass = this.providerRegistry.get(providerKey);

    if (!ProviderClass) {
      throw new Error(`Storage provider '${config.type}' not found. Available: ${this.getAvailableProviders('storage').join(', ')}`);
    }

    const provider = new ProviderClass() as StorageProvider;
    await provider.initialize(config);
    return provider;
  }

  async createDatabaseProvider(config: ProviderConfig): Promise<DatabaseProvider> {
    const providerKey = `database:${config.type}`;
    const ProviderClass = this.providerRegistry.get(providerKey);

    if (!ProviderClass) {
      throw new Error(`Database provider '${config.type}' not found. Available: ${this.getAvailableProviders('database').join(', ')}`);
    }

    const provider = new ProviderClass() as DatabaseProvider;
    await provider.initialize(config);
    return provider;
  }

  async createVectorProvider(config: ProviderConfig): Promise<VectorProvider> {
    const providerKey = `vector:${config.type}`;
    const ProviderClass = this.providerRegistry.get(providerKey);

    if (!ProviderClass) {
      throw new Error(`Vector provider '${config.type}' not found. Available: ${this.getAvailableProviders('vector').join(', ')}`);
    }

    const provider = new ProviderClass() as VectorProvider;
    await provider.initialize(config);
    return provider;
  }

  async createEmailProvider(config: ProviderConfig): Promise<EmailProvider> {
    const providerKey = `email:${config.type}`;
    const ProviderClass = this.providerRegistry.get(providerKey);

    if (!ProviderClass) {
      throw new Error(`Email provider '${config.type}' not found. Available: ${this.getAvailableProviders('email').join(', ')}`);
    }

    const provider = new ProviderClass() as EmailProvider;
    await provider.initialize(config);
    return provider;
  }

  getAvailableProviders(type: string): string[] {
    const prefix = `${type}:`;
    return Array.from(this.providerRegistry.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
  }

  async validateConfig(type: string, config: ProviderConfig): Promise<boolean> {
    try {
      // Create a test instance to validate configuration
      switch (type) {
        case 'llm':
          const llmProvider = await this.createLLMProvider(config);
          await llmProvider.destroy();
          break;
        case 'storage':
          const storageProvider = await this.createStorageProvider(config);
          await storageProvider.destroy();
          break;
        case 'database':
          const dbProvider = await this.createDatabaseProvider(config);
          await dbProvider.destroy();
          break;
        case 'vector':
          const vectorProvider = await this.createVectorProvider(config);
          await vectorProvider.destroy();
          break;
        case 'email':
          const emailProvider = await this.createEmailProvider(config);
          await emailProvider.destroy();
          break;
        default:
          throw new Error(`Unknown provider type: ${type}`);
      }
      return true;
    } catch (error) {
      console.error(`Provider validation failed for ${type}:${config.type}:`, error);
      return false;
    }
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

// Helper functions for provider creation with fallbacks
export async function createLLMProviderWithFallback(
  primaryConfig: ProviderConfig,
  fallbackConfigs: ProviderConfig[] = []
): Promise<LLMProvider> {
  const configs = [primaryConfig, ...fallbackConfigs];
  
  for (const config of configs) {
    try {
      return await providerFactory.createLLMProvider(config);
    } catch (error) {
      console.warn(`Failed to create LLM provider ${config.type}:`, error);
      continue;
    }
  }
  
  throw new Error('All LLM provider configurations failed');
}

export async function createStorageProviderWithFallback(
  primaryConfig: ProviderConfig,
  fallbackConfigs: ProviderConfig[] = []
): Promise<StorageProvider> {
  const configs = [primaryConfig, ...fallbackConfigs];
  
  for (const config of configs) {
    try {
      return await providerFactory.createStorageProvider(config);
    } catch (error) {
      console.warn(`Failed to create Storage provider ${config.type}:`, error);
      continue;
    }
  }
  
  throw new Error('All Storage provider configurations failed');
}

// Provider health check utility
export async function checkProviderHealth(
  type: string,
  config: ProviderConfig
): Promise<{ provider: string; healthy: boolean; error?: string; responseTime?: number }> {
  try {
    let provider: any;
    
    switch (type) {
      case 'llm':
        provider = await providerFactory.createLLMProvider(config);
        break;
      case 'storage':
        provider = await providerFactory.createStorageProvider(config);
        break;
      default:
        throw new Error(`Health check not supported for type: ${type}`);
    }

    const health = await provider.checkHealth();
    await provider.destroy();

    return {
      provider: config.type,
      healthy: health.status === 'healthy',
      error: health.error,
      responseTime: health.responseTime
    };
  } catch (error) {
    return {
      provider: config.type,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 