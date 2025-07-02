import type { Repository } from '../repositories/base-repository';
import type { ServiceContext } from '../types/service-context';

export interface ServiceConfig {
  enableLogging?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export abstract class TenantService<T> {
  constructor(
    protected organizationId: string,
    protected repository: Repository<T>,
    protected config: ServiceConfig = {}
  ) {
    this.config = {
      enableLogging: true,
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  protected async withTransaction<R>(
    operation: () => Promise<R>
  ): Promise<R> {
    // TODO: Implement proper transaction management
    // For now, just execute the operation
    try {
      return await operation();
    } catch (error) {
      // Log error and rethrow
      if (this.config.enableLogging) {
        console.error(`Transaction failed for ${this.constructor.name}:`, error);
      }
      throw error;
    }
  }

  protected async checkPermissions(
    userId: string,
    action: string,
    resourceId?: string
  ): Promise<void> {
    // TODO: Implement permission validation
    // This will integrate with the existing permission system
    const hasPermission = true; // Placeholder
    
    if (!hasPermission) {
      throw new Error(`User ${userId} does not have permission to ${action}`);
    }
  }

  protected createContext(userId?: string): ServiceContext {
    return {
      organizationId: this.organizationId,
      userId,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    };
  }

  protected async validateOrganizationAccess(resourceOrgId: string): Promise<void> {
    if (resourceOrgId !== this.organizationId) {
      throw new Error('Access denied: Resource belongs to different organization');
    }
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < attempts - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 