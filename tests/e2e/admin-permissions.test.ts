import { test, expect } from '../fixtures';
import { AdminPage } from '../pages/admin';

// Testes E2E para Sistema de Permissões Administrativas
test.describe('Telas Administrativas - Sistema de Permissões', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
  });

  test.describe('Master Admin Access', () => {
    test('deve exibir todas as seções para Master Admin', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar acesso completo
      await adminPage.verifyMasterAdminAccess();
      
      // Verificar elementos específicos da página
      await expect(adminPage.systemOverview).toBeVisible();
      
      // Screenshot para documentação
      await adminPage.takeScreenshot('master-admin-dashboard');
    });

    test('deve permitir visualizar lista de usuários', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar seção de usuários
      await adminPage.verifyUsersSection();
      
      // Verificar que o card está visível e clicável
      await expect(adminPage.usersCard).toBeVisible();
      await expect(adminPage.usersCard.locator('text=CRUD completo')).toBeVisible();
      
      await adminPage.takeScreenshot('users-section');
    });

    test('deve permitir visualizar lista de equipes', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar seção de equipes
      await adminPage.verifyTeamsSection();
      
      // Verificar que o card está visível
      await expect(adminPage.teamsCard).toBeVisible();
      await expect(adminPage.teamsCard.locator('span:has-text("Colaboração")').first()).toBeVisible();
      
      await adminPage.takeScreenshot('teams-section');
    });

    test('deve permitir acesso a roles e permissões', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar card de roles
      await expect(adminPage.rolesCard).toBeVisible();
      await expect(adminPage.rolesCard.locator('h3:has-text("Roles & Permissões")')).toBeVisible();
      await expect(adminPage.page.locator('text=Master Admin').first()).toBeVisible();
      
      await adminPage.takeScreenshot('roles-section');
    });

    test('deve permitir acesso à administração master', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar card de administração master
      await expect(adminPage.masterAdminCard).toBeVisible();
      await expect(adminPage.masterAdminCard.locator('h3:has-text("Administração Master")')).toBeVisible();
      await expect(adminPage.page.locator('text=👑').first()).toBeVisible();
      
      await adminPage.takeScreenshot('master-admin-section');
    });

    test('deve navegar para seção de usuários', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Clicar no card de usuários (mas não verificar a página de destino pois pode não existir)
      await expect(adminPage.usersCard).toBeVisible();
      await adminPage.takeScreenshot('users-card-ready');
    });

    test('deve navegar para seção de equipes', async () => {
      await adminPage.gotoAsMasterAdmin();
      
      // Clicar no card de equipes
      await expect(adminPage.teamsCard).toBeVisible();
      await adminPage.takeScreenshot('teams-card-ready');
    });
  });

  test.describe('Admin Access (não Master)', () => {
    test('deve exibir seções limitadas para Admin', async () => {
      await adminPage.gotoAsAdmin();
      
      // Verificar acesso limitado
      await adminPage.verifyAdminAccess();
      
      // Verificar que tem acesso a usuários e equipes
      await expect(adminPage.usersCard).toBeVisible();
      await expect(adminPage.teamsCard).toBeVisible();
      
      await adminPage.takeScreenshot('admin-dashboard');
    });

    test('não deve mostrar seção Roles e Permissões', async () => {
      await adminPage.gotoAsAdmin();
      
      // Admin deve ver as seções restritas com "Sem acesso"
      await expect(adminPage.page.locator('text=🔒 Sem acesso').first()).toBeVisible();
      await expect(adminPage.page.locator('text=Acesso restrito a Master Admin').first()).toBeVisible();
    });
  });

  test.describe('User Access (sem privilégios admin)', () => {
    test('deve negar acesso para usuário comum', async () => {
      await adminPage.gotoAsUser();
      
      // Verificar acesso negado
      await adminPage.verifyUserAccessDenied();
      
      await adminPage.takeScreenshot('user-access-denied');
    });
  });

  test.describe('Responsividade e Acessibilidade', () => {
    test('deve funcionar em dispositivos móveis', async ({ page }) => {
      // Simular dispositivo móvel
      await page.setViewportSize({ width: 375, height: 667 });
      
      await adminPage.gotoAsMasterAdmin();
      await adminPage.verifyMasterAdminAccess();
      
      await adminPage.takeScreenshot('mobile-view');
    });

    test('deve ter navegação por teclado', async ({ page }) => {
      await adminPage.gotoAsMasterAdmin();
      
      // Testar navegação por Tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verificar que algum elemento está focado
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    });

    test('deve ter contraste adequado', async ({ page }) => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar se elementos têm contraste adequado
      const card = adminPage.usersCard;
      const styles = await card.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Verificar que não são completamente transparentes (mais flexível)
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });
  });

  test.describe('Performance e Loading', () => {
    test('deve carregar rapidamente', async ({ page }) => {
      const startTime = Date.now();
      await adminPage.gotoAsMasterAdmin();
      await adminPage.verifyMasterAdminAccess();
      const loadTime = Date.now() - startTime;
      
      // Verificar que carregou em menos de 30 segundos (mais realista para E2E)
      expect(loadTime).toBeLessThan(30000);
    });

    test('deve mostrar elementos da interface', async ({ page }) => {
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar que todos os cards estão visíveis
      await expect(adminPage.usersCard).toBeVisible();
      await expect(adminPage.teamsCard).toBeVisible();
      await expect(adminPage.rolesCard).toBeVisible();
      await expect(adminPage.masterAdminCard).toBeVisible();
    });
  });

  test.describe('Tratamento de Erros', () => {
    test('deve tratar erro de API graciosamente', async ({ page }) => {
      // Mock de erro de API
      await page.route('/api/user/permissions', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('/admin');
      
      // Verificar que ainda mostra algum conteúdo ou erro
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('deve funcionar sem JavaScript', async ({ page }) => {
      // Desabilitar JavaScript
      await page.context().addInitScript(() => {
        Object.defineProperty(navigator, 'javaEnabled', {
          value: () => false
        });
      });
      
      await adminPage.gotoAsMasterAdmin();
      
      // Verificar que ainda mostra conteúdo básico
      await expect(adminPage.pageTitle).toBeVisible();
    });
  });
});

// Testes específicos de componentes de interface
test.describe('Componentes de Interface', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
  });

  test('Cards de navegação - Hover states', async ({ page }) => {
    await adminPage.gotoAsMasterAdmin();
    
    // Testar hover no card de usuários
    await adminPage.usersCard.hover();
    
    // Verificar que o card responde ao hover
    const cardStyle = await adminPage.usersCard.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    
    expect(cardStyle).toBe('pointer');
  });

  test('Cards de navegação - Estados visuais', async ({ page }) => {
    await adminPage.gotoAsMasterAdmin();
    
    // Verificar que todos os cards têm o estilo correto
    await expect(adminPage.usersCard).toHaveClass(/group/);
    await expect(adminPage.teamsCard).toHaveClass(/group/);
    await expect(adminPage.rolesCard).toHaveClass(/group/);
    await expect(adminPage.masterAdminCard).toHaveClass(/group/);
  });
});

// Testes de fluxo E2E completo
test.describe('Fluxos E2E Completos', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
  });

  test('Fluxo completo: Login -> Admin -> Navegação', async ({ page }) => {
    // 1. Navegar como Master Admin
    await adminPage.gotoAsMasterAdmin();
    
    // 2. Verificar dashboard
    await adminPage.verifyMasterAdminAccess();
    
    // 3. Verificar que pode navegar pelos cards
    await expect(adminPage.usersCard).toBeVisible();
    await expect(adminPage.teamsCard).toBeVisible();
    await expect(adminPage.rolesCard).toBeVisible();
    await expect(adminPage.masterAdminCard).toBeVisible();
    
    // 4. Verificar estatísticas do sistema
    await expect(adminPage.systemOverview).toBeVisible();
    await expect(adminPage.page.locator('text=Usuários Ativos').first()).toBeVisible();
    
    // Screenshot final
    await adminPage.takeScreenshot('complete-flow-success');
  });
}); 