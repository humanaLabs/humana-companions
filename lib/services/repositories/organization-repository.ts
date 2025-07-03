import { eq, desc, like, and, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organization as organizationTable } from '@/lib/db/schema';
import { 
  Organization, 
  OrganizationWithStructure, 
  Team, 
  Position, 
  Value,
  OrganizationRepository 
} from '../domain/organization-domain-service';

/**
 * Implementation of OrganizationRepository for PostgreSQL with Drizzle ORM
 */
export class OrganizationRepositoryImpl implements OrganizationRepository {
  constructor() {
    // No need for tenant isolation in constructor since it's handled per-method
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

  /**
   * Convert database row to domain Organization
   */
  private mapToDomain(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      organizationId: row.id, // Self-reference for compatibility
      createdBy: row.userId,
      tenantConfig: row.tenantConfig || {},
      values: Array.isArray(row.values) ? row.values : [],
      teams: Array.isArray(row.teams) ? row.teams : [],
      positions: Array.isArray(row.positions) ? row.positions : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  /**
   * Convert domain Organization to database insert object
   */
  private mapToInsert(organization: Organization, userId: string): any {
    return {
      id: organization.id,
      name: organization.name,
      description: organization.description || '',
      tenantConfig: organization.tenantConfig || {},
      values: organization.values || [],
      teams: organization.teams || [],
      positions: organization.positions || [],
      orgUsers: [], // Initialize empty array for orgUsers
      userId: userId, // Use provided userId
      createdAt: organization.createdAt || new Date(),
      updatedAt: organization.updatedAt || new Date()
    };
  }

  async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Organization> {
    try {
      const organization: Organization = {
        ...data,
        id: this.generateUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertData = this.mapToInsert(organization, userId || data.createdBy);
      
      console.log('🔍 Creating organization with data:', insertData);
      
      const [created] = await db.insert(organizationTable).values(insertData).returning();
      
      console.log('✅ Organization created successfully:', created.id);
      
      return this.mapToDomain(created);
    } catch (error) {
      console.error('❌ Error creating organization:', error);
      throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Organization | null> {
    try {
      console.log('🔍 Finding organization by ID:', id);
      
      const [result] = await db
        .select()
        .from(organizationTable)
        .where(eq(organizationTable.id, id))
        .limit(1);

      if (!result) {
        console.log('⚠️ Organization not found:', id);
        return null;
      }

      console.log('✅ Organization found:', result.id);
      return this.mapToDomain(result);
    } catch (error) {
      console.error('❌ Error finding organization by id:', error);
      return null;
    }
  }

  async findByUserId(userId: string, organizationId: string): Promise<Organization[]> {
    try {
      console.log('🔍 Finding organizations for user:', userId, 'in org:', organizationId);
      
      const results = await db
        .select()
        .from(organizationTable)
        .where(eq(organizationTable.userId, userId))
        .orderBy(desc(organizationTable.createdAt));

      console.log('✅ Found organizations for user:', results.length);
      return results.map(this.mapToDomain);
    } catch (error) {
      console.error('❌ Error finding organizations by user id:', error);
      return [];
    }
  }

  async findByMasterAdmin(userId: string): Promise<Organization[]> {
    try {
      console.log('🔍 Finding all organizations for master admin:', userId);
      
      // Master admin can see all organizations
      const results = await db
        .select()
        .from(organizationTable)
        .orderBy(desc(organizationTable.createdAt));

      console.log('✅ Found organizations for master admin:', results.length);
      return results.map(this.mapToDomain);
    } catch (error) {
      console.error('❌ Error finding organizations for master admin:', error);
      return [];
    }
  }

  async findWithStructure(orgId: string, organizationId: string): Promise<OrganizationWithStructure | null> {
    try {
      const org = await this.findById(orgId);
      if (!org) return null;

      return {
        ...org,
        teamsCount: org.teams?.length || 0,
        positionsCount: org.positions?.length || 0,
        valuesCount: org.values?.length || 0
      };
    } catch (error) {
      console.error('❌ Error finding organization with structure:', error);
      return null;
    }
  }

  async findMany(filters?: Record<string, any>, limit?: number): Promise<Organization[]> {
    try {
      console.log('🔍 Finding organizations with filters:', filters);
      
      let query = db.select().from(organizationTable);
      
      if (limit) {
        query = query.limit(limit) as any;
      }
      
      const results = await query.orderBy(desc(organizationTable.createdAt));
      
      console.log('✅ Found organizations:', results.length);
      return results.map(this.mapToDomain);
    } catch (error) {
      console.error('❌ Error finding many organizations:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    try {
      console.log('🔍 Updating organization:', id);
      
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const [updated] = await db
        .update(organizationTable)
        .set(updateData)
        .where(eq(organizationTable.id, id))
        .returning();

      if (!updated) {
        throw new Error('Organization not found');
      }

      console.log('✅ Organization updated successfully:', updated.id);
      return this.mapToDomain(updated);
    } catch (error) {
      console.error('❌ Error updating organization:', error);
      throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log('🔍 Deleting organization:', id);
      
      await db.delete(organizationTable).where(eq(organizationTable.id, id));
      
      console.log('✅ Organization deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting organization:', error);
      throw new Error(`Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(organizationTable);
      
      return result.count;
    } catch (error) {
      console.error('❌ Error counting organizations:', error);
      return 0;
    }
  }

  async addTeam(orgId: string, team: Omit<Team, 'id'>): Promise<Team> {
    try {
      console.log('🔍 Adding team to organization:', orgId);
      
      const org = await this.findById(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const newTeam: Team = {
        ...team,
        id: this.generateUUID()
      };

      const updatedTeams = [...(org.teams || []), newTeam];
      
      await this.update(orgId, { teams: updatedTeams });
      
      console.log('✅ Team added successfully:', newTeam.id);
      return newTeam;
    } catch (error) {
      console.error('❌ Error adding team:', error);
      throw new Error(`Failed to add team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addPosition(orgId: string, position: Omit<Position, 'id'>): Promise<Position> {
    try {
      console.log('🔍 Adding position to organization:', orgId);
      
      const org = await this.findById(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const newPosition: Position = {
        ...position,
        id: this.generateUUID()
      };

      const updatedPositions = [...(org.positions || []), newPosition];
      
      await this.update(orgId, { positions: updatedPositions });
      
      console.log('✅ Position added successfully:', newPosition.id);
      return newPosition;
    } catch (error) {
      console.error('❌ Error adding position:', error);
      throw new Error(`Failed to add position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addValue(orgId: string, value: Omit<Value, 'id'>): Promise<Value> {
    try {
      console.log('🔍 Adding value to organization:', orgId);
      
      const org = await this.findById(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const newValue: Value = {
        ...value,
        id: this.generateUUID()
      };

      const updatedValues = [...(org.values || []), newValue];
      
      await this.update(orgId, { values: updatedValues });
      
      console.log('✅ Value added successfully:', newValue.id);
      return newValue;
    } catch (error) {
      console.error('❌ Error adding value:', error);
      throw new Error(`Failed to add value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 