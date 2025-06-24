'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { useSession } from 'next-auth/react';

export function DebugPermissions() {
  const { data: session } = useSession();
  const { userPermissions, isMasterAdmin, isAdmin, hasPermission } = usePermissions();

  if (!session) return null;

  const hasRolesPermission = hasPermission('admin.roles');

  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 max-w-md text-xs z-50">
      <h4 className="font-bold text-foreground mb-2">🔐 Debug Permissões</h4>
      <div className="space-y-1 text-muted-foreground">
        <div><strong>Email:</strong> {session.user?.email}</div>
        <div><strong>É Master Admin:</strong> {isMasterAdmin ? '✅' : '❌'}</div>
        <div><strong>É Admin:</strong> {isAdmin ? '✅' : '❌'}</div>
        <div><strong>Role ID:</strong> {userPermissions?.roleId || 'N/A'}</div>
        <div><strong>Permissões:</strong> {userPermissions?.computedPermissions?.length || 0}</div>
        <div><strong>admin.roles:</strong> {hasRolesPermission ? '✅' : '❌'}</div>
        {userPermissions?.computedPermissions?.includes('*') && (
          <div className="text-green-600"><strong>🌟 Wildcard (*)</strong></div>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer">Ver todas permissões</summary>
          <div className="mt-1 max-h-32 overflow-y-auto text-xs">
            {userPermissions?.computedPermissions?.map(perm => (
              <div key={perm} className="text-xs">{perm}</div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
} 