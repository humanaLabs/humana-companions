import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { OrganizationVisualizer } from '@/components/experimental/organization-visualizer';

export default async function OrganizationVisualizerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              🧪 Experimental
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Visualizador Hierárquico de Organizações
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <OrganizationVisualizer userId={session.user.id} />
      </div>
    </div>
  );
} 