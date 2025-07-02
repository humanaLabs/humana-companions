import { BaseProvider, type ProviderConfiguration, type HealthCheckResult, type ProviderMetrics } from '../base/base-provider';

// ========================================
// Core Cache Types
// ========================================

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  /** The cached value */
  value: T;
  /** Entry creation timestamp */
  createdAt: Date;
  /** Entry expiration timestamp */
  expiresAt?: Date;
  /** Cache hit count */
  hitCount: number;
  /** Entry size in bytes (approximate) */
  size: number;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Cache set options
 */
export interface CacheSetOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Override existing value */
  overwrite?: boolean;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Compression enabled */
  compress?: boolean;
}

/**
 * Cache get options
 */
export interface CacheGetOptions {
  /** Return metadata with value */
  includeMetadata?: boolean;
  /** Refresh TTL on access */
  refreshTtl?: boolean;
  /** Default value if not found */
  defaultValue?: any;
}

/**
 * Cache list options
 */
export interface CacheListOptions {
  /** Key pattern to match */
  pattern?: string;
  /** Maximum keys to return */
  limit?: number;
  /** Include values in response */
  includeValues?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Cache list result
 */
export interface CacheListResult {
  /** Cache entries */
  entries: Array<{
    key: string;
    value?: any;
    metadata?: CacheEntry;
  }>;
  /** Pagination cursor */
  cursor?: string;
  /** Whether there are more results */
  hasMore: boolean;
  /** Total count if available */
  totalCount?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of keys */
  keyCount: number;
  /** Total memory used in bytes */
  memoryUsed: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Miss rate percentage */
  missRate: number;
  /** Total hits */
  totalHits: number;
  /** Total misses */
  totalMisses: number;
  /** Eviction count */
  evictions: number;
  /** Expired keys count */
  expired: number;
}

// ========================================
// Cache Provider Interface
// ========================================

/**
 * Abstract base class for all cache providers
 * Provides caching operations with multi-tenant isolation
 */
export abstract class CacheProvider extends BaseProvider {
  constructor(
    organizationId: string,
    config: ProviderConfiguration
  ) {
    super(organizationId, config, 'cache');
  }

  // ========================================
  // Abstract Methods (Provider Implementation)
  // ========================================

  /**
   * Set a value in cache
   */
  abstract set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions
  ): Promise<boolean>;

  /**
   * Get a value from cache
   */
  abstract get<T>(
    key: string,
    options?: CacheGetOptions
  ): Promise<T | null>;

  /**
   * Check if key exists in cache
   */
  abstract has(key: string): Promise<boolean>;

  /**
   * Delete a key from cache
   */
  abstract delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys
   */
  abstract deleteMany(keys: string[]): Promise<number>;

  /**
   * Clear all cache entries for organization
   */
  abstract clear(): Promise<boolean>;

  /**
   * List cache keys with optional pattern
   */
  abstract list(options?: CacheListOptions): Promise<CacheListResult>;

  /**
   * Set multiple key-value pairs atomically
   */
  abstract setMany<T>(
    entries: Array<{ key: string; value: T; options?: CacheSetOptions }>
  ): Promise<boolean>;

  /**
   * Get multiple values by keys
   */
  abstract getMany<T>(
    keys: string[],
    options?: CacheGetOptions
  ): Promise<Array<{ key: string; value: T | null }>>;

  /**
   * Increment numeric value
   */
  abstract increment(
    key: string,
    amount?: number,
    options?: CacheSetOptions
  ): Promise<number>;

  /**
   * Decrement numeric value
   */
  abstract decrement(
    key: string,
    amount?: number,
    options?: CacheSetOptions
  ): Promise<number>;

  /**
   * Set expiration time for a key
   */
  abstract expire(key: string, ttl: number): Promise<boolean>;

  /**
   * Get time to live for a key
   */
  abstract ttl(key: string): Promise<number>;

  /**
   * Invalidate cache by tags
   */
  abstract invalidateByTags(tags: string[]): Promise<number>;

  /**
   * Get cache statistics
   */
  abstract getStats(): Promise<CacheStats>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Generate organization-scoped cache key
   */
  protected getOrganizationKey(key: string): string {
    const cleanKey = key.replace(/[^a-zA-Z0-9:_-]/g, '_');
    return `org:${this.organizationId}:${cleanKey}`;
  }

  /**
   * Calculate cache entry size
   */
  protected calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Check if value should be compressed
   */
  protected shouldCompress(value: any, options?: CacheSetOptions): boolean {
    if (options?.compress === false) return false;
    if (options?.compress === true) return true;
    
    // Auto-compress if size > 1KB
    return this.calculateSize(value) > 1024;
  }

  /**
   * Serialize value for storage
   */
  protected serialize(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new Error(`Failed to serialize cache value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deserialize value from storage
   */
  protected deserialize<T>(data: string): T {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to deserialize cache value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check implementation for cache providers
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test set/get cycle
      const testKey = `health-check-${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue, { ttl: 60 });
      const retrieved = await this.get(testKey);
      
      if (!retrieved || JSON.stringify(retrieved) !== JSON.stringify(testValue)) {
        throw new Error('Cache set/get cycle failed');
      }
      
      await this.delete(testKey);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operations: ['set', 'get', 'delete']
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operation: 'health-check'
        }
      };
    }
  }
}

// ========================================
// Cache Provider Registry
// ========================================

/**
 * Registry for managing cache providers by organization
 */
export class CacheProviderRegistry {
  private static instance: CacheProviderRegistry;
  private providers = new Map<string, CacheProvider>();

  static getInstance(): CacheProviderRegistry {
    if (!CacheProviderRegistry.instance) {
      CacheProviderRegistry.instance = new CacheProviderRegistry();
    }
    return CacheProviderRegistry.instance;
  }

  registerProvider(organizationId: string, provider: CacheProvider): void {
    const key = `${organizationId}:cache`;
    this.providers.set(key, provider);
  }

  getProvider(organizationId: string): CacheProvider | undefined {
    const key = `${organizationId}:cache`;
    return this.providers.get(key);
  }

  removeProvider(organizationId: string): void {
    const key = `${organizationId}:cache`;
    this.providers.delete(key);
  }

  getRegisteredOrganizations(): string[] {
    const organizationIds = new Set<string>();
    for (const key of this.providers.keys()) {
      const [orgId] = key.split(':');
      organizationIds.add(orgId);
    }
    return Array.from(organizationIds);
  }

  clear(): void {
    this.providers.clear();
  }
} 