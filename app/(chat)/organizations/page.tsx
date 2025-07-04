import { auth } from '@/app/(auth)/auth';
import { OrganizationsPageClient } from '@/components/organizations-page-client';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { OrganizationsHeaderActions } from '@/components/organizations-header-actions';

export default async function OrganizationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Organizações" 
        description="Configure estruturas organizacionais para seus companions"
        showBackButton={true}
      >
        <OrganizationsHeaderActions />
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto">
        <OrganizationsPageClient />
      </div>
    </div>
  );
} 