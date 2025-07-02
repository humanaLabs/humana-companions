import { CacheProvider, type CacheSetOptions, type CacheGetOptions, type CacheListOptions, type CacheListResult, type CacheStats, type CacheEntry } from './cache-provider-interface';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { ProviderFactory } from '../factory/provider-factory-interface';

// ========================================
// Memory Cache Configuration
// ========================================

export interface MemoryCacheConfiguration extends ProviderConfiguration {
  settings: {
    /** Maximum number of entries */
    maxEntries: number;
    /** Default TTL in seconds */
    defaultTtl: number;
    /** Maximum memory usage in bytes */
    maxMemoryUsage: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
    /** LRU eviction enabled */
    enableLru: boolean;
    /** Statistics tracking enabled */
    enableStats: boolean;
    /** Check for expired entries on get */
    checkExpirationOnGet: boolean;
  };
}

// ========================================
// Memory Cache Entry
// ========================================

interface MemoryCacheEntry<T = any> extends CacheEntry<T> {
  /** Last access timestamp for LRU */
  lastAccessed: Date;
  /** Entry tags for invalidation */
  tags?: string[];
}

// ========================================
// Memory Cache Provider Implementation
// ========================================

export class MemoryCacheProvider extends CacheProvider {
  private cache = new Map<string, MemoryCacheEntry>();
  private tagMap = new Map<string, Set<string>>();
  private readonly config: MemoryCacheConfiguration;
  private cleanupTimer: NodeJS.Timer | null = null;
  
  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    expired: 0,
    memoryUsage: 0
  };

  constructor(
    organizationId: string,
    config: MemoryCacheConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'Memory Cache Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'In-memory cache provider with LRU eviction and TTL support';
  }

  getPriority(): number {
    return 999; // Lowest priority - fallback option
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  async initialize(): Promise<void> {
    // Start cleanup timer
    if (this.config.settings.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.settings.cleanupInterval);
    }

    this.logger.info('Memory cache provider initialized', {
      organizationId: this.organizationId,
      provider: this.getName(),
      maxEntries: this.config.settings.maxEntries,
      maxMemoryUsage: this.config.settings.maxMemoryUsage
    });
  }

  async dispose(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.cache.clear();
    this.tagMap.clear();
    
    this.logger.info('Memory cache provider disposed', {
      organizationId: this.organizationId
    });
  }

  // ========================================
  // Cache Operations
  // ========================================

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean> {
    try {
      const orgKey = this.getOrganizationKey(key);
      
      // Check if we need to evict entries
      if (this.cache.size >= this.config.settings.maxEntries) {
        await this.evictEntries();
      }

      const now = new Date();
      const ttl = options?.ttl || this.config.settings.defaultTtl;
      const expiresAt = ttl > 0 ? new Date(now.getTime() + ttl * 1000) : undefined;
      const size = this.calculateSize(value);

      // Check memory usage
      if (this.stats.memoryUsage + size > this.config.settings.maxMemoryUsage) {
        await this.evictByMemory(size);
      }

      const entry: MemoryCacheEntry<T> = {
        value,
        createdAt: now,
        expiresAt,
        hitCount: 0,
        size,
        lastAccessed: now,
        metadata: options?.metadata,
        tags: options?.tags
      };

      // Remove old entry if exists
      const oldEntry = this.cache.get(orgKey);
      if (oldEntry) {
        this.stats.memoryUsage -= oldEntry.size;
        this.removeTags(orgKey, oldEntry.tags);
      }

      this.cache.set(orgKey, entry);
      this.stats.memoryUsage += size;
      this.stats.sets++;

      // Update tag mappings
      if (options?.tags) {
        this.addTags(orgKey, options.tags);
      }

      this.logger.debug('Memory cache set successful', {
        key: orgKey,
        ttl,
        size,
        tags: options?.tags,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Memory cache set failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async get<T>(key: string, options?: CacheGetOptions): Promise<T | null> {
    try {
      const orgKey = this.getOrganizationKey(key);
      const entry = this.cache.get(orgKey) as MemoryCacheEntry<T> | undefined;

      if (!entry) {
        this.stats.misses++;
        return options?.defaultValue ?? null;
      }

      // Check expiration
      if (this.config.settings.checkExpirationOnGet && this.isExpired(entry)) {
        this.cache.delete(orgKey);
        this.stats.memoryUsage -= entry.size;
        this.stats.expired++;
        this.stats.misses++;
        this.removeTags(orgKey, entry.tags);
        return options?.defaultValue ?? null;
      }

      // Update access statistics
      entry.hitCount++;
      entry.lastAccessed = new Date();
      this.stats.hits++;

      // Refresh TTL if requested
      if (options?.refreshTtl && entry.expiresAt) {
        const ttl = this.config.settings.defaultTtl;
        entry.expiresAt = new Date(Date.now() + ttl * 1000);
      }

      this.logger.debug('Memory cache get successful', {
        key: orgKey,
        found: true,
        hitCount: entry.hitCount,
        organizationId: this.organizationId
      });

      return entry.value;
    } catch (error) {
      this.logger.error('Memory cache get failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      this.stats.misses++;
      return options?.defaultValue ?? null;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const orgKey = this.getOrganizationKey(key);
      const entry = this.cache.get(orgKey);
      
      if (!entry) {
        return false;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(orgKey);
        this.stats.memoryUsage -= entry.size;
        this.stats.expired++;
        this.removeTags(orgKey, entry.tags);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Memory cache has failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const orgKey = this.getOrganizationKey(key);
      const entry = this.cache.get(orgKey);
      
      if (!entry) {
        return false;
      }

      this.cache.delete(orgKey);
      this.stats.memoryUsage -= entry.size;
      this.stats.deletes++;
      this.removeTags(orgKey, entry.tags);

      this.logger.debug('Memory cache delete successful', {
        key: orgKey,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Memory cache delete failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    let deleted = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }

    this.logger.debug('Memory cache deleteMany successful', {
      keysCount: keys.length,
      deleted,
      organizationId: this.organizationId
    });

    return deleted;
  }

  async clear(): Promise<boolean> {
    try {
      const orgPrefix = `org:${this.organizationId}:`;
      const keysToDelete: string[] = [];
      
      for (const [key] of this.cache) {
        if (key.startsWith(orgPrefix)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        const entry = this.cache.get(key);
        if (entry) {
          this.cache.delete(key);
          this.stats.memoryUsage -= entry.size;
          this.removeTags(key, entry.tags);
        }
      }

      this.logger.info('Memory cache cleared', {
        keysDeleted: keysToDelete.length,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Memory cache clear failed', {
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async list(options?: CacheListOptions): Promise<CacheListResult> {
    try {
      const orgPrefix = `org:${this.organizationId}:`;
      const entries = [];
      const limit = options?.limit || 100;
      let count = 0;

      for (const [key, entry] of this.cache) {
        if (count >= limit) break;
        
        if (!key.startsWith(orgPrefix)) continue;
        
        // Check pattern if provided
        if (options?.pattern) {
          const originalKey = key.replace(orgPrefix, '');
          const regex = new RegExp(options.pattern.replace(/\*/g, '.*'));
          if (!regex.test(originalKey)) continue;
        }

        // Check expiration
        if (this.isExpired(entry)) {
          this.cache.delete(key);
          this.stats.memoryUsage -= entry.size;
          this.stats.expired++;
          this.removeTags(key, entry.tags);
          continue;
        }

        const originalKey = key.replace(orgPrefix, '');
        const resultEntry: any = { key: originalKey };

        if (options?.includeValues) {
          resultEntry.value = entry.value;
        }

        if (options?.includeMetadata) {
          resultEntry.metadata = {
            createdAt: entry.createdAt,
            expiresAt: entry.expiresAt,
            hitCount: entry.hitCount,
            size: entry.size,
            lastAccessed: entry.lastAccessed,
            metadata: entry.metadata
          };
        }

        entries.push(resultEntry);
        count++;
      }

      const totalKeys = Array.from(this.cache.keys()).filter(key => key.startsWith(orgPrefix)).length;

      return {
        entries,
        hasMore: totalKeys > limit,
        totalCount: totalKeys
      };
    } catch (error) {
      this.logger.error('Memory cache list failed', {
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
    let success = true;
    
    for (const entry of entries) {
      const result = await this.set(entry.key, entry.value, entry.options);
      if (!result) {
        success = false;
      }
    }

    this.logger.debug('Memory cache setMany completed', {
      entriesCount: entries.length,
      success,
      organizationId: this.organizationId
    });

    return success;
  }

  async getMany<T>(keys: string[], options?: CacheGetOptions): Promise<Array<{ key: string; value: T | null }>> {
    const results = [];
    
    for (const key of keys) {
      const value = await this.get<T>(key, options);
      results.push({ key, value });
    }

    return results;
  }

  async increment(key: string, amount = 1, options?: CacheSetOptions): Promise<number> {
    try {
      const currentValue = await this.get<number>(key);
      const newValue = (currentValue || 0) + amount;
      
      await this.set(key, newValue, options);
      return newValue;
    } catch (error) {
      this.logger.error('Memory cache increment failed', {
        key,
        amount,
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
  }

  async decrement(key: string, amount = 1, options?: CacheSetOptions): Promise<number> {
    return this.increment(key, -amount, options);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const orgKey = this.getOrganizationKey(key);
      const entry = this.cache.get(orgKey);
      
      if (!entry) {
        return false;
      }

      entry.expiresAt = new Date(Date.now() + ttl * 1000);
      return true;
    } catch (error) {
      this.logger.error('Memory cache expire failed', {
        key,
        ttl,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const orgKey = this.getOrganizationKey(key);
      const entry = this.cache.get(orgKey);
      
      if (!entry || !entry.expiresAt) {
        return -1;
      }

      const remaining = Math.max(0, Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000));
      return remaining;
    } catch (error) {
      this.logger.error('Memory cache ttl failed', {
        key,
        error,
        organizationId: this.organizationId
      });
      return -1;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalDeleted = 0;
      
      for (const tag of tags) {
        const tagKey = this.getOrganizationKey(`tag:${tag}`);
        const keys = this.tagMap.get(tagKey) || new Set();
        
        for (const key of keys) {
          const entry = this.cache.get(key);
          if (entry) {
            this.cache.delete(key);
            this.stats.memoryUsage -= entry.size;
            this.removeTags(key, entry.tags);
            totalDeleted++;
          }
        }
        
        this.tagMap.delete(tagKey);
      }

      this.logger.debug('Memory cache invalidateByTags successful', {
        tags,
        totalDeleted,
        organizationId: this.organizationId
      });

      return totalDeleted;
    } catch (error) {
      this.logger.error('Memory cache invalidateByTags failed', {
        tags,
        error,
        organizationId: this.organizationId
      });
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const total = this.stats.hits + this.stats.misses;
      const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
      const missRate = total > 0 ? (this.stats.misses / total) * 100 : 0;

      return {
        keyCount: this.cache.size,
        memoryUsed: this.stats.memoryUsage,
        hitRate,
        missRate,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        evictions: this.stats.evictions,
        expired: this.stats.expired
      };
    } catch (error) {
      this.logger.error('Memory cache getStats failed', {
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

  private isExpired(entry: MemoryCacheEntry): boolean {
    return entry.expiresAt ? entry.expiresAt.getTime() < Date.now() : false;
  }

  private async evictEntries(): Promise<void> {
    if (!this.config.settings.enableLru) {
      return;
    }

    // Sort by last accessed time (LRU)
    const orgPrefix = `org:${this.organizationId}:`;
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(orgPrefix))
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      this.stats.memoryUsage -= entry.size;
      this.stats.evictions++;
      this.removeTags(key, entry.tags);
    }
  }

  private async evictByMemory(neededSize: number): Promise<void> {
    const orgPrefix = `org:${this.organizationId}:`;
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(orgPrefix))
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    let freedSize = 0;
    
    for (const [key, entry] of entries) {
      if (freedSize >= neededSize) break;
      
      this.cache.delete(key);
      this.stats.memoryUsage -= entry.size;
      this.stats.evictions++;
      this.removeTags(key, entry.tags);
      freedSize += entry.size;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.memoryUsage -= entry.size;
        this.stats.expired++;
        this.removeTags(key, entry.tags);
      }
    }

    if (expiredKeys.length > 0) {
      this.logger.debug('Memory cache cleanup completed', {
        expiredKeys: expiredKeys.length,
        organizationId: this.organizationId
      });
    }
  }

  private addTags(key: string, tags: string[]): void {
    for (const tag of tags) {
      const tagKey = this.getOrganizationKey(`tag:${tag}`);
      if (!this.tagMap.has(tagKey)) {
        this.tagMap.set(tagKey, new Set());
      }
      this.tagMap.get(tagKey)!.add(key);
    }
  }

  private removeTags(key: string, tags?: string[]): void {
    if (!tags) return;
    
    for (const tag of tags) {
      const tagKey = this.getOrganizationKey(`tag:${tag}`);
      const tagSet = this.tagMap.get(tagKey);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) {
          this.tagMap.delete(tagKey);
        }
      }
    }
  }

  async getMetrics(): Promise<ProviderMetrics> {
    const stats = await this.getStats();
    
    return {
      requests: stats.totalHits + stats.totalMisses,
      errors: 0, // Would need to track this separately
      responseTime: 0, // In-memory is essentially instant
      uptime: Date.now(), // Placeholder
      memoryUsage: stats.memoryUsed,
      customMetrics: {
        cacheHitRate: stats.hitRate,
        keyCount: stats.keyCount,
        evictions: stats.evictions,
        expired: stats.expired
      }
    };
  }
}

// ========================================
// Memory Cache Provider Factory
// ========================================

export class MemoryCacheProviderFactory implements ProviderFactory<MemoryCacheProvider> {
  create(organizationId: string, config: MemoryCacheConfiguration): MemoryCacheProvider {
    return new MemoryCacheProvider(organizationId, config);
  }

  validateConfig(config: any): config is MemoryCacheConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.settings &&
      typeof config.settings.maxEntries === 'number' &&
      typeof config.settings.defaultTtl === 'number' &&
      typeof config.settings.maxMemoryUsage === 'number'
    );
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      required: ['settings'],
      properties: {
        settings: {
          type: 'object',
          required: ['maxEntries', 'defaultTtl', 'maxMemoryUsage'],
          properties: {
            maxEntries: { type: 'number', description: 'Maximum number of cache entries' },
            defaultTtl: { type: 'number', description: 'Default TTL in seconds' },
            maxMemoryUsage: { type: 'number', description: 'Maximum memory usage in bytes' },
            cleanupInterval: { type: 'number', description: 'Cleanup interval in milliseconds' },
            enableLru: { type: 'boolean', description: 'Enable LRU eviction' },
            enableStats: { type: 'boolean', description: 'Enable statistics tracking' }
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
 * Create memory cache configuration with defaults
 */
export function createMemoryCacheConfig(organizationId?: string): MemoryCacheConfiguration {
  return {
    id: `memory-cache-${organizationId || 'default'}`,
    name: 'Memory Cache',
    type: 'cache',
    priority: 999, // Lowest priority
    enabled: true,
    settings: {
      maxEntries: 10000,
      defaultTtl: 3600, // 1 hour
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      cleanupInterval: 60000, // 1 minute
      enableLru: true,
      enableStats: true,
      checkExpirationOnGet: true
    }
  };
} 