# 🧪 HUMANA COMPANIONS - SUITE DE TESTES INTEGRADOS

**Versão:** 2.0  
**Data:** 30-1-2025  
**Aplicação:** Executar a cada mudança no sistema  
**Objetivo:** Garantir qualidade, usabilidade e conformidade arquitetural

---

## 🎯 **OVERVIEW DO SISTEMA DE TESTES**

### **Tipos de Testes Implementados:**
- 🔗 **Integration Tests** - Componentes funcionando juntos
- 🌐 **End-to-End (E2E)** - Fluxos completos de usuário
- 👥 **Usability Tests** - Experiência do usuário
- 🎨 **Visual/UI Tests** - Componentes e layout
- ⚡ **Performance Tests** - Velocidade e responsividade
- ♿ **Accessibility Tests** - Conformidade WCAG
- 🔄 **Regression Tests** - Funcionalidades não quebradas
- 💨 **Smoke Tests** - Funcionalidades críticas básicas

### **Execução Automática:**
- ✅ **A cada commit** - Smoke Tests + Unit Tests
- ✅ **A cada Pull Request** - Integration + E2E básicos
- ✅ **Deploy staging** - Suite completa
- ✅ **Deploy produção** - Smoke Tests + Critical paths

---

## 🔗 **INTEGRATION TESTS**

### **1. SERVICE LAYER INTEGRATION**

#### **Chat Service Integration**
```typescript
// tests/integration/chat-service.integration.test.ts
describe('Chat Service Integration', () => {
  test('should create chat with proper multi-tenant isolation', async () => {
    const orgId = 'test-org-123';
    const userId = 'test-user-456';
    
    // Setup real dependencies
    const chatRepo = new ChatRepositoryImpl(db);
    const messageRepo = new MessageRepositoryImpl(db);
    const quotaService = new QuotaServiceImpl(db);
    
    const chatService = new ChatDomainServiceImpl(
      orgId, chatRepo, messageRepo, quotaService
    );
    
    // Create chat
    const result = await chatService.createChat({
      userId,
      title: 'Integration Test Chat',
      initialMessage: 'Hello integration test'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.organizationId).toBe(orgId);
    
    // Verify tenant isolation
    const anotherOrgService = new ChatDomainServiceImpl(
      'different-org', chatRepo, messageRepo, quotaService
    );
    
    const isolationTest = await anotherOrgService.getChat(
      result.data!.id, userId
    );
    
    expect(isolationTest.success).toBe(false);
    expect(isolationTest.error).toContain('Access denied');
  });
  
  test('should enforce quota limits across services', async () => {
    // Test quota enforcement integration
  });
  
  test('should propagate organization context through service calls', async () => {
    // Test context propagation
  });
});
```

#### **Document Service Integration**
```typescript
describe('Document Service Integration', () => {
  test('should upload, process and search documents with tenant isolation', async () => {
    // Integration test para document workflow completo
  });
  
  test('should integrate with vector database for RAG', async () => {
    // Test RAG integration
  });
});
```

#### **Companion Service Integration**
```typescript
describe('Companion Service Integration', () => {
  test('should create companion and integrate with LLM providers', async () => {
    // Test companion creation + AI integration
  });
  
  test('should handle provider failover correctly', async () => {
    // Test provider abstraction working
  });
});
```

### **2. DATABASE INTEGRATION**

#### **Multi-Tenant Data Isolation**
```typescript
describe('Database Multi-Tenant Integration', () => {
  test('should never return cross-organization data', async () => {
    // Setup data for multiple organizations
    const org1Data = await seedOrganizationData('org-1');
    const org2Data = await seedOrganizationData('org-2');
    
    // Test all repositories respect tenant boundaries
    const chatRepo = new ChatRepositoryImpl(db);
    
    const org1Chats = await chatRepo.findAll('org-1');
    const org2Chats = await chatRepo.findAll('org-2');
    
    // Verify isolation
    org1Chats.forEach(chat => {
      expect(chat.organizationId).toBe('org-1');
    });
    
    org2Chats.forEach(chat => {
      expect(chat.organizationId).toBe('org-2');
    });
    
    // Verify no data bleeding
    expect(org1Chats.some(c => c.organizationId === 'org-2')).toBe(false);
    expect(org2Chats.some(c => c.organizationId === 'org-1')).toBe(false);
  });
});
```

### **3. API LAYER INTEGRATION**

