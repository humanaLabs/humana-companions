import { test, expect } from '../fixtures';
import { AdminPage } from '../pages/admin';
import { 
  VisualTestHelper, 
  AccessibilityTestHelper, 
  PerformanceTestHelper,
  InteractionTestHelper 
} from '../helpers/visual-testing';

test.describe('Testes Visuais - Regressão', () => {
  let adminPage: AdminPage;
  let visualHelper: VisualTestHelper;
  let accessibilityHelper: AccessibilityTestHelper;
  let performanceHelper: PerformanceTestHelper;
  let interactionHelper: InteractionTestHelper;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    visualHelper = new VisualTestHelper(page);
    accessibilityHelper = new AccessibilityTestHelper(page);
    performanceHelper = new PerformanceTestHelper(page);
    interactionHelper = new InteractionTestHelper(page);

    // Setup básico
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

  test.describe('Screenshots de Baseline', () => {
    test('Admin Dashboard - Estados de Permissão', async ({ page }) => {
      // Cenários para documentação visual
      const scenarios = [
        {
          name: 'master-admin',
          setup: async () => {
            await adminPage.mockMasterAdminPermissions();
            await adminPage.mockUsersData();
            await adminPage.mockTeamsData();
            await adminPage.goto();
          },
          description: 'Dashboard completo para Master Admin'
        },
        {
          name: 'admin',
          setup: async () => {
            await adminPage.mockAdminPermissions();
            await adminPage.mockUsersData();
            await adminPage.mockTeamsData();
            await adminPage.goto();
          },
          description: 'Dashboard limitado para Admin'
        },
        {
          name: 'user-denied',
          setup: async () => {
            await adminPage.mockUserPermissions();
            await adminPage.goto();
          },
          description: 'Acesso negado para usuário comum'
        }
      ];

      await visualHelper.generateVisualDocumentation('admin-dashboard', scenarios);
    });

    test('Modais - Estados e Interações', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.goto();

      // Modal de Convite - Estados
      await interactionHelper.testComponentStates(
        '[data-testid="invite-user-modal"]',
        [
          {
            name: 'opened',
            action: async () => {
              await adminPage.openInviteUserModal();
            }
          },
          {
            name: 'filled',
            action: async () => {
              await page.locator('#email').fill('teste@exemplo.com');
              await page.locator('#role').selectOption('admin');
            }
          },
          {
            name: 'validation-error',
            action: async () => {
              await page.locator('#email').fill('email-invalido');
              await page.locator('button[type="submit"]').click();
            }
          }
        ],
        'invite-modal'
      );

      // Testar formulário completo
      await interactionHelper.testFormInteractions(
        '[data-testid="invite-user-modal"]',
        'invite-form'
      );
    });

    test('Responsividade - Múltiplos Dispositivos', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.goto();

      // Testar em diferentes tamanhos
      await visualHelper.testResponsiveScreenshots('admin-responsive');

      // Testar modal em mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await adminPage.openInviteUserModal();
      await visualHelper.takeFullPageScreenshot('modal-mobile');
    });

    test('Temas - Claro vs Escuro', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.goto();

      // Testar ambos os temas
      await visualHelper.testThemeScreenshots('admin-themes');

      // Testar modal nos dois temas
      await adminPage.openInviteUserModal();
      await visualHelper.testThemeScreenshots('modal-themes');
    });
  });

  test.describe('Comparação Visual', () => {
    test('Admin Dashboard - Comparar com Baseline', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.mockTeamsData();
      await adminPage.goto();

      // Comparar página completa
      await visualHelper.compareScreenshot('admin-dashboard-baseline');

      // Comparar seções específicas
      await visualHelper.compareElementScreenshot(
        '[data-testid="users-section"]',
        'users-section-baseline'
      );

      await visualHelper.compareElementScreenshot(
        '[data-testid="teams-section"]',
        'teams-section-baseline'
      );
    });

    test('Modais - Comparar Estados', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Modal fechado (não deve aparecer)
      await visualHelper.compareScreenshot('modal-closed-baseline');

      // Modal aberto
      await adminPage.openInviteUserModal();
      await visualHelper.compareElementScreenshot(
        '[data-testid="invite-user-modal"]',
        'invite-modal-baseline'
      );
    });
  });

  test.describe('Testes de Acessibilidade Visual', () => {
    test('Navegação por Teclado', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Testar navegação por Tab
      const focusableElements = await accessibilityHelper.testKeyboardNavigation();
      
      // Verificar que há elementos focáveis
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Verificar elementos importantes estão na lista
      expect(focusableElements.some(el => el.includes('invite-user-btn'))).toBeTruthy();
    });

    test('Contraste de Cores', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Verificar contraste dos botões principais
      const buttonStyles = await accessibilityHelper.checkColorContrast(
        '[data-testid="invite-user-btn"]'
      );

      expect(buttonStyles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('Atributos de Acessibilidade', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Verificar atributos ARIA
      const buttonAttributes = await accessibilityHelper.checkAccessibilityAttributes(
        '[data-testid="invite-user-btn"]'
      );

      // Botões importantes devem ter aria-label ou texto descritivo
      expect(
        buttonAttributes['aria-label'] || 
        await page.locator('[data-testid="invite-user-btn"]').textContent()
      ).toBeTruthy();
    });
  });

  test.describe('Testes de Performance Visual', () => {
    test('Tempo de Carregamento', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      
      const loadTime = await performanceHelper.measureLoadTime();
      
      // Página deve carregar em menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`Admin Dashboard carregou em ${loadTime}ms`);
    });

    test('Core Web Vitals', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      const vitals = await performanceHelper.measureCoreWebVitals();
      
      // Log dos resultados (pode ser usado para monitoramento)
      console.log('Core Web Vitals:', vitals);
      
      // Verificações básicas se disponíveis
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      }
    });

    test('Uso de Memória', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      const memoryBefore = await performanceHelper.measureMemoryUsage();
      
      // Executar ações que podem consumir memória
      for (let i = 0; i < 5; i++) {
        await adminPage.openInviteUserModal();
        await page.locator('button:has-text("Cancelar")').click();
      }

      const memoryAfter = await performanceHelper.measureMemoryUsage();
      
      if (memoryBefore && memoryAfter) {
        console.log('Memória antes:', memoryBefore.usedJSHeapSize);
        console.log('Memória depois:', memoryAfter.usedJSHeapSize);
        
        // Verificar que não há vazamentos enormes
        const memoryIncrease = memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB
      }
    });
  });

  test.describe('Testes de Interação Visual', () => {
    test('Hover States', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Testar hover em botões principais
      const buttonsToTest = [
        '[data-testid="invite-user-btn"]',
        '[data-testid="create-team-btn"]',
        '[data-testid="create-role-btn"]'
      ];

      await interactionHelper.testHoverStates(buttonsToTest, 'admin-buttons');
    });

    test('Animações de Modal', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.goto();

      // Testar animação de abertura do modal
      await interactionHelper.testAnimations(
        async () => {
          await adminPage.inviteUserButton.click();
        },
        '[data-testid="invite-user-modal"]',
        300, // 300ms de duração
        'modal-open-animation'
      );
    });

    test('Estados de Loading', async ({ page }) => {
      await adminPage.mockMasterAdminPermissions();
      
      // Mock de API lenta para capturar loading
      await page.route('/api/admin/users', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await adminPage.goto();

      // Capturar estado de loading
      await visualHelper.takeFullPageScreenshot('loading-state');
      
      // Aguardar carregamento completo
      await page.waitForLoadState('networkidle');
      await visualHelper.takeFullPageScreenshot('loaded-state');
    });
  });

  test.describe('Cross-Browser Visual Testing', () => {
    test('Chrome vs Firefox Comparison', async ({ page, browserName }) => {
      await adminPage.mockMasterAdminPermissions();
      await adminPage.mockUsersData();
      await adminPage.goto();

      // Screenshot específico do browser
      await visualHelper.takeFullPageScreenshot(`admin-${browserName}`);
      
      // Testar modal
      await adminPage.openInviteUserModal();
      await visualHelper.takeFullPageScreenshot(`modal-${browserName}`);
    });
  });
});

