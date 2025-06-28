# 🎯 Testes Visuais Automatizados - Humana Companions

## 📋 Visão Geral

Este guia demonstra como implementar e executar **testes de telas automatizados** no Humana Companions usando **Playwright** com **Page Object Model** e **Visual Testing**.

## 🚀 Como Executar Testes de Telas

### **Comandos Rápidos**

```bash
# Executar todos os testes visuais
npm run test:visual

# Executar apenas testes administrativos
npm run test:visual:admin

# Executar testes mobile
npm run test:visual:mobile

# Executar em múltiplos browsers
npm run test:visual:cross-browser

# Gerar relatório HTML
npm run test:visual:report

# Atualizar baselines visuais
npm run test:visual:update
```

### **Executar Manualmente**

```bash
# Testes E2E básicos
npx playwright test tests/e2e/admin-permissions.test.ts

# Testes de regressão visual
npx playwright test tests/e2e/visual-regression.test.ts

# Interface gráfica do Playwright
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## 🏗️ Arquitetura dos Testes

### **1. Page Object Model**

```typescript
// tests/pages/admin.ts
export class AdminPage {
  readonly page: Page;
  readonly inviteUserButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.inviteUserButton = page.locator('[data-testid="invite-user-btn"]');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async openInviteUserModal() {
    await this.inviteUserButton.click();
    return new InviteUserModal(this.page);
  }
}
```

### **2. Helpers de Teste Visual**

```typescript
// tests/helpers/visual-testing.ts
export class VisualTestHelper {
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/${name}.png`,
      fullPage: true,
      animations: 'disabled'
    });
  }

  async testResponsiveScreenshots(name: string) {
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    // ... implementação
  }
}
```

## 📸 Tipos de Testes Visuais

### **1. Screenshots de Baseline**
- Captura estado inicial das telas
- Comparação visual automática
- Detecção de regressões

### **2. Testes de Responsividade**
- Mobile (320px)
- Tablet (768px) 
- Desktop (1920px)

### **3. Testes de Temas**
- Tema claro vs escuro
- Contraste de cores
- Acessibilidade visual

### **4. Testes de Interação**
- Estados de hover
- Animações de modal
- Loading states
- Estados de erro

### **5. Testes Cross-Browser**
- Chrome vs Firefox
- Compatibilidade visual

## 🎛️ Configuração de Testes

### **Mock de APIs**

```typescript
// Mock de autenticação
await page.route('/api/auth/session', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        email: 'eduibrahim@yahoo.com.br',
        name: 'Eduardo Ibrahim'
      }
    })
  });
});

// Mock de permissões
await page.route('/api/user/permissions', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      permissions: ['users.view', 'admin.view_dashboard'],
      roles: ['master_admin'],
      isMasterAdmin: true
    })
  });
});
```

### **Data Test IDs**

```tsx
// Componente React
<Button data-testid="invite-user-btn">
  Convidar Usuário
</Button>

// Teste
const button = page.locator('[data-testid="invite-user-btn"]');
await button.click();
```

## 📊 Exemplos Práticos

### **Teste de Permissões**

```typescript
test('deve exibir todas as seções para Master Admin', async () => {
  await adminPage.mockMasterAdminPermissions();
  await adminPage.goto();
  
  // Verificar acesso completo
  await expect(page.locator('text=Gestão de Usuários')).toBeVisible();
  await expect(page.locator('text=Gestão de Equipes')).toBeVisible();
  await expect(page.locator('text=Roles e Permissões')).toBeVisible();
  
  // Screenshot para documentação
  await page.screenshot({ 
    path: 'tests/screenshots/master-admin-dashboard.png',
    fullPage: true 
  });
});
```

### **Teste de Modal**

```typescript
test('deve abrir modal de convite', async () => {
  await adminPage.goto();
  
  const modal = await adminPage.openInviteUserModal();
  
  // Verificar elementos do modal
  await expect(modal.emailInput).toBeVisible();
  await expect(modal.roleSelect).toBeVisible();
  
  // Preencher e submeter
  await modal.fillAndSubmit('novo@usuario.com', 'admin');
  
  // Verificar sucesso
  await expect(page.locator('text=Convite enviado!')).toBeVisible();
});
```

### **Teste Responsivo**

```typescript
test('deve funcionar em dispositivos móveis', async ({ page }) => {
  // Simular dispositivo móvel
  await page.setViewportSize({ width: 375, height: 667 });
  
  await adminPage.goto();
  await adminPage.verifyMasterAdminAccess();
  
  // Screenshot mobile
  await page.screenshot({ 
    path: 'tests/screenshots/mobile-view.png',
    fullPage: true 
  });
});
```

## 🔧 Configuração do Projeto

### **playwright.config.ts**

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
  ],
});
```

## 📁 Estrutura de Arquivos

```
tests/
├── e2e/
│   ├── admin-permissions.test.ts      # Testes de funcionalidade
│   ├── visual-regression.test.ts      # Testes de regressão visual
│   └── chat.test.ts                   # Testes existentes
├── pages/
│   ├── admin.ts                       # Page Object para admin
│   ├── chat.ts                        # Page Object existente
│   └── auth.ts                        # Page Object para auth
├── helpers/
│   └── visual-testing.ts              # Helpers para testes visuais
├── screenshots/
│   ├── admin-dashboard-full.png       # Screenshots principais
│   ├── elements/                      # Screenshots de elementos
│   ├── docs/                          # Screenshots para documentação
│   ├── baselines/                     # Baselines para comparação
│   └── diffs/                         # Diferenças detectadas
└── fixtures.ts                        # Configurações base
```

## 🎯 Boas Práticas

### **1. Nomenclatura**
- Use nomes descritivos para screenshots
- Prefixe com categoria: `admin-`, `modal-`, `mobile-`
- Inclua estado: `-opened`, `-filled`, `-error`

### **2. Estabilidade**
- Aguarde `networkidle` antes de screenshots
- Desabilite animações: `animations: 'disabled'`
- Use `waitForTimeout` para elementos dinâmicos

### **3. Manutenibilidade**
- Use Page Objects para reutilização
- Mock dados consistentes
- Organize screenshots por categoria

### **4. Performance**
- Execute testes em paralelo
- Use screenshots apenas quando necessário
- Limite resolução para testes rápidos

## 🚨 Troubleshooting

### **Problema: Screenshots diferentes**
```bash
# Atualizar baselines
npm run test:visual:update

