import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { hasPermission, UserPermissions, SYSTEM_ROLES, computeUserPermissions } from './index';

export interface RoutePermissionConfig {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  requireMasterAdmin?: boolean;
  requireAdmin?: boolean;
  context?: {
    getOrganizationId?: (req: NextRequest) => string | undefined;
    getTeamId?: (req: NextRequest) => string | undefined;
    getOwnerId?: (req: NextRequest) => string | undefined;
    getResourceId?: (req: NextRequest) => string | undefined;
  };
}

// Configurações de permissões para rotas
export const ROUTE_PERMISSIONS: Record<string, RoutePermissionConfig> = {
  // === ROTAS DE ADMINISTRAÇÃO ===
  '/api/admin/users': {
    resource: 'users',
    action: 'read'
  },
  '/api/admin/users/invite': {
    resource: 'users', 
    action: 'create'
  },
  '/api/admin/users/[id]': {
    resource: 'users',
    action: 'update'
  },
  '/api/admin/teams': {
    resource: 'teams',
    action: 'read'
  },
  '/api/admin/roles': {
    permission: 'admin.roles'
  },
  '/api/organizations': {
    resource: 'organizations',
    action: 'read'
  },

  // === ROTAS DE COMPANIONS ===
  '/api/companions': {
    resource: 'companions',
    action: 'read'
  },
  '/api/companions/generate': {
    resource: 'companions',
    action: 'create'
  },
  '/api/companions/[id]': {
    resource: 'companions',
    action: 'update'
  },

  // === ROTAS DE DATA ROOM ===
  '/api/document': {
    resource: 'dataroom',
    action: 'read'
  },
  '/api/files/upload': {
    resource: 'dataroom',
    action: 'manage'
  },

  // === ROTAS DE MCP ===
  '/api/mcp-servers': {
    resource: 'mcp',
    action: 'read'
  },
  '/api/mcp-servers/connect': {
    resource: 'mcp',
    action: 'manage'
  },

  // === ROTAS EXPERIMENTAIS ===
  '/api/experimental': {
    requireMasterAdmin: true
  }
};

async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    // Mock de permissões baseado no userId
    const mockUserData = {
      userId,
      roleId: 'admin',
      organizationId: 'org-1',
      teamIds: ['team-1'],
      isMasterAdmin: userId === 'master-admin-id',
      permissions: SYSTEM_ROLES.ADMIN.permissions
    };

    return {
      userId: mockUserData.userId,
      roleId: mockUserData.roleId,
      organizationId: mockUserData.organizationId,
      teamIds: mockUserData.teamIds,
      isMasterAdmin: mockUserData.isMasterAdmin,
      permissions: [],
      computedPermissions: computeUserPermissions(
        mockUserData.permissions,
        mockUserData.isMasterAdmin
      )
    };
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    return null;
  }
}

export async function validateRoutePermissions(
  request: NextRequest,
  config: RoutePermissionConfig
): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { hasAccess: false, error: 'Usuário não autenticado' };
    }

    const userPermissions = await getUserPermissions(session.user.id);
    if (!userPermissions) {
      return { hasAccess: false, error: 'Permissões do usuário não encontradas' };
    }

    // Verificar Master Admin
    if (config.requireMasterAdmin && !userPermissions.isMasterAdmin) {
      return { hasAccess: false, error: 'Acesso restrito a Master Admin' };
    }

    // Verificar Admin
    if (config.requireAdmin && !userPermissions.isMasterAdmin && userPermissions.roleId !== 'admin') {
      return { hasAccess: false, error: 'Acesso restrito a Administradores' };
    }

    // Preparar contexto
    const context = config.context ? {
      resourceId: config.context.getResourceId?.(request),
      organizationId: config.context.getOrganizationId?.(request) || userPermissions.organizationId,
      teamId: config.context.getTeamId?.(request),
      ownerId: config.context.getOwnerId?.(request)
    } : undefined;

    // Verificar permissão por resource.action
    if (config.resource && config.action) {
      const permissionId = `${config.resource}.${config.action}`;
      if (!hasPermission(userPermissions, permissionId, context)) {
        return { 
          hasAccess: false, 
          error: `Sem permissão para ${config.action} em ${config.resource}` 
        };
      }
    }

    // Verificar permissão específica
    if (config.permission) {
      if (!hasPermission(userPermissions, config.permission, context)) {
        return { 
          hasAccess: false, 
          error: `Sem permissão: ${config.permission}` 
        };
      }
    }

    // Verificar múltiplas permissões
    if (config.permissions && config.permissions.length > 0) {
      const checkAll = config.requireAll || false;
      
      if (checkAll) {
        const hasAllPerms = config.permissions.every(perm => 
          hasPermission(userPermissions, perm, context)
        );
        if (!hasAllPerms) {
          return { 
            hasAccess: false, 
            error: 'Sem todas as permissões necessárias' 
          };
        }
      } else {
        const hasAnyPerm = config.permissions.some(perm => 
          hasPermission(userPermissions, perm, context)
        );
        if (!hasAnyPerm) {
          return { 
            hasAccess: false, 
            error: 'Sem nenhuma das permissões necessárias' 
          };
        }
      }
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Erro na validação de permissões:', error);
    return { hasAccess: false, error: 'Erro interno na validação de permissões' };
  }
}

// Helper para usar em APIs
export async function withPermissions(
  request: NextRequest,
  config: RoutePermissionConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const validation = await validateRoutePermissions(request, config);
  
  if (!validation.hasAccess) {
    return NextResponse.json(
      { error: validation.error || 'Acesso negado' },
      { status: 403 }
    );
  }

  return handler(request);
}

// Helper para extrair configuração de rota
export function getRouteConfig(pathname: string): RoutePermissionConfig | null {
  // Busca exata primeiro
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // Busca por padrões com [id]
  for (const route in ROUTE_PERMISSIONS) {
    if (route.includes('[id]')) {
      const pattern = route.replace(/\[id\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return ROUTE_PERMISSIONS[route];
      }
    }
  }

  return null;
}

// Middleware para Next.js
export async function permissionsMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Ignorar rotas públicas
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')) {
    return null;
  }

  // Buscar configuração da rota
  const config = getRouteConfig(pathname);
  if (!config) {
    // Rota não tem configuração de permissões - permitir
    return null;
  }

  // Validar permissões
  const validation = await validateRoutePermissions(request, config);
  
  if (!validation.hasAccess) {
    return NextResponse.json(
      { error: validation.error || 'Acesso negado' },
      { status: 403 }
    );
  }

  return null; // Permitir continuar
} 