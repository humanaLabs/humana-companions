'use client';

import { usePermissions } from '@/hooks/use-permissions';
import type { Resource, Action } from '@/lib/types/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
  action = 'view',
  fallback,
  redirectTo = '/',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { hasPageAccess, hasActionAccess, isAuthenticated } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const hasAccess = action === 'view' 
      ? hasPageAccess(resource)
      : hasActionAccess(resource, action);

    if (!hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, hasPageAccess, hasActionAccess, resource, action, redirectTo, requireAuth, router]);

  // Verificar autenticação
  if (requireAuth && !isAuthenticated) {
    return fallback || <div>Redirecionando para login...</div>;
  }

  // Verificar permissão
  const hasAccess = action === 'view' 
    ? hasPageAccess(resource)
    : hasActionAccess(resource, action);

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
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
  const { hasActionAccess } = usePermissions();

  const hasAccess = hasActionAccess(resource, action, targetContext);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 