import { test, expect } from '../fixtures';
import { AdminPage, InviteUserModal, CreateTeamModal } from '../pages/admin';

test.describe('Telas Administrativas - Sistema de Permissões', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    
    // Mock de autenticação básica
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
  });

  test.describe('Master Admin Access', () => {
    test.beforeEach(async () => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.mockTeamsData();
    });

    test('deve exibir todas as seções para Master Admin', async () => {
      await adminPage.goto();
      
      // Verificar acesso completo
      await adminPage.verifyMasterAdminAccess();
      
      // Verificar debug de permissões
      await expect(adminPage.debugPermissions).toBeVisible();
      await expect(adminPage.page.locator('text=Master Admin: ✅')).toBeVisible();
      
      // Screenshot para documentação
      await adminPage.takeScreenshot('master-admin-dashboard');
    });

    test('deve permitir visualizar lista de usuários', async () => {
      await adminPage.goto();
      
      // Verificar seção de usuários
      await adminPage.verifyUsersSection();
      
      // Verificar dados mockados
      await expect(adminPage.page.locator('text=Eduardo Ibrahim')).toBeVisible();
      await expect(adminPage.page.locator('text=master_admin')).toBeVisible();
      
      await adminPage.takeScreenshot('users-list');
    });

    test('deve permitir visualizar lista de equipes', async () => {
      await adminPage.goto();
      
      // Verificar seção de equipes
      await adminPage.verifyTeamsSection();
      
      // Verificar dados mockados
      await expect(adminPage.page.locator('text=5 membros')).toBeVisible();
      
      await adminPage.takeScreenshot('teams-list');
    });

    test('deve abrir modal de convite de usuário', async () => {
      await adminPage.goto();
      
      // Abrir modal
      const modal = await adminPage.openInviteUserModal();
      
      // Verificar elementos do modal
      await expect(modal.emailInput).toBeVisible();
      await expect(modal.roleSelect).toBeVisible();
      await expect(modal.submitButton).toBeVisible();
      
      await adminPage.takeScreenshot('invite-user-modal');
    });

    test('deve enviar convite de usuário com sucesso', async () => {
      await adminPage.goto();
      
      // Abrir modal e preencher
      const modal = await adminPage.openInviteUserModal();
      await modal.fillAndSubmit('novo@usuario.com', 'admin');
      
      // Verificar sucesso (toast já verificado no modal)
      await adminPage.takeScreenshot('invite-success');
    });

    test('deve cancelar modal de convite', async () => {
      await adminPage.goto();
      
      const modal = await adminPage.openInviteUserModal();
      await modal.cancel();
      
      // Modal deve estar fechado
      await expect(adminPage.page.locator('text=Convidar Usuário')).not.toBeVisible();
    });

    test('deve criar nova equipe', async () => {
      await adminPage.goto();
      
      const modal = await adminPage.openCreateTeamModal();
      await modal.fillAndSubmit('Marketing', 'Equipe de marketing digital');
      
      await adminPage.takeScreenshot('team-created');
    });
  });

  test.describe('Admin Access (não Master)', () => {
    test.beforeEach(async () => {
      await adminPage.mockAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.mockTeamsData();
    });

    test('deve exibir seções limitadas para Admin', async () => {
      await adminPage.goto();
      
      // Verificar acesso limitado
      await adminPage.verifyAdminAccess();
      
      // Verificar debug de permissões
      await expect(adminPage.page.locator('text=Master Admin: ❌')).toBeVisible();
      await expect(adminPage.page.locator('text=Admin: ✅')).toBeVisible();
      
      await adminPage.takeScreenshot('admin-dashboard');
    });

    test('não deve mostrar seção Roles e Permissões', async () => {
      await adminPage.goto();
      
      await expect(adminPage.page.locator('text=Roles e Permissões')).not.toBeVisible();
      await expect(adminPage.page.locator('text=Administração Master')).not.toBeVisible();
    });
  });

  test.describe('User Access (sem privilégios admin)', () => {
    test.beforeEach(async () => {
      await adminPage.mockUserPermissions();
    });

    test('deve negar acesso para usuário comum', async () => {
      await adminPage.goto();
      
      // Verificar acesso negado
      await adminPage.verifyUserAccessDenied();
      
      // Verificar debug de permissões
      await expect(adminPage.page.locator('text=Master Admin: ❌')).toBeVisible();
      await expect(adminPage.page.locator('text=Admin: ❌')).toBeVisible();
      
      await adminPage.takeScreenshot('user-access-denied');
    });
  });

  test.describe('Responsividade e Acessibilidade', () => {
    test.beforeEach(async () => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
    });

    test('deve funcionar em dispositivos móveis', async ({ page }) => {
      // Simular dispositivo móvel
      await page.setViewportSize({ width: 375, height: 667 });
      
      await adminPage.goto();
      await adminPage.verifyMasterAdminAccess();
      
      await adminPage.takeScreenshot('mobile-view');
    });

    test('deve ter navegação por teclado', async ({ page }) => {
      await adminPage.goto();
      
      // Testar navegação por Tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verificar se modal abriu
      await expect(page.locator('text=Convidar Usuário')).toBeVisible();
    });

    test('deve ter contraste adequado', async ({ page }) => {
      await adminPage.goto();
      
      // Verificar se elementos têm contraste adequado
      const button = adminPage.inviteUserButton;
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Verificar que não são transparentes
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  test.describe('Performance e Loading', () => {
    test('deve carregar rapidamente', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      
      const startTime = Date.now();
      await adminPage.goto();
      await adminPage.verifyMasterAdminAccess();
      const loadTime = Date.now() - startTime;
      
      // Verificar que carregou em menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);
    });

    test('deve mostrar loading states', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      
      // Mock de API lenta
      await page.route('/api/admin/users', (route) => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }, 1000);
      });
      
      await adminPage.goto();
      
      // Verificar loading state
      await expect(page.locator('text=Carregando')).toBeVisible();
    });
  });

  test.describe('Tratamento de Erros', () => {
    test('deve tratar erro de API graciosamente', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      
      // Mock de erro de API
      await page.route('/api/admin/users', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erro interno do servidor' })
        });
      });
      
      await adminPage.goto();
      
      // Verificar mensagem de erro
      await expect(page.locator('text=Erro ao carregar')).toBeVisible();
      
      await adminPage.takeScreenshot('error-state');
    });

    test('deve validar formulários', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();
      
      const modal = await adminPage.openInviteUserModal();
      
      // Tentar submeter sem preencher
      await modal.submitButton.click();
      
      // Verificar validação
      await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    });
  });
});