// Teste específico para documentação visual
test.describe('Documentação Visual Automatizada', () => {
  test('Gerar Screenshots para Documentação', async ({ page }) => {
    const adminPage = new AdminPage(page);
    const visualHelper = new VisualTestHelper(page);

    // Cenários para documentação
    const documentationScenarios = [
      {
        name: 'overview',
        setup: async () => {
          await adminPage.mockMasterAdminPermissions();
          await adminPage.mockUsersData();
          await adminPage.mockTeamsData();
          await adminPage.goto();
        },
        description: 'Visão geral do painel administrativo'
      },
      {
        name: 'user-management',
        setup: async () => {
          await adminPage.mockMasterAdminPermissions();
          await adminPage.mockUsersData();
          await adminPage.goto();
          // Scroll para seção de usuários
          await page.locator('[data-testid="users-section"]').scrollIntoViewIfNeeded();
        },
        description: 'Gestão de usuários'
      },
      {
        name: 'team-management',
        setup: async () => {
          await adminPage.mockMasterAdminPermissions();
          await adminPage.mockTeamsData();
          await adminPage.goto();
          // Scroll para seção de equipes
          await page.locator('[data-testid="teams-section"]').scrollIntoViewIfNeeded();
        },
        description: 'Gestão de equipes'
      },
      {
        name: 'invite-workflow',
        setup: async () => {
          await adminPage.mockMasterAdminPermissions();
          await adminPage.goto();
          await adminPage.openInviteUserModal();
          await page.locator('#email').fill('novo@usuario.com');
          await page.locator('#role').selectOption('admin');
        },
        description: 'Fluxo de convite de usuários'
      }
    ];

    await visualHelper.generateVisualDocumentation('admin', documentationScenarios);
  });
});

