import {
  StorageProvider,
  StorageFile,
  StorageUploadRequest,
  ProviderConfig,
  ProviderHealth
} from '../base/provider-interface';
import { put, del, list, head, copy } from '@vercel/blob';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { 
  type StorageObjectMetadata, 
  type StorageUploadOptions,
  type StorageDownloadOptions,
  type StorageListOptions,
  type StorageListResult,
  type StorageUrlOptions
} from './storage-provider-interface';

// ========================================
// Vercel Blob Credentials
// ========================================

export interface VercelBlobCredentials {
  /** Vercel Blob Read Write Token */
  token: string;
}

// ========================================
// Vercel Blob Provider Implementation
// ========================================

/**
 * Vercel Blob Storage Provider
 * Uses @vercel/blob for file storage operations
 */
export class VercelBlobProvider extends StorageProvider {
  private readonly token: string;

  constructor(organizationId: string, config: ProviderConfiguration) {
    super(organizationId, config);
    
    const credentials = this.getCredential('token');
    if (!credentials) {
      throw new Error('VercelBlobProvider: token credential is required');
    }
    
    this.token = credentials;
  }

  /**
   * Initialize provider and validate configuration
   */
  async initialize(): Promise<void> {
    try {
      // Test connection with a simple list operation
      await list({ 
        token: this.token,
        limit: 1
      });
      
      this.auditLog('provider_initialized', this.getId(), {
        provider: 'vercel-blob',
        organization: this.organizationId
      });
    } catch (error) {
      throw new Error(`Failed to initialize VercelBlobProvider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate provider configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      // Validate token by attempting a list operation
      await list({ 
        token: this.token,
        limit: 1
      });
      return true;
    } catch (error) {
      console.error('VercelBlobProvider config validation failed:', error);
      return false;
    }
  }

  /**
   * Get provider usage metrics
   */
  async getMetrics(): Promise<ProviderMetrics> {
    // Basic metrics - Vercel Blob doesn't provide detailed analytics
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      uptime: 100 // Assume 100% uptime for managed service
    };
  }

  /**
   * Cleanup provider resources
   */
  async dispose(): Promise<void> {
    // Vercel Blob doesn't require explicit cleanup
    this.auditLog('provider_disposed', this.getId(), {
      provider: 'vercel-blob',
      organization: this.organizationId
    });
  }

  // ========================================
  // Storage Operations
  // ========================================

  /**
   * Upload file to Vercel Blob
   */
  async uploadFile(
    key: string,
    data: Buffer | Uint8Array | ReadableStream,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata> {
    this.validateUpload(data, options);
    
    const orgKey = this.getOrganizationKey(key);
    
    try {
      const blob = await put(orgKey, data, {
        token: this.token,
        contentType: options?.contentType,
        access: options?.public ? 'public' : undefined,
        addRandomSuffix: !options?.overwrite,
        cacheControlMaxAge: options?.cacheControl ? parseInt(options.cacheControl) : undefined
      });

      this.auditLog('file_uploaded', orgKey, {
        size: blob.size,
        contentType: options?.contentType,
        public: options?.public
      });

      return {
        size: blob.size,
        contentType: options?.contentType || 'application/octet-stream',
        lastModified: new Date(),
        path: orgKey,
        filename: options?.filename,
        url: blob.url,
        metadata: options?.metadata
      };
    } catch (error) {
      this.auditLog('file_upload_failed', orgKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file from Vercel Blob
   */
  async downloadFile(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      // Get file metadata to construct download URL
      const metadata = await this.getFileMetadata(key);
      
      if (!metadata.url) {
        throw new Error('File URL not available');
      }

      // Fetch file content
      const response = await fetch(metadata.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      this.auditLog('file_downloaded', orgKey, {
        size: buffer.length,
        attachment: options?.attachment
      });

      return buffer;
    } catch (error) {
      this.auditLog('file_download_failed', orgKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file stream for large files
   */
  async getFileStream(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<ReadableStream> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      const metadata = await this.getFileMetadata(key);
      
      if (!metadata.url) {
        throw new Error('File URL not available');
      }

      const response = await fetch(metadata.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.auditLog('file_stream_requested', orgKey, {
        attachment: options?.attachment
      });

      return response.body;
    } catch (error) {
      this.auditLog('file_stream_failed', orgKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to get file stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Vercel Blob
   */
  async deleteFile(key: string): Promise<boolean> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      await del(orgKey, { token: this.token });

      this.auditLog('file_deleted', orgKey);
      return true;
    } catch (error) {
      this.auditLog('file_delete_failed', orgKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if file exists in Vercel Blob
   */
  async fileExists(key: string): Promise<boolean> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      await head(orgKey, { token: this.token });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from Vercel Blob
   */
  async getFileMetadata(key: string): Promise<StorageObjectMetadata> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      const blob = await head(orgKey, { token: this.token });

      return {
        size: blob.size,
        contentType: blob.contentType || 'application/octet-stream',
        lastModified: blob.uploadedAt,
        path: orgKey,
        url: blob.url
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in Vercel Blob
   */
  async listFiles(options?: StorageListOptions): Promise<StorageListResult> {
    try {
      const prefix = options?.prefix 
        ? this.getOrganizationKey(options.prefix)
        : `organizations/${this.organizationId}/`;

      const result = await list({
        token: this.token,
        prefix,
        limit: options?.limit || 100,
        cursor: options?.continuationToken
      });

      const objects: StorageObjectMetadata[] = result.blobs.map(blob => ({
        size: blob.size,
        contentType: blob.contentType || 'application/octet-stream',
        lastModified: blob.uploadedAt,
        path: blob.pathname,
        url: blob.url,
        filename: blob.pathname.split('/').pop()
      }));

      this.auditLog('files_listed', prefix, {
        count: objects.length,
        hasMore: !!result.cursor
      });

      return {
        objects,
        continuationToken: result.cursor,
        hasMore: !!result.cursor,
        totalCount: objects.length
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate signed URL for Vercel Blob file
   */
  async generateSignedUrl(
    key: string,
    options?: StorageUrlOptions
  ): Promise<string> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      const metadata = await this.getFileMetadata(key);
      
      if (!metadata.url) {
        throw new Error('File URL not available');
      }

      // Vercel Blob URLs are already signed and publicly accessible
      // For additional security, you might want to implement your own URL signing
      let url = metadata.url;

      // Add query parameters for download behavior
      if (options?.attachment || options?.filename) {
        const urlObj = new URL(url);
        if (options.attachment) {
          urlObj.searchParams.set('download', '1');
        }
        if (options.filename) {
          urlObj.searchParams.set('filename', options.filename);
        }
        url = urlObj.toString();
      }

      this.auditLog('signed_url_generated', orgKey, {
        expiresIn: options?.expiresIn,
        attachment: options?.attachment
      });

      return url;
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy file within Vercel Blob
   */
  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata> {
    const orgSourceKey = this.getOrganizationKey(sourceKey);
    const orgDestKey = this.getOrganizationKey(destinationKey);
    
    try {
      const copiedBlob = await copy(orgSourceKey, orgDestKey, {
        token: this.token,
        contentType: options?.contentType,
        access: options?.public ? 'public' : undefined
      });

      this.auditLog('file_copied', orgDestKey, {
        source: orgSourceKey,
        size: copiedBlob.size
      });

      return {
        size: copiedBlob.size,
        contentType: options?.contentType || 'application/octet-stream',
        lastModified: new Date(),
        path: orgDestKey,
        filename: options?.filename,
        url: copiedBlob.url,
        metadata: options?.metadata
      };
    } catch (error) {
      this.auditLog('file_copy_failed', orgDestKey, {
        source: orgSourceKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ========================================
// Vercel Blob Provider Factory
// ========================================

export class VercelBlobProviderFactory {
  static create(organizationId: string, config: ProviderConfiguration): VercelBlobProvider {
    return new VercelBlobProvider(organizationId, config);
  }

  static getProviderType(): string {
    return 'storage:vercel-blob';
  }

  static validateConfiguration(config: ProviderConfiguration): boolean {
    const token = config.credentials?.token;
    return typeof token === 'string' && token.length > 0;
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Create Vercel Blob provider configuration from environment variables
 */
export function createVercelBlobConfig(organizationId: string): ProviderConfiguration {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
  }

  return {
    id: `vercel-blob-${organizationId}`,
    organizationId,
    providerType: 'storage',
    providerName: 'vercel-blob',
    enabled: true,
    isPrimary: true,
    isFallback: false,
    priority: 1,
    credentials: { token },
    settings: {
      maxFileSize: 50 * 1024 * 1024, // 50MB default
      allowedTypes: ['*'], // Allow all types by default
      cacheControl: '3600' // 1 hour cache
    },
    metadata: {
      description: 'Vercel Blob storage provider',
      region: 'auto'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 