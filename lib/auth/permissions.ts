import type { 
  UserRole, 
  Resource, 
  Action, 
  Permission, 
  RolePermissions, 
  UserContext, 
  PermissionCheck 
} from '@/lib/types/permissions';

// Configuração padrão de permissões por role
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'super_admin',
    permissions: [
      { resource: 'admin_dashboard', action: 'manage' },
      { resource: 'studio', action: 'manage' },
      { resource: 'data_room', action: 'manage' },
      { resource: 'university', action: 'manage' },
      { resource: 'applications', action: 'manage' },
      { resource: 'mcp_servers', action: 'manage' },
      { resource: 'organizations', action: 'manage' },
      { resource: 'user_management', action: 'manage' },
      { resource: 'audit_logs', action: 'read' },
      { resource: 'companions', action: 'manage' },
      { resource: 'chats', action: 'manage' },
      { resource: 'documents', action: 'manage' },
      { resource: 'folders', action: 'manage' },
      { resource: 'users', action: 'manage' },
      { resource: 'teams', action: 'manage' },
      { resource: 'permissions', action: 'manage' },
      { resource: 'analytics', action: 'read' },
    ]
  },
  {
    role: 'admin',
    permissions: [
      { resource: 'admin_dashboard', action: 'view', conditions: { organization_only: true } },
      { resource: 'studio', action: 'manage', conditions: { organization_only: true } },
      { resource: 'data_room', action: 'manage', conditions: { organization_only: true } },
      { resource: 'university', action: 'manage', conditions: { organization_only: true } },
      { resource: 'applications', action: 'manage', conditions: { organization_only: true } },
      { resource: 'mcp_servers', action: 'manage', conditions: { organization_only: true } },
      { resource: 'user_management', action: 'manage', conditions: { organization_only: true } },
      { resource: 'companions', action: 'manage', conditions: { organization_only: true } },
      { resource: 'chats', action: 'read', conditions: { organization_only: true } },
      { resource: 'documents', action: 'manage', conditions: { organization_only: true } },
      { resource: 'folders', action: 'manage', conditions: { organization_only: true } },
      { resource: 'users', action: 'manage', conditions: { organization_only: true } },
      { resource: 'teams', action: 'manage', conditions: { organization_only: true } },
      { resource: 'analytics', action: 'read', conditions: { organization_only: true } },
    ]
  },
  {
    role: 'manager',
    permissions: [
      { resource: 'studio', action: 'manage', conditions: { team_only: true } },
      { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
      { resource: 'university', action: 'read', conditions: { organization_only: true } },
      { resource: 'applications', action: 'read' },
      { resource: 'mcp_servers', action: 'read', conditions: { organization_only: true } },
      { resource: 'companions', action: 'manage', conditions: { team_only: true } },
      { resource: 'chats', action: 'read', conditions: { team_only: true } },
      { resource: 'documents', action: 'manage', conditions: { team_only: true } },
      { resource: 'folders', action: 'manage', conditions: { own_only: true } },
      { resource: 'users', action: 'read', conditions: { team_only: true } },
      { resource: 'analytics', action: 'read', conditions: { team_only: true } },
    ]
  },
  {
    role: 'user',
    permissions: [
      { resource: 'studio', action: 'read' },
      { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
      { resource: 'university', action: 'read' },
      { resource: 'applications', action: 'read' },
      { resource: 'mcp_servers', action: 'read', conditions: { own_only: true } },
      { resource: 'companions', action: 'manage', conditions: { own_only: true } },
      { resource: 'chats', action: 'manage', conditions: { own_only: true } },
      { resource: 'documents', action: 'manage', conditions: { own_only: true } },
      { resource: 'folders', action: 'manage', conditions: { own_only: true } },
    ]
  },
  {
    role: 'guest',
    permissions: [
      { resource: 'university', action: 'read' },
      { resource: 'applications', action: 'read' },
      { resource: 'chats', action: 'create' },
      { resource: 'chats', action: 'read', conditions: { own_only: true } },
    ]
  }
];

// Função para obter permissões de um role
export function getRolePermissions(role: UserRole): Permission[] {
  const roleConfig = DEFAULT_ROLE_PERMISSIONS.find(r => r.role === role);
  return roleConfig?.permissions || [];
}

// Função principal para verificar permissões
export function checkPermission(
  userContext: UserContext,
  resource: Resource,
  action: Action,
  targetContext?: {
    ownerId?: string;
    organizationId?: string;
    teamId?: string;
  }
): PermissionCheck {
  // Obter permissões do usuário (custom ou padrão do role)
  const userPermissions = userContext.permissions || getRolePermissions(userContext.role);
  
  // Procurar permissão específica
  const relevantPermissions = userPermissions.filter(p => 
    p.resource === resource && (p.action === action || p.action === 'manage')
  );

  if (relevantPermissions.length === 0) {
    return { allowed: false, reason: 'Permissão não encontrada' };
  }

  // Verificar condições da permissão
  for (const permission of relevantPermissions) {
    const conditionCheck = checkConditions(userContext, permission, targetContext);
    if (conditionCheck.allowed) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'Condições de acesso não atendidas' };
}

// Verificar condições específicas da permissão
function checkConditions(
  userContext: UserContext,
  permission: Permission,
  targetContext?: {
    ownerId?: string;
    organizationId?: string;
    teamId?: string;
  }
): PermissionCheck {
  const conditions = permission.conditions;
  
  if (!conditions) {
    return { allowed: true };
  }

  // Verificar se é apenas próprios recursos
  if (conditions.own_only && targetContext?.ownerId) {
    if (userContext.id !== targetContext.ownerId) {
      return { allowed: false, reason: 'Acesso permitido apenas aos próprios recursos' };
    }
  }

  // Verificar se é apenas da organização
  if (conditions.organization_only && targetContext?.organizationId) {
    if (userContext.organizationId !== targetContext.organizationId) {
      return { allowed: false, reason: 'Acesso permitido apenas à própria organização' };
    }
  }

  // Verificar se é apenas do time
  if (conditions.team_only && targetContext?.teamId) {
    if (!userContext.teamIds?.includes(targetContext.teamId)) {
      return { allowed: false, reason: 'Acesso permitido apenas ao próprio time' };
    }
  }

  return { allowed: true };
}

// Função para verificar se usuário pode acessar uma tela
export function canAccessPage(userContext: UserContext, page: Resource): boolean {
  const check = checkPermission(userContext, page, 'view');
  return check.allowed;
}

// Função para verificar se usuário pode realizar ação em objeto
export function canPerformAction(
  userContext: UserContext,
  resource: Resource,
  action: Action,
  targetContext?: {
    ownerId?: string;
    organizationId?: string;
    teamId?: string;
  }
): boolean {
  const check = checkPermission(userContext, resource, action, targetContext);
  return check.allowed;
} 