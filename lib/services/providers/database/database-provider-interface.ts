import { BaseProvider, type ProviderConfiguration, type HealthCheckResult, type ProviderMetrics } from '../base/base-provider';

// ========================================
// Core Database Types
// ========================================

/**
 * Database connection configuration
 */
export interface DatabaseConnection {
  /** Connection string/URL */
  url: string;
  /** Database type */
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  /** Connection pool settings */
  pool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
  /** SSL configuration */
  ssl?: {
    enabled: boolean;
    rejectUnauthorized: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
}

/**
 * Query result metadata
 */
export interface QueryResult<T = any> {
  /** Query results */
  rows: T[];
  /** Number of affected rows */
  rowCount: number;
  /** Query execution time in ms */
  executionTime: number;
  /** Fields metadata */
  fields?: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

/**
 * Transaction context
 */
export interface Transaction {
  /** Transaction ID */
  id: string;
  /** Transaction start time */
  startTime: Date;
  /** Is transaction active */
  isActive: boolean;
  /** Organization ID for multi-tenancy */
  organizationId: string;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  /** Total connections */
  totalConnections: number;
  /** Active connections */
  activeConnections: number;
  /** Idle connections */
  idleConnections: number;
  /** Total queries executed */
  totalQueries: number;
  /** Average query time in ms */
  avgQueryTime: number;
  /** Database size in bytes */
  databaseSize: number;
  /** Number of tables */
  tableCount: number;
  /** Cache hit ratio */
  cacheHitRatio: number;
}

/**
 * Migration information
 */
export interface Migration {
  /** Migration ID */
  id: string;
  /** Migration name */
  name: string;
  /** SQL statements */
  sql: string[];
  /** Applied timestamp */
  appliedAt?: Date;
  /** Organization ID (for tenant-specific migrations) */
  organizationId?: string;
}

/**
 * Schema information
 */
export interface SchemaInfo {
  /** Schema name */
  name: string;
  /** Tables in schema */
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      defaultValue?: any;
    }>;
    indexes: Array<{
      name: string;
      columns: string[];
      unique: boolean;
    }>;
  }>;
  /** Schema owner */
  owner?: string;
}

// ========================================
// Database Provider Interface
// ========================================

/**
 * Abstract base class for all database providers
 * Provides database operations with multi-tenant isolation
 */
export abstract class DatabaseProvider extends BaseProvider {
  constructor(
    organizationId: string,
    config: ProviderConfiguration
  ) {
    super(organizationId, config, 'database');
  }

  // ========================================
  // Abstract Methods (Provider Implementation)
  // ========================================

  /**
   * Execute a SQL query
   */
  abstract query<T = any>(
    sql: string,
    params?: any[],
    options?: {
      timeout?: number;
      maxRows?: number;
      transaction?: Transaction;
    }
  ): Promise<QueryResult<T>>;

  /**
   * Execute multiple queries in a transaction
   */
  abstract transaction<T = any>(
    queries: Array<{
      sql: string;
      params?: any[];
    }>,
    options?: {
      timeout?: number;
      isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    }
  ): Promise<QueryResult<T>[]>;

  /**
   * Begin a new transaction
   */
  abstract beginTransaction(
    options?: {
      isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
      timeout?: number;
    }
  ): Promise<Transaction>;

  /**
   * Commit a transaction
   */
  abstract commitTransaction(transaction: Transaction): Promise<boolean>;

  /**
   * Rollback a transaction
   */
  abstract rollbackTransaction(transaction: Transaction): Promise<boolean>;

  /**
   * Get database statistics
   */
  abstract getStats(): Promise<DatabaseStats>;

  /**
   * Check database connection health
   */
  abstract ping(): Promise<boolean>;

  /**
   * Get schema information
   */
  abstract getSchema(schemaName?: string): Promise<SchemaInfo>;

  /**
   * Execute raw SQL (for administrative operations)
   */
  abstract executeRaw(
    sql: string,
    options?: {
      timeout?: number;
      skipTenantCheck?: boolean;
    }
  ): Promise<any>;

  /**
   * Run database migrations
   */
  abstract runMigrations(
    migrations: Migration[],
    options?: {
      dryRun?: boolean;
      skipValidation?: boolean;
    }
  ): Promise<Migration[]>;

  /**
   * Get applied migrations
   */
  abstract getAppliedMigrations(): Promise<Migration[]>;

  /**
   * Create database backup
   */
  abstract createBackup(
    options?: {
      includeData?: boolean;
      compressionLevel?: number;
      excludeTables?: string[];
    }
  ): Promise<{
    backupId: string;
    size: number;
    createdAt: Date;
    location: string;
  }>;

