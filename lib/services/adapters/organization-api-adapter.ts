import type { ServiceContext, OperationResult } from '../types/service-context';
import { ServiceContainer, ServiceResolver } from '../container/service-container';
import type { 
  IOrganizationDomainService,
  Organization,
  CreateOrganizationRequest 
} from '../domain/organization-domain-service';

/**
 * API Adapter para Organizations - Bridge entre API routes e Domain Service
 */
export class OrganizationApiAdapter {
  constructor(
    private organizationService: IOrganizationDomainService,
    private context: ServiceContext
  ) {}

  async getUserOrganizations(userId: string): Promise<OperationResult<Organization[]>> {
    try {
      const contextWithUser = { ...this.context, userId };
      return await this.organizationService.getOrganizationsForUser(userId, contextWithUser);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADAPTER_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  async getOrganization(orgId: string, userId: string): Promise<OperationResult<Organization>> {
    try {
      const contextWithUser = { ...this.context, userId };
      return await this.organizationService.getOrganization(orgId, contextWithUser);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADAPTER_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  async createOrganization(request: CreateOrganizationRequest): Promise<OperationResult<Organization>> {
    try {
      return await this.organizationService.createOrganization(request);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADAPTER_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  async updateOrganization(
    orgId: string, 
    updates: Partial<Organization>, 
    userId: string
  ): Promise<OperationResult<Organization>> {
    try {
      const contextWithUser = { ...this.context, userId };
      return await this.organizationService.updateOrganization(orgId, updates, contextWithUser);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADAPTER_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  async deleteOrganization(orgId: string, userId: string): Promise<OperationResult<void>> {
    try {
      const contextWithUser = { ...this.context, userId };
      return await this.organizationService.deleteOrganization(orgId, contextWithUser);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADAPTER_ERROR',
          message: (error as Error).message
        }
      };
    }
  }
}

/**
 * Factory function para criar OrganizationApiAdapter
 */
export async function createOrganizationApiAdapter(
  organizationId: string,
  requestId?: string
): Promise<OrganizationApiAdapter> {
  const container = ServiceContainer.getInstance();
  const context = container.createContext(organizationId, requestId);
  
  // Resolve service with dependency injection - FIXED
  const resolver = ServiceResolver.create();
  const organizationService = resolver.organizationDomainService(context);
  
  return new OrganizationApiAdapter(organizationService, context);
}

/**
 * Helper para criar context com user info
 */
export function createOrganizationContext(
  organizationId: string,
  userId: string,
  requestId?: string,
  timestamp?: Date
): ServiceContext {
  return {
    organizationId,
    userId,
    userType: 'admin', // Default type for organization operations
    permissions: [],
    isMasterAdmin: false,
    requestId: requestId || crypto.randomUUID(),
    timestamp: timestamp || new Date()
  };
} 