import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

export default async function IntegracoesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Integrações" 
        description="Conecte suas ferramentas favoritas"
        badge="🔗 Data Room"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} />
            Configurações
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Nova Integração
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
              Todas
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Armazenamento
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Comunicação
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Produtividade
            </button>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Storage Integrations */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Armazenamento
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Google Drive
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sincronize e acesse seus arquivos do Google Drive diretamente na plataforma.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">✓ Conectado</span>
                <button className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Configurar
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Armazenamento
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Dropbox
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integre seus arquivos do Dropbox para acesso rápido e sincronização.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            {/* Communication Integrations */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Comunicação
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Slack
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Receba notificações e interaja com seus companions diretamente no Slack.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Comunicação
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Microsoft Teams
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integre com o Teams para colaboração e comunicação em equipe.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            {/* Productivity Integrations */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Produtividade
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Notion
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sincronize suas páginas e bancos de dados do Notion.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Produtividade
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Trello
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte seus boards do Trello para gerenciamento de projetos.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Produtividade
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Asana
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integre com o Asana para acompanhar tarefas e projetos.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Armazenamento
                  </span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                OneDrive
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse e sincronize arquivos da Microsoft OneDrive.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Não conectado</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Conectar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 