test.describe('Testes Visuais - Regressão', () => {
  test('Admin Dashboard - Screenshots Básicos', async ({ page }) => {
    // Mock básico
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
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.invite', 'users.manage_roles',
            'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 'teams.manage_members',
            'admin.view_dashboard', 'admin.manage_system', 'admin.view_logs', 'admin.manage_integrations', 'admin.roles'
          ],
          roles: ['master_admin'],
          isMasterAdmin: true
        })
      });
    });

    // Mock de dados
    await page.route('/api/admin/users', (route) => {
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
          }
        ])
      });
    });

    // Navegar para admin
    await page.goto('/admin');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Screenshot da página completa
    await page.screenshot({ 
      path: 'tests/screenshots/admin-dashboard-full.png',
      fullPage: true 
    });

    console.log('✅ Screenshot do dashboard administrativo capturado');
  });

  test('Modal de Convite - Estados Visuais', async ({ page }) => {
    // Setup básico
    await page.route('/api/auth/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { email: 'eduibrahim@yahoo.com.br', name: 'Eduardo Ibrahim' }
        })
      });
    });

    await page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: ['users.invite', 'admin.view_dashboard'],
          roles: ['master_admin'],
          isMasterAdmin: true
        })
      });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Screenshot antes de abrir modal
    await page.screenshot({ 
      path: 'tests/screenshots/before-modal.png',
      fullPage: true 
    });

    // Abrir modal (se botão existir)
    const inviteButton = page.locator('button:has-text("Convidar")').first();
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(300);
      
      // Screenshot com modal aberto
      await page.screenshot({ 
        path: 'tests/screenshots/modal-opened.png',
        fullPage: true 
      });
    }

    console.log('✅ Screenshots do modal capturados');
  });

  test('Responsividade - Mobile vs Desktop', async ({ page }) => {
    // Setup
    await page.route('/api/auth/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { email: 'eduibrahim@yahoo.com.br', name: 'Eduardo Ibrahim' }
        })
      });
    });

    await page.route('/api/user/permissions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permissions: ['admin.view_dashboard'],
          roles: ['master_admin'],
          isMasterAdmin: true
        })
      });
    });

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/desktop-view.png',
      fullPage: true 
    });

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/mobile-view.png',
      fullPage: true 
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/tablet-view.png',
      fullPage: true 
    });

    console.log('✅ Screenshots responsivos capturados');
  });
}); 