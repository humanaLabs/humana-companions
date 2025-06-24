'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Tipos locais para o componente (simplificados)
type Resource = string;
type Action = string;

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource: Resource;
  action?: Action;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  resource,
  action = 'read',
  fallback,
  redirectTo = '/',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { canAccess, loading, isMasterAdmin } = usePermissions();
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  useEffect(() => {
    // Aguardar carregamento da sessão e permissões
    if (status === 'loading' || loading) return;

    // Verificar autenticação
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Master admin tem acesso a tudo
    if (isMasterAdmin) return;

    // Verificar permissões específicas
    if (isAuthenticated) {
      const hasAccess = canAccess(resource, action);
      if (!hasAccess && redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [
    status,
    loading,
    isAuthenticated,
    canAccess,
    resource,
    action,
    redirectTo,
    requireAuth,
    router,
    isMasterAdmin,
  ]);

  // Mostrar loading enquanto carrega
  if (status === 'loading' || loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      )
    );
  }

  // Verificar autenticação
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-muted-foreground">
              Redirecionando para login...
            </p>
          </div>
        </div>
      )
    );
  }

  // Master admin tem acesso a tudo
  if (isMasterAdmin) {
    return <>{children}</>;
  }

  // Verificar permissão para usuários regulares
  const hasAccess = canAccess(resource, action);

  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// Componente para proteger elementos específicos
interface ProtectedElementProps {
  children: React.ReactNode;
  resource: Resource;
  action: Action;
  targetContext?: {
    ownerId?: string;
    organizationId?: string;
    teamId?: string;
    resourceId?: string;
  };
  fallback?: React.ReactNode;
}

export function ProtectedElement({
  children,
  resource,
  action,
  targetContext,
  fallback = null,
}: ProtectedElementProps) {
  const { canAccess, isMasterAdmin } = usePermissions();

  // Master admin pode ver tudo
  if (isMasterAdmin) {
    return <>{children}</>;
  }

  // Converter targetContext para o formato esperado pelo hook
  const context = targetContext
    ? {
        resourceId: targetContext.resourceId || targetContext.ownerId,
        organizationId: targetContext.organizationId,
        teamId: targetContext.teamId,
        ownerId: targetContext.ownerId,
      }
    : undefined;

  const hasAccess = canAccess(resource, action, context);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook customizado para verificar acesso simples a recursos
export function useResourceAccess(resource: string, action = 'read'): boolean {
  const { canAccess, isMasterAdmin } = usePermissions();

  // Master admin tem acesso a tudo
  if (isMasterAdmin) return true;

  return canAccess(resource, action);
}

// Hook para verificar se é uma página admin
export function useIsAdminPage(resource: string): boolean {
  const adminResources = ['users', 'teams', 'roles', 'organizations', 'admin'];
  return adminResources.some((adminRes) => resource.includes(adminRes));
}

// Hook para verificar acesso a páginas específicas do sistema
export function usePagePermissions() {
  const { canAccess, isMasterAdmin, isAdmin } = usePermissions();
  const { data: session } = useSession();

  return {
    // Páginas básicas (qualquer usuário autenticado)
    canAccessCompanions: !!session?.user,
    canAccessChat: !!session?.user,
    canAccessPreferences: !!session?.user,

    // Páginas administrativas
    canAccessUsers: isMasterAdmin || canAccess('users', 'read'),
    canAccessTeams: isMasterAdmin || canAccess('teams', 'read'),
    canAccessRoles: isMasterAdmin || canAccess('roles', 'read'),
    canAccessOrganizations: isMasterAdmin || canAccess('organizations', 'read'),
    canAccessMasterAdmin: isMasterAdmin,

    // Páginas avançadas
    canAccessMcpServers: isAdmin || canAccess('mcp_servers', 'read'),
    canAccessDataRoom: isAdmin || canAccess('data_room', 'read'),
    canAccessExperimental: isAdmin || canAccess('experimental', 'read'),

    // Estados
    isMasterAdmin,
    isAdmin,
    isAuthenticated: !!session?.user,
  };
}
