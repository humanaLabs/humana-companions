import { OperationResult, OperationResultHelper, ServiceContext } from '../types/service-context';
import { TenantService } from '../base/tenant-service';
import { Repository } from '../repositories/base-repository';

/**
 * @description Types para CompanionDomainService
 */

// New Complex Schema Types  
export interface CompanionExpertise {
  area: string;
  topics: string[];
}

export interface CompanionSource {
  type: string;
  description: string;
}

export interface CompanionRule {
  type: 'tone' | 'restriction' | 'clarification_prompt';
  description: string;
}

export interface CompanionContentPolicy {
  allowed: string[];
  disallowed: string[];
}

export interface CompanionSkillData {
  origem: string;
  descricao: string;
}

export interface CompanionSkillFile {
  nome: string;
  descricao: string;
}

export interface CompanionSkill {
  name: string;
  description: string;
  tools?: string[];
  templates?: string[];
  dados?: CompanionSkillData[];
  arquivos?: CompanionSkillFile[];
  example?: string;
}

export interface CompanionFallbacks {
  ambiguous?: string;
  out_of_scope?: string;
  unknown?: string;
}

export interface CompanionUsage {
  totalInteractions: number;
  lastUsed: Date | null;
  averageRating: number;
  totalRatings: number;
}

export interface Companion {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  responsibilities: string[];
  expertises: CompanionExpertise[];
  sources: CompanionSource[];
  rules: CompanionRule[];
  contentPolicy: CompanionContentPolicy;
  skills: CompanionSkill[];
  fallbacks: CompanionFallbacks;
  status: 'active' | 'inactive' | 'training';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  usage: CompanionUsage;
}

export interface CreateCompanionRequest {
  name: string;
  role: string;
  responsibilities: string[];
  expertises?: CompanionExpertise[];
  sources?: CompanionSource[];
  rules?: CompanionRule[];
  contentPolicy?: CompanionContentPolicy;
  skills?: CompanionSkill[];
  fallbacks?: CompanionFallbacks;
}

export interface CompanionFilters {
  status?: string;
  isPublic?: boolean;
  userId?: string;
}

export interface CompanionAnalytics {
  totalInteractions: number;
  averageRating: number;
  popularTopics: string[];
  usageOverTime: Array<{ date: string; count: number }>;
}

export interface CompanionRepository {
  create(companion: Companion, userId: string): Promise<Companion>;
  findById(id: string): Promise<Companion | null>;
  update(id: string, data: Partial<Companion>): Promise<Companion>;
  delete(id: string): Promise<void>;
  findMany(filters?: Record<string, any>, limit?: number): Promise<Companion[]>;
  count(filters?: Record<string, any>): Promise<number>;
  findByOrganization(organizationId: string): Promise<Companion[]>;
  findPublic(limit?: number): Promise<Companion[]>;
  countByOrganization(organizationId: string): Promise<number>;
  search(query: string, organizationId: string): Promise<Companion[]>;
}

export interface QuotaService {
  checkQuota(organizationId: string, resource: string): Promise<boolean>;
  incrementUsage(organizationId: string, resource: string): Promise<void>;
}

export interface CompanionDomainService {
  createCompanion(request: CreateCompanionRequest, userId: string): Promise<OperationResult<Companion>>;
  getCompanion(id: string): Promise<OperationResult<Companion | null>>;
  updateCompanion(id: string, data: Partial<CreateCompanionRequest>): Promise<OperationResult<Companion>>;
  deleteCompanion(id: string): Promise<OperationResult<void>>;
  listCompanions(filters?: CompanionFilters): Promise<OperationResult<Companion[]>>;
  getCompanionsForUser(userId: string): Promise<OperationResult<Companion[]>>;
  searchCompanions(query: string): Promise<OperationResult<Companion[]>>;
  generateResponse(companionId: string, prompt: string): Promise<OperationResult<string>>;
  trainCompanion(companionId: string, data: string[]): Promise<OperationResult<void>>;
  getCompanionAnalytics(companionId: string): Promise<OperationResult<CompanionAnalytics>>;
}

export class CompanionDomainServiceImpl extends TenantService<Companion> implements CompanionDomainService {
  constructor(
    context: ServiceContext,
    private readonly companionRepo: CompanionRepository,
    private readonly quotaService: QuotaService
  ) {
    super(context);
  }

