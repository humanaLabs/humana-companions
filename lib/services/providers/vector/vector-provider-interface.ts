import { BaseProvider, type ProviderConfiguration, type HealthCheckResult, type ProviderMetrics } from '../base/base-provider';

// ========================================
// Core Vector Types
// ========================================

/**
 * Vector embedding representation
 */
export interface VectorEmbedding {
  /** Vector ID */
  id: string;
  /** Embedding values */
  values: number[];
  /** Document content that was embedded */
  content: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt: Date;
  /** Organization ID for multi-tenancy */
  organizationId: string;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  /** Matching embedding */
  embedding: VectorEmbedding;
  /** Similarity score (0-1, higher is more similar) */
  score: number;
  /** Distance metric used */
  distance: number;
  /** Rank in results */
  rank: number;
}

/**
 * Vector search options
 */
export interface VectorSearchOptions {
  /** Maximum number of results */
  limit?: number;
  /** Minimum similarity score threshold */
  threshold?: number;
  /** Metadata filters */
  filters?: Record<string, any>;
  /** Include embedding values in results */
  includeValues?: boolean;
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Distance metric to use */
  metric?: 'cosine' | 'euclidean' | 'dot_product';
}

/**
 * Vector upsert options
 */
export interface VectorUpsertOptions {
  /** Batch size for bulk operations */
  batchSize?: number;
  /** Override existing embeddings */
  overwrite?: boolean;
  /** Custom namespace for isolation */
  namespace?: string;
  /** Skip embedding generation if values provided */
  skipEmbedding?: boolean;
}

/**
 * Vector delete options
 */
export interface VectorDeleteOptions {
  /** Delete by metadata filters */
  filters?: Record<string, any>;
  /** Delete by ID list */
  ids?: string[];
  /** Delete all vectors in namespace */
  deleteAll?: boolean;
  /** Custom namespace */
  namespace?: string;
}

/**
 * Vector statistics
 */
export interface VectorStats {
  /** Total number of vectors */
  totalVectors: number;
  /** Index size in bytes */
  indexSize: number;
  /** Vector dimensions */
  dimensions: number;
  /** Storage used in bytes */
  storageUsed: number;
  /** Average search time in ms */
  avgSearchTime: number;
  /** Index type */
  indexType: string;
  /** Last update timestamp */
  lastUpdated: Date;
}

/**
 * Embedding generation result
 */
export interface EmbeddingResult {
  /** Generated embedding values */
  values: number[];
  /** Number of tokens used */
  tokenCount: number;
  /** Model used for embedding */
  model: string;
  /** Processing time in ms */
  processingTime: number;
}

// ========================================
// Vector Provider Interface
// ========================================

/**
 * Abstract base class for all vector providers
 * Provides vector storage and similarity search with multi-tenant isolation
 */
export abstract class VectorProvider extends BaseProvider {
  constructor(
    organizationId: string,
    config: ProviderConfiguration
  ) {
    super(organizationId, config, 'vector');
  }

  // ========================================
  // Abstract Methods (Provider Implementation)
  // ========================================

