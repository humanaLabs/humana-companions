import { createClient, type RedisClientType, type RedisDefaultModules, type RedisFunctions, type RedisScripts } from 'redis';
import { CacheProvider, type CacheSetOptions, type CacheGetOptions, type CacheListOptions, type CacheListResult, type CacheStats, type CacheEntry } from './cache-provider-interface';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { ProviderFactory } from '../factory/provider-factory-interface';

// ========================================
// Redis Configuration
// ========================================

export interface RedisCacheCredentials {
  /** Redis connection URL */
  url: string;
  /** Username for Redis authentication */
  username?: string;
  /** Password for Redis authentication */
  password?: string;
  /** Database number (0-15) */
  database?: number;
  /** Connection timeout in milliseconds */
  connectTimeout?: number;
  /** Command timeout in milliseconds */
  commandTimeout?: number;
  /** Key prefix for organization isolation */
  keyPrefix?: string;
}

export interface RedisCacheConfiguration extends ProviderConfiguration {
  credentials: RedisCacheCredentials;
  settings: {
    /** Default TTL in seconds */
    defaultTtl: number;
    /** Maximum key length */
    maxKeyLength: number;
    /** Maximum value size in bytes */
    maxValueSize: number;
    /** Connection pool size */
    poolSize: number;
    /** Enable compression for large values */
    enableCompression: boolean;
    /** Compression threshold in bytes */
    compressionThreshold: number;
    /** Auto-retry failed commands */
    autoRetry: boolean;
    /** Maximum retry attempts */
    maxRetries: number;
  };
}

// ========================================
// Redis Cache Provider Implementation
// ========================================

export class RedisCacheProvider extends CacheProvider {
  private client: RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts> | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly config: RedisCacheConfiguration;

  constructor(
    organizationId: string,
    config: RedisCacheConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'Redis Cache Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Redis-based cache provider with multi-tenant isolation';
  }

  getPriority(): number {
    return 1; // High priority for Redis
  }

  // ========================================
  // Connection Management
  // ========================================

