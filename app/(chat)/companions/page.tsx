import { auth } from '@/app/(auth)/auth';
import { getAllCompanionsByOrganization } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { CompanionsPageClient } from '@/components/companions-page-client';
import { PageHeader } from '@/components/page-header';
import { CompanionsHeaderActions } from '@/components/companions-header-actions';
import { headers } from 'next/headers';

export default async function CompanionsPage() {
  console.log('🚀 COMPANIONS PAGE - Starting execution...');
  
  try {
    const session = await auth();
    console.log('🔐 COMPANIONS PAGE - Session obtained:', !!session?.user);

    if (!session?.user) {
      console.log('❌ COMPANIONS PAGE - No session, redirecting to login');
      redirect('/login');
    }

    // 🔒 ISOLAMENTO MULTI-TENANT: Ler organizationId dos headers do middleware
    const headersList = await headers();
    const organizationId = headersList.get('x-organization-id');
    
    console.log('🔍 COMPANIONS PAGE - Headers check:', {
      hasHeaders: !!headersList,
      organizationId: organizationId,
      allHeaders: Object.fromEntries(
        Array.from(headersList.keys()).map(key => [key, headersList.get(key)])
      )
    });
    
    if (!organizationId) {
      console.error('❌ COMPANIONS PAGE - No organization context');
      throw new Error('Organization context required - no x-organization-id header found');
    }

    // 🔍 DEBUG: Verificar isolamento
    console.log('🔒 COMPANIONS PAGE - Multi-tenant isolation check:', {
      userId: session.user.id,
      organizationId: organizationId,
      source: 'middleware-header'
    });

    console.log('📊 COMPANIONS PAGE - About to query database...');
    
    // ✅ CORREÇÃO: Usar nova query que busca TODOS da organização (mesma lógica da API)
    const companions = await getAllCompanionsByOrganization({
      organizationId: organizationId
    });

    console.log('📊 COMPANIONS PAGE - Database query completed:', {
      companionsCount: companions?.length || 0,
      companionsData: companions?.map(c => ({ id: c.id, name: c.name, organizationId: c.organizationId })) || []
    });

    console.log('🔒 COMPANIONS PAGE - Found companions by organization:', companions.length);

    console.log('🎨 COMPANIONS PAGE - About to render component...');

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
  } catch (error) {
    console.error('💥 COMPANIONS PAGE - Fatal error:', error);
    console.error('💥 COMPANIONS PAGE - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error; // Re-throw para Next.js mostrar erro
  }
} 