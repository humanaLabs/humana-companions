import type { Repository } from '../repositories/base-repository';
import type { ServiceContext } from '../types/service-context';

/**
 * @description Base abstrata para todos os domain services
 * Garante isolamento multi-tenant e padrões consistentes
 */
export abstract class TenantService<T = any> {
  protected readonly organizationId: string;
  protected readonly context: ServiceContext;

  constructor(context: ServiceContext) {
    this.organizationId = context.organizationId;
    this.context = context;
    
    // Validação crítica de tenant
    if (!this.organizationId) {
      throw new Error('TenantService: organizationId is required');
    }
  }

  /**
   * @description Transaction wrapper com retry automático
   */
  protected async withTransaction<R>(
    operation: () => Promise<R>,
    retries: number = 3
  ): Promise<R> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries || !this.isRetryableError(error)) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 100);
      }
    }
    
    throw lastError!;
  }

  /**
   * @description Validação de permissões por tenant
   */
  protected async checkPermissions(
    userId: string,
    action: string,
    resource?: string
  ): Promise<void> {
    // TODO: Integrar com sistema de permissões
    if (!userId) {
      throw new Error('User ID is required for permission check');
    }
    
    // Log para auditoria
    console.log(`🔐 Permission check: ${userId} -> ${action} on ${resource || 'resource'} (org: ${this.organizationId})`);
  }

  /**
   * @description Wrapper para operações com validação de tenant
   */
  protected async executeWithValidation<R>(
    userId: string,
    action: string,
    operation: () => Promise<R>,
    resource?: string
  ): Promise<R> {
    // 1. Validar permissões
    await this.checkPermissions(userId, action, resource);
    
    // 2. Executar com transaction
    return this.withTransaction(operation);
  }

  /**
   * @description Validação de acesso a entidade por tenant
   */
  protected validateTenantAccess(entityOrgId: string): void {
    if (entityOrgId !== this.organizationId) {
      throw new Error(`Access denied: Entity belongs to different organization`);
    }
  }

  /**
   * @description Log estruturado para auditoria
   */
  protected auditLog(
    action: string,
    entityId: string,
    userId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`📋 AUDIT: ${action} by ${userId} on ${entityId} (org: ${this.organizationId})`, {
      organizationId: this.organizationId,
      userId,
      action,
      entityId,
      timestamp: new Date().toISOString(),
      requestId: this.context.requestId,
      ...metadata
    });
  }

  /**
   * @description Determina se erro é passível de retry
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'TEMP_FAILURE'
    ];
    
    return retryableErrors.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  /**
   * @description Delay para retry com exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @description Resultado padronizado para operações de domain service
   */
  protected createResult<TData>(
    success: boolean,
    data?: TData,
    error?: string,
    metadata?: Record<string, any>
  ): OperationResult<TData> {
    return {
      success,
      data,
      error,
      organizationId: this.organizationId,
      timestamp: new Date().toISOString(),
      requestId: this.context.requestId,
      ...metadata
    };
  }

  /**
   * @description Success result helper
   */
  protected success<TData>(data: TData, metadata?: Record<string, any>): OperationResult<TData> {
    return this.createResult(true, data, undefined, metadata);
  }

  /**
   * @description Error result helper
   */
  protected failure<TData>(error: string, metadata?: Record<string, any>): OperationResult<TData> {
    return this.createResult(false, undefined as any, error, metadata);
  }
}

/**
 * @description Resultado padronizado para operações de serviços
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  organizationId: string;
  timestamp: string;
  requestId: string;
  [key: string]: any;
}

/**
 * @description Configuração base para services
 */
export interface ServiceConfig {
  retryAttempts?: number;
  timeoutMs?: number;
  enableAuditLog?: boolean;
  enablePerformanceLog?: boolean;
}

/**
 * @description Default service configuration
 */
export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  retryAttempts: 3,
  timeoutMs: 30000,
  enableAuditLog: true,
  enablePerformanceLog: true
}; 