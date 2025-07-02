import { defineConfig } from '@playwright/test';

/**
 * 🚀 Performance Tests Configuration
 * 
 * Optimized settings for performance testing with:
 * - Longer timeouts for measuring response times
 * - Single browser for consistency
 * - Detailed reporting for debugging
 */

export default defineConfig({
  testDir: '.',
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  // Run tests in parallel but limit workers for consistency
  fullyParallel: false,
  workers: 1, // Single worker for performance consistency
  
  // Retry failed tests to account for network variance
  retries: 2,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['json', { outputFile: 'performance-results.json' }],
    ['html', { outputFolder: 'performance-report', open: 'never' }],
  ],
  
  use: {
    // Base URL for API requests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace and screenshots for debugging
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    // Longer timeout for API requests in performance tests
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  
  projects: [
    {
      name: 'performance-chrome',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  
  // Global setup for performance tests
  globalSetup: './performance-setup.ts',
  
  // Output directory for test results
  outputDir: './performance-test-results',
}); 