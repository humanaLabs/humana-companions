import { auth } from '@/app/(auth)/auth';
import { getCompanionsByUserId } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { CompanionsPageClient } from '@/components/companions-page-client';
import { PageHeader } from '@/components/page-header';
import { CompanionsHeaderActions } from '@/components/companions-header-actions';
import { getOrganizationId } from '@/lib/tenant-context';

export default async function CompanionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  const companions = await getCompanionsByUserId({ 
    userId: session.user.id!,
    organizationId
  });

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Companions" 
        description="Gerencie seus assistentes de IA personalizados"
        showBackButton={true}
      >
        <CompanionsHeaderActions />
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto">
        <CompanionsPageClient companions={companions} />
      </div>
    </div>
  );
} 