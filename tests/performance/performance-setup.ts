import { FullConfig } from '@playwright/test';

/**
 * 🚀 Performance Tests Global Setup
 * 
 * Initializes the environment for performance testing and
 * establishes baseline measurements
 */

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Setting up Performance Tests...\n');
  
  // Environment validation
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  console.log(`🌐 Testing against: ${baseURL}`);
  
  // Check if server is running
  try {
    const response = await fetch(`${baseURL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running and responsive');
    } else {
      console.log('⚠️  Server responded but may have issues');
    }
  } catch (error) {
    console.log('❌ Server is not responding - tests may fail');
    console.log('💡 Make sure to run: npm run dev');
  }
  
  // Performance baseline check
  console.log('\n📊 Establishing Performance Baseline...');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseURL}/`);
    const responseTime = Date.now() - startTime;
    
    console.log(`📈 Homepage response time: ${responseTime}ms`);
    
    if (responseTime > 2000) {
      console.log('⚠️  Slow homepage response - performance tests may be affected');
    } else {
      console.log('✅ Homepage response time is acceptable');
    }
  } catch (error) {
    console.log('❌ Could not establish baseline - tests will continue anyway');
  }
  
  // Environment info
  console.log('\n🔧 Environment Information:');
  console.log(`📦 Node version: ${process.version}`);
  console.log(`🖥️  Platform: ${process.platform}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
  
  // Performance test configuration
  console.log('\n⚙️  Performance Test Configuration:');
  console.log('⚡ Target response time: < 3 seconds');
  console.log('🎯 Ideal response time: < 1 second');
  console.log('🚨 Critical threshold: > 5 seconds');
  console.log('🔄 Model caching: Required');
  console.log('🗄️  SQL errors: None allowed');
  
  console.log('\n🎬 Starting Performance Tests...\n');
  
  return async () => {
    console.log('\n🎯 Performance Tests Complete!');
    console.log('📊 Check the performance-report folder for detailed results');
  };
}

export default globalSetup; 