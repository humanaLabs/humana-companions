import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Search } from 'lucide-react';
import { BoxIcon, SparklesIcon, GlobeIcon, LineChartIcon, CheckIcon, ServerIcon } from '@/components/icons';

export default async function AplicativosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Aplicativos" 
        description="Catálogo de aplicativos customizados desenvolvidos pelos usuários"
        badge="Aplicativos"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} />
            Configurações
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Novo Aplicativo
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          
          {/* Barra de busca e filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="🔍 Buscar aplicativos..."
                className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                Todos
              </button>
              <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
                Produtividade
              </button>
              <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
                Comunicação
              </button>
              <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
                Analytics
              </button>
            </div>
          </div>

          {/* Aplicativos em Destaque */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <SparklesIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Produtividade
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.8</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Smart Task Manager</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie suas tarefas com IA integrada. Priorização automática e sugestões inteligentes.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                      JD
                    </div>
                    <span className="text-xs text-muted-foreground">por João Dev</span>
                  </div>
                  <Button size="sm">Instalar</Button>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <LineChartIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Analytics
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.9</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Data Insights Pro</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize e analise seus dados com dashboards interativos e relatórios automáticos.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
                      MS
                    </div>
                    <span className="text-xs text-muted-foreground">por Maria Silva</span>
                  </div>
                  <Button size="sm">Instalar</Button>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <GlobeIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Comunicação
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.7</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Team Sync Hub</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Centralize comunicação da equipe com notificações inteligentes e integração com ferramentas.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                      TC
                    </div>
                    <span className="text-xs text-muted-foreground">por Tech Corp</span>
                  </div>
                  <Button size="sm">Instalar</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Todos os Aplicativos */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">📱 Todos os Aplicativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <BoxIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Produtividade
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.5</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Document Organizer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Organize e categorize documentos automaticamente usando IA.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                      AL
                    </div>
                    <span className="text-xs text-muted-foreground">por Ana Lima</span>
                  </div>
                  <Button variant="outline" size="sm">Instalar</Button>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <ServerIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Infraestrutura
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.6</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Server Monitor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitore servidores e aplicações com alertas em tempo real.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                      RS
                    </div>
                    <span className="text-xs text-muted-foreground">por Rafael Santos</span>
                  </div>
                  <Button variant="outline" size="sm">Instalar</Button>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <CheckIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Produtividade
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">⭐</span>
                      <span className="text-xs text-muted-foreground">4.3</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Quality Checker</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verifique qualidade de código e documentos com IA avançada.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white">
                      LC
                    </div>
                    <span className="text-xs text-muted-foreground">por Lucas Costa</span>
                  </div>
                  <Button variant="outline" size="sm">Instalar</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-muted/50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">📊 Estatísticas da Loja</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">127</div>
                <div className="text-sm text-muted-foreground">Aplicativos Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">1.2k</div>
                <div className="text-sm text-muted-foreground">Downloads Totais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">89</div>
                <div className="text-sm text-muted-foreground">Desenvolvedores Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">4.7</div>
                <div className="text-sm text-muted-foreground">Avaliação Média</div>
              </div>
            </div>
          </div>

          {/* Call to Action para Desenvolvedores */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">🚀 Seja um Desenvolvedor</h3>
            <p className="text-muted-foreground mb-4">
              Crie seus próprios aplicativos e compartilhe com a comunidade. Ganhe reconhecimento e ajude outros usuários.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button>Começar a Desenvolver</Button>
              <Button variant="outline">Ver Documentação</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 