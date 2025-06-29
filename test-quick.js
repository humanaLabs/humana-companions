console.log('🧪 Quick Middleware Test\n');

async function testBasicFunctions() {
  try {
    // Import functions
    const { extractOrganizationFromPath, validateOrganizationAccess, tenantConfig } = 
      await import('./middleware/tenant.ts');
    
    console.log('✅ Import successful');
    
    // Test 1: Path extraction
    const path1 = extractOrganizationFromPath('/api/organizations/org-123/companions');
    const path2 = extractOrganizationFromPath('/api/chat');
    const path3 = extractOrganizationFromPath('/api/organizations/guest-org-456/data');
    
    console.log('\n📋 Path Extraction Tests:');
    console.log(`  /api/organizations/org-123/companions → ${path1}`);
    console.log(`  /api/chat → ${path2}`);
    console.log(`  /api/organizations/guest-org-456/data → ${path3}`);
    
    if (path1 === 'org-123' && path2 === null && path3 === 'guest-org-456') {
      console.log('  ✅ Path extraction working correctly');
    } else {
      console.log('  ❌ Path extraction failed');
      return false;
    }
    
    // Test 2: Access validation
    const access1 = validateOrganizationAccess('org-123', 'org-123'); // Same org
    const access2 = validateOrganizationAccess('org-123', 'org-456'); // Different org
    const access3 = validateOrganizationAccess('org-123', null);       // No specific org
    
    console.log('\n🔐 Access Validation Tests:');
    console.log(`  Same org (org-123, org-123) → ${access1}`);
    console.log(`  Different org (org-123, org-456) → ${access2}`);
    console.log(`  No specific org (org-123, null) → ${access3}`);
    
    if (access1 === true && access2 === false && access3 === true) {
      console.log('  ✅ Access validation working correctly');
    } else {
      console.log('  ❌ Access validation failed');
      return false;
    }
    
    // Test 3: Configuration
    console.log('\n⚙️ Configuration Test:');
    console.log(`  Matcher: ${tenantConfig.matcher[0]}`);
    
    if (tenantConfig.matcher.includes('/api/((?!auth).*)')) {
      console.log('  ✅ Configuration correct');
    } else {
      console.log('  ❌ Configuration incorrect');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testBasicFunctions().then(success => {
  if (success) {
    console.log('\n🎉 Basic middleware tests PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('  ✓ Helper functions working');
    console.log('  ✓ Configuration correct');
    console.log('  → Ready to integrate with main middleware.ts');
    process.exit(0);
  } else {
    console.log('\n🚨 Tests FAILED!');
    process.exit(1);
  }
}); 