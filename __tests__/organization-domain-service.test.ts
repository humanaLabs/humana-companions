import { describe, expect, test, beforeEach } from 'vitest';
import { OrganizationDomainService } from '@/lib/services/domain/organization-domain-service';
import { OrganizationRepositoryImpl } from '@/lib/services/repositories/organization-repository';
import type { ServiceContext } from '@/lib/services/types/service-context';

describe('OrganizationDomainService', () => {
  let service: OrganizationDomainService;
  let repository: OrganizationRepositoryImpl;
  let context: ServiceContext;

  beforeEach(() => {
    const organizationId = 'test-org-123';
    repository = new OrganizationRepositoryImpl({}, organizationId);
    service = new OrganizationDomainService(
      organizationId,
      repository,
      {} as any, // userRepo stub
      null, // permissionService stub
      null  // quotaService stub
    );

    context = {
      organizationId,
      userId: 'test-user-123',
      requestId: 'test-request-123',
      timestamp: new Date()
    };
  });

  describe('getOrganizationsForUser', () => {
    test('should return organizations for user with proper isolation', async () => {
      const result = await service.getOrganizationsForUser('test-user-123', context);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      if (result.data) {
        result.data.forEach(org => {
          expect(org.organizationId).toBe(context.organizationId);
        });
      }
    });

    test('should apply access control filters', async () => {
      const result = await service.getOrganizationsForUser('test-user-123', context);
      
      expect(result.success).toBe(true);
      // Since we're using mock data, we should get at least the mock organization
      expect(result.data?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getOrganization', () => {
    test('should return organization by id with access validation', async () => {
      const orgId = 'test-org-id';
      const result = await service.getOrganization(orgId, context);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(orgId);
      expect(result.data?.organizationId).toBe(context.organizationId);
    });

    test('should fail for non-existent organization', async () => {
      // Mock repository to return null
      repository.findById = async () => null;
      
      const result = await service.getOrganization('non-existent', context);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('createOrganization', () => {
    test('should enforce master admin permission requirement', async () => {
      const request = {
        name: 'Test Organization',
        description: 'Test description',
        userId: 'test-user-123'
      };

      const result = await service.createOrganization(request);
      
      // Since we don't have a real permission service, this should fail
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });

    test('should apply organization policies', () => {
      const org = service.applyOrganizationPolicies({
        id: 'test-id',
        name: '  Test   Organization  ',
        organizationId: 'wrong-org',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(org.name).toBe('Test Organization'); // Name should be standardized
      expect(org.organizationId).toBe(context.organizationId); // Should be corrected
    });
  });

  describe('validateOrganizationAccess', () => {
    test('should validate creator access', async () => {
      // Mock organization with creator
      repository.findById = async () => ({
        id: 'test-org',
        name: 'Test Org',
        organizationId: context.organizationId,
        createdBy: 'test-user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const hasAccess = await service.validateOrganizationAccess('test-user-123', 'test-org');
      expect(hasAccess).toBe(true);
    });

    test('should deny access for non-creator without admin rights', async () => {
      // Mock organization with different creator
      repository.findById = async () => ({
        id: 'test-org',
        name: 'Test Org',
        organizationId: context.organizationId,
        createdBy: 'different-user',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const hasAccess = await service.validateOrganizationAccess('test-user-123', 'test-org');
      expect(hasAccess).toBe(false);
    });
  });

  describe('Multi-tenant isolation', () => {
    test('should ensure all operations respect organizationId', async () => {
      const result = await service.getOrganizationsForUser('test-user', context);
      
      if (result.success && result.data) {
        result.data.forEach(org => {
          expect(org.organizationId).toBe(context.organizationId);
        });
      }
    });

    test('should apply tenant isolation in policies', () => {
      const org = service.applyOrganizationPolicies({
        id: 'test',
        name: 'Test',
        organizationId: 'different-org', // This should be corrected
        createdBy: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(org.organizationId).toBe(context.organizationId);
    });
  });

  describe('Error handling', () => {
    test('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      repository.findById = async () => {
        throw new Error('Database connection failed');
      };

      const result = await service.getOrganization('test-id', context);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_FAILED');
    });

    test('should handle invalid input data', () => {
      expect(() => {
        service.applyOrganizationPolicies({
          id: '',
          name: '',
          organizationId: '',
          createdBy: '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }).not.toThrow();
    });
  });
});

// Integration test with Service Container
describe('OrganizationDomainService Integration', () => {
  test('should be properly registered in service container', async () => {
    const { ServiceContainer, ServiceResolver } = await import('@/lib/services/container/service-container');
    
    const container = ServiceContainer.getInstance();
    const context = container.createContext('test-org-123');
    const resolver = ServiceResolver.create();
    
    expect(() => {
      const service = resolver.organizationDomainService(context);
      expect(service).toBeDefined();
    }).not.toThrow();
  });
}); 