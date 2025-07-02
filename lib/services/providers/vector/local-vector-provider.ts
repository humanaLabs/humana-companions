import { openai } from '@ai-sdk/openai';
import { embedMany, embed } from 'ai';
import {
  VectorProvider,
  type VectorEmbedding,
  type VectorSearchResult,
  type VectorSearchOptions,
  type VectorUpsertOptions,
  type VectorDeleteOptions,
  type VectorStats,
  type EmbeddingResult
} from './vector-provider-interface';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { ProviderFactory } from '../factory/provider-factory-interface';

// ========================================
// Local Vector Configuration
// ========================================

export interface LocalVectorConfiguration extends ProviderConfiguration {
  settings: {
    /** Default embedding model */
    embeddingModel: string;
    /** Vector dimensions */
    dimensions: number;
    /** Maximum vectors to store */
    maxVectors: number;
    /** Batch size for operations */
    batchSize: number;
    /** Persistence file path (optional) */
    persistenceFile?: string;
    /** Auto-save interval in ms */
    autoSaveInterval?: number;
    /** Default distance metric */
    defaultMetric: 'cosine' | 'euclidean' | 'dot_product';
  };
}

// ========================================
// Local Vector Storage
// ========================================

interface LocalVectorEntry extends VectorEmbedding {
  namespace: string;
}

interface LocalVectorIndex {
  vectors: Map<string, LocalVectorEntry>;
  namespaces: Set<string>;
  lastUpdated: Date;
}

// ========================================
// Local Vector Provider Implementation
// ========================================

export class LocalVectorProvider extends VectorProvider {
  private readonly config: LocalVectorConfiguration;
  private storage: LocalVectorIndex = {
    vectors: new Map(),
    namespaces: new Set(),
    lastUpdated: new Date()
  };
  private saveTimer: NodeJS.Timer | null = null;
  private isInitialized = false;

  constructor(
    organizationId: string,
    config: LocalVectorConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'Local Vector Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'In-memory vector storage with optional file persistence and simple embeddings';
  }

  getPriority(): number {
    return 999; // Lowest priority - fallback option
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load from persistence file if configured
      if (this.config.settings.persistenceFile) {
        await this.loadFromFile();
      }

      // Start auto-save if configured
      if (this.config.settings.autoSaveInterval && this.config.settings.persistenceFile) {
        this.saveTimer = setInterval(() => {
          this.saveToFile().catch(error => {
            this.logger.error('Auto-save failed', { error, organizationId: this.organizationId });
          });
        }, this.config.settings.autoSaveInterval);
      }

      this.isInitialized = true;
      
      this.logger.info('Local vector provider initialized', {
        organizationId: this.organizationId,
        provider: this.getName(),
        dimensions: this.config.settings.dimensions,
        model: this.config.settings.embeddingModel,
        persistenceFile: this.config.settings.persistenceFile
      });
    } catch (error) {
      this.logger.error('Failed to initialize local vector provider', {
        organizationId: this.organizationId,
        error
      });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }

    // Save data before disposing if persistence is enabled
    if (this.config.settings.persistenceFile) {
      try {
        await this.saveToFile();
      } catch (error) {
        this.logger.error('Failed to save data on dispose', {
          error,
          organizationId: this.organizationId
        });
      }
    }

    this.storage.vectors.clear();
    this.storage.namespaces.clear();
    this.isInitialized = false;
    
