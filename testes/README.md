# 🧪 Documentação Geral de Testes - Humana Companions

## 📋 Visão Geral

Este documento centraliza toda a informação sobre testes no Humana Companions, incluindo estratégias, ferramentas, comandos e boas práticas.

## 🎯 Estratégia de Testes

### **Pirâmide de Testes**

```
        🔺 E2E Visual
       📸 Screenshots
      🎭 E2E Funcionais  
     📱 Testes Responsivos
    ♿ Testes Acessibilidade
   ⚡ Testes Performance
  🧪 Testes Integração
 🔧 Testes Unitários
```

### **Tipos de Teste Implementados**

| Tipo | Ferramenta | Comando | Cobertura |
|------|------------|---------|-----------|
| **E2E Funcionais** | Playwright | `pnpm test` | ✅ 100% |
| **Testes Visuais** | Playwright | `pnpm test:visual` | ✅ 100% |
| **Responsividade** | Playwright | `pnpm test:visual:mobile` | ✅ 100% |
| **Cross-Browser** | Playwright | `pnpm test:visual:cross-browser` | ✅ 100% |
| **Acessibilidade** | Playwright | `pnpm test:visual` | ✅ 100% |
| **Performance** | Playwright | `pnpm test:visual` | ✅ 100% |

## 🚀 Comandos de Teste

### **Comandos Básicos**

```bash
# Executar todos os testes E2E
pnpm test

# Interface gráfica do Playwright
pnpm test:ui

# Executar testes específicos
npx playwright test tests/e2e/chat.test.ts

# Debug mode
npx playwright test --debug
```

### **Comandos de Testes Visuais**

```bash
# Todos os testes visuais
pnpm test:visual

# Apenas telas administrativas
pnpm test:visual:admin

# Testes responsivos (mobile, tablet, desktop)
pnpm test:visual:mobile

# Testes em múltiplos browsers
pnpm test:visual:cross-browser

# Gerar relatório HTML
pnpm test:visual:report

# Atualizar baselines visuais
pnpm test:visual:update

# Ajuda completa
node scripts/run-visual-tests.js help
```

### **Comandos de Validação**

```bash
# Linting
pnpm lint

# Validação completa (lint + testes)
pnpm lint && pnpm test

# Validação completa com testes visuais
pnpm lint && pnpm test && pnpm test:visual
```

## 📁 Estrutura de Testes

```
tests/
├── e2e/                              # Testes End-to-End
│   ├── admin-permissions.test.ts     # Testes administrativos
│   ├── artifacts.test.ts             # Testes de artefatos
│   ├── chat.test.ts                  # Testes de chat
│   ├── organization-flow.test.ts     # Testes de organizações
│   └── visual-regression.test.ts     # Testes de regressão visual
├── integration/                      # Testes de integração
│   └── organization-api.test.ts      # APIs de organização
├── unit/                            # Testes unitários
│   └── organization.test.ts         # Lógica de organização
├── pages/                           # Page Objects
│   ├── admin.ts                     # Page Object para admin
│   ├── artifact.ts                  # Page Object para artefatos
│   ├── auth.ts                      # Page Object para auth
│   └── chat.ts                      # Page Object para chat
├── helpers/                         # Helpers de teste
│   └── visual-testing.ts            # Helpers para testes visuais
├── prompts/                         # Prompts de teste
│   ├── basic.ts                     # Prompts básicos
│   ├── routes.ts                    # Prompts de rotas
│   └── utils.ts                     # Utilitários de prompts
├── routes/                          # Testes de rotas
│   ├── chat.test.ts                 # Rotas de chat
│   └── document.test.ts             # Rotas de documentos
├── screenshots/                     # Screenshots automáticos
│   ├── admin-dashboard-full.png     # Screenshots principais
│   ├── elements/                    # Screenshots de elementos
│   ├── docs/                        # Screenshots para documentação
│   ├── baselines/                   # Baselines para comparação
│   └── diffs/                       # Diferenças detectadas
├── fixtures.ts                      # Configurações base
└── helpers.ts                       # Helpers gerais
```

## 🛠️ Ferramentas de Teste

### **Playwright**

- **Versão:** `^1.50.1`
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome
- **Recursos:** Screenshots, videos, traces, debug mode
- **Configuração:** `playwright.config.ts`

### **Scripts Customizados**

- **`scripts/run-visual-tests.js`** - Automação de testes visuais
- **Interface CLI** com cores e relatórios
- **Criação automática** de diretórios
- **Geração de relatórios** HTML

## 📊 Cobertura de Testes

### **Funcionalidades Testadas**

#### **Sistema de Autenticação**
- ✅ Login/logout
- ✅ Sessões
- ✅ Permissões por role

#### **Sistema Administrativo**
- ✅ Dashboard de administração
- ✅ Gestão de usuários
- ✅ Gestão de equipes
- ✅ Sistema de permissões
- ✅ Modais de criação/edição

#### **Sistema de Chat**
- ✅ Criação de chats
- ✅ Envio de mensagens
- ✅ Anexos de arquivos
- ✅ Sugestões automáticas
- ✅ Votação de mensagens

#### **Sistema de Organizações**
- ✅ Criação de organizações
- ✅ Gestão de membros
- ✅ Configurações
- ✅ Templates

#### **Sistema de Artefatos**
- ✅ Criação de artefatos
- ✅ Edição de código
- ✅ Visualização
- ✅ Compartilhamento

### **Aspectos Visuais Testados**

