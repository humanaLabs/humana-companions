export interface ServiceContext {
  userId: string;
  organizationId: string;
  userType: 'user' | 'admin' | 'master';
  permissions: string[];
  isMasterAdmin: boolean;
  requestId?: string;
  timestamp?: Date;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface PaginatedResult<T> extends OperationResult<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export type TenantContext = {
  organizationId: string;
  userId: string;
};

export class OperationResultHelper {
  static success<T>(data: T): OperationResult<T> {
    return {
      success: true,
      data
    };
  }

  static failure<T>(code: string, message: string): OperationResult<T> {
    return {
      success: false,
      error: {
        code,
        message
      }
    };
  }
}

export interface PaginationContext {
  page: number;
  limit: number;
  offset: number;
  total?: number;
}

export interface SearchContext {
  query: string;
  filters?: Record<string, any>;
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  pagination?: PaginationContext;
} 