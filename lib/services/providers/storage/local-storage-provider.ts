import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { 
  StorageProvider, 
  type StorageObjectMetadata, 
  type StorageUploadOptions,
  type StorageDownloadOptions,
  type StorageListOptions,
  type StorageListResult,
  type StorageUrlOptions
} from './storage-provider-interface';

// ========================================
// Local Storage Configuration
// ========================================

export interface LocalStorageCredentials {
  /** Base directory for file storage */
  basePath: string;
  /** URL prefix for serving files */
  baseUrl?: string;
}

// ========================================
// Local Storage Provider Implementation
// ========================================

/**
 * Local Storage Provider
 * Uses local filesystem for file storage operations
 * Suitable for development and fallback scenarios
 */
export class LocalStorageProvider extends StorageProvider {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(organizationId: string, config: ProviderConfiguration) {
    super(organizationId, config);
    
    const basePath = this.getCredential('basePath');
    if (!basePath) {
      throw new Error('LocalStorageProvider: basePath credential is required');
    }
    
    this.basePath = basePath;
    this.baseUrl = this.getCredential('baseUrl') || '/api/storage';
  }

  /**
   * Initialize provider and validate configuration
   */
  async initialize(): Promise<void> {
    try {
      // Ensure base directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Ensure organization directory exists
      const orgPath = join(this.basePath, `organizations/${this.organizationId}`);
      await fs.mkdir(orgPath, { recursive: true });
      
      this.auditLog('provider_initialized', this.getId(), {
        provider: 'local-storage',
        organization: this.organizationId,
        basePath: this.basePath
      });
    } catch (error) {
      throw new Error(`Failed to initialize LocalStorageProvider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate provider configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      // Test write access to base directory
      const testFile = join(this.basePath, '.test-write');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      console.error('LocalStorageProvider config validation failed:', error);
      return false;
    }
  }

  /**
   * Get provider usage metrics
   */
  async getMetrics(): Promise<ProviderMetrics> {
    try {
      const orgPath = join(this.basePath, `organizations/${this.organizationId}`);
      const files = await this.getAllFiles(orgPath);
      
      return {
        totalRequests: files.length,
        successfulRequests: files.length,
        failedRequests: 0,
        averageResponseTime: 10, // Local storage is very fast
        lastUsed: new Date(),
        uptime: 100
      };
    } catch (error) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 1,
        averageResponseTime: 0,
        lastUsed: new Date(),
        uptime: 0
      };
    }
  }

  /**
   * Cleanup provider resources
   */
  async dispose(): Promise<void> {
    // Local storage doesn't require explicit cleanup
    this.auditLog('provider_disposed', this.getId(), {
      provider: 'local-storage',
      organization: this.organizationId
    });
  }

  // ========================================
  // Storage Operations
  // ========================================

  /**
   * Upload file to local storage
   */
  async uploadFile(
    key: string,
    data: Buffer | Uint8Array | ReadableStream,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata> {
    this.validateUpload(data, options);
    
    const orgKey = this.getOrganizationKey(key);
    const filePath = join(this.basePath, orgKey);
    
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(filePath), { recursive: true });
      
      // Check if file exists and overwrite is not allowed
      if (!options?.overwrite) {
        try {
          await fs.access(filePath);
          throw new Error('File already exists and overwrite is not allowed');
        } catch (error) {
          // File doesn't exist, continue
          if ((error as any).code !== 'ENOENT') {
            throw error;
          }
        }
      }

      // Write file data
      if (data instanceof Buffer || data instanceof Uint8Array) {
        await fs.writeFile(filePath, data);
      } else {
        // Handle ReadableStream
        const writeStream = createWriteStream(filePath);
        const reader = data.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            writeStream.write(value);
          }
        } finally {
          writeStream.end();
          reader.releaseLock();
        }
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Generate file URL
      const url = `${this.baseUrl}/${orgKey}`;

      this.auditLog('file_uploaded', orgKey, {
        size: stats.size,
        contentType: options?.contentType,
        public: options?.public
      });

      return {
        size: stats.size,
        contentType: options?.contentType || this.getContentType(filePath),
        lastModified: stats.mtime,
        path: orgKey,
        filename: options?.filename || basename(filePath),
        url,
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
   * Download file from local storage
   */
  async downloadFile(
    key: string,
    options?: StorageDownloadOptions
  ): Promise<Buffer> {
    const orgKey = this.getOrganizationKey(key);
    const filePath = join(this.basePath, orgKey);
    
    try {
      const data = await fs.readFile(filePath);

      this.auditLog('file_downloaded', orgKey, {
        size: data.length,
        attachment: options?.attachment
      });

      return data;
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
    const filePath = join(this.basePath, orgKey);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Create readable stream from file
      const fileStream = createReadStream(filePath);
      
      this.auditLog('file_stream_requested', orgKey, {
        attachment: options?.attachment
      });

      // Convert Node.js readable stream to Web ReadableStream
      return new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk: string | Buffer) => {
            if (typeof chunk === 'string') {
              controller.enqueue(new TextEncoder().encode(chunk));
            } else {
              controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
            }
          });
          
          fileStream.on('end', () => {
            controller.close();
          });
          
          fileStream.on('error', (error) => {
            controller.error(error);
          });
        },
        
        cancel() {
          fileStream.destroy();
        }
      });
    } catch (error) {
      this.auditLog('file_stream_failed', orgKey, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to get file stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(key: string): Promise<boolean> {
    const orgKey = this.getOrganizationKey(key);
    const filePath = join(this.basePath, orgKey);
    
    try {
      await fs.unlink(filePath);

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
   * Check if file exists in local storage
   */
  async fileExists(key: string): Promise<boolean> {
    const orgKey = this.getOrganizationKey(key);
    const filePath = join(this.basePath, orgKey);
    
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from local storage
   */
  async getFileMetadata(key: string): Promise<StorageObjectMetadata> {
    const orgKey = this.getOrganizationKey(key);
    const filePath = join(this.basePath, orgKey);
    
    try {
      const stats = await fs.stat(filePath);
      const url = `${this.baseUrl}/${orgKey}`;

      return {
        size: stats.size,
        contentType: this.getContentType(filePath),
        lastModified: stats.mtime,
        path: orgKey,
        filename: basename(filePath),
        url
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in local storage
   */
  async listFiles(options?: StorageListOptions): Promise<StorageListResult> {
    try {
      const basePath = options?.prefix 
        ? join(this.basePath, this.getOrganizationKey(options.prefix))
        : join(this.basePath, `organizations/${this.organizationId}`);

      const files = await this.getAllFiles(basePath);
      const limit = options?.limit || 100;
      const startIndex = options?.continuationToken ? parseInt(options.continuationToken) : 0;
      const endIndex = startIndex + limit;
      const paginatedFiles = files.slice(startIndex, endIndex);

      const objects: StorageObjectMetadata[] = await Promise.all(
        paginatedFiles.map(async (filePath) => {
          const stats = await fs.stat(filePath);
          const relativePath = filePath.replace(this.basePath + '/', '');
          const url = `${this.baseUrl}/${relativePath}`;

          return {
            size: stats.size,
            contentType: this.getContentType(filePath),
            lastModified: stats.mtime,
            path: relativePath,
            filename: basename(filePath),
            url
          };
        })
      );

      this.auditLog('files_listed', basePath, {
        count: objects.length,
        hasMore: endIndex < files.length
      });

      return {
        objects,
        continuationToken: endIndex < files.length ? endIndex.toString() : undefined,
        hasMore: endIndex < files.length,
        totalCount: files.length
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate signed URL for local storage file
   */
  async generateSignedUrl(
    key: string,
    options?: StorageUrlOptions
  ): Promise<string> {
    const orgKey = this.getOrganizationKey(key);
    
    try {
      // Check if file exists
      const filePath = join(this.basePath, orgKey);
      await fs.access(filePath);
      
      // Generate URL (local storage URLs are typically not signed)
      let url = `${this.baseUrl}/${orgKey}`;

      // Add query parameters for download behavior
      if (options?.attachment || options?.filename) {
        const urlObj = new URL(url, 'http://localhost');
        if (options.attachment) {
          urlObj.searchParams.set('download', '1');
        }
        if (options.filename) {
          urlObj.searchParams.set('filename', options.filename);
        }
        url = urlObj.pathname + urlObj.search;
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
   * Copy file within local storage
   */
  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options?: StorageUploadOptions
  ): Promise<StorageObjectMetadata> {
    const orgSourceKey = this.getOrganizationKey(sourceKey);
    const orgDestKey = this.getOrganizationKey(destinationKey);
    const sourcePath = join(this.basePath, orgSourceKey);
    const destPath = join(this.basePath, orgDestKey);
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(dirname(destPath), { recursive: true });
      
      // Copy file
      await fs.copyFile(sourcePath, destPath);
      
      // Get destination file stats
      const stats = await fs.stat(destPath);
      const url = `${this.baseUrl}/${orgDestKey}`;

      this.auditLog('file_copied', orgDestKey, {
        source: orgSourceKey,
        size: stats.size
      });

      return {
        size: stats.size,
        contentType: options?.contentType || this.getContentType(destPath),
        lastModified: stats.mtime,
        path: orgDestKey,
        filename: options?.filename || basename(destPath),
        url,
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

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Get all files recursively from a directory
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is empty
    }
    
    return files;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.xml': 'application/xml'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// ========================================
// Local Storage Provider Factory
// ========================================

export class LocalStorageProviderFactory {
  static create(organizationId: string, config: ProviderConfiguration): LocalStorageProvider {
    return new LocalStorageProvider(organizationId, config);
  }

  static getProviderType(): string {
    return 'storage:local';
  }

  static validateConfiguration(config: ProviderConfiguration): boolean {
    const basePath = config.credentials?.basePath;
    return typeof basePath === 'string' && basePath.length > 0;
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Create Local Storage provider configuration
 */
export function createLocalStorageConfig(
  organizationId: string, 
  basePath: string = './storage'
): ProviderConfiguration {
  return {
    id: `local-storage-${organizationId}`,
    organizationId,
    providerType: 'storage',
    providerName: 'local',
    enabled: true,
    isPrimary: false,
    isFallback: true,
    priority: 999, // Lowest priority (fallback)
    credentials: { 
      basePath,
      baseUrl: '/api/storage'
    },
    settings: {
      maxFileSize: 100 * 1024 * 1024, // 100MB default
      allowedTypes: ['*'], // Allow all types
      cacheControl: '3600' // 1 hour cache
    },
    metadata: {
      description: 'Local filesystem storage provider',
      type: 'fallback'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 