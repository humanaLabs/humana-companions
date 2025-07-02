import type { ProviderConfiguration } from '../base/base-provider';
import { StorageProvider, StorageProviderRegistry } from '../storage/storage-provider-interface';
import { VercelBlobProvider, VercelBlobProviderFactory, createVercelBlobConfig } from '../storage/vercel-blob-provider';
import { LocalStorageProvider, LocalStorageProviderFactory, createLocalStorageConfig } from '../storage/local-storage-provider';

// ========================================
// Storage Provider Manager
// ========================================

/**
 * Storage Provider Manager
 * Manages storage providers with fallback strategy and health monitoring
 */
export class StorageProviderManager {
  private static instance: StorageProviderManager;
  private registry: StorageProviderRegistry;
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();

  private constructor() {
    this.registry = StorageProviderRegistry.getInstance();
    this.registerFactories();
  }

  static getInstance(): StorageProviderManager {
    if (!StorageProviderManager.instance) {
      StorageProviderManager.instance = new StorageProviderManager();
    }
    return StorageProviderManager.instance;
  }

  // ========================================
  // Factory Registration
  // ========================================

  private registerFactories(): void {
    // Register all storage provider factories
    // Note: In a real implementation, you might want to load these dynamically
  }

  // ========================================
  // Provider Creation and Management
  // ========================================

  /**
   * Create and register a storage provider for an organization
   */
  async createProvider(
    organizationId: string,
    config: ProviderConfiguration
  ): Promise<StorageProvider> {
    let provider: StorageProvider;

    switch (config.providerName) {
      case 'vercel-blob':
        provider = VercelBlobProviderFactory.create(organizationId, config);
        break;
      case 'local':
        provider = LocalStorageProviderFactory.create(organizationId, config);
        break;
      default:
        throw new Error(`Unknown storage provider: ${config.providerName}`);
    }

    // Initialize the provider
    await provider.initialize();

    // Register the provider
    this.registry.registerProvider(organizationId, provider);

    // Start health monitoring
    this.startHealthMonitoring(organizationId, provider);

    return provider;
  }

  /**
   * Get storage provider for an organization
   */
  getProvider(organizationId: string): StorageProvider | undefined {
    return this.registry.getProvider(organizationId);
  }