  /**
   * Generate embeddings for text content
   */
  abstract generateEmbedding(
    content: string,
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts
   */
  abstract generateEmbeddings(
    contents: string[],
    options?: { model?: string; dimensions?: number }
  ): Promise<EmbeddingResult[]>;

  /**
   * Upsert vector embeddings
   */
  abstract upsert(
    embeddings: Omit<VectorEmbedding, 'createdAt' | 'organizationId'>[],
    options?: VectorUpsertOptions
  ): Promise<boolean>;

  /**
   * Search for similar vectors
   */
  abstract search(
    query: string | number[],
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]>;

  /**
   * Get vector by ID
   */
  abstract getById(id: string, namespace?: string): Promise<VectorEmbedding | null>;

  /**
   * Get multiple vectors by IDs
   */
  abstract getByIds(ids: string[], namespace?: string): Promise<VectorEmbedding[]>;

  /**
   * Delete vectors
   */
  abstract delete(options: VectorDeleteOptions): Promise<number>;

  /**
   * List vectors with pagination
   */
  abstract list(
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
  }>;

  /**
   * Create or update vector index
   */
  abstract createIndex(
    name: string,
    dimensions: number,
    options?: {
      metric?: 'cosine' | 'euclidean' | 'dot_product';
      indexType?: string;
      configuration?: Record<string, any>;
    }
  ): Promise<boolean>;

  /**
   * Delete vector index
   */
  abstract deleteIndex(name: string): Promise<boolean>;

  /**
   * Get vector statistics
   */
  abstract getStats(namespace?: string): Promise<VectorStats>;

  /**
   * Clear all vectors for organization
   */
  abstract clear(namespace?: string): Promise<boolean>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Generate organization-scoped namespace
   */
  protected getOrganizationNamespace(namespace?: string): string {
    const baseNamespace = namespace || 'default';
    return `org_${this.organizationId}_${baseNamespace}`;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  protected calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate euclidean distance between two vectors
   */
  protected calculateEuclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate dot product between two vectors
   */
  protected calculateDotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let product = 0;
    for (let i = 0; i < a.length; i++) {
      product += a[i] * b[i];
    }

    return product;
  }

  /**
   * Normalize vector to unit length
   */
  protected normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      return vector;
    }

    return vector.map(val => val / magnitude);
  }

  /**
   * Chunk text into smaller pieces for embedding
   */
  protected chunkText(
    text: string,
    options?: {
      maxChunkSize?: number;
      overlap?: number;
      preserveWords?: boolean;
    }
  ): string[] {
    const maxChunkSize = options?.maxChunkSize || 1000;
    const overlap = options?.overlap || 100;
    const preserveWords = options?.preserveWords ?? true;

    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + maxChunkSize, text.length);
      
      // Try to break at word boundaries if preserveWords is true
      if (preserveWords && end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = Math.max(start + maxChunkSize - overlap, end);
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Validate vector embedding
   */
  protected validateEmbedding(embedding: VectorEmbedding): boolean {
    return (
      typeof embedding.id === 'string' &&
      embedding.id.length > 0 &&
      Array.isArray(embedding.values) &&
      embedding.values.length > 0 &&
      embedding.values.every(val => typeof val === 'number' && !isNaN(val)) &&
      typeof embedding.content === 'string' &&
      embedding.content.length > 0
    );
  }

  /**
   * Health check implementation for vector providers
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test embedding generation
      const testContent = 'Health check test content';
      const embedding = await this.generateEmbedding(testContent);
      
      if (!embedding.values || embedding.values.length === 0) {
        throw new Error('Embedding generation failed');
      }

      // Test upsert and search
      const testEmbedding: Omit<VectorEmbedding, 'createdAt' | 'organizationId'> = {
        id: `health-check-${Date.now()}`,
        values: embedding.values,
        content: testContent,
        metadata: { test: true }
      };

      await this.upsert([testEmbedding]);
      const searchResults = await this.search(testContent, { limit: 1 });
      
      if (searchResults.length === 0) {
        throw new Error('Vector search failed');
      }

      // Cleanup
      await this.delete({ ids: [testEmbedding.id] });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operations: ['generate', 'upsert', 'search', 'delete'],
          embeddingDimensions: embedding.values.length
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
// Vector Provider Registry
// ========================================

/**
 * Registry for managing vector providers by organization
 */
export class VectorProviderRegistry {
  private static instance: VectorProviderRegistry;
  private providers = new Map<string, VectorProvider>();

  static getInstance(): VectorProviderRegistry {
    if (!VectorProviderRegistry.instance) {
      VectorProviderRegistry.instance = new VectorProviderRegistry();
    }
    return VectorProviderRegistry.instance;
  }

  registerProvider(organizationId: string, provider: VectorProvider): void {
    const key = `${organizationId}:vector`;
    this.providers.set(key, provider);
  }

  getProvider(organizationId: string): VectorProvider | undefined {
    const key = `${organizationId}:vector`;
    return this.providers.get(key);
  }

  removeProvider(organizationId: string): void {
    const key = `${organizationId}:vector`;
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