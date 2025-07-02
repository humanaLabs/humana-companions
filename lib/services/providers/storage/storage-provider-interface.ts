import { BaseProvider, type ProviderConfiguration, type HealthCheckResult } from '../base/base-provider';

// ========================================
// Core Storage Types
// ========================================

/**
 * Storage object metadata
 */
export interface StorageObjectMetadata {
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  contentType: string;
  /** Last modified timestamp */
  lastModified: Date;
  /** MD5 hash of the file */
  etag?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** File path within the storage bucket */
  path: string;
  /** Original filename */
  filename?: string;
  /** Access URL (if publicly accessible) */
  url?: string;
}

/**
 * Storage upload options
 */
export interface StorageUploadOptions {
  /** Custom filename override */
  filename?: string;
  /** MIME type override */
  contentType?: string;
  /** Make file publicly accessible */
  public?: boolean;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Folder path for organization */
  folder?: string;
  /** Override existing file if exists */
  overwrite?: boolean;
  /** Cache control headers */
  cacheControl?: string;
}

/**
 * Storage download options
 */
export interface StorageDownloadOptions {
  /** Download as attachment with custom filename */
  attachment?: boolean;
  /** Filename for attachment download */
  filename?: string;
  /** Cache control override */
  cacheControl?: string;
}

/**
 * Storage list options
 */
export interface StorageListOptions {
  /** Folder prefix to list */
  prefix?: string;
  /** Maximum number of objects to return */
  limit?: number;
  /** Pagination token */
  continuationToken?: string;
  /** Include metadata in response */
  includeMetadata?: boolean;
}

/**
 * Storage list result
 */
export interface StorageListResult {
  /** List of storage objects */
  objects: StorageObjectMetadata[];
  /** Pagination token for next page */
  continuationToken?: string;
  /** Whether there are more results */
  hasMore: boolean;
  /** Total count (if available) */
  totalCount?: number;
}

/**
 * Storage URL generation options
 */
export interface StorageUrlOptions {
  /** URL expiration time in seconds */
  expiresIn?: number;
  /** Download as attachment */
  attachment?: boolean;
  /** Custom filename for download */
  filename?: string;
  /** Response content type override */
  responseContentType?: string;
}

/**
 * Storage provider configuration interface
 */
export interface StorageProviderConfig extends ProviderConfiguration {
  /** Default bucket/container name */
  bucketName?: string;
  /** Default region */
  region?: string;
  /** Default public access settings */
  publicAccess?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed file types (MIME types) */
  allowedTypes?: string[];
  /** Default cache control */
  cacheControl?: string;
}

// ========================================
// Storage Provider Interface
// ========================================

/**
 * Abstract base class for all storage providers
 * Provides file storage operations with multi-tenant isolation
 */
export abstract class StorageProvider extends BaseProvider {
  constructor(
    organizationId: string,
    config: ProviderConfiguration
  ) {
    super(organizationId, config, 'storage');
  }

  // ========================================
  // Abstract Methods (Provider Implementation)
  // ========================================

