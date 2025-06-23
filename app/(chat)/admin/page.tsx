import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader title="Administração" description="Gerencie acessos, times e permissões da organização" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {/* Gestão de Pessoas */}
          <Link href="/admin/people" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gestão de Pessoas</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gerencie usuários, times, convites e organize a estrutura da equipe
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Controle de Acessos */}
          <Link href="/admin/permissions" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Controle de Acessos</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure permissões e níveis de acesso para diferentes funcionalidades
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Auditoria e Logs */}
          <Link href="/admin/audit" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Auditoria</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Visualize logs de atividades e relatórios de auditoria
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Configurações da Organização */}
          <Link href="/admin/organization" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Organização</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure dados da organização e políticas gerais
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Analytics e Métricas */}
          <Link href="/admin/analytics" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Métricas de uso, performance e insights da organização
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Configurações Avançadas */}
          <Link href="/admin/settings" className="group">
            <Card className="p-6 h-full bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Configurações</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configurações avançadas do sistema e integrações
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 