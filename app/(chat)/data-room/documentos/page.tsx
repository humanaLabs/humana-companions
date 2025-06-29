import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { DocumentManager } from '@/components/document-manager';

export default async function DocumentosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Documentos" 
        description="Gerencie e organize seus documentos de forma inteligente"
        badge="Data Room"
        showBackButton={true}
      />
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto">
          <DocumentManager />
        </div>
      </div>
    </div>
  );
} 