import type { Page, Locator } from '@playwright/test';
import { expect } from '../fixtures';

export class AdminPage {
  // Locators para elementos da página
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly inviteUserButton: Locator;
  readonly createTeamButton: Locator;
  readonly createRoleButton: Locator;
  readonly debugPermissions: Locator;
  readonly usersList: Locator;
  readonly teamsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.inviteUserButton = page.locator('[data-testid="invite-user-btn"]');
    this.createTeamButton = page.locator('[data-testid="create-team-btn"]');
    this.createRoleButton = page.locator('[data-testid="create-role-btn"]');
    this.debugPermissions = page.locator('[data-testid="debug-permissions"]');
    this.usersList = page.locator('[data-testid="users-list"]');
    this.teamsList = page.locator('[data-testid="teams-list"]');
  }

  // Navegação
  async goto() {
    await this.page.goto('/admin');
    await expect(this.pageTitle).toContainText('Administração');
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

  // Verificações de permissões
  async verifyMasterAdminAccess() {
    await expect(this.page.locator('text=Gestão de Usuários')).toBeVisible();
    await expect(this.page.locator('text=Gestão de Equipes')).toBeVisible();
    await expect(this.page.locator('text=Roles e Permissões')).toBeVisible();
    await expect(this.page.locator('text=Administração Master')).toBeVisible();
  }

  async verifyAdminAccess() {
    await expect(this.page.locator('text=Gestão de Usuários')).toBeVisible();
    await expect(this.page.locator('text=Gestão de Equipes')).toBeVisible();
    await expect(this.page.locator('text=Roles e Permissões')).not.toBeVisible();
    await expect(this.page.locator('text=Administração Master')).not.toBeVisible();
  }

  async verifyUserAccessDenied() {
    await expect(this.page.locator('text=Você não tem permissão')).toBeVisible();
    await expect(this.page.locator('text=Gestão de Usuários')).not.toBeVisible();
  }

  // Ações de interface
  async openInviteUserModal() {
    await this.inviteUserButton.click();
    await expect(this.page.locator('text=Convidar Usuário')).toBeVisible();
    return new InviteUserModal(this.page);
  }

  async openCreateTeamModal() {
    await this.createTeamButton.click();
    await expect(this.page.locator('text=Criar Nova Equipe')).toBeVisible();
    return new CreateTeamModal(this.page);
  }

  async verifyUsersSection() {
    await expect(this.usersList).toBeVisible();
    await expect(this.page.locator('text=Eduardo Ibrahim')).toBeVisible();
    await expect(this.page.locator('text=eduibrahim@yahoo.com.br')).toBeVisible();
  }

  async verifyTeamsSection() {
    await expect(this.teamsList).toBeVisible();
    await expect(this.page.locator('text=Desenvolvimento')).toBeVisible();
    await expect(this.page.locator('text=Equipe de desenvolvimento')).toBeVisible();
  }

  // Screenshots para documentação
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/screenshots/admin-${name}.png`,
      fullPage: true 
    });
  }
}

// Modal classes para testes específicos
export class InviteUserModal {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.roleSelect = page.locator('#role');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancelar")');
  }

  async fillAndSubmit(email: string, role: string) {
    await this.emailInput.fill(email);
    await this.roleSelect.selectOption(role);
    
    // Mock da API de convite
    await this.page.route('/api/admin/users/invite', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await this.submitButton.click();
    
    // Verificar toast de sucesso
    await expect(this.page.locator('text=Convite enviado!')).toBeVisible();
  }

  async cancel() {
    await this.cancelButton.click();
    await expect(this.page.locator('text=Convidar Usuário')).not.toBeVisible();
  }
}

export class CreateTeamModal {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name');
    this.descriptionTextarea = page.locator('#description');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async fillAndSubmit(name: string, description: string) {
    await this.nameInput.fill(name);
    await this.descriptionTextarea.fill(description);

    // Mock da API de criação
    await this.page.route('/api/admin/teams', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          id: '3',
          name,
          description,
          createdAt: new Date().toISOString()
        })
      });
    });

    await this.submitButton.click();
    
    // Verificar toast de sucesso
    await expect(this.page.locator(`text=Equipe "${name}" foi criada`)).toBeVisible();
  }
} 