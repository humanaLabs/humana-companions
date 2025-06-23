import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  ROUTE_PERMISSIONS,
  type AuthContext,
  type PermissionCheck 
} from '@/lib/types/auth';

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(
  userRole: UserRole, 
  permission: Permission
): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  return userPermissions.includes(permission);
}

/**
 * Verifica se um usuário pode acessar uma rota específica
 */
export function canAccessRoute(
  userRole: UserRole, 
  route: string
): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  
  // Se não há permissões definidas, a rota é pública
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  const userPermissions = ROLE_PERMISSIONS[userRole];
  
  // Verifica se o usuário tem pelo menos uma das permissões necessárias
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Verifica múltiplas permissões de uma vez
 */
export function checkPermissions(
  userRole: UserRole,
  permissions: Permission[]
): PermissionCheck {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  const missingPermissions: Permission[] = [];
  
  permissions.forEach(permission => {
    if (!userPermissions.includes(permission)) {
      missingPermissions.push(permission);
    }
  });
  
  return {
    hasPermission: missingPermissions.length === 0,
    missingPermissions,
    context: {
      userId: '', // Será preenchido pelo contexto real
      role: userRole,
      permissions: userPermissions
    }
  };
}

/**
 * Obtém todas as rotas que um usuário pode acessar
 */
export function getAccessibleRoutes(userRole: UserRole): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => 
    canAccessRoute(userRole, route)
  );
}

/**
 * Verifica se um role é administrador do sistema
 */
export function isSystemAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.SYSTEM_ADMIN;
}

/**
 * Verifica se um role é administrador (sistema ou organização)
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.ORG_ADMIN;
}

/**
 * Verifica se um role pode gerenciar uma organização
 */
export function canManageOrganization(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.MANAGE_ORGANIZATION);
}

/**
 * Verifica se um role pode criar companions
 */
export function canCreateCompanions(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.CREATE_COMPANIONS);
}

/**
 * Verifica se um role pode acessar o studio
 */
export function canAccessStudio(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.ACCESS_STUDIO);
}

/**
 * Verifica se um role pode acessar área experimental
 */
export function canAccessExperimental(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.ACCESS_EXPERIMENTAL);
}

/**
 * Middleware para verificação de permissão em rotas
 */
export function requirePermission(permission: Permission) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Access denied. Required permission: ${permission}`);
    }
    return true;
  };
}

/**
 * Middleware para verificação de role mínimo
 */
export function requireRole(minimumRole: UserRole) {
  const roleHierarchy = {
    [UserRole.GUEST]: 0,
    [UserRole.MEMBER]: 1,
    [UserRole.TEAM_LEAD]: 2,
    [UserRole.ORG_ADMIN]: 3,
    [UserRole.SYSTEM_ADMIN]: 4,
  };

  return (userRole: UserRole) => {
    if (roleHierarchy[userRole] < roleHierarchy[minimumRole]) {
      throw new Error(`Access denied. Required role: ${minimumRole} or higher`);
    }
    return true;
  };
}

/**
 * Filtra uma lista de itens baseado nas permissões do usuário
 */
export function filterByPermissions<T extends { requiredPermissions?: Permission[] }>(
  items: T[],
  userRole: UserRole
): T[] {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  
  return items.filter(item => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true; // Item público
    }
    
    return item.requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  });
}

/**
 * Utilitário para log de auditoria
 */
export function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  organizationId?: string
) {
  return {
    userId,
    organizationId,
    action,
    resource,
    resourceId,
    details,
    ipAddress: null, // Será preenchido pelo middleware
    userAgent: null, // Será preenchido pelo middleware
    createdAt: new Date()
  };
} 