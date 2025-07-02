import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/app/(auth)/auth';
import { AdminQuotasPageClient } from '@/components/admin-quotas-page-client';
import { ProtectedElement } from '@/components/auth/protected-route';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Gerenciar Quotas | Admin - Humana Companions',
  description: 'Gerencie quotas e limites de todos os usuários',
};

export default async function AdminQuotasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <ProtectedElement resource="users" action="update">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Gerenciar Quotas de Usuários
          </h1>
          <p className="text-muted-foreground">
            Configure limites e monitore o uso de recursos para todos os usuários
          </p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-6">
              {/* Loading para tabela */}
              <div className="bg-card border rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <AdminQuotasPageClient />
        </Suspense>
      </div>
    </ProtectedElement>
  );
} 