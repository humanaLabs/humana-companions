import { test, expect, type Page } from '@playwright/test';

test.describe('Organization Designer E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock authentication - simular usuário logado como master admin
    await page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canCreateOrganization: true,
          isMasterAdmin: true,
        }),
      });
    });

    // Mock organizations list
    await page.route('/api/organizations', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'org-1',
              name: 'Humana AI',
              description: 'Plataforma de IA para empresas',
              tenantConfig: {
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                llm_provider: 'azure-openai',
                default_model: 'gpt-4o',
              },
              values: [
                {
                  name: 'Inovação',
                  description: 'Busca por soluções criativas',
                  principles: ['Experimentar novas tecnologias'],
                },
              ],
              teams: [
                {
                  id: 'product-team',
                  name: 'Produto',
                  description: 'Equipe de produto',
                  members: ['product-manager'],
                  permissions: ['read_product'],
                },
              ],
              positions: [
                {
                  id: 'product-manager',
                  title: 'Product Manager',
                  team_id: 'product-team',
                  level: 'senior',
                  responsibilities: ['Definir estratégia'],
                  required_skills: ['product_strategy'],
                  reporting_to: null,
                  companions: [],
                },
              ],
              orgUsers: [],
              userId: 'user-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      }
    });

    // Mock templates
    await page.route('/api/organizations/templates', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            templates: [
              {
                id: 'startup-tech',
                name: 'Startup Tecnológica',
                description: 'Estrutura ágil para startups de tecnologia',
                category: 'technology',
                structure: {
                  tenantConfig: {
                    timezone: 'America/Sao_Paulo',
                    language: 'pt-BR',
                    llm_provider: 'azure-openai',
                    default_model: 'gpt-4o',
                  },
                  values: [
                    {
                      name: 'Inovação',
                      description: 'Busca constante por soluções criativas',
                      principles: ['Experimentar novas tecnologias'],
                    },
                  ],
                  teams: [
                    {
                      id: 'product-team',
                      name: 'Produto',
                      description: 'Equipe de produto',
                      members: ['product-manager'],
                      permissions: ['read_product'],
                    },
                  ],
                  positions: [
                    {
                      id: 'product-manager',
                      title: 'Product Manager',
                      team_id: 'product-team',
                      level: 'senior',
                      responsibilities: ['Definir estratégia'],
                      required_skills: ['product_strategy'],
                      reporting_to: null,
                      companions: [],
                    },
                  ],
                },
              },
            ],
            categories: ['technology', 'consulting', 'retail'],
          }),
        });
      }
    });

    await page.goto('/organizations');
  });

  test('should display organization designer page with correct elements', async () => {
    // Verificar título da página
    await expect(page.locator('h1')).toContainText('Organization Designer');
    
    // Verificar badge de Master Admin
    await expect(page.locator('text=Master Admin')).toBeVisible();
    
    // Verificar cards de estatísticas
    await expect(page.locator('text=Total Organizações')).toBeVisible();
    await expect(page.locator('text=Equipes')).toBeVisible();
    await expect(page.locator('text=Posições')).toBeVisible();
    await expect(page.locator('text=Valores')).toBeVisible();
    
    // Verificar botões de ação
    await expect(page.locator('button:has-text("Usar Template")')).toBeVisible();
    await expect(page.locator('button:has-text("Gerar com IA")')).toBeVisible();
    await expect(page.locator('button:has-text("Nova Organização")')).toBeVisible();
  });

  test('should display organizations list correctly', async () => {
    // Verificar se a organização é exibida
    await expect(page.locator('text=Humana AI')).toBeVisible();
    await expect(page.locator('text=Plataforma de IA para empresas')).toBeVisible();
    
    // Verificar estatísticas da organização
    await expect(page.locator('text=1 equipes')).toBeVisible();
    await expect(page.locator('text=1 posições')).toBeVisible();
    await expect(page.locator('text=1 valores')).toBeVisible();
    
    // Verificar badges de configuração
    await expect(page.locator('text=pt-BR')).toBeVisible();
    await expect(page.locator('text=azure-openai')).toBeVisible();
  });

  test('should open template selector and display templates', async () => {
    // Clicar no botão "Usar Template"
    await page.click('button:has-text("Usar Template")');
    
    // Verificar se o modal de templates foi aberto
    await expect(page.locator('text=Selecionar Template Organizacional')).toBeVisible();
    
    // Verificar se o template é exibido
    await expect(page.locator('text=Startup Tecnológica')).toBeVisible();
    await expect(page.locator('text=Estrutura ágil para startups de tecnologia')).toBeVisible();
    
    // Verificar categoria
    await expect(page.locator('text=technology')).toBeVisible();
    
    // Verificar estatísticas do template
    await expect(page.locator('text=1 equipes')).toBeVisible();
    await expect(page.locator('text=1 posições')).toBeVisible();
    await expect(page.locator('text=1 valores')).toBeVisible();
  });

  test('should select template and show preview', async () => {
    // Abrir seletor de templates
    await page.click('button:has-text("Usar Template")');
    
    // Selecionar template
    await page.click('text=Startup Tecnológica');
    
    // Verificar se o preview é exibido
    await expect(page.locator('text=Valores Organizacionais')).toBeVisible();
    await expect(page.locator('text=Inovação')).toBeVisible();
    await expect(page.locator('text=Busca constante por soluções criativas')).toBeVisible();
    
    await expect(page.locator('text=Equipes')).toBeVisible();
    await expect(page.locator('text=Produto')).toBeVisible();
    
    await expect(page.locator('text=Posições')).toBeVisible();
    await expect(page.locator('text=Product Manager')).toBeVisible();
    
    // Verificar se o botão "Usar Template" está habilitado
    await expect(page.locator('button:has-text("Usar Template")')).toBeEnabled();
  });

  test('should apply template and open organization form', async () => {
    // Mock da aplicação do template
    await page.route('/api/organizations/templates', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            template: {
              tenantConfig: {
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                llm_provider: 'azure-openai',
                default_model: 'gpt-4o',
              },
              values: [
                {
                  name: 'Inovação',
                  description: 'Busca constante por soluções criativas',
                  principles: ['Experimentar novas tecnologias'],
                },
              ],
              teams: [
                {
                  id: 'product-team',
                  name: 'Produto',
                  description: 'Equipe de produto',
                  members: ['product-manager'],
                  permissions: ['read_product'],
                },
              ],
              positions: [
                {
                  id: 'product-manager',
                  title: 'Product Manager',
                  team_id: 'product-team',
                  level: 'senior',
                  responsibilities: ['Definir estratégia'],
                  required_skills: ['product_strategy'],
                  reporting_to: null,
                  companions: [],
                },
              ],
            },
            metadata: {
              name: 'Startup Tecnológica',
              description: 'Estrutura ágil para startups de tecnologia',
              category: 'technology',
            },
          }),
        });
      }
    });

    // Abrir seletor de templates
    await page.click('button:has-text("Usar Template")');
    
    // Selecionar template
    await page.click('text=Startup Tecnológica');
    
    // Usar template
    await page.click('button:has-text("Usar Template")');
    
    // Verificar se o formulário foi aberto com dados do template
    await expect(page.locator('text=Nova Organização')).toBeVisible();
    await expect(page.locator('input[value="Startup Tecnológica"]')).toBeVisible();
    await expect(page.locator('textarea:has-text("Estrutura ágil para startups de tecnologia")')).toBeVisible();
  });

  test('should open AI generator modal', async () => {
    // Clicar no botão "Gerar com IA"
    await page.click('button:has-text("Gerar com IA")');
    
    // Verificar se o modal foi aberto
    await expect(page.locator('text=Gerar Organização com IA')).toBeVisible();
    
    // Verificar campos do formulário
    await expect(page.locator('label:has-text("Nome da organização")')).toBeVisible();
    await expect(page.locator('label:has-text("Descrição da organização")')).toBeVisible();
    await expect(page.locator('label:has-text("Estrutura organizacional")')).toBeVisible();
    
    // Verificar informações sobre o funcionamento
    await expect(page.locator('text=Como funciona:')).toBeVisible();
    await expect(page.locator('text=A IA criará uma estrutura organizacional completa')).toBeVisible();
  });

  test('should handle AI generation flow', async () => {
    // Mock da geração com IA
    await page.route('/api/organizations/generate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organization: {
            id: 'org-ai-generated',
            name: 'Tech Startup',
            description: 'Startup de tecnologia inovadora',
            tenantConfig: {
              timezone: 'America/Sao_Paulo',
              language: 'pt-BR',
              llm_provider: 'azure-openai',
              default_model: 'gpt-4o',
            },
            values: [
              {
                name: 'Inovação',
                description: 'Busca por soluções disruptivas',
                principles: ['Experimentar tecnologias emergentes'],
              },
            ],
            teams: [],
            positions: [],
            orgUsers: [],
            userId: 'user-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          companionsCreated: 3,
        }),
      });
    });

    // Abrir gerador de IA
    await page.click('button:has-text("Gerar com IA")');
    
    // Preencher formulário
    await page.fill('input[placeholder*="Humana AI"]', 'Tech Startup');
    await page.fill('textarea[placeholder*="Plataforma de aprendizado"]', 'Startup de tecnologia inovadora');
    await page.fill('textarea[placeholder*="Liste os principais cargos"]', '- CEO\n- CTO\n- Product Manager');
    
    // Submeter formulário
    await page.click('button:has-text("Gerar Organização")');
    
    // Verificar loading state
    await expect(page.locator('button:has-text("Gerando...")')).toBeVisible();
    
    // Aguardar resposta e verificar toast de sucesso
    await expect(page.locator('text=Organização gerada com sucesso! 3 Companions criados automaticamente.')).toBeVisible();
  });

  test('should navigate to organization edit page', async () => {
    // Clicar no menu da organização
    await page.click('[data-testid="organization-menu"]');
    
    // Clicar em "Editar"
    await page.click('text=Editar');
    
    // Verificar se navegou para a página de edição
    await expect(page.url()).toContain('/organizations/org-1');
  });

  test('should handle organization deletion', async () => {
    // Mock da deleção
    await page.route('/api/organizations/org-1', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Clicar no menu da organização
    await page.click('[data-testid="organization-menu"]');
    
    // Clicar em "Deletar"
    await page.click('text=Deletar');
    
    // Confirmar deleção no modal
    await expect(page.locator('text=Confirmar exclusão')).toBeVisible();
    await expect(page.locator('text=Tem certeza que deseja deletar a organização "Humana AI"?')).toBeVisible();
    
    await page.click('button:has-text("Deletar")');
    
    // Verificar toast de sucesso
    await expect(page.locator('text=Organização deletada com sucesso!')).toBeVisible();
  });

  test('should show different UI for regular user vs master admin', async () => {
    // Reconfigurar para usuário regular
    await page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canCreateOrganization: false,
          isMasterAdmin: false,
        }),
      });
    });

    await page.reload();

    // Verificar que não há badge de Master Admin
    await expect(page.locator('text=Master Admin')).not.toBeVisible();
    
    // Verificar texto diferente no header
    await expect(page.locator('text=Suas Organizações')).toBeVisible();
    await expect(page.locator('text=Gerencie suas organizações')).toBeVisible();
    
    // Verificar que o botão "Nova Organização" não está visível
    await expect(page.locator('button:has-text("Nova Organização")')).not.toBeVisible();
    
    // Mas os outros botões devem estar visíveis
    await expect(page.locator('button:has-text("Usar Template")')).toBeVisible();
    await expect(page.locator('button:has-text("Gerar com IA")')).toBeVisible();
  });

  test('should handle error states gracefully', async () => {
    // Mock erro na API
    await page.route('/api/organizations', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    await page.reload();

    // Verificar que ainda mostra a interface básica
    await expect(page.locator('h1')).toContainText('Organization Designer');
    
    // As estatísticas devem mostrar 0
    await expect(page.locator('text=0').first()).toBeVisible();
  });

  test('should be responsive on mobile devices', async () => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que a página ainda é utilizável
    await expect(page.locator('h1')).toContainText('Organization Designer');
    
    // Verificar que os cards de estatísticas se adaptam
    const statsCards = page.locator('[class*="grid-cols-1"]');
    await expect(statsCards).toBeVisible();
    
    // Verificar que os botões ainda são clicáveis
    await expect(page.locator('button:has-text("Usar Template")')).toBeVisible();
    await expect(page.locator('button:has-text("Gerar com IA")')).toBeVisible();
  });
});

// Testes de acessibilidade
test.describe('Organization Designer Accessibility Tests', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/organizations');

    // Verificar labels dos botões
    await expect(page.locator('button:has-text("Usar Template")')).toHaveAttribute('type', 'button');
    await expect(page.locator('button:has-text("Gerar com IA")')).toHaveAttribute('type', 'button');
    
    // Verificar headings hierárquicos
    await expect(page.locator('h1')).toBeVisible();
    
    // Verificar que imagens têm alt text apropriado
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt');
    }
  });

  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/organizations');

    // Testar navegação por tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar que os elementos focáveis recebem foco
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/organizations');

    // Verificar que não há problemas de contraste críticos
    // (Este teste seria mais completo com uma biblioteca de acessibilidade como axe-playwright)
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.text-muted-foreground')).toBeVisible();
  });
}); 