#### **API Routes with Domain Services**
```typescript
describe('API Integration with Domain Services', () => {
  test('should create chat via API adapter', async () => {
    const session = await createTestSession();
    const adapter = await createChatApiAdapter(session);
    
    const result = await adapter.createChatFromRequest({
      message: 'Test message',
      selectedCompanionId: 'companion-123'
    });
    
    expect(result.success).toBe(true);
    expect(result.chatId).toBeDefined();
  });
  
  test('should enforce authentication and authorization', async () => {
    // Test auth integration
  });
});
```

---

## 🌐 **END-TO-END (E2E) TESTS**

### **Critical User Flows**

#### **1. User Onboarding Flow**
```typescript
// tests/e2e/onboarding.e2e.test.ts
describe('User Onboarding E2E', () => {
  test('complete onboarding flow', async ({ page }) => {
    // 1. Landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Humana Companions/);
    
    // 2. Registration
    await page.click('[data-testid="register-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="submit-register"]');
    
    // 3. Email verification (mock)
    await mockEmailVerification(page);
    
    // 4. Profile setup
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.selectOption('[data-testid="plan-select"]', 'pro');
    await page.click('[data-testid="complete-setup"]');
    
    // 5. First companion creation
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await page.click('[data-testid="create-companion"]');
    
    // 6. Verify successful onboarding
    await expect(page).toHaveURL(/\/companions/);
    await expect(page.locator('[data-testid="companion-list"]')).toBeVisible();
  });
});
```

#### **2. Chat Creation and Usage Flow**
```typescript
describe('Chat Flow E2E', () => {
  test('create chat, send messages, get AI responses', async ({ page }) => {
    await loginAsTestUser(page);
    
    // 1. Navigate to chat
    await page.click('[data-testid="new-chat-button"]');
    
    // 2. Send first message
    await page.fill('[data-testid="message-input"]', 'Hello, I need help with my project');
    await page.click('[data-testid="send-button"]');
    
    // 3. Verify message appears
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, I need help');
    
    // 4. Wait for AI response
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 10000 });
    
    // 5. Continue conversation
    await page.fill('[data-testid="message-input"]', 'Can you provide more details?');
    await page.click('[data-testid="send-button"]');
    
    // 6. Verify conversation state
    await expect(page.locator('[data-testid="message"]')).toHaveCount(4); // 2 user + 2 AI
    
    // 7. Save chat
    await page.click('[data-testid="save-chat"]');
    await expect(page.locator('[data-testid="chat-saved-indicator"]')).toBeVisible();
  });
});
```

#### **3. Document Upload and RAG Flow**
```typescript
describe('Document RAG Flow E2E', () => {
  test('upload document, process, and query via RAG', async ({ page }) => {
    await loginAsTestUser(page);
    
    // 1. Navigate to Data Room
    await page.click('[data-testid="data-room-nav"]');
    
    // 2. Upload document
    const fileInput = page.locator('[data-testid="file-upload"]');
    await fileInput.setInputFiles('./tests/fixtures/sample-document.pdf');
    
    // 3. Wait for processing
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Processing');
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Complete', { timeout: 30000 });
    
    // 4. Query document via chat
    await page.click('[data-testid="chat-with-documents"]');
    await page.fill('[data-testid="message-input"]', 'Summarize the uploaded document');
    await page.click('[data-testid="send-button"]');
    
    // 5. Verify RAG response
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="document-references"]')).toBeVisible();
  });
});
```

#### **4. Organization Management Flow**
```typescript
describe('Organization Management E2E', () => {
  test('admin manages users and permissions', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test admin flows
    // - Add users
    // - Set permissions
    // - Manage quotas
    // - Configure organization settings
  });
});
```

---

## 👥 **USABILITY TESTS**

### **1. User Experience Validation**

#### **Navigation and Information Architecture**
```typescript
describe('Navigation Usability', () => {
  test('users can find key features within 3 clicks', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Test: Create new chat (should be 1-2 clicks)
    const chatButton = page.locator('[data-testid="new-chat-button"]');
    await expect(chatButton).toBeVisible();
    await expect(chatButton).toBeEnabled();
    
    // Test: Access data room (should be 1-2 clicks)
    const dataRoomNav = page.locator('[data-testid="data-room-nav"]');
    await expect(dataRoomNav).toBeVisible();
    
    // Test: User settings (should be 2-3 clicks)
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="settings-link"]')).toBeVisible();
  });
  
  test('breadcrumb navigation works correctly', async ({ page }) => {
    // Test breadcrumb functionality
  });
  
  test('search functionality is discoverable and works', async ({ page }) => {
    // Test search UX
  });
});
```

#### **Form Usability**
```typescript
describe('Form Usability', () => {
  test('form validation provides helpful feedback', async ({ page }) => {
    await page.goto('/register');
    
    // Test empty form submission
    await page.click('[data-testid="submit-register"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    
    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="submit-register"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    
    // Test password requirements
    await page.fill('[data-testid="password-input"]', '123');
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Weak');
  });
  
  test('forms autosave and restore progress', async ({ page }) => {
    // Test form state persistence
  });
});
```

