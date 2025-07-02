import { test, expect } from '@playwright/test';
import { generateUUID } from '@/lib/utils';

/**
 * 🚀 Performance Tests for Chat API
 * 
 * These tests ensure chat responses stay fast and prevent regressions
 * from issues like:
 * - SQL syntax errors in incrementUsage
 * - Azure model recreation on each request
 * - Immutable request header modifications
 * - Quota verification bottlenecks
 */

test.describe('Chat Performance Tests', () => {
  
  test('Chat API should respond within 3 seconds for simple message', async ({ request }) => {
    const startTime = Date.now();
    const chatId = generateUUID();
    
    const response = await request.post('/api/chat', {
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'oi',
          parts: [{ type: 'text', text: 'oi' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    
    // ⚡ Critical: Response should be under 3 seconds
    expect(responseTime).toBeLessThan(3000);
    
    // 🎯 Ideal: Response should be under 2 seconds
    if (responseTime > 2000) {
      console.warn(`⚠️ Chat response took ${responseTime}ms - investigate performance`);
    }
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('Multiple concurrent chat requests should not degrade performance significantly', async ({ request }) => {
    const chatIds = Array.from({ length: 3 }, () => generateUUID());
    
    const startTime = Date.now();
    
    // Send 3 concurrent chat requests
    const promises = chatIds.map(chatId => 
      request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'teste concorrência',
            parts: [{ type: 'text', text: 'teste concorrência' }],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
        },
      })
    );
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // ⚡ Total time for 3 concurrent requests should be under 5 seconds
    expect(totalTime).toBeLessThan(5000);
    
    // Average per request should still be reasonable
    const avgTime = totalTime / 3;
    expect(avgTime).toBeLessThan(4000);
    
    // Cleanup
    await Promise.all(chatIds.map(chatId => 
      request.delete(`/api/chat?id=${chatId}`)
    ));
  });

  test('Chat API should not have compilation delays in production mode', async ({ request }) => {
    const firstRequestStart = Date.now();
    const chatId1 = generateUUID();
    
    await request.post('/api/chat', {
      data: {
        id: chatId1,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'primeira requisição',
          parts: [{ type: 'text', text: 'primeira requisição' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    const firstRequestTime = Date.now() - firstRequestStart;
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const secondRequestStart = Date.now();
    const chatId2 = generateUUID();
    
    await request.post('/api/chat', {
      data: {
        id: chatId2,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'segunda requisição',
          parts: [{ type: 'text', text: 'segunda requisição' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    const secondRequestTime = Date.now() - secondRequestStart;
    
    // Second request should not be significantly slower (no compilation)
    // Allow some variance but flag if there's a big difference
    const difference = Math.abs(secondRequestTime - firstRequestTime);
    
    // If difference is more than 1.5 seconds, something is wrong
    expect(difference).toBeLessThan(1500);
    
    if (difference > 1000) {
      console.warn(`⚠️ Potential compilation issue: First=${firstRequestTime}ms, Second=${secondRequestTime}ms`);
    }
    
    // Cleanup
    await Promise.all([
      request.delete(`/api/chat?id=${chatId1}`),
      request.delete(`/api/chat?id=${chatId2}`)
    ]);
  });

  test('Azure model instances should be cached and not recreated', async ({ request }) => {
    // This test verifies that Azure models are cached by measuring consistent response times
    const chatIds = Array.from({ length: 5 }, () => generateUUID());
    const responseTimes: number[] = [];
    
    for (const chatId of chatIds) {
      const startTime = Date.now();
      
      const response = await request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'cache test',
            parts: [{ type: 'text', text: 'cache test' }],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
        },
      });
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      expect(response.status()).toBe(200);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Calculate variance in response times
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // If models are cached properly, response times should be fairly consistent
    // High variance indicates model recreation issues
    expect(stdDev).toBeLessThan(1000); // Standard deviation should be less than 1 second
    
    console.log(`📊 Response times: ${responseTimes.join(', ')}ms`);
    console.log(`📊 Avg: ${avgTime.toFixed(0)}ms, StdDev: ${stdDev.toFixed(0)}ms`);
    
    // Cleanup
    await Promise.all(chatIds.map(chatId => 
      request.delete(`/api/chat?id=${chatId}`)
    ));
  });

  test('Quota verification should not significantly impact performance', async ({ request }) => {
    const chatId = generateUUID();
    
    // Test with quota headers to ensure verification is fast
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
          content: 'quota test',
          parts: [{ type: 'text', text: 'quota test' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    
    // Quota verification should add minimal overhead (under 100ms ideally)
    // But we'll be lenient and test for under 3 seconds total
    expect(responseTime).toBeLessThan(3000);
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('Database operations should complete without SQL errors', async ({ request }) => {
    const chatId = generateUUID();
    
    const response = await request.post('/api/chat', {
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'db test',
          parts: [{ type: 'text', text: 'db test' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    expect(response.status()).toBe(200);
    
    // If there were SQL errors, we'd get a 400 or 500 status
    // The response should complete successfully
    const responseText = await response.text();
    expect(responseText).toBeTruthy();
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });

  test('Performance regression alert thresholds', async ({ request }) => {
    const chatId = generateUUID();
    const startTime = Date.now();
    
    const response = await request.post('/api/chat', {
      data: {
        id: chatId,
        message: {
          id: generateUUID(),
          role: 'user',
          content: 'performance baseline',
          parts: [{ type: 'text', text: 'performance baseline' }],
          createdAt: new Date().toISOString(),
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    
    // 🚨 Performance Regression Alerts
    if (responseTime > 5000) {
      throw new Error(`🚨 CRITICAL: Chat response took ${responseTime}ms - Major performance regression!`);
    }
    
    if (responseTime > 3000) {
      console.error(`🚨 WARNING: Chat response took ${responseTime}ms - Performance regression detected!`);
    }
    
    if (responseTime > 2000) {
      console.warn(`⚠️ NOTICE: Chat response took ${responseTime}ms - Monitor performance closely`);
    }
    
    if (responseTime < 1000) {
      console.log(`✅ EXCELLENT: Chat response took ${responseTime}ms - Performance is optimal!`);
    }
    
    // Cleanup
    await request.delete(`/api/chat?id=${chatId}`);
  });
}); 