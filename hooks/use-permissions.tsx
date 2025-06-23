'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import type { UserContext, Resource, Action } from '@/lib/types/permissions';
import { canAccessPage, canPerformAction } from '@/lib/auth/permissions';

export function usePermissions() {
  const { data: session } = useSession();

  const userContext: UserContext | null = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id!,
      role: (session.user as any).role || 'user', // TODO: Adicionar role na sessão
      organizationId: (session.user as any).organizationId,
      teamIds: (session.user as any).teamIds || [],
    };
  }, [session]);

  const hasPageAccess = (page: Resource): boolean => {
    if (!userContext) return false;
    return canAccessPage(userContext, page);
  };

  const hasActionAccess = (
    resource: Resource,
    action: Action,
    targetContext?: {
      ownerId?: string;
      organizationId?: string;
      teamId?: string;
    }
  ): boolean => {
    if (!userContext) return false;
    return canPerformAction(userContext, resource, action, targetContext);
  };

  const isRole = (role: string): boolean => {
    return userContext?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return userContext ? roles.includes(userContext.role) : false;
  };

  return {
    userContext,
    hasPageAccess,
    hasActionAccess,
    isRole,
    hasAnyRole,
    isAuthenticated: !!session?.user,
    isAdmin: hasAnyRole(['admin', 'super_admin']),
    isSuperAdmin: isRole('super_admin'),
  };
} 