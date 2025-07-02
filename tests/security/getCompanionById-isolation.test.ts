import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCompanionById } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { companion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { eq } from 'drizzle-orm';

describe('getCompanionById - Multi-tenant Isolation', () => {
  let org1Id: string;
  let org2Id: string;
  let companion1Id: string;
  let companion2Id: string;
  const testUserId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    // Setup test data
    org1Id = generateUUID();
    org2Id = generateUUID();
    companion1Id = generateUUID();
    companion2Id = generateUUID();

    // Create test companions directly in database
    await db.insert(companion).values([
      {
        id: companion1Id,
        name: 'Test Companion 1',
        role: 'Assistant',
        responsibilities: ['Testing'],
        expertises: [{ area: 'Testing', topics: ['Unit Tests'] }],
        sources: [{ type: 'documentation', description: 'Test docs' }],
        rules: [{ type: 'security', description: 'Test security' }],
        contentPolicy: { allowed: ['testing'], disallowed: ['spam'] },
        organizationId: org1Id,
        userId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: companion2Id,
        name: 'Test Companion 2',
        role: 'Assistant',
        responsibilities: ['Testing'],
        expertises: [{ area: 'Testing', topics: ['Unit Tests'] }],
        sources: [{ type: 'documentation', description: 'Test docs' }],
        rules: [{ type: 'security', description: 'Test security' }],
        contentPolicy: { allowed: ['testing'], disallowed: ['spam'] },
        organizationId: org2Id,
        userId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(companion).where(eq(companion.id, companion1Id));
    await db.delete(companion).where(eq(companion.id, companion2Id));
  });

  it('should return companion when organizationId matches', async () => {
    const companion = await getCompanionById({ 
      id: companion1Id, 
      organizationId: org1Id 
    });

    expect(companion).toBeTruthy();
    expect(companion?.id).toBe(companion1Id);
    expect(companion?.organizationId).toBe(org1Id);
  });

  it('should return null when organizationId does not match', async () => {
    // Try to access companion1 (from org1) using org2 context
    const companion = await getCompanionById({ 
      id: companion1Id, 
      organizationId: org2Id 
    });

    expect(companion).toBeNull();
  });

  it('should return null when companion does not exist', async () => {
    const companion = await getCompanionById({ 
      id: '00000000-0000-0000-0000-999999999999', 
      organizationId: org1Id 
    });

    expect(companion).toBeNull();
  });

  it('should enforce isolation across different organizations', async () => {
    // Access companion1 from org1 - should work
    const companion1FromOrg1 = await getCompanionById({ 
      id: companion1Id, 
      organizationId: org1Id 
    });
    expect(companion1FromOrg1).toBeTruthy();

    // Access companion2 from org2 - should work  
    const companion2FromOrg2 = await getCompanionById({ 
      id: companion2Id, 
      organizationId: org2Id 
    });
    expect(companion2FromOrg2).toBeTruthy();

    // Cross-access should fail
    const companion1FromOrg2 = await getCompanionById({ 
      id: companion1Id, 
      organizationId: org2Id 
    });
    expect(companion1FromOrg2).toBeNull();

    const companion2FromOrg1 = await getCompanionById({ 
      id: companion2Id, 
      organizationId: org1Id 
    });
    expect(companion2FromOrg1).toBeNull();
  });
}); 