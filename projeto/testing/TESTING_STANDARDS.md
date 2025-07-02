# 🧪 HUMANA COMPANIONS - PADRÕES DE TESTES INTEGRADOS

**Data:** 30-1-2025  
**Objetivo:** Garantir qualidade, usabilidade e conformidade a cada mudança

---

## 🎯 **TIPOS DE TESTES OBRIGATÓRIOS**

### **Execução Automática:**
- ✅ **A cada commit** - Smoke Tests + Unit Tests
- ✅ **A cada Pull Request** - Integration + E2E básicos
- ✅ **Deploy staging** - Suite completa
- ✅ **Deploy produção** - Smoke Tests + Critical paths

### **Categorias de Testes:**
1. 🔗 **Integration Tests** - Componentes funcionando juntos
2. 🌐 **End-to-End (E2E)** - Fluxos completos de usuário
3. 👥 **Usability Tests** - Experiência do usuário
4. 🎨 **Visual/UI Tests** - Componentes e layout
5. ⚡ **Performance Tests** - Velocidade e responsividade
6. ♿ **Accessibility Tests** - Conformidade WCAG
7. 💨 **Smoke Tests** - Funcionalidades críticas básicas

---

## 🔗 **INTEGRATION TESTS**

### **Multi-Tenant Isolation (CRÍTICO)**
```typescript
test('should never return cross-organization data', async () => {
  const org1Data = await seedOrganizationData('org-1');
  const org2Data = await seedOrganizationData('org-2');
  
  const chatRepo = new ChatRepositoryImpl(db);
  const org1Chats = await chatRepo.findAll('org-1');
  const org2Chats = await chatRepo.findAll('org-2');
  
  // Verify no data bleeding
  expect(org1Chats.some(c => c.organizationId === 'org-2')).toBe(false);
  expect(org2Chats.some(c => c.organizationId === 'org-1')).toBe(false);
});
```

### **Service Layer Integration**
```typescript
test('should create chat with proper tenant isolation', async () => {
  const chatService = new ChatDomainServiceImpl(orgId, chatRepo, messageRepo);
  
  const result = await chatService.createChat({
    userId: 'test-user',
    title: 'Test Chat'
  });
  
  expect(result.success).toBe(true);
  expect(result.data?.organizationId).toBe(orgId);
  
  // Test isolation
  const anotherOrgService = new ChatDomainServiceImpl('different-org', chatRepo, messageRepo);
  const isolationTest = await anotherOrgService.getChat(result.data!.id, 'test-user');
  
  expect(isolationTest.success).toBe(false);
  expect(isolationTest.error).toContain('Access denied');
});
```

---

## 🌐 **END-TO-END TESTS**

### **Critical User Flows**

#### **1. User Onboarding**
```typescript
test('complete onboarding flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="register-button"]');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'SecurePass123!');
  await page.click('[data-testid="submit-register"]');
  
  await expect(page).toHaveURL(/\/companions/);
  await expect(page.locator('[data-testid="companion-list"]')).toBeVisible();
});
```

#### **2. Chat Creation and AI Response**
```typescript
test('create chat and get AI response', async ({ page }) => {
  await loginAsTestUser(page);
  await page.click('[data-testid="new-chat-button"]');
  await page.fill('[data-testid="message-input"]', 'Hello, test message');
  await page.click('[data-testid="send-button"]');
  
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="message"]')).toHaveCount(2); // user + AI
});
```

#### **3. Document Upload and Processing**
```typescript
test('upload and process document', async ({ page }) => {
  await loginAsTestUser(page);
  await page.click('[data-testid="data-room-nav"]');
  
  const fileInput = page.locator('[data-testid="file-upload"]');
  await fileInput.setInputFiles('./tests/fixtures/sample-document.pdf');
  
  await expect(page.locator('[data-testid="processing-status"]')).toContainText('Complete', { timeout: 30000 });
});
```

---

## 👥 **USABILITY TESTS**

