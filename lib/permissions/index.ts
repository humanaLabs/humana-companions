// Sistema de Permissões - Core
export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionConditions;
}

export interface PermissionConditions {
  ownOnly?: boolean;
  organizationOnly?: boolean;
  teamOnly?: boolean;
  requireMasterAdmin?: boolean;
  requireActiveStatus?: boolean;
}

export interface UserPermissions {
  userId: string;
  roleId: string;
  organizationId?: string;
  teamIds?: string[];
  isMasterAdmin: boolean;
  permissions: Permission[];
  computedPermissions: string[];
}

// Definição completa de permissões do sistema
export const SYSTEM_PERMISSIONS: Permission[] = [
  // === GESTÃO DE USUÁRIOS ===
  {
    id: 'users.read',
    name: 'Visualizar Usuários',
    category: 'Usuários',
    description: 'Ver lista de usuários e suas informações',
    resource: 'users',
    action: 'read',
    conditions: { organizationOnly: true }
  },
  {
    id: 'users.create',
    name: 'Convidar Usuários',
    category: 'Usuários', 
    description: 'Convidar novos usuários para a organização',
    resource: 'users',
    action: 'create',
    conditions: { organizationOnly: true }
  },
  {
    id: 'users.update',
    name: 'Editar Usuários',
    category: 'Usuários',
    description: 'Alterar dados e roles de usuários',
    resource: 'users',
    action: 'update',
    conditions: { organizationOnly: true }
  },
  {
    id: 'users.delete',
    name: 'Remover Usuários',
    category: 'Usuários',
    description: 'Excluir usuários do sistema',
    resource: 'users',
    action: 'delete',
    conditions: { organizationOnly: true }
  },
  {
    id: 'users.manage_all',
    name: 'Gerenciar Todos Usuários',
    category: 'Usuários',
    description: 'Acesso total a usuários de todas organizações',
    resource: 'users',
    action: 'manage',
    conditions: { requireMasterAdmin: true }
  },

  // === GESTÃO DE TIMES ===
  {
    id: 'teams.read',
    name: 'Visualizar Times',
    category: 'Times',
    description: 'Ver lista de times da organização',
    resource: 'teams',
    action: 'read',
    conditions: { organizationOnly: true }
  },
  {
    id: 'teams.create',
    name: 'Criar Times',
    category: 'Times',
    description: 'Criar novos times na organização',
    resource: 'teams',
    action: 'create',
    conditions: { organizationOnly: true }
  },
  {
    id: 'teams.update',
    name: 'Editar Times',
    category: 'Times',
    description: 'Alterar configurações de times',
    resource: 'teams',
    action: 'update',
    conditions: { organizationOnly: true }
  },
  {
    id: 'teams.delete',
    name: 'Remover Times',
    category: 'Times',
    description: 'Excluir times da organização',
    resource: 'teams',
    action: 'delete',
    conditions: { organizationOnly: true }
  },
  {
    id: 'teams.manage_members',
    name: 'Gerenciar Membros',
    category: 'Times',
    description: 'Adicionar/remover membros de times',
    resource: 'teams',
    action: 'manage_members',
    conditions: { organizationOnly: true }
  },

  // === GESTÃO DE COMPANIONS ===
  {
    id: 'companions.read',
    name: 'Visualizar Companions',
    category: 'Companions',
    description: 'Ver lista de companions',
    resource: 'companions',
    action: 'read',
    conditions: { organizationOnly: true }
  },
  {
    id: 'companions.create',
    name: 'Criar Companions',
    category: 'Companions',
    description: 'Criar novos companions',
    resource: 'companions',
    action: 'create',
    conditions: { organizationOnly: true }
  },
  {
    id: 'companions.update',
    name: 'Editar Companions',
    category: 'Companions',
    description: 'Alterar companions existentes',
    resource: 'companions',
    action: 'update',
    conditions: { organizationOnly: true }
  },
  {
    id: 'companions.delete',
    name: 'Remover Companions',
    category: 'Companions',
    description: 'Excluir companions',
    resource: 'companions',
    action: 'delete',
    conditions: { organizationOnly: true }
  },
  {
    id: 'companions.manage_own',
    name: 'Gerenciar Próprios Companions',
    category: 'Companions',
    description: 'Gerenciar apenas companions próprios',
    resource: 'companions',
    action: 'manage',
    conditions: { ownOnly: true }
  },

  // === GESTÃO DE ORGANIZAÇÕES ===
  {
    id: 'organizations.read',
    name: 'Visualizar Organizações',
    category: 'Organizações',
    description: 'Ver informações de organizações',
    resource: 'organizations',
    action: 'read',
    conditions: { requireMasterAdmin: true }
  },
  {
    id: 'organizations.create',
    name: 'Criar Organizações',
    category: 'Organizações',
    description: 'Criar novas organizações',
    resource: 'organizations',
    action: 'create',
    conditions: { requireMasterAdmin: true }
  },
  {
    id: 'organizations.update',
    name: 'Editar Organizações',
    category: 'Organizações',
    description: 'Alterar configurações de organizações',
    resource: 'organizations',
    action: 'update',
    conditions: { requireMasterAdmin: true }
  },
  {
    id: 'organizations.delete',
    name: 'Remover Organizações',
    category: 'Organizações',
    description: 'Excluir organizações',
    resource: 'organizations',
    action: 'delete',
    conditions: { requireMasterAdmin: true }
  },

  // === ADMINISTRAÇÃO ===
  {
    id: 'admin.dashboard',
    name: 'Dashboard Admin',
    category: 'Administração',
    description: 'Acessar dashboard administrativo',
    resource: 'admin',
    action: 'dashboard',
    conditions: { organizationOnly: true }
  },
  {
    id: 'admin.roles',
    name: 'Gerenciar Roles',
    category: 'Administração',
    description: 'Criar e editar roles personalizadas',
    resource: 'admin',
    action: 'manage_roles',
    conditions: { requireMasterAdmin: true }
  },
  {
    id: 'admin.permissions',
    name: 'Gerenciar Permissões',
    category: 'Administração',
    description: 'Atribuir e remover permissões',
    resource: 'admin',
    action: 'manage_permissions',
    conditions: { requireMasterAdmin: true }
  },
  {
    id: 'admin.audit',
    name: 'Visualizar Auditoria',
    category: 'Administração',
    description: 'Ver logs de auditoria e atividades',
    resource: 'admin',
    action: 'audit',
    conditions: { organizationOnly: true }
  },
  {
    id: 'admin.settings',
    name: 'Configurações Sistema',
    category: 'Administração',
    description: 'Alterar configurações do sistema',
    resource: 'admin',
    action: 'settings',
    conditions: { requireMasterAdmin: true }
  },

  // === STUDIO E FERRAMENTAS ===
  {
    id: 'studio.read',
    name: 'Visualizar Studio',
    category: 'Studio',
    description: 'Acessar interface do Studio',
    resource: 'studio',
    action: 'read'
  },
  {
    id: 'studio.create',
    name: 'Criar no Studio',
    category: 'Studio',
    description: 'Criar conteúdo no Studio',
    resource: 'studio',
    action: 'create',
    conditions: { organizationOnly: true }
  },
  {
    id: 'dataroom.read',
    name: 'Visualizar Data Room',
    category: 'Data Room',
    description: 'Acessar documentos do Data Room',
    resource: 'dataroom',
    action: 'read',
    conditions: { organizationOnly: true }
  },
  {
    id: 'dataroom.manage',
    name: 'Gerenciar Data Room',
    category: 'Data Room',
    description: 'Upload e gestão de documentos',
    resource: 'dataroom',
    action: 'manage',
    conditions: { organizationOnly: true }
  },
  {
    id: 'mcp.read',
    name: 'Visualizar MCP Servers',
    category: 'MCP',
    description: 'Ver servidores MCP disponíveis',
    resource: 'mcp',
    action: 'read',
    conditions: { organizationOnly: true }
  },
  {
    id: 'mcp.manage',
    name: 'Gerenciar MCP Servers',
    category: 'MCP',
    description: 'Configurar e gerenciar servidores MCP',
    resource: 'mcp',
    action: 'manage',
    conditions: { organizationOnly: true }
  }
];