  /**
   * Restore database from backup
   */
  abstract restoreBackup(
    backupId: string,
    options?: {
      dropExisting?: boolean;
      skipData?: boolean;
    }
  ): Promise<boolean>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Ensure organization ID is included in query for multi-tenancy
   */
  protected ensureOrganizationFilter(sql: string): string {
    // Basic implementation - should be overridden by specific providers
    if (sql.toLowerCase().includes('where')) {
      return sql.replace(
        /where/i,
        `WHERE organization_id = '${this.organizationId}' AND`
      );
    } else if (sql.toLowerCase().includes('from')) {
      return sql.replace(
        /from\s+(\w+)/i,
        `FROM $1 WHERE organization_id = '${this.organizationId}'`
      );
    }
    return sql;
  }

  /**
   * Sanitize SQL to prevent injection
   */
  protected sanitizeSQL(sql: string): string {
    // Basic sanitization - in production use a proper SQL parser
    return sql
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .replace(/;\s*$/g, '') // Remove trailing semicolons
      .trim();
  }

  /**
   * Validate organization access
   */
  protected validateOrganizationAccess(organizationId?: string): boolean {
    if (organizationId && organizationId !== this.organizationId) {
      throw new Error(`Access denied: Organization ${organizationId} not authorized`);
    }
    return true;
  }

  /**
   * Build parameterized query
   */
  protected buildParameterizedQuery(
    sql: string,
    params: Record<string, any>
  ): { sql: string; params: any[] } {
    const paramArray: any[] = [];
    let paramIndex = 1;
    
    const processedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
      if (paramName in params) {
        paramArray.push(params[paramName]);
        return `$${paramIndex++}`; // PostgreSQL style
      }
      return match;
    });

    return {
      sql: processedSql,
      params: paramArray
    };
  }

  /**
   * Calculate query timeout based on complexity
   */
  protected calculateQueryTimeout(sql: string, defaultTimeout = 30000): number {
    // Simple heuristic based on query complexity
    const complexity = (sql.match(/join/gi) || []).length +
                      (sql.match(/subquery|with/gi) || []).length * 2 +
                      (sql.match(/group by|order by/gi) || []).length;
    
    return Math.min(defaultTimeout + complexity * 5000, 300000); // Max 5 minutes
  }

  /**
   * Format query result for logging
   */
  protected formatQueryForLogging(sql: string, params?: any[]): string {
    let formatted = sql.substring(0, 200);
    if (params && params.length > 0) {
      formatted += ` [params: ${params.slice(0, 5).map(p => typeof p === 'string' ? `'${p}'` : p).join(', ')}${params.length > 5 ? '...' : ''}]`;
    }
    return formatted;
  }

  /**
   * Health check implementation for database providers
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const pingResult = await this.ping();
      
      if (!pingResult) {
        throw new Error('Database ping failed');
      }

      // Test simple query
      const testQuery = 'SELECT 1 as test_value';
      const queryResult = await this.query<{ test_value: number }>(testQuery);
      
      if (queryResult.rows.length === 0 || queryResult.rows[0].test_value !== 1) {
        throw new Error('Test query failed');
      }

      // Get basic stats
      const stats = await this.getStats();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operations: ['ping', 'query', 'stats'],
          activeConnections: stats.activeConnections,
          totalQueries: stats.totalQueries
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
// Database Provider Registry
// ========================================

/**
 * Registry for managing database providers by organization
 */
export class DatabaseProviderRegistry {
  private static instance: DatabaseProviderRegistry;
  private providers = new Map<string, DatabaseProvider>();

  static getInstance(): DatabaseProviderRegistry {
    if (!DatabaseProviderRegistry.instance) {
      DatabaseProviderRegistry.instance = new DatabaseProviderRegistry();
    }
    return DatabaseProviderRegistry.instance;
  }

  registerProvider(organizationId: string, provider: DatabaseProvider): void {
    const key = `${organizationId}:database`;
    this.providers.set(key, provider);
  }

  getProvider(organizationId: string): DatabaseProvider | undefined {
    const key = `${organizationId}:database`;
    return this.providers.get(key);
  }

  removeProvider(organizationId: string): void {
    const key = `${organizationId}:database`;
    this.providers.delete(key);
  }

  getRegisteredOrganizations(): string[] {
    const organizationIds = new Set<string>();
    for (const key of this.providers.keys()) {
      const [orgId] = key.split(':');
      organizationIds.add(orgId);
    }
    return Array.from(organizationIds);
  }

  clear(): void {
    this.providers.clear();
  }
} 