#### **Mobile Usability**
```typescript
describe('Mobile Usability', () => {
  test('mobile navigation is thumb-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsTestUser(page);
    
    // Test touch targets are at least 44px
    const buttons = page.locator('button, a, [role="button"]');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.width >= 44 || box.height >= 44).toBe(true);
      }
    }
  });
  
  test('mobile chat interface is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Test mobile chat UX
  });
});
```

### **2. Cognitive Load Testing**

#### **Information Hierarchy**
```typescript
describe('Information Hierarchy', () => {
  test('primary actions are visually prominent', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Primary CTA should be most prominent
    const primaryButton = page.locator('[data-testid="primary-cta"]');
    const secondaryButton = page.locator('[data-testid="secondary-button"]');
    
    // Test visual hierarchy (color contrast, size, etc.)
    // This would require custom visual testing helpers
  });
  
  test('users understand their current location', async ({ page }) => {
    // Test breadcrumbs, active states, page titles
  });
});
```

---

## 🎨 **VISUAL/UI TESTS**

### **1. Design System Compliance**

#### **Component Visual Regression**
```typescript
// tests/visual/components.visual.test.ts
describe('Component Visual Tests', () => {
  test('Button components match design system', async ({ page }) => {
    await page.goto('/components/buttons');
    
    // Test all button variants
    await expect(page.locator('[data-testid="button-primary"]')).toHaveScreenshot('button-primary.png');
    await expect(page.locator('[data-testid="button-secondary"]')).toHaveScreenshot('button-secondary.png');
    await expect(page.locator('[data-testid="button-outline"]')).toHaveScreenshot('button-outline.png');
    
    // Test button states
    await page.hover('[data-testid="button-primary"]');
    await expect(page.locator('[data-testid="button-primary"]')).toHaveScreenshot('button-primary-hover.png');
  });
  
  test('Form components are consistent', async ({ page }) => {
    await page.goto('/components/forms');
    
    await expect(page.locator('[data-testid="input-text"]')).toHaveScreenshot('input-text.png');
    await expect(page.locator('[data-testid="input-select"]')).toHaveScreenshot('input-select.png');
    await expect(page.locator('[data-testid="input-textarea"]')).toHaveScreenshot('input-textarea.png');
  });
});
```

