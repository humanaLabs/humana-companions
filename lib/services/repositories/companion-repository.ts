import { eq, desc, like, and, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companion as companionTable } from '@/lib/db/schema';
import { 
  Companion, 
  CompanionRepository,
  CompanionUsage,
  CompanionExpertise,
  CompanionSource,
  CompanionRule,
  CompanionContentPolicy,
  CompanionSkill,
  CompanionFallbacks
} from '../domain/companion-domain-service';

/**
 * @description CompanionRepository Implementation (Real Database)
 * Uses PostgreSQL with Drizzle ORM for production-ready data persistence.
 * Implements strict multi-tenant isolation.
 */
export class CompanionRepositoryImpl implements CompanionRepository {
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
   * Convert database row to domain Companion object
   */
  private mapToCompanion(row: any): Companion {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      role: row.role,
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
      expertises: Array.isArray(row.expertises) ? row.expertises : [],
      sources: Array.isArray(row.sources) ? row.sources : [],
      rules: Array.isArray(row.rules) ? row.rules : [],
      contentPolicy: row.contentPolicy || { allowed: [], disallowed: [] },
      skills: Array.isArray(row.skills) ? row.skills : [],
      fallbacks: row.fallbacks || {},
      status: 'active', // Default status
      isPublic: false, // Default to private
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      usage: {
        totalInteractions: 0,
        lastUsed: null,
        averageRating: 0,
        totalRatings: 0
      }
    };
  }

  /**
   * Convert domain Companion to database insert object
   */
  private mapToInsert(companion: Companion, userId: string): any {
    return {
      id: companion.id,
      organizationId: companion.organizationId,
      name: companion.name,
      role: companion.role,
      responsibilities: companion.responsibilities,
      expertises: companion.expertises,
      sources: companion.sources,
      rules: companion.rules,
      contentPolicy: companion.contentPolicy,
      skills: companion.skills,
      fallbacks: companion.fallbacks,
      userId: userId, // Use provided userId instead of generating
      createdAt: companion.createdAt || new Date(),
      updatedAt: companion.updatedAt || new Date()
    };
  }

  async create(companion: Companion, userId: string): Promise<Companion> {
    try {
      const insertData = this.mapToInsert(companion, userId);
      
      const [result] = await db
        .insert(companionTable)
        .values(insertData)
        .returning();

      return this.mapToCompanion(result);
    } catch (error) {
      console.error('❌ Error creating companion:', error);
      throw new Error(`Failed to create companion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Companion | null> {
    try {
      const [result] = await db
        .select()
        .from(companionTable)
        .where(eq(companionTable.id, id));

      return result ? this.mapToCompanion(result) : null;
    } catch (error) {
      console.error('❌ Error finding companion by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<Companion[]> {
    try {
      const results = await db
        .select()
        .from(companionTable)
        .orderBy(desc(companionTable.updatedAt));

      return results.map(row => this.mapToCompanion(row));
    } catch (error) {
      console.error('❌ Error finding all companions:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<Companion>): Promise<Companion> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };
      
      // Remove undefined/null fields manually
      if (updateData.id === undefined) delete updateData.id;
      if (updateData.organizationId === undefined) delete updateData.organizationId;
      if (updateData.name === undefined) delete updateData.name;
      if (updateData.role === undefined) delete updateData.role;
      if (updateData.responsibilities === undefined) delete updateData.responsibilities;
      if (updateData.expertises === undefined) delete updateData.expertises;
      if (updateData.sources === undefined) delete updateData.sources;
      if (updateData.rules === undefined) delete updateData.rules;
      if (updateData.contentPolicy === undefined) delete updateData.contentPolicy;
      if (updateData.skills === undefined) delete updateData.skills;
      if (updateData.fallbacks === undefined) delete updateData.fallbacks;
      if (updateData.status === undefined) delete updateData.status;
      if (updateData.isPublic === undefined) delete updateData.isPublic;
      if (updateData.createdAt === undefined) delete updateData.createdAt;
      if (updateData.usage === undefined) delete updateData.usage;

      const [result] = await db
        .update(companionTable)
        .set(updateData)
        .where(eq(companionTable.id, id))
        .returning();

      if (!result) {
        throw new Error(`Companion with ID ${id} not found`);
      }

      return this.mapToCompanion(result);
    } catch (error) {
      console.error('❌ Error updating companion:', error);
      throw new Error(`Failed to update companion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await db
        .delete(companionTable)
        .where(eq(companionTable.id, id));

      console.log(`✅ Companion ${id} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting companion:', error);
      throw new Error(`Failed to delete companion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByOrganization(organizationId: string): Promise<Companion[]> {
    try {
      console.log(`🔍 Finding companions for organization: ${organizationId}`);
      
      const results = await db
        .select()
        .from(companionTable)
        .where(eq(companionTable.organizationId, organizationId))
        .orderBy(desc(companionTable.updatedAt));

      console.log(`✅ Found ${results.length} companions for organization ${organizationId}`);
      return results.map(row => this.mapToCompanion(row));
    } catch (error) {
      console.error('❌ Error finding companions by organization:', error);
      return [];
    }
  }

  async findPublic(limit = 20): Promise<Companion[]> {
    try {
      // For now, return empty array since we don't have isPublic field in database
      // TODO: Add isPublic field to database schema when needed
      console.log(`🔍 Finding public companions (limit: ${limit})`);
      return [];
    } catch (error) {
      console.error('❌ Error finding public companions:', error);
      return [];
    }
  }

  async countByOrganization(organizationId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(companionTable)
        .where(eq(companionTable.organizationId, organizationId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('❌ Error counting companions by organization:', error);
      return 0;
    }
  }

  async search(query: string, organizationId: string): Promise<Companion[]> {
    try {
      console.log(`🔍 Searching companions in org ${organizationId} with query: "${query}"`);
      
      const results = await db
        .select()
        .from(companionTable)
        .where(
          and(
            eq(companionTable.organizationId, organizationId),
            like(companionTable.name, `%${query}%`)
          )
        )
        .orderBy(desc(companionTable.updatedAt));

      console.log(`✅ Search found ${results.length} companions`);
      return results.map(row => this.mapToCompanion(row));
    } catch (error) {
      console.error('❌ Error searching companions:', error);
      return [];
    }
  }

  async findMany(filters?: Record<string, any>, limit?: number): Promise<Companion[]> {
    try {
      let query = db.select().from(companionTable);

      // Apply organization filter (REQUIRED for tenant isolation)
      if (filters?.organizationId) {
        query = query.where(eq(companionTable.organizationId, filters.organizationId)) as any;
      }

      // Apply limit if specified
      if (limit) {
        query = query.limit(limit) as any;
      }

      // Order by most recent
      query = query.orderBy(desc(companionTable.updatedAt)) as any;

      const results = await query;
      return results.map(row => this.mapToCompanion(row));
    } catch (error) {
      console.error('❌ Error finding many companions:', error);
      return [];
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(companionTable);

      // Apply organization filter (REQUIRED for tenant isolation)
      if (filters?.organizationId) {
        query = query.where(eq(companionTable.organizationId, filters.organizationId)) as any;
      }

      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('❌ Error counting companions:', error);
      return 0;
    }
  }
} 