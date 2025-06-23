// Sistema de Roles e Permissões
export enum UserRole {
  // Administrador do sistema - pode gerenciar tudo
  SYSTEM_ADMIN = 'system_admin',
  
  // Administrador da organização - pode gerenciar sua organização
  ORG_ADMIN = 'org_admin',
  
  // Líder de equipe - pode gerenciar sua equipe
  TEAM_LEAD = 'team_lead',
  
  // Membro comum - acesso básico
  MEMBER = 'member',
  
  // Convidado - acesso limitado
  GUEST = 'guest'
}

// Permissões baseadas em rotas/menus
export enum Permission {
  // Sistema - apenas SYSTEM_ADMIN
  MANAGE_SYSTEM = 'manage_system',
  CREATE_ORGANIZATIONS = 'create_organizations',
  DELETE_ORGANIZATIONS = 'delete_organizations',
  
  // Organização - ORG_ADMIN e acima
  MANAGE_ORGANIZATION = 'manage_organization',
  INVITE_USERS = 'invite_users',
  MANAGE_USERS = 'manage_users',
  
  // Studio - TEAM_LEAD e acima
  ACCESS_STUDIO = 'access_studio',
  CREATE_COMPANIONS = 'create_companions',
  MANAGE_COMPANIONS = 'manage_companions',
  CREATE_ORGANIZATIONS_DESIGN = 'create_organizations_design',
  MANAGE_ORGANIZATIONS_DESIGN = 'manage_organizations_design',
  
  // Data Room - MEMBER e acima
  ACCESS_DATA_ROOM = 'access_data_room',
  UPLOAD_DOCUMENTS = 'upload_documents',
  MANAGE_TEMPLATES = 'manage_templates',
  CONFIGURE_INTEGRATIONS = 'configure_integrations',
  
  // University - MEMBER e acima
  ACCESS_UNIVERSITY = 'access_university',
  CREATE_COURSES = 'create_courses',
  MANAGE_COURSES = 'manage_courses',
  
  // Experimental - TEAM_LEAD e acima
  ACCESS_EXPERIMENTAL = 'access_experimental',
  
  // Chat básico - todos
  ACCESS_CHAT = 'access_chat',
  CREATE_CHAT = 'create_chat'
}

// Mapeamento de rotas para permissões
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Rotas do sistema
  '/admin': [Permission.MANAGE_SYSTEM],
  '/admin/organizations': [Permission.MANAGE_SYSTEM, Permission.CREATE_ORGANIZATIONS],
  
  // Rotas da organização
  '/organizations': [Permission.ACCESS_STUDIO, Permission.CREATE_ORGANIZATIONS_DESIGN],
  '/organizations/create': [Permission.CREATE_ORGANIZATIONS_DESIGN],
  '/organizations/[id]': [Permission.MANAGE_ORGANIZATIONS_DESIGN],
  
  // Studio
  '/studio': [Permission.ACCESS_STUDIO],
  '/companions': [Permission.ACCESS_STUDIO, Permission.CREATE_COMPANIONS],
  '/companions/create': [Permission.CREATE_COMPANIONS],
  
  // Data Room
  '/data-room': [Permission.ACCESS_DATA_ROOM],
  '/data-room/documentos': [Permission.ACCESS_DATA_ROOM],
  '/data-room/templates': [Permission.ACCESS_DATA_ROOM, Permission.MANAGE_TEMPLATES],
  '/data-room/integracoes': [Permission.ACCESS_DATA_ROOM, Permission.CONFIGURE_INTEGRATIONS],
  
  // University
  '/university': [Permission.ACCESS_UNIVERSITY],
  '/university/cursos': [Permission.ACCESS_UNIVERSITY],
  '/university/create': [Permission.CREATE_COURSES],
  
  // Experimental
  '/experimental': [Permission.ACCESS_EXPERIMENTAL],
  
  // Chat - acesso básico
  '/': [Permission.ACCESS_CHAT],
  '/chat': [Permission.ACCESS_CHAT],
  '/chat/[id]': [Permission.ACCESS_CHAT]
};

// Permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SYSTEM_ADMIN]: [
    // Todas as permissões
    Permission.MANAGE_SYSTEM,
    Permission.CREATE_ORGANIZATIONS,
    Permission.DELETE_ORGANIZATIONS,
    Permission.MANAGE_ORGANIZATION,
    Permission.INVITE_USERS,
    Permission.MANAGE_USERS,
    Permission.ACCESS_STUDIO,
    Permission.CREATE_COMPANIONS,
    Permission.MANAGE_COMPANIONS,
    Permission.CREATE_ORGANIZATIONS_DESIGN,
    Permission.MANAGE_ORGANIZATIONS_DESIGN,
    Permission.ACCESS_DATA_ROOM,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_TEMPLATES,
    Permission.CONFIGURE_INTEGRATIONS,
    Permission.ACCESS_UNIVERSITY,
    Permission.CREATE_COURSES,
    Permission.MANAGE_COURSES,
    Permission.ACCESS_EXPERIMENTAL,
    Permission.ACCESS_CHAT,
    Permission.CREATE_CHAT
  ],
  
  [UserRole.ORG_ADMIN]: [
    Permission.MANAGE_ORGANIZATION,
    Permission.INVITE_USERS,
    Permission.MANAGE_USERS,
    Permission.ACCESS_STUDIO,
    Permission.CREATE_COMPANIONS,
    Permission.MANAGE_COMPANIONS,
    Permission.CREATE_ORGANIZATIONS_DESIGN,
    Permission.MANAGE_ORGANIZATIONS_DESIGN,
    Permission.ACCESS_DATA_ROOM,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_TEMPLATES,
    Permission.CONFIGURE_INTEGRATIONS,
    Permission.ACCESS_UNIVERSITY,
    Permission.CREATE_COURSES,
    Permission.MANAGE_COURSES,
    Permission.ACCESS_EXPERIMENTAL,
    Permission.ACCESS_CHAT,
    Permission.CREATE_CHAT
  ],
  
  [UserRole.TEAM_LEAD]: [
    Permission.ACCESS_STUDIO,
    Permission.CREATE_COMPANIONS,
    Permission.MANAGE_COMPANIONS,
    Permission.CREATE_ORGANIZATIONS_DESIGN,
    Permission.MANAGE_ORGANIZATIONS_DESIGN,
    Permission.ACCESS_DATA_ROOM,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_TEMPLATES,
    Permission.CONFIGURE_INTEGRATIONS,
    Permission.ACCESS_UNIVERSITY,
    Permission.ACCESS_EXPERIMENTAL,
    Permission.ACCESS_CHAT,
    Permission.CREATE_CHAT
  ],
  
  [UserRole.MEMBER]: [
    Permission.ACCESS_DATA_ROOM,
    Permission.UPLOAD_DOCUMENTS,
    Permission.ACCESS_UNIVERSITY,
    Permission.ACCESS_CHAT,
    Permission.CREATE_CHAT
  ],
  
  [UserRole.GUEST]: [
    Permission.ACCESS_CHAT
  ]
};

// Tipos para o contexto de autorização
export interface AuthContext {
  userId: string;
  organizationId?: string;
  teamId?: string;
  role: UserRole;
  permissions: Permission[];
}

// Tipo para verificação de permissão
export interface PermissionCheck {
  hasPermission: boolean;
  missingPermissions: Permission[];
  context: AuthContext;
}

// Utilitário para verificar se um role tem uma permissão específica
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Utilitário para verificar se um role pode acessar uma rota
export function canAccessRoute(role: UserRole, route: string): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // Rota pública
  }
  
  const userPermissions = ROLE_PERMISSIONS[role];
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Utilitário para obter rotas acessíveis por role
export function getAccessibleRoutes(role: UserRole): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => canAccessRoute(role, route));
}

// Utilitário para filtrar menus baseado em permissões
export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiredPermissions?: Permission[];
  children?: MenuItem[];
}

export function filterMenuByPermissions(menu: MenuItem[], userPermissions: Permission[]): MenuItem[] {
  return menu.filter(item => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true; // Item público
    }
    
    const hasAccess = item.requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (hasAccess && item.children) {
      item.children = filterMenuByPermissions(item.children, userPermissions);
    }
    
    return hasAccess;
  });
} 