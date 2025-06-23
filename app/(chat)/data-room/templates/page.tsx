import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { LineChartIcon, FileIcon, InvoiceIcon } from '@/components/icons';

export default async function TemplatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Templates" 
        description="Modelos prontos para acelerar seu trabalho"
        badge="Data Room"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload size={16} />
            Importar Template
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Criar Template
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
              Todos
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Business
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Jurídico
            </button>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">
              Marketing
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Templates */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <LineChartIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Business
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Plano de Negócios
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Template completo para estruturar seu plano de negócios com todas as seções essenciais.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">12 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            {/* Jurídico Templates */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <InvoiceIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Jurídico
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Contrato de Prestação de Serviços
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Modelo de contrato padrão para prestação de serviços profissionais.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">8 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            {/* Marketing Templates */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <FileIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Marketing
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Estratégia de Marketing Digital
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Framework completo para desenvolver sua estratégia de marketing digital.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">15 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            {/* More Templates */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <FileIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Business
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Relatório Executivo
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Template para criação de relatórios executivos profissionais.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">6 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <FileIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Jurídico
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Política de Privacidade
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Template de política de privacidade em conformidade com a LGPD.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">10 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <LineChartIcon size={32} />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Marketing
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Dashboard de KPIs
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Template para acompanhamento e análise de indicadores de performance.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">4 páginas</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm font-medium transition-colors">
                  Usar Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 