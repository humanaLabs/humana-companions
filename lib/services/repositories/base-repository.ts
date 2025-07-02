import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import type { PaginationContext, SearchContext } from '../types/service-context';

/**
 * @description Base repository abstrata com isolamento multi-tenant
 */
export abstract class BaseRepository<T> {
  protected readonly tableName: string;
  protected readonly organizationId: string;

  constructor(tableName: string, organizationId: string) {
    this.tableName = tableName;
    this.organizationId = organizationId;

    if (!organizationId) {
      throw new Error('BaseRepository: organizationId is required');
    }
  }

  /**
   * @description Wrapper para queries com auto-isolamento de tenant
   */
  protected async executeQuery<R>(
    operation: () => Promise<R>,
    context?: string
  ): Promise<R> {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log performance para queries lentas
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected: ${this.tableName}.${context} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Repository error in ${this.tableName}.${context}:`, error);
      throw error;
    }
  }

  /**
   * @description Buscar por ID com isolamento de tenant
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * @description Buscar múltiplos por organização
   */
  abstract findMany(filters?: Record<string, any>, limit?: number): Promise<T[]>;

  /**
   * @description Criar nova entidade
   */
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;

  /**
   * @description Atualizar entidade existente
   */
  abstract update(id: string, data: Partial<T>): Promise<T>;

  /**
   * @description Deletar entidade
   */
  abstract delete(id: string): Promise<void>;

  /**
   * @description Count com filtros
   */
  abstract count(filters?: Record<string, any>): Promise<number>;

  /**
   * @description Validar se entidade pertence à organização
   */
  protected validateTenantAccess(entity: any): void {
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (entity.organizationId !== this.organizationId) {
      throw new Error('Access denied: Entity belongs to different organization');
    }
  }

  /**
   * @description Log de auditoria para repository operations
   */
  protected auditLog(
    operation: string,
    entityId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`📊 REPO: ${operation} on ${this.tableName}:${entityId} (org: ${this.organizationId})`, {
      operation,
      table: this.tableName,
      entityId,
      organizationId: this.organizationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

/**
 * @description Interface padrão para repositories
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: Record<string, any>, limit?: number): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filters?: Record<string, any>): Promise<number>;
}

/**
 * @description Query builder helpers
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * @description Helper para criar condições de filtro
 */
export function createFilters(
  table: any,
  filters: Record<string, any> = {},
  organizationId: string
) {
  const conditions = [eq(table.organizationId, organizationId)];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // IN condition
        conditions.push(table[key].in(value));
      } else if (typeof value === 'string' && value.includes('%')) {
        // LIKE condition
        conditions.push(table[key].like(value));
      } else {
        // Equality condition
        conditions.push(eq(table[key], value));
      }
    }
  });

  return and(...conditions);
}

/**
 * @description Helper para paginação
 */
export function createPagination<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginationResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    hasNext: (page * pageSize) < total,
    hasPrev: page > 1
  };
}

export interface TransactionalRepository<T> extends Repository<T> {
  withTransaction<R>(operation: (repo: Repository<T>) => Promise<R>): Promise<R>;
}

export abstract class BaseRepositoryImpl<T> implements Repository<T> {
  constructor(
    protected tableName: string,
    protected db: any // Will be typed properly when we implement the database abstraction
  ) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filters?: Record<string, any>, limit?: number): Promise<T[]>;
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract count(filters?: Record<string, any>): Promise<number>;

  protected ensureTenantIsolation(query: any, organizationId: string): any {
    // Ensures all queries are scoped to the organization
    if (!query.where) {
      query.where = {};
    }
    query.where.organizationId = organizationId;
    return query;
  }

  protected validateOrganizationId(organizationId: string): void {
    if (!organizationId || organizationId.trim() === '') {
      throw new Error('Organization ID is required for all repository operations');
    }
  }
} 