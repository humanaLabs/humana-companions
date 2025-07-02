import { test, expect } from '@playwright/test';
import { generateUUID } from '@/lib/utils';

/**
 * 🗄️ Database Performance Tests
 * 
 * These tests monitor database operations to prevent:
 * - SQL syntax errors in incrementUsage
 * - Slow quota verification queries
 * - Database connection bottlenecks
 * - Transaction deadlocks
 */

test.describe('Database Performance Tests', () => {

  test('incrementUsage should complete without SQL errors', async ({ request }) => {
    const chatId = generateUUID();
    
    // This test specifically targets the incrementUsage SQL error we fixed
    const response = await request.post('/api/chat', {
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'test incrementUsage performance',
          parts: [{ type: 'text', text: 'test incrementUsage performance' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    // Should succeed without SQL errors
    expect(response.status()).toBe(200);
    
    // Response should contain expected streaming data
    const responseText = await response.text();
    expect(responseText).toBeTruthy();
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('Multiple incrementUsage calls should not cause deadlocks', async ({ request }) => {
    const chatIds = Array.from({ length: 5 }, () => generateUUID());
    
    // Send multiple requests that trigger incrementUsage simultaneously
    const promises = chatIds.map(chatId => 
      request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'concurrent incrementUsage test',
            parts: [{ type: 'text', text: 'concurrent incrementUsage test' }],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
        },
      })
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed without deadlocks
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Cleanup
    await Promise.all(chatIds.map(chatId => 
      request.delete(`/api/chat?id=${chatId}`)
    ));
  });

  test('Quota verification should not slow down requests significantly', async ({ request }) => {
    const chatId = generateUUID();
    
    const startTime = Date.now();
    
    const response = await request.post('/api/chat', {
      headers: {
        'x-organization-id': '00000000-0000-0000-0000-000000000003',
      },
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'quota verification performance test',
          parts: [{ type: 'text', text: 'quota verification performance test' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    
    // Quota verification should add minimal overhead
    expect(responseTime).toBeLessThan(5000);
    
    if (responseTime > 3000) {
      console.warn(`⚠️ Quota verification took ${responseTime}ms - may need optimization`);
    }
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('Database connections should handle rapid requests', async ({ request }) => {
    const iterations = 10;
    const responseTimes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const chatId = generateUUID();
      const startTime = Date.now();
      
      const response = await request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: `db connection test ${i}`,
            parts: [{ type: 'text', text: `db connection test ${i}` }],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
        },
      });
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      expect(response.status()).toBe(200);
      
      // Cleanup immediately to test connection handling
      await request.delete(`/api/chat?id=${chatId}`);
      
      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate performance metrics
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    const minTime = Math.min(...responseTimes);
    
    console.log(`📊 DB Connection Performance: Avg=${avgTime.toFixed(0)}ms, Min=${minTime}ms, Max=${maxTime}ms`);
    
    // Average should be reasonable
    expect(avgTime).toBeLessThan(3000);
    
    // No single request should be excessively slow
    expect(maxTime).toBeLessThan(8000);
    
    // Variance shouldn't be too high (indicates connection issues)
    const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);
    
    expect(stdDev).toBeLessThan(2000); // Standard deviation should be reasonable
  });

  test('Document operations should not interfere with chat performance', async ({ request }) => {
    const chatId = generateUUID();
    
    // Start a chat request
    const chatPromise = request.post('/api/chat', {
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'chat during document ops',
          parts: [{ type: 'text', text: 'chat during document ops' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    // Simulate document operations concurrently
    const docPromise = request.get('/api/documents');
    
    const [chatResponse, docResponse] = await Promise.all([chatPromise, docPromise]);
    
    // Both should succeed
    expect(chatResponse.status()).toBe(200);
    expect([200, 404, 403]).toContain(docResponse.status()); // May not have documents
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('User session validation should be fast', async ({ request }) => {
    const startTime = Date.now();
    
    // Test endpoint that requires authentication
    const response = await request.get('/api/user/profile');
    
    const responseTime = Date.now() - startTime;
    
    // Should respond quickly regardless of auth status
    expect([200, 401, 403]).toContain(response.status());
    expect(responseTime).toBeLessThan(2000);
    
    if (responseTime > 1000) {
      console.warn(`⚠️ User session validation took ${responseTime}ms`);
    }
  });

  test('Tenant isolation queries should be optimized', async ({ request }) => {
    const chatId = generateUUID();
    
    const startTime = Date.now();
    
    // Test with specific organization header to trigger tenant queries
    const response = await request.post('/api/chat', {
      headers: {
        'x-organization-id': '00000000-0000-0000-0000-000000000001',
      },
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'tenant isolation test',
          parts: [{ type: 'text', text: 'tenant isolation test' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    
    // Tenant isolation should not significantly impact performance
    expect(responseTime).toBeLessThan(4000);
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });
}); 