import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ExperimentalPage() {
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
              Desenvolvimentos Experimentais
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Warning Card */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-muted-foreground">⚠️</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Área de Desenvolvimento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Esta área contém funcionalidades experimentais que podem estar incompletas 
                  ou instáveis. Use apenas para testes e desenvolvimento.
                </p>
              </div>
            </div>
          </div>

          {/* Experimental Features List */}
          <div className="bg-card border rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-foreground">
                Desenvolvimentos Experimentais
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Funcionalidades em desenvolvimento para testes futuros
              </p>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {/* Visualizador Hierárquico */}
                <Link
                  href="/experimental/organization-visualizer"
                  className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <span className="text-primary text-sm">🌐</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        Visualizador Hierárquico
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Editor visual de organizações e companions com ReactFlow
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                    Ativo
                  </div>
                </Link>

                {/* Placeholder for future experimental features */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border-dashed border">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-muted rounded">
                      <span className="text-muted-foreground text-sm">🚧</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        Área reservada para desenvolvimentos futuros
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Novos recursos experimentais aparecerão aqui
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Em breve
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 