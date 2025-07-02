import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/app/(auth)/auth';
import { QuotasPageClient } from '@/components/quotas-page-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Quotas | Humana Companions',
  description: 'Gerencie suas quotas e limites de uso',
};

export default async function QuotasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Quotas e Limites
        </h1>
        <p className="text-muted-foreground">
          Visualize seu uso atual e gerencie os limites dos recursos
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-full mb-4"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <QuotasPageClient userId={session.user.id} />
      </Suspense>
    </div>
  );
} 