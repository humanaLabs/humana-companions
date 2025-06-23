// Tipos de roles/funções
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'guest';

// Recursos do sistema (telas e objetos)
export type Resource = 
  // Telas/Páginas
  | 'admin_dashboard'
  | 'studio'
  | 'data_room'
  | 'university'
  | 'applications'
  | 'mcp_servers'
  | 'organizations'
  | 'user_management'
  | 'audit_logs'
  
  // Objetos/Entidades
  | 'companions'
  | 'chats'
  | 'documents'
  | 'folders'
  | 'users'
  | 'teams'
  | 'permissions'
  | 'analytics';

// Ações possíveis
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';

// Estrutura de uma permissão
export interface Permission {
  resource: Resource;
  action: Action;
  conditions?: {
    own_only?: boolean; // Apenas próprios recursos
    organization_only?: boolean; // Apenas da própria organização
    team_only?: boolean; // Apenas do próprio time
  };
}

// Mapeamento de roles para permissões
export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Contexto do usuário para verificação de permissões
export interface UserContext {
  id: string;
  role: UserRole;
  organizationId?: string;
  teamIds?: string[];
  permissions?: Permission[];
}

// Resultado da verificação de permissão
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
} 