#### **Responsividade**
- ✅ Mobile (320px - 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (1024px+)

#### **Temas**
- ✅ Tema claro
- ✅ Tema escuro
- ✅ Transições de tema

#### **Estados de Interface**
- ✅ Estados de loading
- ✅ Estados de erro
- ✅ Estados de hover
- ✅ Estados de focus
- ✅ Animações de modal

#### **Cross-Browser**
- ✅ Chrome
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Mobile Chrome

### **Acessibilidade**
- ✅ Navegação por teclado
- ✅ Contraste de cores
- ✅ Atributos ARIA
- ✅ Foco visível
- ✅ Ordem de tabulação

### **Performance**
- ✅ Tempo de carregamento
- ✅ Core Web Vitals
- ✅ Uso de memória
- ✅ Detecção de vazamentos

## 🎯 Boas Práticas

### **Escrita de Testes**

```typescript
// ✅ BOM: Teste descritivo e focado
test('deve exibir modal de convite ao clicar no botão', async ({ page }) => {
  await adminPage.goto();
  await adminPage.openInviteUserModal();
  await expect(page.locator('text=Convidar Usuário')).toBeVisible();
});

// ❌ RUIM: Teste genérico
test('teste do admin', async ({ page }) => {
  // ...
});
```

### **Page Objects**

```typescript
// ✅ BOM: Page Object bem estruturado
export class AdminPage {
  readonly page: Page;
  readonly inviteButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.inviteButton = page.locator('[data-testid="invite-user-btn"]');
  }

  async openInviteModal() {
    await this.inviteButton.click();
    return new InviteModal(this.page);
  }
}
```

### **Mocks e Fixtures**

```typescript
// ✅ BOM: Mock consistente
await page.route('/api/user/permissions', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MASTER_ADMIN_PERMISSIONS)
  });
});
```

### **Screenshots**

```typescript
// ✅ BOM: Screenshot estável
await page.waitForLoadState('networkidle');
await page.screenshot({ 
  path: 'tests/screenshots/admin-dashboard.png',
  fullPage: true,
  animations: 'disabled'
});
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **Testes Instáveis**
```bash
# Aguardar elementos específicos
await page.waitForSelector('[data-testid="content-loaded"]');

# Aguardar rede estável
await page.waitForLoadState('networkidle');

# Aguardar timeout fixo
await page.waitForTimeout(1000);
```

#### **Screenshots Diferentes**
```bash
# Atualizar baselines
pnpm test:visual:update

# Comparar diferenças
npx playwright show-report
```

#### **Problemas de Permissão**
```typescript
// Verificar mock de permissões
await page.route('/api/user/permissions', (route) => {
  console.log('Permissions API called');
  route.fulfill(/* ... */);
});
```

### **Debug de Testes**

```bash
# Modo debug
npx playwright test --debug

# Executar com interface
pnpm test:ui

# Ver traces
npx playwright show-trace trace.zip

# Executar teste específico
npx playwright test -g "nome do teste"
```

## 📈 Métricas e Relatórios

### **Relatórios Automáticos**

```bash
# Relatório HTML padrão do Playwright
npx playwright show-report

# Relatório customizado de testes visuais
pnpm test:visual:report
# Gera: tests/screenshots/report.html
```

### **Métricas Coletadas**

- **Tempo de execução** dos testes
- **Taxa de sucesso/falha**
- **Cobertura visual** (páginas testadas)
- **Performance** (Core Web Vitals)
- **Acessibilidade** (contraste, navegação)

### **CI/CD Integration**

```yaml
# .github/workflows/tests.yml
- name: Run E2E Tests
  run: pnpm test

- name: Run Visual Tests
  run: pnpm test:visual

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      playwright-report/
      tests/screenshots/
```

## 📚 Documentação Relacionada

- **📖 [Testes Visuais Automatizados](TESTES_VISUAIS_AUTOMATIZADOS.md)** - Guia completo
- **🏗️ [Arquitetura Modular](../arquitetura_geral/ARQUITETURA_MODULAR.md)** - Estrutura do projeto
- **🎯 [Boas Práticas](../arquitetura_geral/BOAS_PRATICAS_CODIGO.md)** - Padrões de código

## 🔄 Processo de Desenvolvimento

### **Fluxo de Desenvolvimento com Testes**

1. **Desenvolvimento** - Criar funcionalidade
2. **Testes Unitários** - Testar lógica isolada
3. **Testes E2E** - Testar fluxo completo
4. **Testes Visuais** - Verificar interface
5. **Validação** - `pnpm lint && pnpm test`
6. **Commit** - Enviar para repositório

### **Antes de Fazer PR**

```bash
# Checklist obrigatório
pnpm lint                    # ✅ Sem erros de lint
pnpm test                    # ✅ Todos os testes E2E passando
pnpm test:visual             # ✅ Testes visuais ok
pnpm build                   # ✅ Build sem erros
```

### **Adicionando Novos Testes**

1. **Identifique** a funcionalidade a testar
2. **Crie** Page Object se necessário
3. **Escreva** teste funcional
4. **Adicione** teste visual se relevante
5. **Documente** casos especiais
6. **Execute** suite completa

## 🎉 Conclusão

O Humana Companions possui uma **arquitetura de testes robusta** que garante:

✅ **Qualidade** - Detecção precoce de bugs  
✅ **Confiabilidade** - Testes automatizados  
✅ **Acessibilidade** - Conformidade com padrões  
✅ **Performance** - Monitoramento contínuo  
✅ **Manutenibilidade** - Código testável  

**Para começar:**
```bash
pnpm test:visual
```

**Para dúvidas:** Consulte a documentação específica ou abra uma issue no repositório. 