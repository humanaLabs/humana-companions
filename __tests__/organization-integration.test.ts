import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '../lib/services/container/service-container';
import { OrganizationDomainService } from '../lib/services/domain/organization-domain-service';

describe('Organization Integration Tests - YOLO Mode', () => {
  let container: ServiceContainer;
  const TEST_ORG_ID = '00000000-0000-0000-0000-000000000003';
  const TEST_USER_ID = 'b00e5284-aa20-4b6a-9248-b7546b16499a';

  beforeEach(async () => {
    container = ServiceContainer.getInstance();
    container.clearAll(); // Reset for each test
  });

  describe('🏗️ Service Layer Architecture', () => {
    it('Should register OrganizationDomainService correctly', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(OrganizationDomainService);
    });

    it('Should resolve OrganizationDomainService as singleton', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service1 = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      const service2 = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      expect(service1).toBe(service2); // Same instance
    });
  });

  describe('🔧 Organization CRUD Operations', () => {
    it('Should create organization with business rules', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const createRequest = {
        name: 'Test Organization YOLO',
        description: 'Organization created in YOLO mode',
        userId: TEST_USER_ID,
        tenantConfig: { theme: 'modern' },
        values: [{ name: 'Innovation', description: 'Innovation value' }],
        teams: [{ name: 'Engineering', description: 'Engineering team' }],
        positions: [{ name: 'Developer', description: 'Software Developer' }]
      };

      const result = await service.createOrganization(createRequest);
      
      console.log('🔍 Create result:', result);
      
      // Para organizações criadas pelo Master Admin, deve funcionar 
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe(createRequest.name);
        expect(result.data!.description).toBe(createRequest.description);
        expect(result.data!.createdBy).toBe(TEST_USER_ID);
      }
    });

    it('Should get organizations for user', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const result = await service.getOrganizationsForUser(TEST_USER_ID, context);
      
      console.log('🔍 Get orgs result:', result);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('Should validate organization access', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const hasAccess = await service.validateOrganizationAccess(TEST_USER_ID, TEST_ORG_ID);
      
      console.log('🔍 Access validation:', hasAccess);
      
      expect(typeof hasAccess).toBe('boolean');
    });
  });

  describe('🏢 Organization Structure Management', () => {
    it('Should add team to organization', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const team = {
        name: 'QA Team',
        description: 'Quality Assurance Team'
      };

      const result = await service.addTeam(TEST_ORG_ID, team, context);
      
      console.log('🔍 Add team result:', result);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe(team.name);
        expect(result.data!.organizationId).toBe(TEST_ORG_ID);
      }
    });

    it('Should add position to organization', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const position = {
        name: 'Senior Developer',
        description: 'Senior Software Developer position'
      };

      const result = await service.addPosition(TEST_ORG_ID, position, context);
      
      console.log('🔍 Add position result:', result);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe(position.name);
        expect(result.data!.organizationId).toBe(TEST_ORG_ID);
      }
    });

    it('Should add value to organization', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const value = {
        name: 'Transparency',
        description: 'We value transparency in all communications'
      };

      const result = await service.addValue(TEST_ORG_ID, value, context);
      
      console.log('🔍 Add value result:', result);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe(value.name);
        expect(result.data!.organizationId).toBe(TEST_ORG_ID);
      }
    });
  });

  describe('🔒 Security & Multi-Tenancy', () => {
    it('Should enforce organization isolation', async () => {
      const org1Context = container.createContext('org-1');
      const org2Context = container.createContext('org-2');
      
      const service1 = container.resolve<OrganizationDomainService>('OrganizationDomainService', org1Context);
      const service2 = container.resolve<OrganizationDomainService>('OrganizationDomainService', org2Context);
      
      // Should be different instances for different orgs
      expect(service1).not.toBe(service2);
    });

    it('Should check creation permissions', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const canCreate = await service.checkCreationPermissions(TEST_USER_ID);
      
      console.log('🔍 Creation permissions:', canCreate);
      
      expect(typeof canCreate).toBe('boolean');
    });

    it('Should apply organization policies', async () => {
      const context = container.createContext(TEST_ORG_ID);
      const service = container.resolve<OrganizationDomainService>('OrganizationDomainService', context);
      
      const orgData = {
        id: 'test-org-id',
        name: ' Test Organization ',
        description: 'Test organization',
        organizationId: TEST_ORG_ID,
        createdBy: TEST_USER_ID,
        tenantConfig: {},
        values: [],
        teams: [],
        positions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const processed = service.applyOrganizationPolicies(orgData);
      
      console.log('🔍 Processed org:', processed);
      
      expect(processed.name).toBe('Test Organization'); // Should trim whitespace
      expect(processed).toBeDefined();
    });
  });

  describe('📊 Health Check & Monitoring', () => {
    it('Should pass health check for organization services', async () => {
      const healthStatus = await container.healthCheck(TEST_ORG_ID);
      
      console.log('🔍 Health status:', healthStatus);
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.OrganizationDomainService).toBeDefined();
    });
  });
}); 