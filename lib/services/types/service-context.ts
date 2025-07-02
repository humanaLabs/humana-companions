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
  error?: string;
  context: ServiceContext;
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