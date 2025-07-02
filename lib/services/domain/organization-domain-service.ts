import type { ServiceContext, OperationResult } from '../types/service-context';
import { OperationResultHelper } from '../types/service-context';
import { TenantService } from '../base/tenant-service';
import type { Repository } from '../repositories/base-repository';

// Types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  tenantConfig?: Record<string, any>;
  values?: Value[];
  teams?: Team[];
  positions?: Position[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  userId: string;
  tenantConfig?: Record<string, any>;
  values?: Omit<Value, 'id' | 'organizationId'>[];
  teams?: Omit<Team, 'id' | 'organizationId'>[];
  positions?: Omit<Position, 'id' | 'organizationId'>[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  organizationId: string;
}

export interface Value {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

export interface OrganizationWithStructure extends Organization {
  teamsCount: number;
  positionsCount: number;
  valuesCount: number;
}

// Repository Interface
export interface OrganizationRepository extends Repository<Organization> {
  findByUserId(userId: string, organizationId: string): Promise<Organization[]>;
  findByMasterAdmin(userId: string): Promise<Organization[]>;
  findWithStructure(orgId: string, organizationId: string): Promise<OrganizationWithStructure | null>;
  addTeam(orgId: string, team: Omit<Team, 'id'>): Promise<Team>;
  addPosition(orgId: string, position: Omit<Position, 'id'>): Promise<Position>;
  addValue(orgId: string, value: Omit<Value, 'id'>): Promise<Value>;
}

// Service Interface
export interface IOrganizationDomainService {
  // Core operations
  createOrganization(request: CreateOrganizationRequest): Promise<OperationResult<Organization>>;
  getOrganization(orgId: string, context: ServiceContext): Promise<OperationResult<Organization>>;
  updateOrganization(orgId: string, updates: Partial<Organization>, context: ServiceContext): Promise<OperationResult<Organization>>;
  deleteOrganization(orgId: string, context: ServiceContext): Promise<OperationResult<void>>;
  
  // User-specific operations
  getOrganizationsForUser(userId: string, context: ServiceContext): Promise<OperationResult<Organization[]>>;
  
  // Business rules
  validateOrganizationAccess(userId: string, orgId: string): Promise<boolean>;
  applyOrganizationPolicies(org: Organization): Organization;
  checkCreationPermissions(userId: string): Promise<boolean>;
  
  // Structure management
  addTeam(orgId: string, team: Omit<Team, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Team>>;
  addPosition(orgId: string, position: Omit<Position, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Position>>;
  addValue(orgId: string, value: Omit<Value, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Value>>;
}

// Service Implementation
export class OrganizationDomainService extends TenantService<Organization> implements IOrganizationDomainService {
  constructor(
    organizationId: string,
    private orgRepo: OrganizationRepository,
    private userRepo: Repository<any> = {} as Repository<any>,
    private permissionService: any = null,
    private quotaService: any = null
  ) {
    super(organizationId, orgRepo);
  }

  async createOrganization(request: CreateOrganizationRequest): Promise<OperationResult<Organization>> {
    return this.withTransaction(async () => {
      try {
        // 1. Check permissions (only master admin)
        const canCreate = await this.checkCreationPermissions(request.userId);
        if (!canCreate) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'Only master admins can create organizations');
        }

        // 2. Validate business rules
        const organization = this.applyOrganizationPolicies({
          id: crypto.randomUUID(),
          name: request.name,
          description: request.description,
          organizationId: this.organizationId,
          createdBy: request.userId,
          tenantConfig: request.tenantConfig,
          values: request.values as Value[],
          teams: request.teams as Team[],
          positions: request.positions as Position[],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // 3. Check quotas (if applicable)
        if (this.quotaService) {
          await this.quotaService.checkUserQuota(request.userId, 'organizations');
        }

        // 4. Create organization
        const created = await this.orgRepo.create(organization);

        // 5. Update quota usage
        if (this.quotaService) {
          await this.quotaService.incrementUsage(request.userId, 'organizations', 1);
        }

        return OperationResultHelper.success(created);
      } catch (error) {
        return OperationResultHelper.failure('CREATION_FAILED', (error as Error).message);
      }
    });
  }

  async getOrganization(orgId: string, context: ServiceContext): Promise<OperationResult<Organization>> {
    try {
      const organization = await this.orgRepo.findById(orgId);
      if (!organization) {
        return OperationResultHelper.failure('NOT_FOUND', 'Organization not found');
      }

      // Check access
      const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
      if (!hasAccess) {
        return OperationResultHelper.failure('PERMISSION_DENIED', 'No access to organization');
      }

      return OperationResultHelper.success(organization);
    } catch (error) {
      return OperationResultHelper.failure('FETCH_FAILED', (error as Error).message);
    }
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>, context: ServiceContext): Promise<OperationResult<Organization>> {
    return this.withTransaction(async () => {
      try {
        // Check access
        const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
        if (!hasAccess) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'No access to organization');
        }

        // Apply policies to updates
        const sanitizedUpdates = this.applyOrganizationPolicies(updates as Organization);
        
        const updated = await this.orgRepo.update(orgId, sanitizedUpdates);
        return OperationResultHelper.success(updated);
      } catch (error) {
        return OperationResultHelper.failure('UPDATE_FAILED', (error as Error).message);
      }
    });
  }

  async deleteOrganization(orgId: string, context: ServiceContext): Promise<OperationResult<void>> {
    return this.withTransaction(async () => {
      try {
        // Check permissions (only creator or master admin)
        const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
        if (!hasAccess) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'No permission to delete organization');
        }

        await this.orgRepo.delete(orgId);
        return OperationResultHelper.success(undefined as void);
      } catch (error) {
        return OperationResultHelper.failure('DELETE_FAILED', (error as Error).message);
      }
    });
  }

  async getOrganizationsForUser(userId: string, context: ServiceContext): Promise<OperationResult<Organization[]>> {
    try {
      // Multi-tenant isolation: user can only see orgs from their tenant
      const organizations = await this.orgRepo.findByUserId(userId, this.organizationId);
      
      // Apply access control
      const accessibleOrgs = await Promise.all(
        organizations.map(async (org) => {
          const hasAccess = await this.validateOrganizationAccess(userId, org.id);
          return hasAccess ? org : null;
        })
      );

      return OperationResultHelper.success(accessibleOrgs.filter(Boolean) as Organization[]);
    } catch (error) {
      return OperationResultHelper.failure('FETCH_FAILED', (error as Error).message);
    }
  }

  async addTeam(orgId: string, team: Omit<Team, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Team>> {
    return this.withTransaction(async () => {
      try {
        // Check access
        const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
        if (!hasAccess) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'No access to organization');
        }

        const teamWithIds = {
          ...team,
          id: crypto.randomUUID(),
          organizationId: this.organizationId
        };

        const created = await this.orgRepo.addTeam(orgId, teamWithIds);
        return OperationResultHelper.success(created);
      } catch (error) {
        return OperationResultHelper.failure('TEAM_CREATION_FAILED', (error as Error).message);
      }
    });
  }

  async addPosition(orgId: string, position: Omit<Position, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Position>> {
    return this.withTransaction(async () => {
      try {
        // Check access
        const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
        if (!hasAccess) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'No access to organization');
        }

        const positionWithIds = {
          ...position,
          id: crypto.randomUUID(),
          organizationId: this.organizationId
        };

        const created = await this.orgRepo.addPosition(orgId, positionWithIds);
        return OperationResultHelper.success(created);
      } catch (error) {
        return OperationResultHelper.failure('POSITION_CREATION_FAILED', (error as Error).message);
      }
    });
  }

  async addValue(orgId: string, value: Omit<Value, 'id' | 'organizationId'>, context: ServiceContext): Promise<OperationResult<Value>> {
    return this.withTransaction(async () => {
      try {
        // Check access
        const hasAccess = await this.validateOrganizationAccess(context.userId || '', orgId);
        if (!hasAccess) {
          return OperationResultHelper.failure('PERMISSION_DENIED', 'No access to organization');
        }

        const valueWithIds = {
          ...value,
          id: crypto.randomUUID(),
          organizationId: this.organizationId
        };

        const created = await this.orgRepo.addValue(orgId, valueWithIds);
        return OperationResultHelper.success(created);
      } catch (error) {
        return OperationResultHelper.failure('VALUE_CREATION_FAILED', (error as Error).message);
      }
    });
  }

  async validateOrganizationAccess(userId: string, orgId: string): Promise<boolean> {
    try {
      const organization = await this.orgRepo.findById(orgId);
      if (!organization) return false;

      // User is creator
      if (organization.createdBy === userId) return true;

      // Check if user is master admin
      if (this.permissionService) {
        return await this.permissionService.checkPermission(userId, 'organizations:read');
      }

      return false;
    } catch {
      return false;
    }
  }

  applyOrganizationPolicies(org: Organization): Organization {
    return {
      ...org,
      // Ensure tenant isolation
      organizationId: this.organizationId,
      // Apply naming conventions
      name: this.standardizeName(org.name),
      // Validate structure
      teams: this.validateTeams(org.teams || []),
      positions: this.validatePositions(org.positions || []),
      values: this.validateValues(org.values || [])
    };
  }

  async checkCreationPermissions(userId: string): Promise<boolean> {
    try {
      // Business rule: Only master admins can create organizations
      const user = await this.userRepo.findById(userId);
      return user?.isMasterAdmin || false;
    } catch {
      return false;
    }
  }

  private standardizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private validateTeams(teams: Team[]): Team[] {
    return teams.map(team => ({
      ...team,
      name: this.standardizeName(team.name)
    }));
  }

  private validatePositions(positions: Position[]): Position[] {
    return positions.map(position => ({
      ...position,
      name: this.standardizeName(position.name)
    }));
  }

  private validateValues(values: Value[]): Value[] {
    return values.map(value => ({
      ...value,
      name: this.standardizeName(value.name)
    }));
  }
} 