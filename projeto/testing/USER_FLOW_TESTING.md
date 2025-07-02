# 👥 HUMANA COMPANIONS - TESTES DE FLUXO DE USUÁRIO

**Data:** 30-1-2025  
**Foco:** User Experience (UX), User Interface (UI), User Journey Testing  
**Objetivo:** Validar experiência completa do usuário em todos os fluxos críticos

---

## 🎯 **TIPOS DE TESTES DE EXPERIÊNCIA**

### **User Journey Testing**
- 🛤️ **User Journeys** - Fluxos completos end-to-end
- 🎨 **UI/UX Testing** - Interface e experiência
- 📱 **Cross-Device Testing** - Desktop, tablet, mobile
- ♿ **Accessibility Testing** - Usuários com necessidades especiais
- 🧠 **Cognitive Load Testing** - Facilidade de uso mental
- 🔄 **Error Recovery Testing** - Como usuários se recuperam de erros

---

## 🛤️ **USER JOURNEYS CRÍTICOS**

### **1. JORNADA DO NOVO USUÁRIO**

#### **Cenário: Primeiro acesso ao sistema**
```typescript
describe('Nova Jornada de Usuário', () => {
  test('usuário descoberta → registro → primeiro uso', async ({ page }) => {
    // 1. DESCOBERTA - Landing page
    await page.goto('/');
    
    // Validar proposta de valor clara
    await expect(page.locator('[data-testid="value-proposition"]')).toBeVisible();
    await expect(page.locator('[data-testid="cta-primary"]')).toContainText(/Começar|Iniciar|Criar/);
    
    // 2. INTERESSE - Call to action
    await page.click('[data-testid="cta-primary"]');
    
    // 3. REGISTRO - Formulário de cadastro
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    
    // Validar campos obrigatórios claros
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-required', 'true');
    
    // Preenchimento do formulário
    await page.fill('[data-testid="email-input"]', 'novousuario@teste.com');
    await page.fill('[data-testid="password-input"]', 'SenhaSegura123!');
    await page.fill('[data-testid="name-input"]', 'João Silva');
    
    // 4. ATIVAÇÃO - Primeira experiência
    await page.click('[data-testid="submit-register"]');
    
    // Onboarding deve ser claro e rápido
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="onboarding-steps"]')).toBeVisible();
    
    // 5. VALOR IMEDIATO - Primeiro companion
    await page.click('[data-testid="create-first-companion"]');
    await page.fill('[data-testid="companion-name"]', 'Meu Assistente');
    await page.click('[data-testid="create-companion"]');
    
    // 6. SUCESSO - Primeiro chat funcional
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await page.fill('[data-testid="message-input"]', 'Olá, como você pode me ajudar?');
    await page.click('[data-testid="send-message"]');
    
    // Validar resposta em tempo razoável
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    
    // Verificar satisfação inicial
    await expect(page.locator('[data-testid="chat-working-indicator"]')).toBeVisible();
  });
});
```

### **2. JORNADA DO USUÁRIO EMPRESARIAL**

#### **Cenário: Admin configurando organização**
```typescript
describe('Jornada Admin Empresarial', () => {
  test('admin configura organização completa', async ({ page }) => {
    await loginAsAdmin(page);
    
    // 1. CONFIGURAÇÃO INICIAL - Organização
    await page.click('[data-testid="org-settings"]');
    await page.fill('[data-testid="org-name"]', 'Empresa Teste LTDA');
    await page.selectOption('[data-testid="org-plan"]', 'enterprise');
    
    // 2. CONFIGURAÇÃO DE USUÁRIOS
    await page.click('[data-testid="invite-users"]');
    await page.fill('[data-testid="user-emails"]', 'funcionario1@empresa.com\nfuncionario2@empresa.com');
    await page.selectOption('[data-testid="user-role"]', 'member');
    await page.click('[data-testid="send-invites"]');
    
    // 3. CONFIGURAÇÃO DE PERMISSÕES
    await page.click('[data-testid="permissions-tab"]');
    await page.check('[data-testid="can-create-companions"]');
    await page.check('[data-testid="can-upload-documents"]');
    
    // 4. CONFIGURAÇÃO BYOC (se enterprise)
    await page.click('[data-testid="byoc-tab"]');
    await page.fill('[data-testid="openai-api-key"]', 'sk-test-key');
    await page.click('[data-testid="test-connection"]');
    await expect(page.locator('[data-testid="connection-success"]')).toBeVisible();
    
    // 5. VERIFICAÇÃO FINAL
    await page.click('[data-testid="save-settings"]');
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
  });
});
```