#### **Layout and Responsive Design**
```typescript
describe('Responsive Layout Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 }
  ];
  
  viewports.forEach(viewport => {
    test(`Layout works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
      
      // Test navigation
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
      
      // Test content doesn't overflow
      await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    });
  });
});
```

#### **Dark/Light Mode Consistency**
```typescript
describe('Theme Visual Tests', () => {
  test('Components work in both light and dark modes', async ({ page }) => {
    // Light mode
    await page.goto('/?theme=light');
    await expect(page.locator('[data-testid="chat-interface"]')).toHaveScreenshot('chat-light.png');
    
    // Dark mode
    await page.goto('/?theme=dark');
    await expect(page.locator('[data-testid="chat-interface"]')).toHaveScreenshot('chat-dark.png');
  });
});
```

### **2. Cross-Browser Visual Testing**
```typescript
describe('Cross-Browser Visual Tests', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Visual consistency in ${browserName}`, async ({ page }) => {
      // Test key pages in different browsers
    });
  });
});
```

---

## ⚡ **PERFORMANCE TESTS**

### **1. Load Time Tests**
```typescript
describe('Performance Tests', () => {
  test('Page load times are under acceptable thresholds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
    
    // Test Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value
          })));
        }).observe({ entryTypes: ['navigation', 'paint'] });
      });
    });
    
    // Verify performance metrics
    // LCP should be < 2.5s, FID < 100ms, CLS < 0.1
  });
  
  test('Chat response times are reasonable', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/chat');
    
    const startTime = Date.now();
    
    await page.fill('[data-testid="message-input"]', 'Hello, test message');
    await page.click('[data-testid="send-button"]');
    
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(10000); // 10 seconds max for AI response
  });
});
```

### **2. Resource Usage Tests**
```typescript
describe('Resource Usage Tests', () => {
  test('Memory usage stays within limits', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return {
        memory: (performance as any).memory,
        resources: performance.getEntriesByType('resource').length
      };
    });
    
    // Test memory usage
    expect(metrics.memory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

---

## ♿ **ACCESSIBILITY TESTS**

### **1. WCAG Compliance**
```typescript
describe('Accessibility Tests', () => {
  test('Pages meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    // Run axe-core accessibility testing
    const accessibilityScanResults = await injectAxe(page);
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
  
  test('Keyboard navigation works throughout the app', async ({ page }) => {
    await page.goto('/');
    
    // Tab through all interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    if (await skipLink.isVisible()) {
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });
  
  test('Screen reader announcements work correctly', async ({ page }) => {
    // Test ARIA labels, live regions, etc.
  });
});
```

### **2. Color and Contrast**
```typescript
describe('Color Accessibility', () => {
  test('Color contrast ratios meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    // Test contrast ratios for all text elements
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const count = await textElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Calculate contrast ratio and verify it meets WCAG AA (4.5:1)
      // This would require a color contrast calculation function
    }
  });
});
```

---

## 🔄 **REGRESSION TESTS**

### **1. Critical Path Regression**
```typescript
describe('Critical Path Regression', () => {
  test('User registration and login still works', async ({ page }) => {
    // Ensure basic auth flow hasn't broken
  });
  
  test('Chat creation and messaging still works', async ({ page }) => {
    // Ensure core chat functionality hasn't broken
  });
  
  test('Document upload and processing still works', async ({ page }) => {
    // Ensure document workflow hasn't broken
  });
  
  test('Organization management still works', async ({ page }) => {
    // Ensure admin functions haven't broken
  });
});
```

### **2. Data Integrity Regression**
```typescript
describe('Data Integrity Regression', () => {
  test('Multi-tenant isolation is maintained', async () => {
    // Test that tenant boundaries are still respected
  });
  
  test('User permissions are still enforced', async () => {
    // Test that RBAC still works
  });
});
```

---

## 💨 **SMOKE TESTS**

### **Quick Health Checks**
```typescript
describe('Smoke Tests', () => {
  test('Application starts and core pages load', async ({ page }) => {
    // Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Humana Companions/);
    
    // Login page
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // API health check
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
  });
  
  test('Database connectivity works', async () => {
    // Test database connection
    const dbTest = await testDatabaseConnection();
    expect(dbTest.connected).toBe(true);
  });
  
  test('External services are reachable', async () => {
    // Test LLM providers, storage, etc.
  });
});
```

---

## 🚀 **AUTOMATION SETUP**

### **1. GitHub Actions Integration**
```yaml
# .github/workflows/test-suite.yml
name: Comprehensive Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Smoke Tests
        run: npm run test:smoke
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: smoke-tests
    steps:
      - uses: actions/checkout@v3
      - name: Run Integration Tests
        run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E Tests
        run: npm run test:e2e
  
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Visual Tests
        run: npm run test:visual
  
  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Accessibility Tests
        run: npm run test:a11y
```

### **2. Package.json Scripts**
```json
{
  "scripts": {
    "test:smoke": "playwright test tests/smoke/",
    "test:integration": "jest tests/integration/",
    "test:e2e": "playwright test tests/e2e/",
    "test:visual": "playwright test tests/visual/",
    "test:a11y": "playwright test tests/accessibility/",
    "test:performance": "playwright test tests/performance/",
    "test:usability": "playwright test tests/usability/",
    "test:all": "npm run test:smoke && npm run test:integration && npm run test:e2e",
    "test:pre-deploy": "npm run test:all && npm run test:visual && npm run test:a11y"
  }
}
```

### **3. Test Configuration**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

---

## 📊 **METRICS AND REPORTING**

### **Test Coverage Requirements**
- **Unit Tests**: > 90% coverage
- **Integration Tests**: > 80% coverage
- **E2E Tests**: 100% critical paths
- **Visual Tests**: 100% key components
- **Accessibility**: 100% WCAG AA compliance

### **Performance Benchmarks**
- **Page Load**: < 3 seconds
- **AI Response**: < 10 seconds
- **File Upload**: < 5 seconds for 10MB
- **Search Results**: < 1 second

### **Quality Gates**
- ✅ All smoke tests pass
- ✅ No critical accessibility violations
- ✅ No visual regressions
- ✅ Performance under thresholds
- ✅ Security tests pass

---

## 🎯 **EXECUTION CHECKLIST**

### **Before Every Release:**
- [ ] Smoke tests pass
- [ ] Integration tests pass
- [ ] E2E critical paths pass
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Manual usability spot checks

### **Weekly/Monthly:**
- [ ] Full test suite execution
- [ ] Performance monitoring review
- [ ] Accessibility audit
- [ ] User feedback integration
- [ ] Test maintenance and updates

---

**🎯 OBJETIVO: Garantir que cada mudança no sistema mantenha a qualidade, usabilidade e conformidade arquitetural do Humana Companions.** 