    this.logger.info('Local vector provider disposed', {
      organizationId: this.organizationId
    });
  }

  // ========================================
  // Embedding Operations
  // ========================================

  async generateEmbedding(
    content: string,
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      // Try OpenAI first if API key is available
      if (process.env.OPENAI_API_KEY) {
        const model = options?.model || this.config.settings.embeddingModel;
        
        const result = await embed({
          model: openai.embedding(model),
          value: content,
        });

        const processingTime = Date.now() - startTime;

        return {
          values: result.embedding,
          tokenCount: result.usage?.tokens || 0,
          model,
          processingTime
        };
      } else {
        // Fallback to simple hash-based embedding
        return this.generateSimpleEmbedding(content, options);
      }
    } catch (error) {
      this.logger.warn('OpenAI embedding failed, using simple embedding', {
        content: content.substring(0, 100),
        error,
        organizationId: this.organizationId
      });
      
      // Fallback to simple embedding
      return this.generateSimpleEmbedding(content, options);
    }
  }

  async generateEmbeddings(
    contents: string[],
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    
    try {
      // Try OpenAI batch embedding first
      if (process.env.OPENAI_API_KEY) {
        const model = options?.model || this.config.settings.embeddingModel;
        
        const result = await embedMany({
          model: openai.embedding(model),
          values: contents,
        });

        const processingTime = Date.now() - startTime;

        return result.embeddings.map((embedding, index) => ({
          values: embedding,
          tokenCount: Math.floor(result.usage?.tokens || 0 / contents.length),
          model,
          processingTime: Math.floor(processingTime / contents.length)
        }));
      } else {
        // Fallback to simple embeddings
        return Promise.all(
          contents.map(content => this.generateSimpleEmbedding(content, options))
        );
      }
    } catch (error) {
      this.logger.warn('OpenAI batch embedding failed, using simple embeddings', {
        count: contents.length,
        error,
        organizationId: this.organizationId
      });
      
      // Fallback to simple embeddings
      return Promise.all(
        contents.map(content => this.generateSimpleEmbedding(content, options))
      );
    }
  }

  /**
   * Generate simple hash-based embedding as fallback
   */
  private generateSimpleEmbedding(
    content: string,
    options?: { model?: string; dimensions?: number }
  ): EmbeddingResult {
    const startTime = Date.now();
    const dimensions = options?.dimensions || this.config.settings.dimensions;
    
    // Simple hash-based embedding
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(dimensions).fill(0);
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      for (let i = 0; i < dimensions; i++) {
        embedding[i] += Math.sin(hash + i) * 0.1;
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] /= magnitude;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      values: embedding,
      tokenCount: words.length,
      model: 'simple-hash',
      processingTime
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // ========================================
  // Vector Operations
  // ========================================

  async upsert(
    embeddings: Omit<VectorEmbedding, 'createdAt' | 'organizationId'>[],
    options?: VectorUpsertOptions
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const namespace = this.getOrganizationNamespace(options?.namespace);
      
      // Check storage limits
      if (this.storage.vectors.size + embeddings.length > this.config.settings.maxVectors) {
        await this.evictOldVectors(embeddings.length);
      }

      for (const embedding of embeddings) {
        const key = `${namespace}:${embedding.id}`;
        const existing = this.storage.vectors.get(key);
        
        if (existing && !options?.overwrite) {
          continue; // Skip if exists and not overwriting
        }

        const vectorEntry: LocalVectorEntry = {
          ...embedding,
          organizationId: this.organizationId,
          namespace,
          createdAt: new Date()
        };

        this.storage.vectors.set(key, vectorEntry);
        this.storage.namespaces.add(namespace);
      }

      this.storage.lastUpdated = new Date();

      this.logger.debug('Local vector upsert successful', {
        count: embeddings.length,
        namespace,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Local vector upsert failed', {
        count: embeddings.length,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async search(
    query: string | number[],
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();
    
    try {
      let queryEmbedding: number[];
      
      if (typeof query === 'string') {
        const embeddingResult = await this.generateEmbedding(query);
        queryEmbedding = embeddingResult.values;
      } else {
        queryEmbedding = query;
      }

      const limit = options?.limit || 10;
      const threshold = options?.threshold || 0;
      const metric = options?.metric || this.config.settings.defaultMetric;
      const namespace = this.getOrganizationNamespace();

      const candidates: Array<{
        entry: LocalVectorEntry;
        score: number;
        distance: number;
      }> = [];

      // Filter vectors by namespace and metadata
      for (const [key, entry] of this.storage.vectors) {
        if (entry.organizationId !== this.organizationId || entry.namespace !== namespace) {
          continue;
        }

        // Apply metadata filters if provided
        if (options?.filters) {
          let matches = true;
          for (const [filterKey, filterValue] of Object.entries(options.filters)) {
            if (entry.metadata?.[filterKey] !== filterValue) {
              matches = false;
              break;
            }
          }
          if (!matches) continue;
        }

        // Calculate similarity
        let score: number;
        let distance: number;

        switch (metric) {
          case 'cosine':
            score = this.calculateCosineSimilarity(queryEmbedding, entry.values);
            distance = 1 - score;
            break;
          case 'euclidean':
            distance = this.calculateEuclideanDistance(queryEmbedding, entry.values);
            score = 1 / (1 + distance);
            break;
          case 'dot_product':
            score = this.calculateDotProduct(queryEmbedding, entry.values);
            distance = -score;
            break;
          default:
            throw new Error(`Unsupported metric: ${metric}`);
        }

        if (score >= threshold) {
          candidates.push({ entry, score, distance });
        }
      }

      // Sort by score (higher is better)
      candidates.sort((a, b) => b.score - a.score);

      // Take top results
      const results = candidates.slice(0, limit).map((candidate, index) => {
        const embedding: VectorEmbedding = {
          id: candidate.entry.id,
          values: options?.includeValues ? candidate.entry.values : [],
          content: candidate.entry.content,
          metadata: options?.includeMetadata ? candidate.entry.metadata : undefined,
          createdAt: candidate.entry.createdAt,
          organizationId: candidate.entry.organizationId
        };

        return {
          embedding,
          score: candidate.score,
          distance: candidate.distance,
          rank: index + 1
        };
      });

      this.logger.debug('Local vector search successful', {
        query: typeof query === 'string' ? query.substring(0, 100) : 'vector',
        results: results.length,
        namespace,
        organizationId: this.organizationId
      });

      return results;
    } catch (error) {
      this.logger.error('Local vector search failed', {
        query: typeof query === 'string' ? query.substring(0, 100) : 'vector',
        error,
        organizationId: this.organizationId
      });
      return [];
    }
  }

  async getById(id: string, namespace?: string): Promise<VectorEmbedding | null> {
    await this.ensureInitialized();
    
    try {
      const ns = this.getOrganizationNamespace(namespace);
      const key = `${ns}:${id}`;
      const entry = this.storage.vectors.get(key);
      
      if (!entry || entry.organizationId !== this.organizationId) {
        return null;
      }

      return {
        id: entry.id,
        values: entry.values,
        content: entry.content,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
        organizationId: entry.organizationId
      };
    } catch (error) {
      this.logger.error('Local vector getById failed', {
        id,
        namespace,
        error,
        organizationId: this.organizationId
      });
      return null;
    }
  }

  async getByIds(ids: string[], namespace?: string): Promise<VectorEmbedding[]> {
    if (ids.length === 0) {
      return [];
    }

    await this.ensureInitialized();
    
    try {
      const ns = this.getOrganizationNamespace(namespace);
      const results: VectorEmbedding[] = [];
      
      for (const id of ids) {
        const key = `${ns}:${id}`;
        const entry = this.storage.vectors.get(key);
        
        if (entry && entry.organizationId === this.organizationId) {
          results.push({
            id: entry.id,
            values: entry.values,
            content: entry.content,
            metadata: entry.metadata,
            createdAt: entry.createdAt,
            organizationId: entry.organizationId
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Local vector getByIds failed', {
        ids: ids.length,
        namespace,
        error,
        organizationId: this.organizationId
      });
      return [];
    }
  }

  async delete(options: VectorDeleteOptions): Promise<number> {
    await this.ensureInitialized();
    
    try {
      const namespace = this.getOrganizationNamespace(options.namespace);
      let deleted = 0;

      if (options.deleteAll) {
        // Delete all vectors in namespace
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.storage.vectors) {
          if (entry.organizationId === this.organizationId && entry.namespace === namespace) {
            keysToDelete.push(key);
          }
        }
        
        for (const key of keysToDelete) {
          this.storage.vectors.delete(key);
          deleted++;
        }
      } else if (options.ids && options.ids.length > 0) {
        // Delete by IDs
        for (const id of options.ids) {
          const key = `${namespace}:${id}`;
          if (this.storage.vectors.has(key)) {
            const entry = this.storage.vectors.get(key)!;
            if (entry.organizationId === this.organizationId) {
              this.storage.vectors.delete(key);
              deleted++;
            }
          }
        }
      } else if (options.filters) {
        // Delete by metadata filters
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.storage.vectors) {
          if (entry.organizationId !== this.organizationId || entry.namespace !== namespace) {
            continue;
          }

          let matches = true;
          for (const [filterKey, filterValue] of Object.entries(options.filters)) {
            if (entry.metadata?.[filterKey] !== filterValue) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            keysToDelete.push(key);
          }
        }

        for (const key of keysToDelete) {
          this.storage.vectors.delete(key);
          deleted++;
        }
      } else {
        throw new Error('Must specify either ids, filters, or deleteAll');
      }

      this.storage.lastUpdated = new Date();

      this.logger.debug('Local vector delete successful', {
        deleted,
        namespace,
        organizationId: this.organizationId
      });

      return deleted;
    } catch (error) {
      this.logger.error('Local vector delete failed', {
        options,
        error,
        organizationId: this.organizationId
      });
      return 0;
    }
  }

  async list(options?: {
    limit?: number;
    offset?: number;
    namespace?: string;
    filters?: Record<string, any>;
  }): Promise<{
    embeddings: VectorEmbedding[];
    total: number;
    hasMore: boolean;
  }> {
    await this.ensureInitialized();
    
    try {
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      const namespace = this.getOrganizationNamespace(options?.namespace);

      const candidates: VectorEmbedding[] = [];

      for (const [key, entry] of this.storage.vectors) {
        if (entry.organizationId !== this.organizationId || entry.namespace !== namespace) {
          continue;
        }

        // Apply metadata filters if provided
        if (options?.filters) {
          let matches = true;
          for (const [filterKey, filterValue] of Object.entries(options.filters)) {
            if (entry.metadata?.[filterKey] !== filterValue) {
              matches = false;
              break;
            }
          }
          if (!matches) continue;
        }

        candidates.push({
          id: entry.id,
          values: entry.values,
          content: entry.content,
          metadata: entry.metadata,
          createdAt: entry.createdAt,
          organizationId: entry.organizationId
        });
      }

      // Sort by creation date (newest first)
      candidates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = candidates.length;
      const embeddings = candidates.slice(offset, offset + limit);

      return {
        embeddings,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      this.logger.error('Local vector list failed', {
        options,
        error,
        organizationId: this.organizationId
      });
      return {
        embeddings: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async createIndex(): Promise<boolean> {
    // Local storage doesn't need explicit indexes
    return true;
  }

  async deleteIndex(): Promise<boolean> {
    // Local storage doesn't need explicit indexes
    return true;
  }

  async getStats(namespace?: string): Promise<VectorStats> {
    await this.ensureInitialized();
    
    try {
      const ns = this.getOrganizationNamespace(namespace);
      let totalVectors = 0;
      let totalSize = 0;

      for (const [key, entry] of this.storage.vectors) {
        if (entry.organizationId === this.organizationId && entry.namespace === ns) {
          totalVectors++;
          totalSize += entry.values.length * 8; // Approximate size (8 bytes per float64)
        }
      }

      return {
        totalVectors,
        indexSize: totalSize,
        dimensions: this.config.settings.dimensions,
        storageUsed: totalSize,
        avgSearchTime: 0, // Would need to track this separately
        indexType: 'in-memory',
        lastUpdated: this.storage.lastUpdated
      };
    } catch (error) {
      this.logger.error('Local vector getStats failed', {
        namespace,
        error,
        organizationId: this.organizationId
      });
      return {
        totalVectors: 0,
        indexSize: 0,
        dimensions: this.config.settings.dimensions,
        storageUsed: 0,
        avgSearchTime: 0,
        indexType: 'in-memory',
        lastUpdated: new Date()
      };
    }
  }

  async clear(namespace?: string): Promise<boolean> {
    return (await this.delete({ deleteAll: true, namespace })) > 0;
  }

  // ========================================
  // Private Helpers
  // ========================================

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async evictOldVectors(neededSpace: number): Promise<void> {
    const namespace = this.getOrganizationNamespace();
    const candidates: Array<[string, LocalVectorEntry]> = [];

    for (const [key, entry] of this.storage.vectors) {
      if (entry.organizationId === this.organizationId && entry.namespace === namespace) {
        candidates.push([key, entry]);
      }
    }

    // Sort by creation date (oldest first)
    candidates.sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime());

    // Remove oldest vectors
    for (let i = 0; i < neededSpace && i < candidates.length; i++) {
      const [key] = candidates[i];
      this.storage.vectors.delete(key);
    }

    this.logger.debug('Evicted old vectors', {
      evicted: Math.min(neededSpace, candidates.length),
      organizationId: this.organizationId
    });
  }

  private async loadFromFile(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.config.settings.persistenceFile!, 'utf8');
      const parsed = JSON.parse(data);
      
      this.storage.vectors.clear();
      this.storage.namespaces.clear();
      
      for (const [key, entry] of Object.entries(parsed.vectors || {})) {
        this.storage.vectors.set(key, {
          ...entry,
          createdAt: new Date((entry as any).createdAt)
        } as LocalVectorEntry);
      }
      
      this.storage.namespaces = new Set(parsed.namespaces || []);
      this.storage.lastUpdated = new Date(parsed.lastUpdated || Date.now());

      this.logger.info('Loaded vectors from file', {
        file: this.config.settings.persistenceFile,
        vectors: this.storage.vectors.size,
        organizationId: this.organizationId
      });
    } catch (error) {
      this.logger.warn('Failed to load vectors from file', {
        file: this.config.settings.persistenceFile,
        error,
        organizationId: this.organizationId
      });
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const dir = path.dirname(this.config.settings.persistenceFile!);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        vectors: Object.fromEntries(this.storage.vectors),
        namespaces: Array.from(this.storage.namespaces),
        lastUpdated: this.storage.lastUpdated.toISOString()
      };
      
      await fs.writeFile(
        this.config.settings.persistenceFile!,
        JSON.stringify(data, null, 2),
        'utf8'
      );

      this.logger.debug('Saved vectors to file', {
        file: this.config.settings.persistenceFile,
        vectors: this.storage.vectors.size,
        organizationId: this.organizationId
      });
    } catch (error) {
      this.logger.error('Failed to save vectors to file', {
        file: this.config.settings.persistenceFile,
        error,
        organizationId: this.organizationId
      });
    }
  }

  async getMetrics(): Promise<ProviderMetrics> {
    const stats = await this.getStats();
    
    return {
      requests: 0, // Would need to track this separately
      errors: 0, // Would need to track this separately
      responseTime: 0, // In-memory is essentially instant
      uptime: Date.now(), // Placeholder
      memoryUsage: stats.storageUsed,
      customMetrics: {
        totalVectors: stats.totalVectors,
        dimensions: stats.dimensions,
        indexSize: stats.indexSize,
        avgSearchTime: stats.avgSearchTime
      }
    };
  }
}

// ========================================
// Local Vector Provider Factory
// ========================================

export class LocalVectorProviderFactory implements ProviderFactory<LocalVectorProvider> {
  create(organizationId: string, config: LocalVectorConfiguration): LocalVectorProvider {
    return new LocalVectorProvider(organizationId, config);
  }

  validateConfig(config: any): config is LocalVectorConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.settings &&
      typeof config.settings.embeddingModel === 'string' &&
      typeof config.settings.dimensions === 'number' &&
      typeof config.settings.maxVectors === 'number'
    );
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      required: ['settings'],
      properties: {
        settings: {
          type: 'object',
          required: ['embeddingModel', 'dimensions', 'maxVectors'],
          properties: {
            embeddingModel: { type: 'string', description: 'Embedding model to use' },
            dimensions: { type: 'number', description: 'Vector dimensions' },
            maxVectors: { type: 'number', description: 'Maximum vectors to store' },
            persistenceFile: { type: 'string', description: 'File path for persistence' },
            autoSaveInterval: { type: 'number', description: 'Auto-save interval in ms' }
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
 * Create local vector configuration with defaults
 */
export function createLocalVectorConfig(organizationId?: string): LocalVectorConfiguration {
  return {
    id: `local-vector-${organizationId || 'default'}`,
    name: 'Local Vector',
    type: 'vector',
    priority: 999, // Lowest priority
    enabled: true,
    settings: {
      embeddingModel: 'text-embedding-3-small',
      dimensions: 1536,
      maxVectors: 100000,
      batchSize: 100,
      persistenceFile: `./data/vectors_${organizationId || 'default'}.json`,
      autoSaveInterval: 60000, // 1 minute
      defaultMetric: 'cosine'
    }
  };
} 