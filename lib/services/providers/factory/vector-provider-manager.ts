import {
  VectorProvider,
  VectorProviderRegistry,
  type VectorEmbedding,
  type VectorSearchResult,
  type VectorSearchOptions,
  type VectorUpsertOptions,
  type VectorDeleteOptions,
  type VectorStats,
  type EmbeddingResult
} from '../vector/vector-provider-interface';
import { PostgresVectorProvider, PostgresVectorProviderFactory, createPostgresVectorConfig } from '../vector/postgresql-vector-provider';
import { LocalVectorProvider, LocalVectorProviderFactory, createLocalVectorConfig } from '../vector/local-vector-provider';
import type { ProviderConfiguration, HealthCheckResult } from '../base/base-provider';

// ========================================
// Vector Provider Manager
// ========================================

/**
 * Manages vector providers with automatic fallback and health monitoring
 */
export class VectorProviderManager {
  private static instance: VectorProviderManager;
  private registry = VectorProviderRegistry.getInstance();
  private healthCheckInterval: NodeJS.Timer | null = null;
  private readonly logger = console; // Replace with proper logger

  static getInstance(): VectorProviderManager {
    if (!VectorProviderManager.instance) {
      VectorProviderManager.instance = new VectorProviderManager();
    }
    return VectorProviderManager.instance;
  }

  // ========================================
  // Provider Management
  // ========================================

  /**
   * Create and register a vector provider for an organization
   */
  async createProvider(
    organizationId: string,
    config: ProviderConfiguration
  ): Promise<VectorProvider> {
    try {
      let provider: VectorProvider;

      switch (config.type) {
        case 'postgres-vector':
          const postgresFactory = new PostgresVectorProviderFactory();
          provider = postgresFactory.create(organizationId, config as any);
          break;
        case 'local-vector':
          const localFactory = new LocalVectorProviderFactory();
          provider = localFactory.create(organizationId, config as any);
          break;
        default:
          throw new Error(`Unsupported vector provider type: ${config.type}`);
      }

      await provider.initialize();
      this.registry.registerProvider(organizationId, provider);

      this.logger.info('Vector provider created and registered', {
        organizationId,
        provider: provider.getName(),
        type: config.type
      });

      return provider;
    } catch (error) {
      this.logger.error('Failed to create vector provider', {
        organizationId,
        config: config.type,
        error
      });
      throw error;
    }
  }

  /**
   * Create providers from environment variables
   */
  async createProvidersFromEnvironment(): Promise<Map<string, VectorProvider[]>> {
    const providers = new Map<string, VectorProvider[]>();
    const organizationIds = ['default']; // Add logic to get organization IDs

    for (const organizationId of organizationIds) {
      const orgProviders: VectorProvider[] = [];

      try {
        // Try PostgreSQL vector first
        if (process.env.POSTGRES_URL && process.env.OPENAI_API_KEY) {
          const postgresConfig = createPostgresVectorConfig(organizationId);
          const postgresProvider = await this.createProvider(organizationId, postgresConfig);
          orgProviders.push(postgresProvider);
        }
      } catch (error) {
        this.logger.warn('PostgreSQL vector provider failed, will use local fallback', {
          organizationId,
          error
        });
      }

      try {
        // Always create local vector as fallback
        const localConfig = createLocalVectorConfig(organizationId);
        const localProvider = await this.createProvider(organizationId, localConfig);
        orgProviders.push(localProvider);
      } catch (error) {
        this.logger.error('Local vector provider failed', {
          organizationId,
          error
        });
      }

      if (orgProviders.length > 0) {
        providers.set(organizationId, orgProviders);
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();

    return providers;
  }

  /**
   * Get or create a vector provider for an organization
   */
  async getOrCreateProvider(organizationId: string): Promise<VectorProvider> {
    let provider = this.registry.getProvider(organizationId);
    
    if (!provider) {
      // Try to create PostgreSQL vector provider first
      try {
        if (process.env.POSTGRES_URL && process.env.OPENAI_API_KEY) {
          const postgresConfig = createPostgresVectorConfig(organizationId);
          provider = await this.createProvider(organizationId, postgresConfig);
        }
      } catch (error) {
        this.logger.warn('PostgreSQL vector provider creation failed, using local vector', {
          organizationId,
          error
        });
      }

      // Fallback to local vector
      if (!provider) {
        const localConfig = createLocalVectorConfig(organizationId);
        provider = await this.createProvider(organizationId, localConfig);
      }
    }

    return provider;
  }

  /**
   * Execute vector operation with automatic fallback
   */
  async executeWithFallback<T>(
    organizationId: string,
    operation: (provider: VectorProvider) => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      const provider = await this.getOrCreateProvider(organizationId);
      return await operation(provider);
    } catch (error) {
      this.logger.error('Vector operation failed', {
        organizationId,
        error
      });

      // Try fallback to local vector if we were using PostgreSQL
      try {
        const localConfig = createLocalVectorConfig(organizationId);
        const localProvider = new LocalVectorProvider(organizationId, localConfig);
        await localProvider.initialize();
        this.registry.registerProvider(organizationId, localProvider);
        
        return await operation(localProvider);
      } catch (fallbackError) {
        this.logger.error('Vector fallback operation failed', {
          organizationId,
          error: fallbackError
        });
        return defaultValue;
      }
    }
  }

  // ========================================
  // Health Monitoring
  // ========================================

  /**
   * Start health check monitoring for all providers
   */
  startHealthMonitoring(intervalMs = 5 * 60 * 1000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalMs);

    this.logger.info('Vector provider health monitoring started', { intervalMs });
  }

