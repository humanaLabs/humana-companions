import {
  StorageProvider,
  StorageFile,
  StorageUploadRequest,
  ProviderConfig,
  ProviderHealth
} from '../base/provider-interface';

export interface AWSS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  endpoint?: string; // Para S3-compatible services
}

export class AWSS3Provider implements StorageProvider {
  readonly type = 'storage' as const;
  readonly name = 'AWS S3';

  private accessKeyId!: string;
  private secretAccessKey!: string;
  private region!: string;
  private bucketName!: string;
  private endpoint?: string;
  private baseUrl!: string;

  async initialize(config: ProviderConfig): Promise<void> {
    const credentials = config.credentials as AWSS3Config;
    
    if (!credentials.accessKeyId) {
      throw new Error('AWS Access Key ID is required');
    }
    if (!credentials.secretAccessKey) {
      throw new Error('AWS Secret Access Key is required');
    }
    if (!credentials.region) {
      throw new Error('AWS Region is required');
    }
    if (!credentials.bucketName) {
      throw new Error('S3 Bucket name is required');
    }

    this.accessKeyId = credentials.accessKeyId;
    this.secretAccessKey = credentials.secretAccessKey;
    this.region = credentials.region;
    this.bucketName = credentials.bucketName;
    this.endpoint = credentials.endpoint;
    
    this.baseUrl = this.endpoint || `https://s3.${this.region}.amazonaws.com`;
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Test by listing objects in bucket (max 1)
      await this.listObjects('', 1);
      const responseTime = Date.now() - startTime;
      
      return {
        type: this.type,
        status: 'healthy',
        responseTime,
        metadata: {
          provider: 'AWS S3',
          bucket: this.bucketName,
          region: this.region
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
      const key = `${request.organizationId}/${request.userId}/${Date.now()}-${request.filename}`;
      
      let fileData: Buffer;
      if (request.file instanceof Buffer) {
        fileData = request.file;
      } else if (request.file instanceof File) {
        const arrayBuffer = await request.file.arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Unsupported file type');
      }

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileData,
        ContentType: request.mimeType,
        Metadata: {
          organizationId: request.organizationId,
          userId: request.userId,
          originalName: request.filename,
          ...Object.fromEntries(
            Object.entries(request.metadata || {}).map(([k, v]) => [k, String(v)])
          )
        }
      };

      await this.putObject(uploadParams);
      
      const url = `${this.baseUrl}/${this.bucketName}/${key}`;

      return {
        id: key,
        name: request.filename,
        size: fileData.length,
        mimeType: request.mimeType,
        url,
        metadata: {
          ...request.metadata,
          organizationId: request.organizationId,
          userId: request.userId,
          uploadedVia: 'aws-s3',
          bucket: this.bucketName,
          key
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
      const params = {
        Bucket: this.bucketName,
        Key: fileId
      };

      const response = await this.getObject(params);
      return response.Body as Buffer;
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(fileId: string, organizationId: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileId
      };

      await this.deleteObject(params);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(fileId: string, organizationId: string): Promise<StorageFile> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileId
      };

      const response = await this.headObject(params);
      const url = `${this.baseUrl}/${this.bucketName}/${fileId}`;

      return {
        id: fileId,
        name: response.Metadata?.originalName || this.extractFilename(fileId),
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        url,
        metadata: {
          organizationId,
          ...response.Metadata
        },
        createdAt: response.LastModified || new Date(),
        updatedAt: response.LastModified || new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(organizationId: string, limit: number = 100): Promise<StorageFile[]> {
    try {
      const objects = await this.listObjects(`${organizationId}/`, limit);
      
      return objects.map(obj => ({
        id: obj.Key || '',
        name: this.extractFilename(obj.Key || ''),
        size: obj.Size || 0,
        mimeType: 'application/octet-stream', // S3 list doesn't include content type
        url: `${this.baseUrl}/${this.bucketName}/${obj.Key}`,
        metadata: {
          organizationId,
          bucket: this.bucketName,
          key: obj.Key
        },
        createdAt: obj.LastModified || new Date(),
        updatedAt: obj.LastModified || new Date()
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
  }

  // AWS S3 API Methods using Fetch (simplified implementation)
  private async putObject(params: any): Promise<any> {
    const url = `${this.baseUrl}/${params.Bucket}/${params.Key}`;
    const headers = await this.getSignedHeaders('PUT', params.Key, {
      'Content-Type': params.ContentType,
      ...Object.fromEntries(
        Object.entries(params.Metadata || {}).map(([k, v]) => [`x-amz-meta-${k}`, v as string])
      )
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: params.Body
    });

    if (!response.ok) {
      throw new Error(`S3 PUT failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async getObject(params: any): Promise<any> {
    const url = `${this.baseUrl}/${params.Bucket}/${params.Key}`;
    const headers = await this.getSignedHeaders('GET', params.Key);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`S3 GET failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return { Body: Buffer.from(buffer) };
  }

  private async deleteObject(params: any): Promise<any> {
    const url = `${this.baseUrl}/${params.Bucket}/${params.Key}`;
    const headers = await this.getSignedHeaders('DELETE', params.Key);

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`S3 DELETE failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async headObject(params: any): Promise<any> {
    const url = `${this.baseUrl}/${params.Bucket}/${params.Key}`;
    const headers = await this.getSignedHeaders('HEAD', params.Key);

    const response = await fetch(url, {
      method: 'HEAD',
      headers
    });

    if (!response.ok) {
      throw new Error(`S3 HEAD failed: ${response.status} ${response.statusText}`);
    }

    // Parse metadata from response headers
    const metadata: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key.startsWith('x-amz-meta-')) {
        metadata[key.replace('x-amz-meta-', '')] = value;
      }
    });

    return {
      ContentLength: parseInt(response.headers.get('content-length') || '0'),
      ContentType: response.headers.get('content-type'),
      LastModified: new Date(response.headers.get('last-modified') || ''),
      Metadata: metadata
    };
  }

  private async listObjects(prefix: string, maxKeys: number = 1000): Promise<any[]> {
    const url = `${this.baseUrl}/${this.bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`;
    const headers = await this.getSignedHeaders('GET', '', {}, `/?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`S3 LIST failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    // Simple XML parsing (in production, use a proper XML parser)
    const objects: any[] = [];
    const regex = /<Contents>[\s\S]*?<\/Contents>/g;
    const matches = xmlText.match(regex);
    
    if (matches) {
      for (const match of matches) {
        const key = match.match(/<Key>(.*?)<\/Key>/)?.[1];
        const size = match.match(/<Size>(\d+)<\/Size>/)?.[1];
        const lastModified = match.match(/<LastModified>(.*?)<\/LastModified>/)?.[1];
        
        if (key) {
          objects.push({
            Key: key,
            Size: size ? parseInt(size) : 0,
            LastModified: lastModified ? new Date(lastModified) : new Date()
          });
        }
      }
    }

    return objects;
  }

  private async getSignedHeaders(method: string, key: string, additionalHeaders: Record<string, string> = {}, canonicalQueryString: string = ''): Promise<Record<string, string>> {
    // Simplified AWS Signature Version 4 implementation
    // In production, use the official AWS SDK or a proper signing library
    
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    
    const headers = {
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${dateStamp}/${this.region}/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=placeholder`,
      'x-amz-date': timestamp,
      'Host': new URL(this.baseUrl).host,
      ...additionalHeaders
    };

    // Note: This is a placeholder. In production, implement proper AWS Signature Version 4
    // or use the AWS SDK which handles signing automatically
    
    return headers;
  }

  private extractFilename(key: string): string {
    const parts = key.split('/');
    return parts[parts.length - 1];
  }
} 