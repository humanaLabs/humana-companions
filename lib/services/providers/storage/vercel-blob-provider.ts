import {
  StorageProvider,
  StorageFile,
  StorageUploadRequest,
  ProviderConfig,
  ProviderHealth
} from '../base/provider-interface';
import { put, del, list, head } from '@vercel/blob';

export interface VercelBlobConfig {
  token: string;
  baseUrl?: string;
}

export class VercelBlobProvider implements StorageProvider {
  readonly type = 'storage' as const;
  readonly name = 'Vercel Blob';

  private token!: string;
  private baseUrl?: string;

  async initialize(config: ProviderConfig): Promise<void> {
    const credentials = config.credentials as VercelBlobConfig;
    
    if (!credentials.token) {
      throw new Error('Vercel Blob token is required');
    }

    this.token = credentials.token;
    this.baseUrl = credentials.baseUrl;

    // Set token for Vercel Blob SDK
    process.env.BLOB_READ_WRITE_TOKEN = this.token;
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Test by listing files (limited to 1)
      await list({ limit: 1 });
      const responseTime = Date.now() - startTime;
      
      return {
        type: this.type,
        status: 'healthy',
        responseTime,
        metadata: {
          provider: 'Vercel Blob',
          tokenConfigured: !!this.token
        }
      };
    } catch (error) {
      return {
        type: this.type,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async upload(request: StorageUploadRequest): Promise<StorageFile> {
    try {
      const filename = `${request.organizationId}/${request.userId}/${Date.now()}-${request.filename}`;
      
      let fileData: Buffer;
      if (request.file instanceof Buffer) {
        fileData = request.file;
      } else if (request.file instanceof File) {
        // Convert File to Buffer
        const arrayBuffer = await request.file.arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Unsupported file type');
      }

      const blob = await put(filename, fileData, {
        contentType: request.mimeType,
        access: 'public' // ou 'private' dependendo da necessidade
      });

      return {
        id: this.extractFileIdFromUrl(blob.url),
        name: request.filename,
        size: fileData.length,
        mimeType: request.mimeType,
        url: blob.url,
        metadata: {
          ...request.metadata,
          organizationId: request.organizationId,
          userId: request.userId,
          uploadedVia: 'vercel-blob'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async download(fileId: string, organizationId: string): Promise<Buffer> {
    try {
      // Reconstruct URL from fileId (this might need adjustment based on URL structure)
      const url = `https://blob.vercel-storage.com/${fileId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(fileId: string, organizationId: string): Promise<void> {
    try {
      // Reconstruct URL from fileId
      const url = `https://blob.vercel-storage.com/${fileId}`;
      await del(url);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(fileId: string, organizationId: string): Promise<StorageFile> {
    try {
      // Reconstruct URL from fileId
      const url = `https://blob.vercel-storage.com/${fileId}`;
      
      const response = await head(url);
      
      return {
        id: fileId,
        name: this.extractFilenameFromUrl(url),
        size: response.size,
        mimeType: response.contentType || 'application/octet-stream',
        url: url,
        metadata: {
          organizationId
        },
        createdAt: new Date(response.uploadedAt),
        updatedAt: new Date(response.uploadedAt)
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(organizationId: string, limit: number = 100): Promise<StorageFile[]> {
    try {
      const { blobs } = await list({
        prefix: `${organizationId}/`,
        limit
      });

      return blobs.map(blob => ({
        id: this.extractFileIdFromUrl(blob.url),
        name: this.extractFilenameFromUrl(blob.url),
        size: blob.size,
        mimeType: (blob as any).contentType || 'application/octet-stream',
        url: blob.url,
        metadata: {
          organizationId,
          pathname: blob.pathname
        },
        createdAt: new Date(blob.uploadedAt),
        updatedAt: new Date(blob.uploadedAt)
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
    delete process.env.BLOB_READ_WRITE_TOKEN;
  }

  private extractFileIdFromUrl(url: string): string {
    // Extract the file identifier from Vercel Blob URL
    // Example: https://blob.vercel-storage.com/org123/user456/file.txt -> org123/user456/file.txt
    const parts = url.split('blob.vercel-storage.com/');
    return parts[1] || url;
  }

  private extractFilenameFromUrl(url: string): string {
    // Extract just the filename from the URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    
    // Remove any query parameters
    return filename.split('?')[0];
  }
} 