  /**
   * Upload a file to storage
   * @param key - Unique file identifier
   * @param data - File data (Buffer or stream)
   * @param options - Upload options
   * @returns Storage object metadata
   */
  abstract uploadFile(
    key: string,
    data: Buffer | Uint8Array | ReadableStream,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata>;

  /**
   * Download a file from storage
   * @param key - File identifier
   * @param options - Download options
   * @returns File data as buffer
   */
  abstract downloadFile(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer>;

  /**
   * Get file stream for large files
   * @param key - File identifier
   * @param options - Download options
   * @returns Readable stream
   */
  abstract getFileStream(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<ReadableStream>;

  /**
   * Delete a file from storage
   * @param key - File identifier
   * @returns Success status
   */
  abstract deleteFile(key: string): Promise<boolean>;

  /**
   * Check if file exists
   * @param key - File identifier
   * @returns Whether file exists
   */
  abstract fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading
   * @param key - File identifier
   * @returns File metadata
   */
  abstract getFileMetadata(key: string): Promise<StorageObjectMetadata>;

  /**
   * List files in storage
   * @param options - List options
   * @returns List of files
   */
  abstract listFiles(options?: StorageListOptions): Promise<StorageListResult>;

  /**
   * Generate signed URL for file access
   * @param key - File identifier
   * @param options - URL options
   * @returns Signed URL
   */
  abstract generateSignedUrl(
    key: string,
    options?: StorageUrlOptions
  ): Promise<string>;

  /**
   * Copy file within storage
   * @param sourceKey - Source file identifier
   * @param destinationKey - Destination file identifier
   * @param options - Upload options for destination
   * @returns New file metadata
   */
  abstract copyFile(
    sourceKey: string,
    destinationKey: string,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Generate organization-scoped file key
   * @param key - Base file key
   * @returns Organization-prefixed key
   */
  protected getOrganizationKey(key: string): string {
    // Remove leading slash if present
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `organizations/${this.organizationId}/${cleanKey}`;
  }

  /**
   * Validate file upload options
   * @param data - File data
   * @param options - Upload options
   */
  protected validateUpload(
    data: Buffer | Uint8Array | ReadableStream,
    options?: StorageUploadOptions
  ): void {
    // Check file size
    const maxFileSize = this.getSetting<number>('maxFileSize');
    if (maxFileSize && data instanceof Buffer) {
      if (data.length > maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size: ${maxFileSize} bytes`);
      }
    }

    // Check allowed types
    const allowedTypes = this.getSetting<string[]>('allowedTypes');
    if (allowedTypes && options?.contentType) {
      if (!allowedTypes.includes(options.contentType)) {
        throw new Error(`File type not allowed: ${options.contentType}`);
      }
    }
  }

  /**
   * Normalize file path
   * @param path - File path
   * @returns Normalized path
   */
  protected normalizePath(path: string): string {
    return path
      .replace(/\\/g, '/') // Replace backslashes with forward slashes
      .replace(/\/+/g, '/') // Replace multiple slashes with single slash
      .replace(/^\//, '') // Remove leading slash
      .replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Health check implementation for storage providers
   * @returns Health check result
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      
      // Test upload/download cycle with a small test file
      const testKey = `health-check-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testData = Buffer.from('Health check test file');
      
      // Upload test file
      await this.uploadFile(testKey, testData, {
        contentType: 'text/plain',
        metadata: { type: 'health-check' }
      });
      
      // Download test file
      const downloadedData = await this.downloadFile(testKey);
      
      // Verify content
      if (!downloadedData.equals(testData)) {
        throw new Error('Downloaded file content does not match uploaded content');
      }
      
      // Clean up test file
      await this.deleteFile(testKey);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          testFileSize: testData.length,
          operations: ['upload', 'download', 'delete']
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
// Storage Provider Registry
// ========================================

/**
 * Registry for managing storage providers by organization
 */
export class StorageProviderRegistry {
  private static instance: StorageProviderRegistry;
  private providers = new Map<string, StorageProvider>();

  static getInstance(): StorageProviderRegistry {
    if (!StorageProviderRegistry.instance) {
      StorageProviderRegistry.instance = new StorageProviderRegistry();
    }
    return StorageProviderRegistry.instance;
  }

  /**
   * Register a storage provider for an organization
   * @param organizationId - Organization identifier
   * @param provider - Storage provider instance
   */
  registerProvider(organizationId: string, provider: StorageProvider): void {
    const key = `${organizationId}:storage`;
    this.providers.set(key, provider);
  }

  /**
   * Get storage provider for an organization
   * @param organizationId - Organization identifier
   * @returns Storage provider or undefined
   */
  getProvider(organizationId: string): StorageProvider | undefined {
    const key = `${organizationId}:storage`;
    return this.providers.get(key);
  }

  /**
   * Remove storage provider for an organization
   * @param organizationId - Organization identifier
   */
  removeProvider(organizationId: string): void {
    const key = `${organizationId}:storage`;
    this.providers.delete(key);
  }

  /**
   * Get all registered organizations
   * @returns Array of organization IDs
   */
  getRegisteredOrganizations(): string[] {
    const organizationIds = new Set<string>();
    for (const key of this.providers.keys()) {
      const [orgId] = key.split(':');
      organizationIds.add(orgId);
    }
    return Array.from(organizationIds);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }
} 