### **3. JORNADA DE PRODUTIVIDADE DIÁRIA**

#### **Cenário: Usuário experiente usando o sistema**
```typescript
describe('Jornada Usuário Produtivo', () => {
  test('workflow diário completo', async ({ page }) => {
    await loginAsExperiencedUser(page);
    
    // 1. MANHÃ - Revisão de chats anteriores
    await page.click('[data-testid="recent-chats"]');
    await expect(page.locator('[data-testid="chat-list"]')).toBeVisible();
    
    // Busca rápida por chat específico
    await page.fill('[data-testid="chat-search"]', 'projeto marketing');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // 2. TRABALHO - Upload de novos documentos
    await page.click('[data-testid="data-room"]');
    await page.setInputFiles('[data-testid="file-upload"]', [
      './tests/fixtures/relatorio-vendas.pdf',
      './tests/fixtures/apresentacao-produto.pptx'
    ]);
    
    // Aguardar processamento
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // 3. ANÁLISE - Chat com documentos
    await page.click('[data-testid="chat-with-docs"]');
    await page.fill('[data-testid="message-input"]', 'Analise os dados de vendas e crie um resumo executivo');
    await page.click('[data-testid="send-message"]');
    
    // Verificar referências aos documentos
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="document-references"]')).toBeVisible();
    
    // 4. COLABORAÇÃO - Compartilhar insights
    await page.click('[data-testid="share-chat"]');
    await page.fill('[data-testid="share-with"]', 'colega@empresa.com');
    await page.click('[data-testid="send-share"]');
    
    // 5. FINALIZAÇÃO - Salvar insights importantes
    await page.click('[data-testid="save-to-knowledge-base"]');
    await page.fill('[data-testid="save-title"]', 'Análise Vendas Q1 2025');
    await page.click('[data-testid="confirm-save"]');
  });
});
```

---

## 🎨 **UI/UX TESTING ESPECÍFICOS**

### **1. DESIGN SYSTEM COMPLIANCE**

#### **Consistência Visual**
```typescript
describe('Consistência UI/UX', () => {
  test('componentes seguem design system', async ({ page }) => {
    await page.goto('/');
    
    // Validar paleta de cores consistente
    const primaryButtons = page.locator('[data-testid*="button-primary"]');
    const count = await primaryButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = primaryButtons.nth(i);
      const bgColor = await button.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bgColor).toBe('rgb(59, 130, 246)'); // primary color
    }
    
    // Validar tipografia consistente
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const fontFamily = await heading.evaluate(el => getComputedStyle(el).fontFamily);
      expect(fontFamily).toContain('Inter'); // design system font
    }
  });
  
  test('estados interativos são claros', async ({ page }) => {
    await page.goto('/');
    
    // Teste hover states
    const button = page.locator('[data-testid="primary-button"]');
    
    // Estado normal
    await expect(button).toHaveCSS('background-color', 'rgb(59, 130, 246)');
    
    // Estado hover
    await button.hover();
    await expect(button).toHaveCSS('background-color', 'rgb(37, 99, 235)');
    
    // Estado focus (acessibilidade)
    await button.focus();
    await expect(button).toHaveCSS('outline-style', 'solid');
  });
});
```

### **2. INFORMATION ARCHITECTURE**