### **Navigation Usability**
```typescript
test('users can find key features within 3 clicks', async ({ page }) => {
  await loginAsTestUser(page);
  
  // Test: Create new chat (should be 1-2 clicks)
  const chatButton = page.locator('[data-testid="new-chat-button"]');
  await expect(chatButton).toBeVisible();
  
  // Test: Access data room (should be 1-2 clicks)
  const dataRoomNav = page.locator('[data-testid="data-room-nav"]');
  await expect(dataRoomNav).toBeVisible();
});
```

### **Form Validation**
```typescript
test('form validation provides helpful feedback', async ({ page }) => {
  await page.goto('/register');
  await page.click('[data-testid="submit-register"]');
  await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
});
```

### **Mobile Usability**
```typescript
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
```

---

## 🎨 **VISUAL/UI TESTS**

### **Component Visual Regression**
```typescript
test('Button components match design system', async ({ page }) => {
  await page.goto('/components/buttons');
  await expect(page.locator('[data-testid="button-primary"]')).toHaveScreenshot('button-primary.png');
  
  // Test hover state
  await page.hover('[data-testid="button-primary"]');
  await expect(page.locator('[data-testid="button-primary"]')).toHaveScreenshot('button-primary-hover.png');
});
```

### **Responsive Design**
```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

viewports.forEach(viewport => {
  test(`Layout works on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
  });
});
```

---

## ⚡ **PERFORMANCE TESTS**

### **Load Time Tests**
```typescript
test('Page load times under 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});

test('AI response times under 10 seconds', async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto('/chat');
  
  const startTime = Date.now();
  await page.fill('[data-testid="message-input"]', 'Test message');
  await page.click('[data-testid="send-button"]');
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  
  const responseTime = Date.now() - startTime;
  expect(responseTime).toBeLessThan(10000);
});
```

---

## ♿ **ACCESSIBILITY TESTS**

### **WCAG Compliance**
```typescript
test('Pages meet WCAG 2.1 AA standards', async ({ page }) => {
  await page.goto('/');
  
  // Run axe-core accessibility testing
  const accessibilityScanResults = await injectAxe(page);
  expect(accessibilityScanResults.violations).toHaveLength(0);
});

test('Keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Test skip links
  const skipLink = page.locator('[data-testid="skip-to-content"]');
  if (await skipLink.isVisible()) {
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  }
});
```

---

## 💨 **SMOKE TESTS**

### **Critical Health Checks**
```typescript
test('Application starts and core pages load', async ({ page }) => {
  // Homepage
  await page.goto('/');
  await expect(page).toHaveTitle(/Humana Companions/);
  
  // Login page
  await page.goto('/login');
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  
  // API health
  const response = await page.request.get('/api/health');
  expect(response.status()).toBe(200);
});

test('Database connectivity', async () => {
  const dbTest = await testDatabaseConnection();
  expect(dbTest.connected).toBe(true);
});
```

---

## 🚀 **AUTOMATION SETUP**

### **Package.json Scripts**
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

### **GitHub Actions**
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:smoke
  
  integration-tests:
    needs: smoke-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:integration
  
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:e2e
```

---

## 📊 **QUALITY METRICS**

### **Coverage Requirements**
- **Unit Tests**: > 90%
- **Integration Tests**: > 80%
- **E2E Tests**: 100% critical paths
- **Accessibility**: 100% WCAG AA
- **Visual Tests**: 100% key components

### **Performance Benchmarks**
- **Page Load**: < 3 seconds
- **AI Response**: < 10 seconds
- **File Upload**: < 5 seconds (10MB)
- **Search**: < 1 second

### **Quality Gates**
- ✅ All smoke tests pass
- ✅ No accessibility violations
- ✅ No visual regressions
- ✅ Performance under thresholds
- ✅ Multi-tenant isolation verified

---

## 🎯 **EXECUTION CHECKLIST**

### **Before Every Release:**
- [ ] Smoke tests pass
- [ ] Integration tests pass
- [ ] E2E critical paths pass
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Performance tests pass
- [ ] Multi-tenant isolation verified

### **Weekly:**
- [ ] Full test suite execution
- [ ] Performance monitoring review
- [ ] Accessibility audit
- [ ] Test maintenance

---

**🎯 OBJETIVO: Cada mudança mantém qualidade, usabilidade e conformidade arquitetural.** 