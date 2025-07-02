export interface ServiceContext {
  organizationId: string;
  userId?: string;
  timestamp: Date;
  requestId: string;
  metadata?: Record<string, any>;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

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