// Simple test for middleware without external test framework
import { NextRequest } from 'next/server';

// Mock next-auth/jwt
const mockGetToken = async (options: any) => {
  if (process.env.TEST_SCENARIO === 'VALID') {
    return {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-456',
      type: 'regular',
    };
  }
  if (process.env.TEST_SCENARIO === 'NO_SESSION') {
    return null;
  }
  if (process.env.TEST_SCENARIO === 'NO_ORG') {
    return {
      id: 'user-123',
      email: 'test@example.com',
      // organizationId missing
    };
  }
  if (process.env.TEST_SCENARIO === 'INVALID_ORG') {
    return {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'invalid-org-format',
    };
  }
  return null;
};

// Replace the import
const originalGetToken = require('next-auth/jwt').getToken;
require('next-auth/jwt').getToken = mockGetToken;

async function runTests() {
  console.log('🧪 Starting Simple Middleware Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Import the middleware after mocking
  const { tenantMiddleware, extractOrganizationFromPath, validateOrganizationAccess } = require('../middleware/tenant');
  
  // Test 1: Valid session
  try {
    console.log('Test 1: Valid Session');
    process.env.TEST_SCENARIO = 'VALID';
    
    const mockRequest = {
      nextUrl: { pathname: '/api/chat' },
      url: 'http://localhost:3000/api/chat',
    } as NextRequest;
    
    const startTime = Date.now();
    const response = await tenantMiddleware(mockRequest);
    const duration = Date.now() - startTime;
    
    // Check if organizationId was injected
    const orgId = response.headers.get('x-organization-id');
    const userId = response.headers.get('x-user-id');
    
    if (orgId === 'org-456' && userId === 'user-123' && duration < 50) {
      console.log('✅ PASSED - Valid session with context injection');
      console.log(`   Performance: ${duration}ms (target: <50ms)`);
      passed++;
    } else {
      console.log('❌ FAILED - Valid session test');
      console.log(`   Expected orgId: org-456, got: ${orgId}`);
      console.log(`   Expected userId: user-123, got: ${userId}`);
      console.log(`   Performance: ${duration}ms`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Valid session test threw error:', error.message);
    failed++;
  }
  
  // Test 2: Missing session
  try {
    console.log('\nTest 2: Missing Session');
    process.env.TEST_SCENARIO = 'NO_SESSION';
    
    const mockRequest = {
      nextUrl: { pathname: '/api/chat' },
      url: 'http://localhost:3000/api/chat',
    } as NextRequest;
    
    const response = await tenantMiddleware(mockRequest);
    
    if (response.status === 401) {
      const body = await response.json();
      if (body.code === 'MISSING_SESSION') {
        console.log('✅ PASSED - Missing session returns 401');
        passed++;
      } else {
        console.log('❌ FAILED - Wrong error code:', body.code);
        failed++;
      }
    } else {
      console.log('❌ FAILED - Missing session should return 401, got:', response.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Missing session test threw error:', error.message);
    failed++;
  }
  
  // Test 3: Missing organizationId
  try {
    console.log('\nTest 3: Missing OrganizationId');
    process.env.TEST_SCENARIO = 'NO_ORG';
    
    const mockRequest = {
      nextUrl: { pathname: '/api/chat' },
      url: 'http://localhost:3000/api/chat',
    } as NextRequest;
    
    const response = await tenantMiddleware(mockRequest);
    
    if (response.status === 403) {
      const body = await response.json();
      if (body.code === 'MISSING_ORGANIZATION') {
        console.log('✅ PASSED - Missing organizationId returns 403');
        passed++;
      } else {
        console.log('❌ FAILED - Wrong error code:', body.code);
        failed++;
      }
    } else {
      console.log('❌ FAILED - Missing organizationId should return 403, got:', response.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Missing organizationId test threw error:', error.message);
    failed++;
  }
  
  // Test 4: Invalid organizationId format
  try {
    console.log('\nTest 4: Invalid OrganizationId Format');
    process.env.TEST_SCENARIO = 'INVALID_ORG';
    
    const mockRequest = {
      nextUrl: { pathname: '/api/chat' },
      url: 'http://localhost:3000/api/chat',
    } as NextRequest;
    
    const response = await tenantMiddleware(mockRequest);
    
    if (response.status === 403) {
      const body = await response.json();
      if (body.code === 'INVALID_ORGANIZATION') {
        console.log('✅ PASSED - Invalid organizationId returns 403');
        passed++;
      } else {
        console.log('❌ FAILED - Wrong error code:', body.code);
        failed++;
      }
    } else {
      console.log('❌ FAILED - Invalid organizationId should return 403, got:', response.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Invalid organizationId test threw error:', error.message);
    failed++;
  }
  
  // Test 5: Helper function - extractOrganizationFromPath
  try {
    console.log('\nTest 5: Helper Function - extractOrganizationFromPath');
    
    const path1 = extractOrganizationFromPath('/api/organizations/org-123/companions');
    const path2 = extractOrganizationFromPath('/api/chat');
    const path3 = extractOrganizationFromPath('/api/test/route');
    
    if (path1 === 'org-123' && path2 === null && path3 === null) {
      console.log('✅ PASSED - Path extraction works correctly');
      passed++;
    } else {
      console.log('❌ FAILED - Path extraction incorrect');
      console.log(`   Expected: org-123, null, null`);
      console.log(`   Got: ${path1}, ${path2}, ${path3}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Path extraction test threw error:', error.message);
    failed++;
  }
  
  // Test 6: Helper function - validateOrganizationAccess
  try {
    console.log('\nTest 6: Helper Function - validateOrganizationAccess');
    
    const access1 = validateOrganizationAccess('org-123', 'org-123'); // Same org
    const access2 = validateOrganizationAccess('org-123', 'org-456'); // Different org
    const access3 = validateOrganizationAccess('org-123', null); // No specific org
    
    if (access1 === true && access2 === false && access3 === true) {
      console.log('✅ PASSED - Organization access validation works correctly');
      passed++;
    } else {
      console.log('❌ FAILED - Organization access validation incorrect');
      console.log(`   Expected: true, false, true`);
      console.log(`   Got: ${access1}, ${access2}, ${access3}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Organization access test threw error:', error.message);
    failed++;
  }
  
  // Test Results
  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Middleware is ready for production.');
    process.exit(0);
  } else {
    console.log('\n🚨 SOME TESTS FAILED! Please fix before proceeding.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
}); 