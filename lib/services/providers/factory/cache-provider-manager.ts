import {
  CacheProvider,
  CacheProviderRegistry,
  type CacheSetOptions,
  type CacheGetOptions,
  type CacheListOptions,
  type CacheListResult,
  type CacheStats
} from '../cache/cache-provider-interface';
import { RedisCacheProvider, RedisCacheProviderFactory, createRedisCacheConfig } from '../cache/redis-cache-provider';
import { MemoryCacheProvider, MemoryCacheProviderFactory, createMemoryCacheConfig } from '../cache/memory-cache-provider';
import type { ProviderConfiguration, HealthCheckResult } from '../base/base-provider';

// ========================================
// Cache Provider Manager
// ========================================

/**
 * Manages cache providers with automatic fallback and health monitoring
 */
export class CacheProviderManager {
  private static instance: CacheProviderManager;
  private registry = CacheProviderRegistry.getInstance();
  private healthCheckInterval: NodeJS.Timer | null = null;
  private readonly logger = console; // Replace with proper logger

  static getInstance(): CacheProviderManager {
    if (!CacheProviderManager.instance) {
      CacheProviderManager.instance = new CacheProviderManager();
    }
    return CacheProviderManager.instance;
  }

  // ========================================
  // Provider Management
  // ========================================

  /**
   * Create and register a cache provider for an organization
   */
  async createProvider(
    organizationId: string,
    config: ProviderConfiguration
  ): Promise<CacheProvider> {
    try {
      let provider: CacheProvider;

      switch (config.type) {
        case 'redis-cache':
          const redisFactory = new RedisCacheProviderFactory();
          provider = redisFactory.create(organizationId, config as any);
          break;
        case 'memory-cache':
          const memoryFactory = new MemoryCacheProviderFactory();
          provider = memoryFactory.create(organizationId, config as any);
          break;
        default:
          throw new Error(`Unsupported cache provider type: ${config.type}`);
      }

      await provider.initialize();
      this.registry.registerProvider(organizationId, provider);

      this.logger.info('Cache provider created and registered', {
        organizationId,
        provider: provider.getName(),
        type: config.type
      });

      return provider;
    } catch (error) {
      this.logger.error('Failed to create cache provider', {
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
  async createProvidersFromEnvironment(): Promise<Map<string, CacheProvider[]>> {
    const providers = new Map<string, CacheProvider[]>();
    const organizationIds = ['default']; // Add logic to get organization IDs

    for (const organizationId of organizationIds) {
      const orgProviders: CacheProvider[] = [];

      try {
        // Try Redis first
        if (process.env.REDIS_URL) {
          const redisConfig = createRedisCacheConfig(organizationId);
          const redisProvider = await this.createProvider(organizationId, redisConfig);
          orgProviders.push(redisProvider);
        }
      } catch (error) {
        this.logger.warn('Redis cache provider failed, will use memory fallback', {
          organizationId,
          error
        });
      }

      try {
        // Always create memory cache as fallback
        const memoryConfig = createMemoryCacheConfig(organizationId);
        const memoryProvider = await this.createProvider(organizationId, memoryConfig);
        orgProviders.push(memoryProvider);
      } catch (error) {
        this.logger.error('Memory cache provider failed', {
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
   * Get or create a cache provider for an organization
   */
  async getOrCreateProvider(organizationId: string): Promise<CacheProvider> {
    let provider = this.registry.getProvider(organizationId);
    
    if (!provider) {
      // Try to create Redis provider first
      try {
        if (process.env.REDIS_URL) {
          const redisConfig = createRedisCacheConfig(organizationId);
          provider = await this.createProvider(organizationId, redisConfig);
        }
      } catch (error) {
        this.logger.warn('Redis provider creation failed, using memory cache', {
          organizationId,
          error
        });
      }

      // Fallback to memory cache
      if (!provider) {
        const memoryConfig = createMemoryCacheConfig(organizationId);
        provider = await this.createProvider(organizationId, memoryConfig);
      }
    }

    return provider;
  }

  /**
   * Execute cache operation with automatic fallback
   */
  async executeWithFallback<T>(
    organizationId: string,
    operation: (provider: CacheProvider) => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      const provider = await this.getOrCreateProvider(organizationId);
      return await operation(provider);
    } catch (error) {
      this.logger.error('Cache operation failed', {
        organizationId,
        error
      });

      // Try fallback to memory cache if we were using Redis
      try {
        const memoryConfig = createMemoryCacheConfig(organizationId);
        const memoryProvider = new MemoryCacheProvider(organizationId, memoryConfig);
        await memoryProvider.initialize();
        this.registry.registerProvider(organizationId, memoryProvider);
        
        return await operation(memoryProvider);
      } catch (fallbackError) {
        this.logger.error('Cache fallback operation failed', {
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

    this.logger.info('Cache provider health monitoring started', { intervalMs });
  }

  /**
   * Stop health check monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Cache provider health monitoring stopped');
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
            this.logger.warn('Cache provider unhealthy', {
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
        
        this.logger.info('Cache provider reinitialized', {
          organizationId,
          provider: provider.getName()
        });
      }
    } catch (error) {
      this.logger.error('Failed to reinitialize cache provider', {
        organizationId,
        error
      });
    }
  }

  // ========================================
  // Organization Management
  // ========================================

  /**
   * Clear all cache data for an organization
   */
  async clearOrganization(organizationId: string): Promise<boolean> {
    try {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        await provider.clear();
        await provider.dispose();
        this.registry.removeProvider(organizationId);
        
        this.logger.info('Organization cache cleared', { organizationId });
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to clear organization cache', {
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
          this.logger.error('Error disposing cache provider', {
            organizationId,
            error
          });
        }
      }
    }
    
    this.registry.clear();
    this.logger.info('Cache provider manager disposed');
  }
}

// ========================================
// Cache Provider Helper
// ========================================

/**
 * Helper class for simplified cache operations
 */
export class CacheProviderHelper {
  private static manager = CacheProviderManager.getInstance();

  /**
   * Set a value in cache
   */
  static async set<T>(
    organizationId: string,
    key: string,
    value: T,
    options?: CacheSetOptions
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.set(key, value, options),
      false
    );
  }

  /**
   * Get a value from cache
   */
  static async get<T>(
    organizationId: string,
    key: string,
    options?: CacheGetOptions
  ): Promise<T | null> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.get<T>(key, options),
      null
    );
  }

  /**
   * Check if key exists in cache
   */
  static async has(organizationId: string, key: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.has(key),
      false
    );
  }

  /**
   * Delete a key from cache
   */
  static async delete(organizationId: string, key: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.delete(key),
      false
    );
  }

  /**
   * Delete multiple keys from cache
   */
  static async deleteMany(organizationId: string, keys: string[]): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.deleteMany(keys),
      0
    );
  }

  /**
   * Clear all cache entries for organization
   */
  static async clear(organizationId: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.clear(),
      false
    );
  }

  /**
   * List cache entries
   */
  static async list(
    organizationId: string,
    options?: CacheListOptions
  ): Promise<CacheListResult> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.list(options),
      { entries: [], hasMore: false, totalCount: 0 }
    );
  }

