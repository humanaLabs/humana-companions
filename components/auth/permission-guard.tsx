'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  context?: {
    resourceId?: string;
    organizationId?: string;
    teamId?: string;
    ownerId?: string;
  };
  fallback?: ReactNode;
  requireMasterAdmin?: boolean;
  requireAdmin?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  context,
  fallback = null,
  requireMasterAdmin = false,
  requireAdmin = false,
}: PermissionGuardProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    canAccess,
    isMasterAdmin,
    isAdmin,
    loading 
  } = usePermissions();

  // Mostrar loading se ainda carregando permissões
  if (loading) {
    return <>{fallback}</>;
  }

  // Verificar Master Admin
  if (requireMasterAdmin && !isMasterAdmin) {
    return <>{fallback}</>;
  }

  // Verificar Admin
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  // Verificar permissão específica por resource.action
  if (resource && action) {
    if (!canAccess(resource, action, context)) {
      return <>{fallback}</>;
    }
  }

  // Verificar permissão específica
  if (permission) {
    if (!hasPermission(permission, context)) {
      return <>{fallback}</>;
    }
  }

  // Verificar múltiplas permissões
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions, context)
      : hasAnyPermission(permissions, context);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Componentes específicos para casos comuns
interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireMaster?: boolean;
}

export function AdminGuard({ 
  children, 
  fallback = null, 
  requireMaster = false 
}: AdminGuardProps) {
  return (
    <PermissionGuard
      requireMasterAdmin={requireMaster}
      requireAdmin={!requireMaster}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

interface ResourceGuardProps {
  children: ReactNode;
  resource: string;
  action: string;
  context?: {
    resourceId?: string;
    organizationId?: string;
    teamId?: string;
    ownerId?: string;
  };
  fallback?: ReactNode;
}

export function ResourceGuard({
  children,
  resource,
  action,
  context,
  fallback = null,
}: ResourceGuardProps) {
  return (
    <PermissionGuard
      resource={resource}
      action={action}
      context={context}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

// Guards específicos para cada área
export function UsersGuard({ children, action = 'read', fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) {
  return (
    <ResourceGuard resource="users" action={action} fallback={fallback}>
      {children}
    </ResourceGuard>
  );
}

export function TeamsGuard({ children, action = 'read', fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) {
  return (
    <ResourceGuard resource="teams" action={action} fallback={fallback}>
      {children}
    </ResourceGuard>
  );
}

export function CompanionsGuard({ children, action = 'read', fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) {
  return (
    <ResourceGuard resource="companions" action={action} fallback={fallback}>
      {children}
    </ResourceGuard>
  );
}

export function OrganizationsGuard({ children, action = 'read', fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) {
  return (
    <ResourceGuard resource="organizations" action={action} fallback={fallback}>
      {children}
    </ResourceGuard>
  );
}

export function RolesGuard({ children, fallback = null }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permission="admin.roles" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
} 