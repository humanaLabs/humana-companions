import { NextRequest } from 'next/server';
import { OperationResult } from '../types/service-context';
import { OperationResultHelper } from '../types/service-context';
import type { 
  CompanionDomainService, 
  CreateCompanionRequest, 
  Companion,
  CompanionFilters 
} from '../domain/companion-domain-service';

export interface CompanionApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class CompanionApiAdapter {
  constructor(private companionService: CompanionDomainService) {}

  async handleCreateRequest(request: NextRequest, userId: string): Promise<CompanionApiResponse> {
    try {
      const body = await request.json();
      
      // Validate and parse the complex schema from the frontend
      const createRequest: CreateCompanionRequest = {
        name: body.name,
        role: body.role,
        responsibilities: body.responsibilities || [],
        expertises: body.expertises || [],
        sources: body.sources || [],
        rules: body.rules || [],
        contentPolicy: body.contentPolicy || { allowed: [], disallowed: [] },
        skills: body.skills || [],
        fallbacks: body.fallbacks || {}
      };

      const result = await this.companionService.createCompanion(createRequest, userId);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Companion created successfully'
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to create companion'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleCreateRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async handleGetRequest(companionId: string): Promise<CompanionApiResponse> {
    try {
      const result = await this.companionService.getCompanion(companionId);

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to get companion'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleGetRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async handleListRequest(query?: URLSearchParams): Promise<CompanionApiResponse> {
    try {
      const filters: CompanionFilters = {};
      
      if (query) {
        if (query.get('status')) filters.status = query.get('status')!;
        if (query.get('isPublic')) filters.isPublic = query.get('isPublic') === 'true';
        if (query.get('userId')) filters.userId = query.get('userId')!;
      }

      const result = await this.companionService.listCompanions(filters);

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to list companions'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleListRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async handleUpdateRequest(companionId: string, request: NextRequest): Promise<CompanionApiResponse> {
    try {
      const body = await request.json();
      
      const result = await this.companionService.updateCompanion(companionId, body);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Companion updated successfully'
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to update companion'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleUpdateRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async handleDeleteRequest(companionId: string): Promise<CompanionApiResponse> {
    try {
      const result = await this.companionService.deleteCompanion(companionId);

      if (result.success) {
        return {
          success: true,
          message: 'Companion deleted successfully'
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to delete companion'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleDeleteRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async handleSearchRequest(query: string): Promise<CompanionApiResponse> {
    try {
      const result = await this.companionService.searchCompanions(query);

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: typeof result.error === 'object' ? result.error.message : result.error || 'Failed to search companions'
        };
      }
    } catch (error) {
      console.error('CompanionApiAdapter.handleSearchRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }
}

// Factory function for easy instantiation
export async function createCompanionApiAdapter(organizationId: string): Promise<CompanionApiAdapter> {
  const { ServiceContainer } = await import('../container/service-container');
  
  // Create service context with proper tenant isolation
  const context = ServiceContainer.getInstance().createContext(organizationId, `companion-api-${Date.now()}`);
  
  // Use ServiceContainer for proper dependency injection
  const companionService = ServiceContainer.getInstance().resolve<CompanionDomainService>('CompanionDomainService', context);
  
  return new CompanionApiAdapter(companionService);
} 