  /**
   * Generate valid UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async createCompanion(request: CreateCompanionRequest, userId: string): Promise<OperationResult<Companion>> {
    try {
      // Validate organization access
      if (!this.context.organizationId) {
        return OperationResultHelper.failure('INVALID_CONTEXT', 'Organization context required');
      }

      // Check quota limits
      const companionCount = await this.companionRepo.countByOrganization(this.context.organizationId);
      const maxCompanions = 100; // Default quota
      if (companionCount >= maxCompanions) {
        return OperationResultHelper.failure('QUOTA_EXCEEDED', 'Companion quota exceeded');
      }

      // Validate required fields
      if (!request.name?.trim()) {
        return OperationResultHelper.failure('VALIDATION_ERROR', 'Name is required');
      }

      if (!request.role?.trim()) {
        return OperationResultHelper.failure('VALIDATION_ERROR', 'Role is required');
      }

      if (!request.responsibilities || request.responsibilities.length === 0) {
        return OperationResultHelper.failure('VALIDATION_ERROR', 'At least one responsibility is required');
      }

      // Create companion entity
      const companion: Companion = {
        id: this.generateUUID(), // Generate valid UUID
        organizationId: this.context.organizationId,
        name: request.name.trim(),
        role: request.role.trim(),
        responsibilities: request.responsibilities,
        expertises: request.expertises || [],
        sources: request.sources || [],
        rules: request.rules || [],
        contentPolicy: request.contentPolicy || { allowed: [], disallowed: [] },
        skills: request.skills || [],
        fallbacks: request.fallbacks || {},
        status: 'active',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          totalInteractions: 0,
          lastUsed: null,
          averageRating: 0,
          totalRatings: 0
        }
      };

      // Save to repository with userId
      const savedCompanion = await this.companionRepo.create(companion, userId);

      return OperationResultHelper.success(savedCompanion);
    } catch (error) {
      console.error('Error creating companion:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to create companion'
      );
    }
  }

  async getCompanion(id: string): Promise<OperationResult<Companion | null>> {
    try {
      const companion = await this.companionRepo.findById(id);
      
      if (!companion) {
        return OperationResultHelper.success(null);
      }

      // Verify tenant isolation
      if (companion.organizationId !== this.context.organizationId) {
        return OperationResultHelper.failure('ACCESS_DENIED', 'Access denied to companion');
      }

      return OperationResultHelper.success(companion);
    } catch (error) {
      console.error('Error getting companion:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to get companion'
      );
    }
  }

  async updateCompanion(id: string, data: Partial<CreateCompanionRequest>): Promise<OperationResult<Companion>> {
    try {
      // Get existing companion
      const existingResult = await this.getCompanion(id);
      if (!existingResult.success || !existingResult.data) {
        return OperationResultHelper.failure('NOT_FOUND', 'Companion not found');
      }

      const existing = existingResult.data;

      // Create update object
      const updateData: Partial<Companion> = {
        ...data,
        updatedAt: new Date()
      };

      const updated = await this.companionRepo.update(id, updateData);
      return OperationResultHelper.success(updated);
    } catch (error) {
      console.error('Error updating companion:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to update companion'
      );
    }
  }

  async deleteCompanion(id: string): Promise<OperationResult<void>> {
    try {
      // Verify access
      const companionResult = await this.getCompanion(id);
      if (!companionResult.success || !companionResult.data) {
        return OperationResultHelper.failure('NOT_FOUND', 'Companion not found');
      }

      await this.companionRepo.delete(id);
      return OperationResultHelper.success(undefined);
    } catch (error) {
      console.error('Error deleting companion:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to delete companion'
      );
    }
  }

  async listCompanions(filters?: CompanionFilters): Promise<OperationResult<Companion[]>> {
    try {
      const companions = await this.companionRepo.findByOrganization(this.context.organizationId);
      
      // Apply filters if provided
      let filtered = companions;
      if (filters) {
        if (filters.status) {
          filtered = filtered.filter(c => c.status === filters.status);
        }
        if (filters.isPublic !== undefined) {
          filtered = filtered.filter(c => c.isPublic === filters.isPublic);
        }
      }

      return OperationResultHelper.success(filtered);
    } catch (error) {
      console.error('Error listing companions:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to list companions'
      );
    }
  }

  async getCompanionsForUser(userId: string): Promise<OperationResult<Companion[]>> {
    try {
      // Get all companions for organization (tenant isolation enforced)
      const companions = await this.companionRepo.findByOrganization(this.context.organizationId);
      
      // For now, return all companions for the user in their organization
      // In the future, this could be filtered by user permissions or assignments
      return OperationResultHelper.success(companions);
    } catch (error) {
      console.error('Error getting companions for user:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to get companions for user'
      );
    }
  }

  async searchCompanions(query: string): Promise<OperationResult<Companion[]>> {
    try {
      const companions = await this.companionRepo.search(query, this.context.organizationId);
      return OperationResultHelper.success(companions);
    } catch (error) {
      console.error('Error searching companions:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to search companions'
      );
    }
  }

  async generateResponse(companionId: string, prompt: string): Promise<OperationResult<string>> {
    try {
      // For now, return a mock response
      // In real implementation, this would use LLM providers
      const companion = await this.getCompanion(companionId);
      if (!companion.success || !companion.data) {
        return OperationResultHelper.failure('NOT_FOUND', 'Companion not found');
      }

      const mockResponse = `Response from ${companion.data.name}: I understand your request about "${prompt}". As a ${companion.data.role}, I would suggest...`;
      
      return OperationResultHelper.success(mockResponse);
    } catch (error) {
      console.error('Error generating response:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to generate response'
      );
    }
  }

  async trainCompanion(companionId: string, data: string[]): Promise<OperationResult<void>> {
    try {
      // For now, return success
      // In real implementation, this would train the companion
      const companion = await this.getCompanion(companionId);
      if (!companion.success || !companion.data) {
        return OperationResultHelper.failure('NOT_FOUND', 'Companion not found');
      }

      return OperationResultHelper.success(undefined);
    } catch (error) {
      console.error('Error training companion:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to train companion'
      );
    }
  }

  async getCompanionAnalytics(companionId: string): Promise<OperationResult<CompanionAnalytics>> {
    try {
      const companion = await this.getCompanion(companionId);
      if (!companion.success || !companion.data) {
        return OperationResultHelper.failure('NOT_FOUND', 'Companion not found');
      }

      // Mock analytics data
      const analytics: CompanionAnalytics = {
        totalInteractions: companion.data.usage.totalInteractions,
        averageRating: companion.data.usage.averageRating,
        popularTopics: ['AI', 'Strategy', 'Analysis'],
        usageOverTime: [
          { date: '2025-01-01', count: 10 },
          { date: '2025-01-02', count: 15 }
        ]
      };

      return OperationResultHelper.success(analytics);
    } catch (error) {
      console.error('Error getting companion analytics:', error);
      return OperationResultHelper.failure(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to get companion analytics'
      );
    }
  }
}