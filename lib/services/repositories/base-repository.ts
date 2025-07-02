import type { PaginationContext, SearchContext } from '../types/service-context';

export interface Repository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findByUserId(userId: string, organizationId: string): Promise<T[]>;
  findAll(organizationId: string, pagination?: PaginationContext): Promise<T[]>;
  search(organizationId: string, context: SearchContext): Promise<T[]>;
  
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<T>;
  update(id: string, updates: Partial<T>, organizationId: string): Promise<T>;
  delete(id: string, organizationId: string): Promise<void>;
  
  count(organizationId: string, filters?: Record<string, any>): Promise<number>;
  exists(id: string, organizationId: string): Promise<boolean>;
}

export interface TransactionalRepository<T> extends Repository<T> {
  withTransaction<R>(operation: (repo: Repository<T>) => Promise<R>): Promise<R>;
}

export abstract class BaseRepositoryImpl<T> implements Repository<T> {
  constructor(
    protected tableName: string,
    protected db: any // Will be typed properly when we implement the database abstraction
  ) {}

  abstract findById(id: string, organizationId: string): Promise<T | null>;
  abstract findByUserId(userId: string, organizationId: string): Promise<T[]>;
  abstract findAll(organizationId: string, pagination?: PaginationContext): Promise<T[]>;
  abstract search(organizationId: string, context: SearchContext): Promise<T[]>;
  abstract create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<T>;
  abstract update(id: string, updates: Partial<T>, organizationId: string): Promise<T>;
  abstract delete(id: string, organizationId: string): Promise<void>;
  abstract count(organizationId: string, filters?: Record<string, any>): Promise<number>;
  abstract exists(id: string, organizationId: string): Promise<boolean>;

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