// Testes específicos para componentes individuais
test.describe('Componentes de Modais', () => {
  test('Modal de Convite - Validação de Email', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.mockMasterAdminPermissions();
    await adminPage.goto();
    
    const modal = await adminPage.openInviteUserModal();
    
    // Testar email inválido
    await modal.emailInput.fill('email-invalido');
    await modal.submitButton.click();
    
    await expect(page.locator('text=Email inválido')).toBeVisible();
  });

  test('Modal de Equipe - Campos Obrigatórios', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.mockMasterAdminPermissions();
    await adminPage.goto();
    
    const modal = await adminPage.openCreateTeamModal();
    
    // Tentar submeter sem nome
    await modal.descriptionTextarea.fill('Descrição sem nome');
    await modal.submitButton.click();
    
    await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
  });
});

// Testes de integração E2E completos
test.describe('Fluxos E2E Completos', () => {
  test('Fluxo completo: Login -> Admin -> Convite -> Sucesso', async ({ page }) => {
    const adminPage = new AdminPage(page);
    
    // 1. Mock de login
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
    
    // 2. Mock de permissões
    await adminPage.mockMasterAdminPermissions();
    
    // 3. Navegar para admin
    await adminPage.goto();
    
    // 4. Verificar acesso
    await adminPage.verifyMasterAdminAccess();
    
    // 5. Convidar usuário
    const modal = await adminPage.openInviteUserModal();
    await modal.fillAndSubmit('teste@fluxo.com', 'manager');
    
    // 6. Verificar sucesso final
    await expect(page.locator('text=Convite enviado!')).toBeVisible();
    
    // Screenshot do fluxo completo
    await adminPage.takeScreenshot('e2e-complete-flow');
  });
}); 