  /**
   * Set multiple values in cache
   */
  static async setMany<T>(
    organizationId: string,
    entries: Array<{ key: string; value: T; options?: CacheSetOptions }>
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.setMany(entries),
      false
    );
  }

  /**
   * Get multiple values from cache
   */
  static async getMany<T>(
    organizationId: string,
    keys: string[],
    options?: CacheGetOptions
  ): Promise<Array<{ key: string; value: T | null }>> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getMany<T>(keys, options),
      keys.map(key => ({ key, value: null }))
    );
  }

  /**
   * Increment numeric value
   */
  static async increment(
    organizationId: string,
    key: string,
    amount = 1,
    options?: CacheSetOptions
  ): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.increment(key, amount, options),
      0
    );
  }

  /**
   * Decrement numeric value
   */
  static async decrement(
    organizationId: string,
    key: string,
    amount = 1,
    options?: CacheSetOptions
  ): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.decrement(key, amount, options),
      0
    );
  }

  /**
   * Set expiration time for a key
   */
  static async expire(organizationId: string, key: string, ttl: number): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.expire(key, ttl),
      false
    );
  }

  /**
   * Get time to live for a key
   */
  static async ttl(organizationId: string, key: string): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.ttl(key),
      -1
    );
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(organizationId: string, tags: string[]): Promise<number> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.invalidateByTags(tags),
      0
    );
  }

  /**
   * Get cache statistics
   */
  static async getStats(organizationId: string): Promise<CacheStats> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getStats(),
      {
        keyCount: 0,
        memoryUsed: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        evictions: 0,
        expired: 0
      }
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
   * Initialize cache providers from environment
   */
  static async initializeFromEnvironment(): Promise<void> {
    await this.manager.createProvidersFromEnvironment();
  }

  /**
   * Dispose all cache providers
   */
  static async dispose(): Promise<void> {
    await this.manager.dispose();
  }
} 