// Simple test file for middleware
import { NextRequest, NextResponse } from 'next/server';

console.log('🧪 Testing Middleware Functions...\n');

try {
  // Test import
  const middleware = await import('./middleware/tenant.ts');
  console.log('✅ Middleware imported successfully');
  console.log('Available exports:', Object.keys(middleware));
  
  // Test helper functions
  if (middleware.extractOrganizationFromPath) {
    const test1 = middleware.extractOrganizationFromPath('/api/organizations/org-123/companions');
    const test2 = middleware.extractOrganizationFromPath('/api/chat');
    
    console.log(`\n📋 Path extraction tests:`);
    console.log(`   /api/organizations/org-123/companions -> ${test1}`);
    console.log(`   /api/chat -> ${test2}`);
    
    if (test1 === 'org-123' && test2 === null) {
      console.log('✅ Path extraction working correctly');
    } else {
      console.log('❌ Path extraction has issues');
    }
  }
  
  if (middleware.validateOrganizationAccess) {
    const access1 = middleware.validateOrganizationAccess('org-123', 'org-123');
    const access2 = middleware.validateOrganizationAccess('org-123', 'org-456');
    const access3 = middleware.validateOrganizationAccess('org-123', null);
    
    console.log(`\n🔐 Access validation tests:`);
    console.log(`   Same org (org-123, org-123) -> ${access1}`);
    console.log(`   Different org (org-123, org-456) -> ${access2}`);
    console.log(`   No specific org (org-123, null) -> ${access3}`);
    
    if (access1 === true && access2 === false && access3 === true) {
      console.log('✅ Access validation working correctly');
    } else {
      console.log('❌ Access validation has issues');
    }
  }
  
  console.log('\n🎉 Basic middleware validation completed successfully!');
  
} catch (error) {
  console.error('💥 Error testing middleware:', error.message);
  process.exit(1);
} 