  /**
   * Get or create storage provider with fallback strategy
   */
  async getOrCreateProvider(organizationId: string): Promise<StorageProvider> {
    // Try to get existing provider
    let provider = this.getProvider(organizationId);
    
    if (provider && provider.isEnabled()) {
      return provider;
    }

    // Try to create from environment
    try {
      const configs = await this.createProvidersFromEnvironment(organizationId);
      
      for (const config of configs) {
        try {
          provider = await this.createProvider(organizationId, config);
          if (await provider.validateConfig()) {
            return provider;
          }
        } catch (error) {
          console.warn(`Failed to create storage provider ${config.providerName}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to create storage providers from environment:', error);
    }

    // Fallback to local storage
    console.warn('Falling back to local storage provider');
    const localConfig = createLocalStorageConfig(organizationId);
    return this.createProvider(organizationId, localConfig);
  }

  /**
   * Create storage providers from environment variables
   */
  async createProvidersFromEnvironment(organizationId: string): Promise<ProviderConfiguration[]> {
    const configs: ProviderConfiguration[] = [];

    // Vercel Blob (primary)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        configs.push(createVercelBlobConfig(organizationId));
      } catch (error) {
        console.warn('Failed to create Vercel Blob config:', error);
      }
    }

    // Local storage (fallback)
    configs.push(createLocalStorageConfig(organizationId));

    return configs;
  }

  // ========================================
  // Health Monitoring
  // ========================================

  /**
   * Start health monitoring for a provider
   */
  private startHealthMonitoring(organizationId: string, provider: StorageProvider): void {
    const key = `${organizationId}:storage`;
    
    // Clear existing interval if any
    const existingInterval = this.healthCheckIntervals.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new health check interval (every 5 minutes)
    const interval = setInterval(async () => {
      try {
        const result = await provider.healthCheck();
        if (result.status === 'unhealthy') {
          console.warn(`Storage provider health check failed for ${organizationId}:`, result.error);
          // Could implement automatic provider switching here
        }
      } catch (error) {
        console.error(`Storage provider health check error for ${organizationId}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.healthCheckIntervals.set(key, interval);
  }

  /**
   * Perform health check for organization's storage provider
   */
  async healthCheckOrganization(organizationId: string): Promise<any> {
    const provider = this.getProvider(organizationId);
    
    if (!provider) {
      return {
        organization: organizationId,
        status: 'no-provider',
        error: 'No storage provider configured'
      };
    }

    try {
      const result = await provider.healthCheck();
      return {
        organization: organizationId,
        provider: provider.getName(),
        ...result
      };
    } catch (error) {
      return {
        organization: organizationId,
        provider: provider.getName(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ========================================
  // Provider Operations with Fallback
  // ========================================

  /**
   * Execute storage operation with automatic fallback
   */
  async executeWithFallback<T>(
    organizationId: string,
    operation: (provider: StorageProvider) => Promise<T>,
    context?: string
  ): Promise<T> {
    let provider = await this.getOrCreateProvider(organizationId);
    
    try {
      return await operation(provider);
    } catch (error) {
      console.warn(`Storage operation failed for ${organizationId}, attempting fallback:`, error);
      
      // Try to create fallback provider
      try {
        const fallbackConfig = createLocalStorageConfig(organizationId);
        const fallbackProvider = await this.createProvider(organizationId, fallbackConfig);
        return await operation(fallbackProvider);
      } catch (fallbackError) {
        console.error(`Storage fallback also failed for ${organizationId}:`, fallbackError);
        throw error; // Throw original error
      }
    }
  }

  // ========================================
  // Cleanup and Disposal
  // ========================================

  /**
   * Remove provider and cleanup resources for an organization
   */
  async clearOrganization(organizationId: string): Promise<void> {
    const provider = this.getProvider(organizationId);
    
    if (provider) {
      try {
        await provider.dispose();
      } catch (error) {
        console.error(`Error disposing storage provider for ${organizationId}:`, error);
      }
    }

    // Clear health check interval
    const key = `${organizationId}:storage`;
    const interval = this.healthCheckIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(key);
    }

    // Remove from registry
    this.registry.removeProvider(organizationId);
  }

  /**
   * Cleanup all providers and intervals
   */
  async dispose(): Promise<void> {
    const organizations = this.registry.getRegisteredOrganizations();
    
    await Promise.all(
      organizations.map(orgId => this.clearOrganization(orgId))
    );

    this.registry.clear();
  }
}

// ========================================
// Storage Provider Helper
// ========================================

/**
 * Helper class for simplified storage operations
 */
export class StorageProviderHelper {
  private static manager = StorageProviderManager.getInstance();

  /**
   * Get storage provider for organization
   */
  static async getProvider(organizationId: string): Promise<StorageProvider> {
    return this.manager.getOrCreateProvider(organizationId);
  }

  /**
   * Upload file with automatic provider resolution and fallback
   */
  static async uploadFile(
    organizationId: string,
    key: string,
    data: Buffer | Uint8Array | ReadableStream,
    options?: any
  ) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.uploadFile(key, data, options),
      'upload'
    );
  }

  /**
   * Download file with automatic provider resolution and fallback
   */
  static async downloadFile(
    organizationId: string,
    key: string,
    options?: any
  ) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.downloadFile(key, options),
      'download'
    );
  }

  /**
   * Delete file with automatic provider resolution and fallback
   */
  static async deleteFile(organizationId: string, key: string) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.deleteFile(key),
      'delete'
    );
  }

  /**
   * List files with automatic provider resolution and fallback
   */
  static async listFiles(organizationId: string, options?: any) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.listFiles(options),
      'list'
    );
  }

  /**
   * Generate signed URL with automatic provider resolution and fallback
   */
  static async generateSignedUrl(
    organizationId: string,
    key: string,
    options?: any
  ) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.generateSignedUrl(key, options),
      'signedUrl'
    );
  }

  /**
   * Check if file exists with automatic provider resolution and fallback
   */
  static async fileExists(organizationId: string, key: string) {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.fileExists(key),
      'exists'
    );
  }

  /**
   * Health check for organization's storage provider
   */
  static async healthCheck(organizationId: string) {
    return this.manager.healthCheckOrganization(organizationId);
  }
} 