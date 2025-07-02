import { openai } from '@ai-sdk/openai';
import { embedMany, embed } from 'ai';
import { db } from '@/lib/db';
// Note: vectorEmbeddings table needs to be added to schema
// import { vectorEmbeddings } from '@/lib/db/schema';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
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
import type { ProviderConfiguration, ProviderMetrics, ProviderFactory } from '../base/base-provider';

// ========================================
// PostgreSQL Vector Configuration
// ========================================

export interface PostgresVectorCredentials {
  /** Database connection URL */
  connectionUrl: string;
  /** OpenAI API key for embeddings */
  openaiApiKey: string;
  /** Azure OpenAI settings (optional) */
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    deployment: string;
  };
}

export interface PostgresVectorConfiguration extends ProviderConfiguration {
  credentials: PostgresVectorCredentials;
  settings: {
    /** Default embedding model */
    embeddingModel: string;
    /** Vector dimensions */
    dimensions: number;
    /** Batch size for operations */
    batchSize: number;
    /** Connection pool size */
    poolSize: number;
    /** Enable pgvector extension */
    enablePgVector: boolean;
    /** Index creation threshold */
    indexThreshold: number;
    /** Distance metric for search */
    defaultMetric: 'cosine' | 'euclidean' | 'dot_product';
    /** Maximum text chunk size */
    maxChunkSize: number;
  };
}

// ========================================
// PostgreSQL Vector Provider Implementation
// ========================================

export class PostgresVectorProvider extends VectorProvider {
  private readonly config: PostgresVectorConfiguration;
  private isInitialized = false;

  constructor(
    organizationId: string,
    config: PostgresVectorConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'PostgreSQL Vector Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'PostgreSQL with pgvector for vector storage and similarity search';
  }

