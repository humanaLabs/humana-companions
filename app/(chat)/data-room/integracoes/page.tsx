import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function IntegracoesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 p-8">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Integrações
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Conecte suas ferramentas favoritas e automatize workflows
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              🔗 Integrações
            </div>
          </div>

          {/* Integration Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cloud Storage */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">💾</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Armazenamento
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">GD</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Google Drive</p>
                      <p className="text-xs text-muted-foreground">Sincronização automática</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">DB</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Dropbox</p>
                      <p className="text-xs text-muted-foreground">Backup automático</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
              </div>
            </div>

            {/* Communication */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Comunicação
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">SL</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Slack</p>
                      <p className="text-xs text-muted-foreground">Notificações em tempo real</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">TM</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Microsoft Teams</p>
                      <p className="text-xs text-muted-foreground">Colaboração empresarial</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
              </div>
            </div>

            {/* Productivity */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Produtividade
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">NT</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Notion</p>
                      <p className="text-xs text-muted-foreground">Workspace colaborativo</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-xs">TR</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Trello</p>
                      <p className="text-xs text-muted-foreground">Gestão de projetos</p>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                    Conectar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Integrations */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Integrações Ativas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Google Drive</p>
                    <p className="text-sm text-muted-foreground">Conectado há 2 dias • Última sincronização: há 5 min</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-muted-foreground hover:text-foreground p-2">
                    <span className="text-sm">⚙</span>
                  </button>
                  <button className="text-muted-foreground hover:text-foreground p-2">
                    <span className="text-sm">🗑</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                <div className="text-center">
                  <span className="text-2xl opacity-50 block mb-2">🔗</span>
                  <p className="text-sm">Conecte mais integrações para ver aqui</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 