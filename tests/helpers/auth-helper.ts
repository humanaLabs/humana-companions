import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  // Mock de usuário Master Admin
  async loginAsMasterAdmin() {
    await this.page.route('**/api/user/permissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: [
            'admin_dashboard.manage',
            'users.manage',
            'teams.manage',
            'permissions.manage',
            'admin.roles',
            'organizations.manage',
            'companions.manage',
            'chats.manage',
            'documents.manage',
            'folders.manage'
          ],
          roleId: 'super_admin',
          isMasterAdmin: true,
          organizationId: 'test-org',
          teamIds: ['test-team']
        })
      });
    });

    // Mock de sessão de usuário
    await this.page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-master-admin',
            email: 'master@test.com',
            name: 'Master Admin Test',
            role: 'super_admin'
          }
        })
      });
    });

    // Mock de lista de usuários
    await this.page.route('**/api/admin/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            email: 'user1@test.com',
            name: 'User 1',
            role: 'user'
          },
          {
            id: '2',
            email: 'user2@test.com',
            name: 'User 2',
            role: 'admin'
          }
        ])
      });
    });

    // Mock de lista de equipes
    await this.page.route('**/api/admin/teams', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Equipe Alpha',
            description: 'Equipe de desenvolvimento'
          },
          {
            id: '2',
            name: 'Equipe Beta',
            description: 'Equipe de testes'
          }
        ])
      });
    });

    // Mock de convite de usuário
    await this.page.route('**/api/admin/users/invite', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Convite enviado com sucesso'
        })
      });
    });
  }

  // Mock de usuário Admin (não Master)
  async loginAsAdmin() {
    await this.page.route('**/api/user/permissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: [
            'admin_dashboard.manage',
            'users.manage',
            'teams.manage',
            'companions.manage',
            'chats.read',
            'documents.manage',
            'folders.manage'
          ],
          roleId: 'admin',
          isMasterAdmin: false,
          organizationId: 'test-org',
          teamIds: ['test-team']
        })
      });
    });

    await this.page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-admin',
            email: 'admin@test.com',
            name: 'Admin Test',
            role: 'admin'
          }
        })
      });
    });
  }

  // Mock de usuário comum (sem privilégios admin)
  async loginAsUser() {
    await this.page.route('**/api/user/permissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: [
            'companions.manage',
            'chats.manage',
            'documents.manage',
            'folders.manage'
          ],
          roleId: 'user',
          isMasterAdmin: false,
          organizationId: 'test-org',
          teamIds: []
        })
      });
    });

    await this.page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user',
            email: 'user@test.com',
            name: 'User Test',
            role: 'user'
          }
        })
      });
    });
  }

  // Mock de erro de API
  async mockApiError(endpoint: string, status: number = 500) {
    await this.page.route(`**${endpoint}`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'API Error for testing'
        })
      });
    });
  }

  // Limpar todos os mocks
  async clearMocks() {
    await this.page.unrouteAll();
  }
} 