// Roles predefinidas do sistema
export const SYSTEM_ROLES = {
  MASTER_ADMIN: {
    id: 'master_admin',
    name: 'Master Admin',
    permissions: ['*'] // Todas as permissões
  },
  ADMIN: {
    id: 'admin', 
    name: 'Admin',
    permissions: [
      'users.read', 'users.create', 'users.update', 'users.delete',
      'teams.read', 'teams.create', 'teams.update', 'teams.delete', 'teams.manage_members',
      'companions.read', 'companions.create', 'companions.update', 'companions.delete',
      'admin.dashboard', 'admin.audit',
      'studio.read', 'studio.create',
      'dataroom.read', 'dataroom.manage',
      'mcp.read', 'mcp.manage'
    ]
  },
  MANAGER: {
    id: 'manager',
    name: 'Manager', 
    permissions: [
      'users.read',
      'teams.read', 'teams.manage_members',
      'companions.read', 'companions.create', 'companions.update',
      'studio.read', 'studio.create',
      'dataroom.read',
      'mcp.read'
    ]
  },
  USER: {
    id: 'user',
    name: 'User',
    permissions: [
      'companions.manage_own',
      'studio.read',
      'dataroom.read',
      'mcp.read'
    ]
  }
};

// Funções utilitárias
export function hasPermission(
  userPermissions: UserPermissions, 
  requiredPermission: string,
  context?: {
    resourceId?: string;
    organizationId?: string;
    teamId?: string;
    ownerId?: string;
  }
): boolean {
  // Master Admin tem acesso total
  if (userPermissions.isMasterAdmin) {
    return true;
  }

  // Verificar se tem permissão wildcard
  if (userPermissions.computedPermissions.includes('*')) {
    return true;
  }

  // Verificar se tem a permissão específica
  if (!userPermissions.computedPermissions.includes(requiredPermission)) {
    return false;
  }

  // Verificar condições contextuais
  const permission = SYSTEM_PERMISSIONS.find(p => p.id === requiredPermission);
  if (!permission?.conditions) {
    return true;
  }

  // Verificar condições específicas
  if (permission.conditions.requireMasterAdmin && !userPermissions.isMasterAdmin) {
    return false;
  }

  if (permission.conditions.organizationOnly && context?.organizationId) {
    if (userPermissions.organizationId !== context.organizationId) {
      return false;
    }
  }

  if (permission.conditions.teamOnly && context?.teamId) {
    if (!userPermissions.teamIds?.includes(context.teamId)) {
      return false;
    }
  }

  if (permission.conditions.ownOnly && context?.ownerId) {
    if (userPermissions.userId !== context.ownerId) {
      return false;
    }
  }

  return true;
}

export function hasAnyPermission(
  userPermissions: UserPermissions,
  requiredPermissions: string[],
  context?: {
    resourceId?: string;
    organizationId?: string;
    teamId?: string;
    ownerId?: string;
  }
): boolean {
  return requiredPermissions.some(permission => 
    hasPermission(userPermissions, permission, context)
  );
}

export function hasAllPermissions(
  userPermissions: UserPermissions,
  requiredPermissions: string[],
  context?: {
    resourceId?: string;
    organizationId?: string;
    teamId?: string;
    ownerId?: string;
  }
): boolean {
  return requiredPermissions.every(permission => 
    hasPermission(userPermissions, permission, context)
  );
}

export function getPermissionsByCategory(category?: string): Permission[] {
  if (!category) {
    return SYSTEM_PERMISSIONS;
  }
  return SYSTEM_PERMISSIONS.filter(p => p.category === category);
}

export function computeUserPermissions(
  rolePermissions: string[],
  isMasterAdmin: boolean = false
): string[] {
  if (isMasterAdmin) {
    return ['*'];
  }

  // Se tem wildcard, retorna todas as permissões
  if (rolePermissions.includes('*')) {
    return SYSTEM_PERMISSIONS.map(p => p.id);
  }

  return rolePermissions;
}