  async initialize(): Promise<void> {
    if (this.isConnected || this.connectionPromise) {
      return this.connectionPromise || Promise.resolve();
    }

    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  private async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.credentials.url,
        username: this.config.credentials.username,
        password: this.config.credentials.password,
        database: this.config.credentials.database || 0,
        socket: {
          connectTimeout: this.config.credentials.connectTimeout || 5000,
          commandTimeout: this.config.credentials.commandTimeout || 3000,
        },
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis client error', { error, organizationId: this.organizationId });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.info('Redis client connected', { organizationId: this.organizationId });
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('Redis client disconnected', { organizationId: this.organizationId });
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      
      this.logger.info('Redis cache provider initialized', {
        organizationId: this.organizationId,
        provider: this.getName()
      });
    } catch (error) {
      this.logger.error('Failed to connect to Redis', {
        error,
        organizationId: this.organizationId
      });
      throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async dispose(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.connectionPromise = null;
        this.logger.info('Redis cache provider disposed', {
          organizationId: this.organizationId
        });
      } catch (error) {
        this.logger.error('Error disposing Redis client', {
          error,
          organizationId: this.organizationId
        });
      }
    }
  }

  // ========================================
  // Cache Operations
  // ========================================

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const serializedValue = this.serialize(value);
      const ttl = options?.ttl || this.config.settings.defaultTtl;

      // Check value size
      if (serializedValue.length > this.config.settings.maxValueSize) {
        throw new Error(`Value size ${serializedValue.length} exceeds maximum ${this.config.settings.maxValueSize}`);
      }

      // Set with TTL
      if (ttl > 0) {
        await this.client!.setEx(orgKey, ttl, serializedValue);
      } else {
        await this.client!.set(orgKey, serializedValue);
      }

      // Add tags for invalidation if provided
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = this.getOrganizationKey(`tag:${tag}`);
          await this.client!.sAdd(tagKey, orgKey);
          if (ttl > 0) {
            await this.client!.expire(tagKey, ttl);
          }
        }
      }

      this.logger.debug('Cache set successful', {
        key: orgKey,
        ttl,
        tags: options?.tags,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Cache set failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async get<T>(key: string, options?: CacheGetOptions): Promise<T | null> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const value = await this.client!.get(orgKey);
      
      if (value === null) {
        return options?.defaultValue ?? null;
      }

      // Refresh TTL if requested
      if (options?.refreshTtl) {
        const currentTtl = await this.client!.ttl(orgKey);
        if (currentTtl > 0) {
          await this.client!.expire(orgKey, currentTtl);
        }
      }

      const deserializedValue = this.deserialize<T>(value);
      
      this.logger.debug('Cache get successful', {
        key: orgKey,
        found: true,
        organizationId: this.organizationId
      });

      return deserializedValue;
    } catch (error) {
      this.logger.error('Cache get failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return options?.defaultValue ?? null;
    }
  }

  async has(key: string): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const exists = await this.client!.exists(orgKey);
      return exists === 1;
    } catch (error) {
      this.logger.error('Cache has failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const deleted = await this.client!.del(orgKey);
      
      this.logger.debug('Cache delete successful', {
        key: orgKey,
        deleted: deleted > 0,
        organizationId: this.organizationId
      });

      return deleted > 0;
    } catch (error) {
      this.logger.error('Cache delete failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    await this.ensureConnected();
    
    try {
      const orgKeys = keys.map(key => this.getOrganizationKey(key));
      const deleted = await this.client!.del(orgKeys);
      
      this.logger.debug('Cache deleteMany successful', {
        keysCount: keys.length,
        deleted,
        organizationId: this.organizationId
      });

      return deleted;
    } catch (error) {
      this.logger.error('Cache deleteMany failed', {
        keysCount: keys.length,
        error,
        organizationId: this.organizationId
      });
      return 0;
    }
  }

  async clear(): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const pattern = this.getOrganizationKey('*');
      const keys = await this.client!.keys(pattern);
      
      if (keys.length > 0) {
        await this.client!.del(keys);
      }

      this.logger.info('Cache cleared', {
        keysDeleted: keys.length,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Cache clear failed', {
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async list(options?: CacheListOptions): Promise<CacheListResult> {
    await this.ensureConnected();
    
    try {
      const pattern = options?.pattern 
        ? this.getOrganizationKey(options.pattern)
        : this.getOrganizationKey('*');
      
      const limit = options?.limit || 100;
      const keys = await this.client!.keys(pattern);
      const limitedKeys = keys.slice(0, limit);
      
      const entries = [];
      
      for (const key of limitedKeys) {
        const originalKey = key.replace(`org:${this.organizationId}:`, '');
        const entry: any = { key: originalKey };
        
        if (options?.includeValues) {
          const value = await this.client!.get(key);
          entry.value = value ? this.deserialize(value) : null;
        }
        
        if (options?.includeMetadata) {
          const ttl = await this.client!.ttl(key);
          entry.metadata = {
            ttl: ttl > 0 ? ttl : undefined,
            createdAt: new Date(), // Redis doesn't track creation time
            size: this.calculateSize(entry.value || ''),
            hitCount: 0 // Redis doesn't track hit count by default
          };
        }
        
        entries.push(entry);
      }

      return {
        entries,
        hasMore: keys.length > limit,
        totalCount: keys.length
      };
    } catch (error) {
      this.logger.error('Cache list failed', {
        error,
        organizationId: this.organizationId
      });
      return {
        entries: [],
        hasMore: false,
        totalCount: 0
      };
    }
  }

  async setMany<T>(entries: Array<{ key: string; value: T; options?: CacheSetOptions }>): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const pipeline = this.client!.multi();
      
      for (const entry of entries) {
        const orgKey = this.getOrganizationKey(entry.key);
        const serializedValue = this.serialize(entry.value);
        const ttl = entry.options?.ttl || this.config.settings.defaultTtl;
        
        if (ttl > 0) {
          pipeline.setEx(orgKey, ttl, serializedValue);
        } else {
          pipeline.set(orgKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      
      this.logger.debug('Cache setMany successful', {
        entriesCount: entries.length,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Cache setMany failed', {
        entriesCount: entries.length,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async getMany<T>(keys: string[], options?: CacheGetOptions): Promise<Array<{ key: string; value: T | null }>> {
    await this.ensureConnected();
    
    try {
      const orgKeys = keys.map(key => this.getOrganizationKey(key));
      const values = await this.client!.mGet(orgKeys);
      
      const results = keys.map((key, index) => ({
        key,
        value: values[index] ? this.deserialize<T>(values[index]) : (options?.defaultValue ?? null)
      }));

      return results;
    } catch (error) {
      this.logger.error('Cache getMany failed', {
        keysCount: keys.length,
        error,
        organizationId: this.organizationId
      });
      return keys.map(key => ({ key, value: options?.defaultValue ?? null }));
    }
  }

  async increment(key: string, amount = 1, options?: CacheSetOptions): Promise<number> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const result = await this.client!.incrBy(orgKey, amount);
      
      if (options?.ttl) {
        await this.client!.expire(orgKey, options.ttl);
      }

      return result;
    } catch (error) {
      this.logger.error('Cache increment failed', {
        key,
        amount,
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
  }

  async decrement(key: string, amount = 1, options?: CacheSetOptions): Promise<number> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const result = await this.client!.decrBy(orgKey, amount);
      
      if (options?.ttl) {
        await this.client!.expire(orgKey, options.ttl);
      }

      return result;
    } catch (error) {
      this.logger.error('Cache decrement failed', {
        key,
        amount,
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      const result = await this.client!.expire(orgKey, ttl);
      return result;
    } catch (error) {
      this.logger.error('Cache expire failed', {
        key,
        ttl,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    
    try {
      const orgKey = this.getOrganizationKey(key);
      return await this.client!.ttl(orgKey);
    } catch (error) {
      this.logger.error('Cache ttl failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return -1;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    await this.ensureConnected();
    
    try {
      let totalDeleted = 0;
      
      for (const tag of tags) {
        const tagKey = this.getOrganizationKey(`tag:${tag}`);
        const keys = await this.client!.sMembers(tagKey);
        
        if (keys.length > 0) {
          const deleted = await this.client!.del(keys);
          totalDeleted += deleted;
        }
        
        // Delete the tag set itself
        await this.client!.del(tagKey);
      }

      this.logger.debug('Cache invalidateByTags successful', {
        tags,
        totalDeleted,
        organizationId: this.organizationId
      });

      return totalDeleted;
    } catch (error) {
      this.logger.error('Cache invalidateByTags failed', {
        tags,
        error,
        organizationId: this.organizationId
      });
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.ensureConnected();
    
    try {
      const info = await this.client!.info('memory');
      const pattern = this.getOrganizationKey('*');
      const keys = await this.client!.keys(pattern);
      
      // Parse Redis memory info
      const memoryLines = info.split('\n');
      const usedMemory = memoryLines.find(line => line.startsWith('used_memory:'));
      const memoryUsed = usedMemory ? parseInt(usedMemory.split(':')[1]) : 0;

      return {
        keyCount: keys.length,
        memoryUsed,
        hitRate: 0, // Redis doesn't provide hit rate by default
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        evictions: 0,
        expired: 0
      };
    } catch (error) {
      this.logger.error('Cache getStats failed', {
        error,
        organizationId: this.organizationId
      });
      return {
        keyCount: 0,
        memoryUsed: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        evictions: 0,
        expired: 0
      };
    }
  }

  // ========================================
  // Private Helpers
  // ========================================

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.initialize();
    }
  }

  async getMetrics(): Promise<ProviderMetrics> {
    const stats = await this.getStats();
    
    return {
      requests: stats.totalHits + stats.totalMisses,
      errors: 0, // Would need to track this separately
      responseTime: 0, // Would need to track this separately
      uptime: Date.now(), // Placeholder
      memoryUsage: stats.memoryUsed,
      customMetrics: {
        cacheHitRate: stats.hitRate,
        keyCount: stats.keyCount,
        evictions: stats.evictions
      }
    };
  }
}

// ========================================
// Redis Cache Provider Factory
// ========================================

export class RedisCacheProviderFactory implements ProviderFactory<RedisCacheProvider> {
  create(organizationId: string, config: RedisCacheConfiguration): RedisCacheProvider {
    return new RedisCacheProvider(organizationId, config);
  }

  validateConfig(config: any): config is RedisCacheConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.credentials &&
      typeof config.credentials.url === 'string' &&
      config.settings &&
      typeof config.settings.defaultTtl === 'number'
    );
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      required: ['credentials', 'settings'],
      properties: {
        credentials: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', description: 'Redis connection URL' },
            username: { type: 'string', description: 'Redis username' },
            password: { type: 'string', description: 'Redis password' },
            database: { type: 'number', description: 'Redis database number' }
          }
        },
        settings: {
          type: 'object',
          required: ['defaultTtl'],
          properties: {
            defaultTtl: { type: 'number', description: 'Default TTL in seconds' },
            maxKeyLength: { type: 'number', description: 'Maximum key length' },
            maxValueSize: { type: 'number', description: 'Maximum value size in bytes' }
          }
        }
      }
    };
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Create Redis cache configuration from environment variables
 */
export function createRedisCacheConfig(organizationId?: string): RedisCacheConfiguration {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  return {
    id: `redis-cache-${organizationId || 'default'}`,
    name: 'Redis Cache',
    type: 'cache',
    priority: 1,
    enabled: true,
    credentials: {
      url: redisUrl,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      database: process.env.REDIS_DATABASE ? parseInt(process.env.REDIS_DATABASE) : 0,
      connectTimeout: 5000,
      commandTimeout: 3000
    },
    settings: {
      defaultTtl: 3600, // 1 hour
      maxKeyLength: 250,
      maxValueSize: 512 * 1024 * 1024, // 512MB
      poolSize: 10,
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      autoRetry: true,
      maxRetries: 3
    }
  };
} 