  getPriority(): number {
    return 1; // High priority for PostgreSQL
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Ensure pgvector extension is enabled
      if (this.config.settings.enablePgVector) {
        await this.ensurePgVectorExtension();
      }

      // Create indexes if needed
      await this.ensureIndexes();

      this.isInitialized = true;
      
      this.logger.info('PostgreSQL vector provider initialized', {
        organizationId: this.organizationId,
        provider: this.getName(),
        dimensions: this.config.settings.dimensions,
        model: this.config.settings.embeddingModel
      });
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL vector provider', {
        organizationId: this.organizationId,
        error
      });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.isInitialized = false;
    
    this.logger.info('PostgreSQL vector provider disposed', {
      organizationId: this.organizationId
    });
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Validate required credentials
      if (!this.config.credentials?.connectionUrl) {
        throw new Error('Database connection URL is required');
      }

      if (!this.config.credentials?.openaiApiKey) {
        throw new Error('OpenAI API key is required for embeddings');
      }

      // Validate settings
      if (!this.config.settings?.embeddingModel) {
        throw new Error('Embedding model is required');
      }

      if (!this.config.settings?.dimensions || this.config.settings.dimensions <= 0) {
        throw new Error('Valid dimensions setting is required');
      }

      return true;
    } catch (error) {
      this.logger.error('Config validation failed', {
        error: (error as Error).message,
        organizationId: this.organizationId
      });
      return false;
    }
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
    } catch (error) {
      this.logger.error('Embedding generation failed', {
        content: content.substring(0, 100),
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
  }

  async generateEmbeddings(
    contents: string[],
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    
    try {
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
    } catch (error) {
      this.logger.error('Batch embedding generation failed', {
        count: contents.length,
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
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
      const batchSize = options?.batchSize || this.config.settings.batchSize;
      const namespace = this.getOrganizationNamespace(options?.namespace);
      
      // Process in batches
      for (let i = 0; i < embeddings.length; i += batchSize) {
        const batch = embeddings.slice(i, i + batchSize);
        const records = batch.map(embedding => ({
          id: embedding.id,
          organizationId: this.organizationId,
          namespace,
          content: embedding.content,
          embedding: embedding.values,
          metadata: embedding.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        if (options?.overwrite) {
          // Use upsert (insert or update)
          for (const record of records) {
            await db
              .insert(vectorEmbeddings)
              .values(record)
              .onConflictDoUpdate({
                target: [vectorEmbeddings.id, vectorEmbeddings.organizationId],
                set: {
                  content: record.content,
                  embedding: record.embedding,
                  metadata: record.metadata,
                  updatedAt: record.updatedAt
                }
              });
          }
        } else {
          // Insert only new records
          await db
            .insert(vectorEmbeddings)
            .values(records)
            .onConflictDoNothing();
        }
      }

      this.logger.debug('Vector upsert successful', {
        count: embeddings.length,
        namespace,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Vector upsert failed', {
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

      // Build similarity query based on metric
      let similarityExpression;
      let orderDirection;
      
      switch (metric) {
        case 'cosine':
          similarityExpression = sql`1 - (${vectorEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;
          orderDirection = desc;
          break;
        case 'euclidean':
          similarityExpression = sql`${vectorEmbeddings.embedding} <-> ${JSON.stringify(queryEmbedding)}::vector`;
          orderDirection = asc;
          break;
        case 'dot_product':
          similarityExpression = sql`${vectorEmbeddings.embedding} <#> ${JSON.stringify(queryEmbedding)}::vector`;
          orderDirection = desc;
          break;
        default:
          throw new Error(`Unsupported metric: ${metric}`);
      }

      let query_builder = db
        .select({
          id: vectorEmbeddings.id,
          content: vectorEmbeddings.content,
          embedding: vectorEmbeddings.embedding,
          metadata: vectorEmbeddings.metadata,
          createdAt: vectorEmbeddings.createdAt,
          similarity: similarityExpression.as('similarity')
        })
        .from(vectorEmbeddings)
        .where(
          and(
            eq(vectorEmbeddings.organizationId, this.organizationId),
            eq(vectorEmbeddings.namespace, namespace)
          )
        );

      // Apply metadata filters if provided
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          query_builder = query_builder.where(
            sql`${vectorEmbeddings.metadata}->>${key} = ${value}`
          );
        }
      }

      const results = await query_builder
        .orderBy(orderDirection(similarityExpression))
        .limit(limit);

      // Convert to VectorSearchResult format
      const searchResults: VectorSearchResult[] = results
        .map((row, index) => {
          const similarity = parseFloat(row.similarity as string);
          
          // Apply threshold filter
          if (similarity < threshold) {
            return null;
          }

          const embedding: VectorEmbedding = {
            id: row.id,
            values: options?.includeValues ? (row.embedding as number[]) : [],
            content: row.content,
            metadata: options?.includeMetadata ? row.metadata : undefined,
            createdAt: row.createdAt,
            organizationId: this.organizationId
          };

          return {
            embedding,
            score: similarity,
            distance: metric === 'cosine' ? 1 - similarity : similarity,
            rank: index + 1
          };
        })
        .filter((result): result is VectorSearchResult => result !== null);

      this.logger.debug('Vector search successful', {
        query: typeof query === 'string' ? query.substring(0, 100) : 'vector',
        results: searchResults.length,
        namespace,
        organizationId: this.organizationId
      });

      return searchResults;
    } catch (error) {
      this.logger.error('Vector search failed', {
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
      
      const result = await db
        .select()
        .from(vectorEmbeddings)
        .where(
          and(
            eq(vectorEmbeddings.id, id),
            eq(vectorEmbeddings.organizationId, this.organizationId),
            eq(vectorEmbeddings.namespace, ns)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        values: row.embedding as number[],
        content: row.content,
        metadata: row.metadata,
        createdAt: row.createdAt,
        organizationId: row.organizationId
      };
    } catch (error) {
      this.logger.error('Vector getById failed', {
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
      
      const results = await db
        .select()
        .from(vectorEmbeddings)
        .where(
          and(
            inArray(vectorEmbeddings.id, ids),
            eq(vectorEmbeddings.organizationId, this.organizationId),
            eq(vectorEmbeddings.namespace, ns)
          )
        );

      return results.map(row => ({
        id: row.id,
        values: row.embedding as number[],
        content: row.content,
        metadata: row.metadata,
        createdAt: row.createdAt,
        organizationId: row.organizationId
      }));
    } catch (error) {
      this.logger.error('Vector getByIds failed', {
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
      let whereConditions = [
        eq(vectorEmbeddings.organizationId, this.organizationId),
        eq(vectorEmbeddings.namespace, namespace)
      ];

      if (options.deleteAll) {
        // Delete all vectors in namespace
      } else if (options.ids && options.ids.length > 0) {
        whereConditions.push(inArray(vectorEmbeddings.id, options.ids));
      } else if (options.filters) {
        // Apply metadata filters
        for (const [key, value] of Object.entries(options.filters)) {
          whereConditions.push(
            sql`${vectorEmbeddings.metadata}->>${key} = ${value}`
          );
        }
      } else {
        throw new Error('Must specify either ids, filters, or deleteAll');
      }

      const result = await db
        .delete(vectorEmbeddings)
        .where(and(...whereConditions));

      this.logger.debug('Vector delete successful', {
        deleted: result.rowCount || 0,
        namespace,
        organizationId: this.organizationId
      });

      return result.rowCount || 0;
    } catch (error) {
      this.logger.error('Vector delete failed', {
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

      let whereConditions = [
        eq(vectorEmbeddings.organizationId, this.organizationId),
        eq(vectorEmbeddings.namespace, namespace)
      ];

      // Apply metadata filters if provided
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          whereConditions.push(
            sql`${vectorEmbeddings.metadata}->>${key} = ${value}`
          );
        }
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(vectorEmbeddings)
        .where(and(...whereConditions));
      
      const total = parseInt(totalResult[0].count as string);

      // Get paginated results
      const results = await db
        .select()
        .from(vectorEmbeddings)
        .where(and(...whereConditions))
        .orderBy(desc(vectorEmbeddings.createdAt))
        .limit(limit)
        .offset(offset);

      const embeddings: VectorEmbedding[] = results.map(row => ({
        id: row.id,
        values: row.embedding as number[],
        content: row.content,
        metadata: row.metadata,
        createdAt: row.createdAt,
        organizationId: row.organizationId
      }));

      return {
        embeddings,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      this.logger.error('Vector list failed', {
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

  async createIndex(
    name: string,
    dimensions: number,
    options?: {
      metric?: 'cosine' | 'euclidean' | 'dot_product';
      indexType?: string;
      configuration?: Record<string, any>;
    }
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const metric = options?.metric || 'cosine';
      const indexType = options?.indexType || 'ivfflat';
      
      let indexOp;
      switch (metric) {
        case 'cosine':
          indexOp = 'vector_cosine_ops';
          break;
        case 'euclidean':
          indexOp = 'vector_l2_ops';
          break;
        case 'dot_product':
          indexOp = 'vector_ip_ops';
          break;
        default:
          throw new Error(`Unsupported metric: ${metric}`);
      }

      const indexName = `idx_${name}_${this.organizationId}_${metric}`;
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ${sql.identifier(indexName)}
        ON ${vectorEmbeddings}
        USING ${sql.raw(indexType)} (embedding ${sql.raw(indexOp)})
        WHERE organization_id = ${this.organizationId}
      `);

      this.logger.info('Vector index created', {
        name: indexName,
        dimensions,
        metric,
        indexType,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Vector index creation failed', {
        name,
        dimensions,
        options,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async deleteIndex(name: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const indexName = `idx_${name}_${this.organizationId}`;
      
      await db.execute(sql`
        DROP INDEX IF EXISTS ${sql.identifier(indexName)}
      `);

      this.logger.info('Vector index deleted', {
        name: indexName,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Vector index deletion failed', {
        name,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async getStats(namespace?: string): Promise<VectorStats> {
    await this.ensureInitialized();
    
    try {
      const ns = this.getOrganizationNamespace(namespace);
      
      const result = await db
        .select({
          count: sql`count(*)`.as('count'),
          avgSize: sql`avg(octet_length(embedding::text))`.as('avgSize')
        })
        .from(vectorEmbeddings)
        .where(
          and(
            eq(vectorEmbeddings.organizationId, this.organizationId),
            eq(vectorEmbeddings.namespace, ns)
          )
        );

      const row = result[0];
      const totalVectors = parseInt(row.count as string);
      const avgSize = parseFloat(row.avgSize as string) || 0;

      return {
        totalVectors,
        indexSize: Math.floor(avgSize * totalVectors),
        dimensions: this.config.settings.dimensions,
        storageUsed: Math.floor(avgSize * totalVectors),
        avgSearchTime: 0, // Would need to track this separately
        indexType: 'pgvector',
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error('Vector getStats failed', {
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
        indexType: 'pgvector',
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

  private async ensurePgVectorExtension(): Promise<void> {
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
      this.logger.debug('pgvector extension ensured', {
        organizationId: this.organizationId
      });
    } catch (error) {
      this.logger.error('Failed to create pgvector extension', {
        error,
        organizationId: this.organizationId
      });
      throw error;
    }
  }

  private async ensureIndexes(): Promise<void> {
    try {
      // Check if we have enough vectors to justify an index
      const countResult = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(vectorEmbeddings)
        .where(eq(vectorEmbeddings.organizationId, this.organizationId));
      
      const vectorCount = parseInt(countResult[0].count as string);
      
      if (vectorCount >= this.config.settings.indexThreshold) {
        await this.createIndex(
          'default',
          this.config.settings.dimensions,
          { metric: this.config.settings.defaultMetric }
        );
      }
    } catch (error) {
      this.logger.warn('Failed to ensure indexes', {
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
      responseTime: 0, // Would need to track this separately
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
// PostgreSQL Vector Provider Factory
// ========================================

export class PostgresVectorProviderFactory implements ProviderFactory<PostgresVectorProvider> {
  create(organizationId: string, config: PostgresVectorConfiguration): PostgresVectorProvider {
    return new PostgresVectorProvider(organizationId, config);
  }

  validateConfig(config: any): config is PostgresVectorConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.credentials &&
      typeof config.credentials.connectionUrl === 'string' &&
      typeof config.credentials.openaiApiKey === 'string' &&
      config.settings &&
      typeof config.settings.embeddingModel === 'string' &&
      typeof config.settings.dimensions === 'number'
    );
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      required: ['credentials', 'settings'],
      properties: {
        credentials: {
          type: 'object',
          required: ['connectionUrl', 'openaiApiKey'],
          properties: {
            connectionUrl: { type: 'string', description: 'PostgreSQL connection URL' },
            openaiApiKey: { type: 'string', description: 'OpenAI API key for embeddings' }
          }
        },
        settings: {
          type: 'object',
          required: ['embeddingModel', 'dimensions'],
          properties: {
            embeddingModel: { type: 'string', description: 'OpenAI embedding model' },
            dimensions: { type: 'number', description: 'Embedding vector dimensions' },
            batchSize: { type: 'number', description: 'Batch size for operations' }
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
 * Create PostgreSQL vector configuration from environment variables
 */
export function createPostgresVectorConfig(organizationId?: string): PostgresVectorConfiguration {
  const connectionUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!connectionUrl) {
    throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
  }
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    id: `postgres-vector-${organizationId || 'default'}`,
    name: 'PostgreSQL Vector',
    type: 'vector',
    priority: 1,
    enabled: true,
    credentials: {
      connectionUrl,
      openaiApiKey,
      azureOpenAI: process.env.AZURE_OPENAI_ENDPOINT ? {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'text-embedding-ada-002'
      } : undefined
    },
    settings: {
      embeddingModel: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 100,
      poolSize: 10,
      enablePgVector: true,
      indexThreshold: 1000,
      defaultMetric: 'cosine',
      maxChunkSize: 1000
    }
  };
} 