  /**
   * Stop health check monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Vector provider health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all registered providers
   */
  async performHealthChecks(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    const organizationIds = this.registry.getRegisteredOrganizations();

    for (const organizationId of organizationIds) {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        try {
          const result = await provider.healthCheck();
          results.set(organizationId, result);

          if (result.status === 'unhealthy') {
            this.logger.warn('Vector provider unhealthy', {
              organizationId,
              provider: provider.getName(),
              error: result.error
            });

            // Try to reinitialize unhealthy provider
            await this.reinitializeProvider(organizationId);
          }
        } catch (error) {
          this.logger.error('Health check failed', {
            organizationId,
            provider: provider.getName(),
            error
          });
        }
      }
    }

    return results;
  }

  /**
   * Reinitialize a provider that failed health check
   */
  private async reinitializeProvider(organizationId: string): Promise<void> {
    try {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        await provider.dispose();
        this.registry.removeProvider(organizationId);
        
        // Create new provider
        await this.getOrCreateProvider(organizationId);
        
        this.logger.info('Vector provider reinitialized', {
          organizationId,
          provider: provider.getName()
        });
      }
    } catch (error) {
      this.logger.error('Failed to reinitialize vector provider', {
        organizationId,
        error
      });
    }
  }

  // ========================================
  // Organization Management
  // ========================================

  /**
   * Clear all vector data for an organization
   */
  async clearOrganization(organizationId: string): Promise<boolean> {
    try {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        await provider.clear();
        await provider.dispose();
        this.registry.removeProvider(organizationId);
        
        this.logger.info('Organization vectors cleared', { organizationId });
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to clear organization vectors', {
        organizationId,
        error
      });
      return false;
    }
  }

  /**
   * Dispose all providers and cleanup
   */
  async dispose(): Promise<void> {
    this.stopHealthMonitoring();
    
    const organizationIds = this.registry.getRegisteredOrganizations();
    
    for (const organizationId of organizationIds) {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        try {
          await provider.dispose();
        } catch (error) {
          this.logger.error('Error disposing vector provider', {
            organizationId,
            error
          });
        }
      }
    }
    
    this.registry.clear();
    this.logger.info('Vector provider manager disposed');
  }
}

// ========================================
// Vector Provider Helper
// ========================================

/**
 * Helper class for simplified vector operations
 */
export class VectorProviderHelper {
  private static manager = VectorProviderManager.getInstance();

  /**
   * Generate embedding for text content
   */
  static async generateEmbedding(
    organizationId: string,
    content: string,
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult | null> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.generateEmbedding(content, options),
      null
    );
  }

  /**
   * Generate embeddings for multiple texts
   */
  static async generateEmbeddings(
    organizationId: string,
    contents: string[],
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult[]> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.generateEmbeddings(contents, options),
      []
    );
  }

  /**
   * Upsert vector embeddings
   */
  static async upsert(
    organizationId: string,
    embeddings: Omit<VectorEmbedding, 'createdAt' | 'organizationId'>[],
    options?: VectorUpsertOptions
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.upsert(embeddings, options),
      false
    );
  }

  /**
   * Search for similar vectors
   */
  static async search(
    organizationId: string,
    query: string | number[],
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.search(query, options),
      []
    );
  }

  /**
   * Get vector by ID
   */
  static async getById(
    organizationId: string,
    id: string,
    namespace?: string
  ): Promise<VectorEmbedding | null> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getById(id, namespace),
      null
    );
  }

  /**
   * Get multiple vectors by IDs
   */
  static async getByIds(
    organizationId: string,
    ids: string[],
    namespace?: string
  ): Promise<VectorEmbedding[]> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getByIds(ids, namespace),
      []
    );
  }

  /**
   * Delete vectors
   */
  static async delete(
    organizationId: string,
    options: VectorDeleteOptions
  ): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.delete(options),
      0
    );
  }

  /**
   * List vectors with pagination
   */
  static async list(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      namespace?: string;
      filters?: Record<string, any>;
    }
  ): Promise<{
    embeddings: VectorEmbedding[];
    total: number;
    hasMore: boolean;
  }> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.list(options),
      { embeddings: [], total: 0, hasMore: false }
    );
  }

  /**
   * Create vector index
   */
  static async createIndex(
    organizationId: string,
    name: string,
    dimensions: number,
    options?: {
      metric?: 'cosine' | 'euclidean' | 'dot_product';
      indexType?: string;
      configuration?: Record<string, any>;
    }
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.createIndex(name, dimensions, options),
      false
    );
  }

  /**
   * Delete vector index
   */
  static async deleteIndex(organizationId: string, name: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.deleteIndex(name),
      false
    );
  }

  /**
   * Get vector statistics
   */
  static async getStats(organizationId: string, namespace?: string): Promise<VectorStats> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getStats(namespace),
      {
        totalVectors: 0,
        indexSize: 0,
        dimensions: 0,
        storageUsed: 0,
        avgSearchTime: 0,
        indexType: 'unknown',
        lastUpdated: new Date()
      }
    );
  }

  /**
   * Clear all vectors for organization
   */
  static async clear(organizationId: string, namespace?: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.clear(namespace),
      false
    );
  }

  /**
   * Perform health check
   */
  static async healthCheck(organizationId: string): Promise<HealthCheckResult> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.healthCheck(),
      {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: 0,
        error: 'No provider available'
      }
    );
  }

  /**
   * Initialize vector providers from environment
   */
  static async initializeFromEnvironment(): Promise<void> {
    await this.manager.createProvidersFromEnvironment();
  }

  /**
   * Dispose all vector providers
   */
  static async dispose(): Promise<void> {
    await this.manager.dispose();
  }
} 