#### **Navegação Intuitiva**
```typescript
describe('Arquitetura de Informação', () => {
  test('usuários encontram funcionalidades facilmente', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Teste de findabilidade (máximo 3 cliques)
    const features = [
      { name: 'Criar novo chat', testId: 'new-chat-button', maxClicks: 1 },
      { name: 'Configurações da conta', testId: 'account-settings', maxClicks: 2 },
      { name: 'Data Room', testId: 'data-room-nav', maxClicks: 1 },
      { name: 'Histórico de chats', testId: 'chat-history', maxClicks: 2 }
    ];
    
    for (const feature of features) {
      await page.goto('/'); // Reset para home
      
      let clicks = 0;
      let found = false;
      
      // Tenta encontrar a funcionalidade
      while (clicks < feature.maxClicks && !found) {
        const element = page.locator(`[data-testid="${feature.testId}"]`);
        
        if (await element.isVisible()) {
          found = true;
        } else {
          // Simula comportamento de usuário procurando
          const navElements = page.locator('nav a, button[data-testid*="nav"], [data-testid*="menu"]');
          const navCount = await navElements.count();
          
          if (navCount > 0) {
            await navElements.first().click();
            clicks++;
          }
        }
      }
      
      expect(found).toBe(true);
      expect(clicks).toBeLessThanOrEqual(feature.maxClicks);
    }
  });
  
  test('breadcrumbs ajudam na orientação', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Navegar para uma página profunda
    await page.click('[data-testid="data-room-nav"]');
    await page.click('[data-testid="documents-folder"]');
    await page.click('[data-testid="specific-document"]');
    
    // Verificar breadcrumbs
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"] a');
    await expect(breadcrumbs).toHaveCount(3); // Home > Data Room > Documents > Document
    
    // Testar navegação via breadcrumbs
    await breadcrumbs.nth(1).click(); // Voltar para Data Room
    await expect(page).toHaveURL(/data-room/);
  });
});
```

### **3. RESPONSIVE DESIGN TESTING**

