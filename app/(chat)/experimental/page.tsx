import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function ExperimentalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Área Experimental" 
        description="Teste novas funcionalidades em desenvolvimento"
        badge="🧪 BETA"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Relatório de Bugs
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} />
            Configurações
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Área Experimental
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  As funcionalidades desta área estão em desenvolvimento e podem apresentar instabilidades. 
                  Os dados não são persistidos e podem ser perdidos.
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Components Lab */}
            <Link href="/experimental/components" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-2xl">🧪</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Componentes
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Laboratório de Componentes
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Teste e visualize novos componentes da interface antes da implementação.
                </p>
                <div className="flex items-center text-sm text-primary group-hover:text-primary/80">
                  <span>Explorar →</span>
                </div>
              </div>
            </Link>

            {/* API Playground */}
            <Link href="/experimental/api-playground" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    API
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  API Playground
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Teste endpoints experimentais e funcionalidades de API em desenvolvimento.
                </p>
                <div className="flex items-center text-sm text-primary group-hover:text-primary/80">
                  <span>Testar →</span>
                </div>
              </div>
            </Link>

            {/* Organization Visualizer */}
            <Link href="/experimental/organization-visualizer" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Visualização
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Visualizador de Organizações
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize e edite a estrutura hierárquica das organizações e companions.
                </p>
                <div className="flex items-center text-sm text-primary group-hover:text-primary/80">
                  <span>Visualizar →</span>
                </div>
              </div>
            </Link>

            {/* Coming Soon */}
            <div className="bg-card border rounded-lg p-6 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">🚧</span>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Em Breve
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Mais Funcionalidades
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Novas funcionalidades experimentais serão adicionadas regularmente.
              </p>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Aguarde...</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">Status da Área Experimental</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Funcionalidades Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">Estável</div>
                <div className="text-sm text-muted-foreground">Status Atual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">Beta</div>
                <div className="text-sm text-muted-foreground">Versão</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 