# Comparar diferenças
npx playwright show-report
```

### **Problema: Testes instáveis**
```typescript
// Aguardar elemento específico
await page.waitForSelector('[data-testid="content-loaded"]');

// Aguardar rede estável
await page.waitForLoadState('networkidle');

// Aguardar timeout fixo
await page.waitForTimeout(1000);
```

### **Problema: Modal não abre**
```typescript
// Verificar se elemento existe
await expect(button).toBeVisible();

// Aguardar elemento estar pronto
await button.waitFor({ state: 'attached' });

// Forçar clique se necessário
await button.click({ force: true });
```

## 📈 Métricas e Relatórios

### **Relatório HTML Automático**
```bash
npm run test:visual:report
# Gera: tests/screenshots/report.html
```

### **Métricas de Performance**
- Tempo de carregamento
- Core Web Vitals
- Uso de memória

### **Cobertura Visual**
- Páginas testadas
- Componentes cobertos
- Estados verificados

## 🔄 CI/CD Integration

### **GitHub Actions**
```yaml
- name: Run Visual Tests
  run: |
    npm run test:visual
    npm run test:visual:report

- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: tests/screenshots/
```

## 📚 Recursos Adicionais

- [Playwright Documentation](https://playwright.dev/)
- [Visual Testing Guide](https://playwright.dev/docs/test-screenshots)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## 🎉 Conclusão

Com esta configuração, você tem:

✅ **Testes automatizados** para todas as telas administrativas  
✅ **Regressão visual** automática  
✅ **Screenshots** para documentação  
✅ **Testes responsivos** multi-dispositivo  
✅ **Cross-browser testing**  
✅ **Relatórios HTML** automáticos  
✅ **CI/CD ready**  

**Próximos passos:**
1. Execute `npm run test:visual` para testar
2. Veja os screenshots em `tests/screenshots/`
3. Abra o relatório HTML gerado
4. Integre no seu pipeline de CI/CD

**Comandos essenciais:**
```bash
npm run test:visual          # Executar tudo
npm run test:visual:admin    # Só admin
npm run test:visual:report   # Gerar relatório
``` 