#### **Cross-Device Experience**
```typescript
describe('Experiência Cross-Device', () => {
  const devices = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad Air', width: 820, height: 1180 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Ultrawide', width: 2560, height: 1440 }
  ];
  
  devices.forEach(device => {
    test(`funcionalidade completa em ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await loginAsTestUser(page);
      
      // Teste funcionalidades críticas
      
      // 1. Navegação principal acessível
      const navToggle = page.locator('[data-testid="nav-toggle"]');
      if (device.width < 768) {
        await expect(navToggle).toBeVisible();
        await navToggle.click();
      }
      
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
      
      // 2. Chat interface funcional
      await page.click('[data-testid="new-chat-button"]');
      
      const messageInput = page.locator('[data-testid="message-input"]');
      await expect(messageInput).toBeVisible();
      
      // Teste input responsivo
      await messageInput.fill('Teste de responsividade no ' + device.name);
      await page.click('[data-testid="send-button"]');
      
      // 3. Upload de arquivos (se disponível)
      if (device.width >= 768) { // Desktop/tablet only
        await page.click('[data-testid="attach-file"]');
        await expect(page.locator('[data-testid="file-upload-modal"]')).toBeVisible();
      }
      
      // 4. Verificar não há overflow horizontal
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      const viewportWidth = device.width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 para tolerância
    });
  });
});
```

---

## 🧠 **COGNITIVE LOAD TESTING**

### **1. TASK COMPLETION TIME**

#### **Eficiência de Tarefas Comuns**
```typescript
describe('Eficiência de Tarefas', () => {
  test('tarefas comuns são completadas rapidamente', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Tarefa 1: Criar novo chat (meta: < 30 segundos)
    const startTask1 = Date.now();
    
    await page.click('[data-testid="new-chat-button"]');
    await page.fill('[data-testid="message-input"]', 'Preciso de ajuda com um projeto');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    
    const task1Time = Date.now() - startTask1;
    expect(task1Time).toBeLessThan(30000); // 30 segundos
    
    // Tarefa 2: Buscar chat anterior (meta: < 15 segundos)
    const startTask2 = Date.now();
    
    await page.click('[data-testid="search-chats"]');
    await page.fill('[data-testid="search-input"]', 'projeto');
    await page.click('[data-testid="search-results"] >> first');
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
    
    const task2Time = Date.now() - startTask2;
    expect(task2Time).toBeLessThan(15000); // 15 segundos
    
    // Tarefa 3: Upload documento (meta: < 45 segundos)
    const startTask3 = Date.now();
    
    await page.click('[data-testid="data-room-nav"]');
    await page.setInputFiles('[data-testid="file-upload"]', './tests/fixtures/sample.pdf');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    const task3Time = Date.now() - startTask3;
    expect(task3Time).toBeLessThan(45000); // 45 segundos
  });
});
```

### **2. ERROR RECOVERY TESTING**

#### **Como Usuários Se Recuperam de Erros**
```typescript
describe('Recuperação de Erros', () => {
  test('usuários se recuperam facilmente de erros', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Erro 1: Upload de arquivo inválido
    await page.click('[data-testid="data-room-nav"]');
    await page.setInputFiles('[data-testid="file-upload"]', './tests/fixtures/malicious.exe');
    
    // Verificar mensagem de erro clara
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Tipo de arquivo não suportado');
    
    // Verificar sugestão de solução
    await expect(page.locator('[data-testid="error-help"]')).toContainText('PDF, DOCX, TXT');
    
    // Testar recuperação fácil
    await page.setInputFiles('[data-testid="file-upload"]', './tests/fixtures/valid.pdf');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Erro 2: Limite de quota atingido
    // Mock quota exceeded
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ error: 'Quota exceeded', quotaType: 'messages_daily' })
      });
    });
    
    await page.click('[data-testid="new-chat-button"]');
    await page.fill('[data-testid="message-input"]', 'Teste');
    await page.click('[data-testid="send-button"]');
    
    // Verificar explicação clara do erro
    await expect(page.locator('[data-testid="quota-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="quota-explanation"]')).toContainText('limite diário');
    
    // Verificar opções de resolução
    await expect(page.locator('[data-testid="upgrade-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
  });
});
```

---

## 📱 **CROSS-PLATFORM TESTING**

### **1. Browser Compatibility**
```typescript
describe('Compatibilidade Cross-Browser', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`funcionalidade completa em ${browserName}`, async ({ page }) => {
      await loginAsTestUser(page);
      
      // Testar funcionalidades core em cada browser
      await page.click('[data-testid="new-chat-button"]');
      await page.fill('[data-testid="message-input"]', `Teste no ${browserName}`);
      await page.click('[data-testid="send-button"]');
      
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
      
      // Verificar CSS rendering
      const button = page.locator('[data-testid="send-button"]');
      await expect(button).toHaveCSS('background-color', 'rgb(59, 130, 246)');
    });
  });
});
```

### **2. OS-Specific Testing**
```typescript
describe('Testes Específicos de OS', () => {
  test('shortcuts de teclado funcionam corretamente', async ({ page }) => {
    await loginAsTestUser(page);
    await page.click('[data-testid="new-chat-button"]');
    
    // Teste shortcuts
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Teste de shortcut');
    
    // Ctrl+Enter para enviar (Windows/Linux) ou Cmd+Enter (Mac)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+Enter`);
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
  });
});
```

---

## 🎯 **MÉTRICAS DE EXPERIÊNCIA**

### **KPIs de UX**
- **Task Success Rate**: > 95%
- **Task Completion Time**: Dentro das metas definidas
- **Error Recovery Rate**: > 90%
- **User Satisfaction Score**: > 4.5/5
- **Abandonment Rate**: < 5%

### **Métricas de Usabilidade**
- **Learnability**: Novos usuários completam tarefas básicas em < 5 minutos
- **Efficiency**: Usuários experientes 3x mais rápidos que novatos
- **Memorability**: 90% lembram como fazer tarefas após 1 semana
- **Error Frequency**: < 2 erros por sessão
- **Satisfaction**: Feedback positivo > 80%

---

## 🚀 **SETUP DE AUTOMAÇÃO**

### **Scripts de Execução**
```json
{
  "scripts": {
    "test:user-flows": "playwright test tests/user-flows/",
    "test:ux": "playwright test tests/ux/",
    "test:responsive": "playwright test tests/responsive/",
    "test:cognitive": "playwright test tests/cognitive-load/",
    "test:cross-platform": "playwright test tests/cross-platform/",
    "test:user-experience": "npm run test:user-flows && npm run test:ux && npm run test:responsive"
  }
}
```

### **Relatórios de UX**
```typescript
// Geração automática de relatórios de experiência
afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    // Capturar screenshot do erro
    await testInfo.attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
    
    // Capturar métricas de performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
      };
    });
    
    await testInfo.attach('performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json'
    });
  }
});
```

---

**🎯 OBJETIVO: Garantir que cada usuário tenha uma experiência excepcional, intuitiva e produtiva no Humana Companions.** 