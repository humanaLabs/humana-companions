'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  computeUserPermissions,
  SYSTEM_PERMISSIONS,
} from '@/lib/permissions/index';
import type { UserPermissions, Permission } from '@/lib/permissions/index';

interface PermissionsContextType {
  userPermissions: UserPermissions | null;
  loading: boolean;
  hasPermission: (permission: string, context?: PermissionContext) => boolean;
  hasAnyPermission: (
    permissions: string[],
    context?: PermissionContext,
  ) => boolean;
  hasAllPermissions: (
    permissions: string[],
    context?: PermissionContext,
  ) => boolean;
  canAccess: (
    resource: string,
    action: string,
    context?: PermissionContext,
  ) => boolean;
  isMasterAdmin: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

interface PermissionContext {
  resourceId?: string;
  organizationId?: string;
  teamId?: string;
  ownerId?: string;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { data: session, status } = useSession();
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    if (!session?.user?.id) {
      setUserPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/permissions');
      if (response.ok) {
        const data = await response.json();
        // DEBUG: Log dos dados recebidos
        console.log('🔐 DEBUG - Dados da API de permissões:', data);
        console.log('📧 Email do usuário:', session.user.email);
        console.log('👑 É Master Admin?', data.isMasterAdmin);

        // Transformar resposta da API em UserPermissions
        const permissions: UserPermissions = {
          userId: session.user.id,
          roleId: data.roleId || 'user',
          organizationId: data.organizationId,
          teamIds: data.teamIds || [],
          isMasterAdmin: data.isMasterAdmin || false,
          permissions: SYSTEM_PERMISSIONS.filter(
            (p: Permission) =>
              data.permissions?.includes(p.id) || data.isMasterAdmin,
          ),
          computedPermissions: computeUserPermissions(
            data.permissions || [],
            data.isMasterAdmin,
          ),
        };

        // DEBUG: Log das permissões computadas
        console.log(
          '🎯 Permissões computadas:',
          permissions.computedPermissions,
        );
        console.log('🔑 Role ID:', permissions.roleId);
        setUserPermissions(permissions);
      } else {
        console.error('Erro ao buscar permissões:', response.statusText);
        // ✅ FALLBACK: Se a API falha mas o usuário é master admin, criar permissões mínimas
        if (session?.user && (session.user as any).isMasterAdmin) {
          console.log('🚨 API falhou, mas usuário é Master Admin. Criando fallback...');
          const fallbackPermissions: UserPermissions = {
            userId: session.user.id,
            roleId: 'master_admin',
            organizationId: (session.user as any).organizationId,
            teamIds: [],
            isMasterAdmin: true,
            permissions: [],
            computedPermissions: ['*'], // All permissions
          };
          setUserPermissions(fallbackPermissions);
        } else {
          setUserPermissions(null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      // ✅ FALLBACK: Se há erro mas o usuário é master admin, criar permissões mínimas
      if (session?.user && (session.user as any).isMasterAdmin) {
        console.log('🚨 Erro na API, mas usuário é Master Admin. Criando fallback...');
        const fallbackPermissions: UserPermissions = {
          userId: session.user.id,
          roleId: 'master_admin',
          organizationId: (session.user as any).organizationId,
          teamIds: [],
          isMasterAdmin: true,
          permissions: [],
          computedPermissions: ['*'], // All permissions
        };
        setUserPermissions(fallbackPermissions);
      } else {
        setUserPermissions(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    fetchUserPermissions();
  }, [session?.user?.id, status]);

  const checkPermission = (
    permission: string,
    context?: PermissionContext,
  ): boolean => {
    if (!userPermissions) return false;
    const result = hasPermission(userPermissions, permission, context);
    // DEBUG: Log da verificação de permissão específica
    console.log(`🔍 Verificando permissão "${permission}":`, result);
    console.log('👤 UserPermissions:', userPermissions);
    return result;
  };

  const checkAnyPermission = (
    permissions: string[],
    context?: PermissionContext,
  ): boolean => {
    if (!userPermissions) return false;
    return hasAnyPermission(userPermissions, permissions, context);
  };

  const checkAllPermissions = (
    permissions: string[],
    context?: PermissionContext,
  ): boolean => {
    if (!userPermissions) return false;
    return hasAllPermissions(userPermissions, permissions, context);
  };

  const canAccess = (
    resource: string,
    action: string,
    context?: PermissionContext,
  ): boolean => {
    const permissionId = `${resource}.${action}`;
    return checkPermission(permissionId, context);
  };

  const isMasterAdmin = userPermissions?.isMasterAdmin || false;
  const isAdmin = isMasterAdmin || userPermissions?.roleId === 'admin' || false;

  const value: PermissionsContextType = {
    userPermissions,
    loading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    canAccess,
    isMasterAdmin,
    isAdmin,
    refresh: fetchUserPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Hooks específicos para casos comuns
export function useCanAccess(
  resource: string,
  action: string,
  context?: PermissionContext,
): boolean {
  const { canAccess } = usePermissions();
  return canAccess(resource, action, context);
}

export function useHasPermission(
  permission: string,
  context?: PermissionContext,
): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission, context);
}

export function useHasAnyPermission(
  permissions: string[],
  context?: PermissionContext,
): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions, context);
}

export function useHasAllPermissions(
  permissions: string[],
  context?: PermissionContext,
): boolean {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions, context);
}

export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissions();
  return isAdmin;
}

export function useIsMasterAdmin(): boolean {
  const { isMasterAdmin } = usePermissions();
  return isMasterAdmin;
}

// Hook para verificar acesso a rotas administrativas
export function useAdminAccess(): {
  canAccessUsers: boolean;
  canAccessTeams: boolean;
  canAccessRoles: boolean;
  canAccessOrganizations: boolean;
  canAccessAudit: boolean;
  canAccessSettings: boolean;
} {
  const { canAccess } = usePermissions();
  return {
    canAccessUsers: canAccess('users', 'read'),
    canAccessTeams: canAccess('teams', 'read'),
    canAccessRoles: canAccess('admin', 'manage_roles'),
    canAccessOrganizations: canAccess('organizations', 'read'),
    canAccessAudit: canAccess('admin', 'audit'),
    canAccessSettings: canAccess('admin', 'settings'),
  };
}
