import type { Page, Locator } from '@playwright/test';
import { expect } from '../fixtures';
import { AuthHelper } from '../helpers/auth-helper';

export class AdminPage {
  // Locators para elementos da página
  readonly page: Page;
  readonly authHelper: AuthHelper;
  readonly pageTitle: Locator;
  readonly usersCard: Locator;
  readonly teamsCard: Locator;
  readonly rolesCard: Locator;
  readonly masterAdminCard: Locator;
  readonly debugPermissions: Locator;
  readonly systemOverview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authHelper = new AuthHelper(page);
    this.pageTitle = page.locator('h1');
    this.usersCard = page.locator('a[href="/admin/users"]');
    this.teamsCard = page.locator('a[href="/admin/teams"]');
    this.rolesCard = page.locator('a[href="/admin/roles"]');
    this.masterAdminCard = page.locator('a[href="/admin/master"]');
    this.debugPermissions = page.locator('[data-testid="debug-permissions"]');
    this.systemOverview = page.locator('text=Visão Geral do Sistema');
  }

  // Navegação com autenticação Master Admin
  async gotoAsMasterAdmin() {
    await this.authHelper.loginAsMasterAdmin();
    await this.page.goto('/admin');
    await expect(this.pageTitle).toContainText('Dashboard Administrativo');
  }

  // Navegação com autenticação Admin
  async gotoAsAdmin() {
    await this.authHelper.loginAsAdmin();
    await this.page.goto('/admin');
    await expect(this.pageTitle).toContainText('Dashboard Administrativo');
  }

  // Navegação como usuário comum (deve dar acesso negado)
  async gotoAsUser() {
    await this.authHelper.loginAsUser();
    await this.page.goto('/admin');
    // Para usuário comum, esperamos "Acesso Negado"
    await expect(this.pageTitle).toContainText('Acesso Negado');
  }

  // Navegação original (mantida para compatibilidade)
  async goto() {
    await this.gotoAsMasterAdmin(); // Por padrão, usa Master Admin
  }

  // Mock de permissões
  async mockMasterAdminPermissions() {
    await this.page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.invite', 'users.manage_roles',
            'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 'teams.manage_members',
            'companions.view', 'companions.create', 'companions.edit', 'companions.delete', 'companions.manage_sharing',
            'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete', 'organizations.manage_settings',
            'admin.view_dashboard', 'admin.manage_system', 'admin.view_logs', 'admin.manage_integrations', 'admin.roles'
          ],
          roles: ['master_admin'],
          isMasterAdmin: true
        })
      });
    });
  }

  async mockAdminPermissions() {
    await this.page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.invite',
            'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 'teams.manage_members',
            'companions.view', 'companions.create', 'companions.edit', 'companions.delete', 'companions.manage_sharing',
            'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete', 'organizations.manage_settings',
            'admin.view_dashboard', 'admin.manage_system', 'admin.view_logs', 'admin.manage_integrations'
          ],
          roles: ['admin'],
          isMasterAdmin: false
        })
      });
    });
  }

  async mockUserPermissions() {
    await this.page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: ['companions.view', 'companions.create', 'companions.edit'],
          roles: ['user'],
          isMasterAdmin: false
        })
      });
    });
  }

  // Mock de dados
  async mockUsersData() {
    await this.page.route('/api/admin/users', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Eduardo Ibrahim',
            email: 'eduibrahim@yahoo.com.br',
            role: 'master_admin',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'João Silva',
            email: 'joao@teste.com',
            role: 'admin',
            createdAt: '2024-01-02T00:00:00Z'
          }
        ])
      });
    });
  }

  async mockTeamsData() {
    await this.page.route('/api/admin/teams', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Desenvolvimento',
            description: 'Equipe de desenvolvimento de software',
            membersCount: 5,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Design',
            description: 'Equipe de design e UX',
            membersCount: 3,
            createdAt: '2024-01-02T00:00:00Z'
          }
        ])
      });
    });
  }

  // Verificações de permissões (corrigidas para evitar strict mode violations)
  async verifyMasterAdminAccess() {
    await expect(this.usersCard).toBeVisible();
    await expect(this.teamsCard).toBeVisible();
    await expect(this.rolesCard).toBeVisible();
    await expect(this.masterAdminCard).toBeVisible();
    
    // Usar seletores mais específicos para evitar múltiplas correspondências
    await expect(this.usersCard.locator('h3:has-text("Usuários")')).toBeVisible();
    await expect(this.teamsCard.locator('h3:has-text("Times")')).toBeVisible();
    await expect(this.rolesCard.locator('h3:has-text("Roles & Permissões")')).toBeVisible();
    await expect(this.masterAdminCard.locator('h3:has-text("Administração Master")')).toBeVisible();
  }

  async verifyAdminAccess() {
    await expect(this.usersCard).toBeVisible();
    await expect(this.teamsCard).toBeVisible();
    
    // Usar seletores mais específicos
    await expect(this.usersCard.locator('h3:has-text("Usuários")')).toBeVisible();
    await expect(this.teamsCard.locator('h3:has-text("Times")')).toBeVisible();
    
    // Admin não deve ver Roles e Master Admin (devem estar com opacity-50)
    await expect(this.page.locator('text=🔒 Sem acesso').first()).toBeVisible();
  }

  async verifyUserAccessDenied() {
    await expect(this.page.locator('text=Você não tem permissão')).toBeVisible();
    await expect(this.usersCard).not.toBeVisible();
  }

  // Ações de interface (adaptadas para a estrutura atual)
  async openUsersSection() {
    await this.usersCard.click();
    await this.page.waitForURL('**/admin/users');
  }

  async openTeamsSection() {
    await this.teamsCard.click();
    await this.page.waitForURL('**/admin/teams');
  }

  async verifyUsersSection() {
    await expect(this.usersCard).toBeVisible();
    await expect(this.usersCard.locator('text=Gerencie usuários, roles e permissões')).toBeVisible();
  }

  async verifyTeamsSection() {
    await expect(this.teamsCard).toBeVisible();
    await expect(this.teamsCard.locator('text=Organize usuários em equipes')).toBeVisible();
  }

  // Screenshots para documentação
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/screenshots/admin-${name}.png`,
      fullPage: true 
    });
  }
}

// Modal classes para testes específicos (mantidas para compatibilidade, mas não usadas na página atual)
export class InviteUserModal {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.roleSelect = page.locator('select[name="role"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancelar")');
  }

  async fillAndSubmit(email: string, role: string) {
    await this.emailInput.fill(email);
    await this.roleSelect.selectOption(role);
    await this.submitButton.click();
    
    // Aguardar feedback de sucesso
    await expect(this.page.locator('text=Convite enviado')).toBeVisible();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}

export class CreateTeamModal {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async fillAndSubmit(name: string, description: string) {
    await this.nameInput.fill(name);
    await this.descriptionTextarea.fill(description);
    await this.submitButton.click();
    
    // Aguardar feedback de sucesso
    await expect(this.page.locator('text=Equipe criada')).toBeVisible();
  }
} 