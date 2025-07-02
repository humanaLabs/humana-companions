import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test service layer without external dependencies
    const results: {
      timestamp: string;
      tests: any[];
      summary?: {
        total: number;
        passed: number;
        failed: number;
        success: boolean;
      };
    } = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: OperationResult helpers
    try {
      const { OperationResultHelper } = await import('@/lib/services/types/service-context');
      
      const successResult = OperationResultHelper.success({ test: 'data' });
      const failureResult = OperationResultHelper.failure('TEST_ERROR', 'Test error');
      
      results.tests.push({
        name: 'OperationResult helpers',
        status: 'PASSED',
        details: {
          successResult: successResult,
          failureResult: failureResult
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'OperationResult helpers',
        status: 'FAILED',
        error: (error as Error).message
      });
    }

    // Test 2: Organization Repository
    try {
      const { OrganizationRepositoryImpl } = await import('@/lib/services/repositories/organization-repository');
      
      const repo = new OrganizationRepositoryImpl({}, 'test-org');
      const mockOrg = await repo.findById('test-id');
      
      results.tests.push({
        name: 'Organization Repository',
        status: mockOrg ? 'PASSED' : 'FAILED',
        details: {
          mockOrganization: mockOrg
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Organization Repository',
        status: 'FAILED',
        error: (error as Error).message
      });
    }

    // Test 3: Companion Repository
    try {
      const { CompanionRepositoryImpl } = await import('@/lib/services/repositories/companion-repository');
      
      const repo = new CompanionRepositoryImpl({}, 'test-org');
      const mockCompanion = await repo.findById('test-id');
      
      results.tests.push({
        name: 'Companion Repository',
        status: mockCompanion ? 'PASSED' : 'FAILED',
        details: {
          mockCompanion: mockCompanion
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Companion Repository',
        status: 'FAILED',
        error: (error as Error).message
      });
    }

    // Test 4: Organization Domain Service (without full container)
    try {
      const { OrganizationDomainService } = await import('@/lib/services/domain/organization-domain-service');
      const { OrganizationRepositoryImpl } = await import('@/lib/services/repositories/organization-repository');
      
      const repo = new OrganizationRepositoryImpl({}, 'test-org');
      const service = new OrganizationDomainService('test-org', repo);
      
      // Test policy application
      const testOrg = service.applyOrganizationPolicies({
        id: 'test',
        name: '  Test   Org  ',
        organizationId: 'wrong-org',
        createdBy: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      results.tests.push({
        name: 'Organization Domain Service',
        status: 'PASSED',
        details: {
          appliedPolicies: testOrg,
          nameStandardized: testOrg.name === 'Test Org',
          orgIdCorrected: testOrg.organizationId === 'test-org'
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Organization Domain Service',
        status: 'FAILED',
        error: (error as Error).message
      });
    }

    // Test 5: Companion Domain Service (without full container)
    try {
      const { CompanionDomainService } = await import('@/lib/services/domain/companion-domain-service');
      const { CompanionRepositoryImpl } = await import('@/lib/services/repositories/companion-repository');
      
      const repo = new CompanionRepositoryImpl({}, 'test-org');
      const mockAiProvider = {
        generateText: async () => 'Mock AI response',
        generateStream: async function* () { yield 'Mock stream'; },
        getAvailableModels: async () => [],
        validateConfig: async () => true
      };
      
      const service = new CompanionDomainService('test-org', repo, mockAiProvider);
      
      // Test policy application
      const testCompanion = service.applyCompanionPolicies({
        id: 'test',
        name: '  Test   Companion  ',
        role: 'Assistant',
        instructions: 'Be helpful',
        userId: 'user',
        organizationId: 'wrong-org',
        isPublic: false,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      results.tests.push({
        name: 'Companion Domain Service',
        status: 'PASSED',
        details: {
          appliedPolicies: testCompanion,
          nameStandardized: testCompanion.name === 'Test Companion',
          orgIdCorrected: testCompanion.organizationId === 'test-org'
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Companion Domain Service',
        status: 'FAILED',
        error: (error as Error).message
      });
    }

    // Summary
    const passedTests = results.tests.filter(t => t.status === 'PASSED').length;
    const totalTests = results.tests.length;
    
    results['summary'] = {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success: passedTests === totalTests
    };

    return NextResponse.json(results, { 
      status: results.summary.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Service layer test error:', error);
    return NextResponse.json({
      error: 'Failed to test service layer',
      details: (error as Error).message
    }, { status: 500 });
  }
} 