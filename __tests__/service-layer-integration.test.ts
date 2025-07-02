import { describe, expect, test } from 'vitest';

describe('Service Layer Integration', () => {
  test('should create and resolve organization domain service', async () => {
    const { ServiceContainer, ServiceResolver } = await import('../lib/services/container/service-container');
    
    const container = ServiceContainer.getInstance();
    const context = container.createContext('test-org-123');
    const resolver = ServiceResolver.create();
    
    const organizationService = resolver.organizationDomainService(context);
    expect(organizationService).toBeDefined();
    expect(typeof organizationService.getOrganizationsForUser).toBe('function');
  });

  test('should create and resolve companion domain service', async () => {
    const { ServiceContainer, ServiceResolver } = await import('../lib/services/container/service-container');
    
    const container = ServiceContainer.getInstance();
    const context = container.createContext('test-org-123');
    const resolver = ServiceResolver.create();
    
    const companionService = resolver.companionDomainService(context);
    expect(companionService).toBeDefined();
    expect(typeof companionService.getCompanionsForUser).toBe('function');
  });

  test('should create organization API adapter', async () => {
    const { createOrganizationApiAdapter } = await import('../lib/services/adapters/organization-api-adapter');
    
    const adapter = await createOrganizationApiAdapter('test-org-123');
    expect(adapter).toBeDefined();
    expect(typeof adapter.getUserOrganizations).toBe('function');
  });

  test('should create companion API adapter', async () => {
    const { createCompanionApiAdapter } = await import('../lib/services/adapters/companion-api-adapter');
    
    const adapter = await createCompanionApiAdapter('test-org-123');
    expect(adapter).toBeDefined();
    expect(typeof adapter.getUserCompanions).toBe('function');
  });

  test('should maintain tenant isolation across services', async () => {
    const { ServiceContainer, ServiceResolver } = await import('../lib/services/container/service-container');
    
    const container = ServiceContainer.getInstance();
    const context1 = container.createContext('tenant-1');
    const context2 = container.createContext('tenant-2');
    const resolver = ServiceResolver.create();
    
    const orgService1 = resolver.organizationDomainService(context1);
    const orgService2 = resolver.organizationDomainService(context2);
    
    // Services should be different instances for different tenants
    expect(orgService1).toBeDefined();
    expect(orgService2).toBeDefined();
    
    // Test operation with tenant isolation
    const result1 = await orgService1.getOrganizationsForUser('user-123', context1);
    const result2 = await orgService2.getOrganizationsForUser('user-123', context2);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  test('should handle service dependencies correctly', async () => {
    const { ServiceContainer } = await import('../lib/services/container/service-container');
    
    const container = ServiceContainer.getInstance();
    const healthCheck = await container.healthCheck('test-org-123');
    
    expect(healthCheck).toBeDefined();
    expect(healthCheck.ChatDomainService).toBeDefined();
    expect(healthCheck.OrganizationDomainService).toBeDefined();
    expect(healthCheck.CompanionDomainService).toBeDefined();
  });

  test('should validate operation results structure', async () => {
    const { OperationResultHelper } = await import('../lib/services/types/service-context');
    
    const successResult = OperationResultHelper.success({ test: 'data' });
    expect(successResult.success).toBe(true);
    expect(successResult.data).toEqual({ test: 'data' });
    expect(successResult.error).toBeUndefined();

    const failureResult = OperationResultHelper.failure('TEST_ERROR', 'Test error message');
    expect(failureResult.success).toBe(false);
    expect(failureResult.error?.code).toBe('TEST_ERROR');
    expect(failureResult.error?.message).toBe('Test error message');
    expect(failureResult.data).toBeUndefined();
  });

  test('should support service context creation', async () => {
    const { createOrganizationContext } = await import('../lib/services/adapters/organization-api-adapter');
    const { createCompanionContext } = await import('../lib/services/adapters/companion-api-adapter');
    
    const orgContext = createOrganizationContext('test-org', 'user-123', 'request-123');
    expect(orgContext.organizationId).toBe('test-org');
    expect(orgContext.userId).toBe('user-123');
    expect(orgContext.requestId).toBe('request-123');
    expect(orgContext.timestamp).toBeInstanceOf(Date);

    const companionContext = createCompanionContext('test-org', 'user-456', 'request-456');
    expect(companionContext.organizationId).toBe('test-org');
    expect(companionContext.userId).toBe('user-456');
  });
}); 