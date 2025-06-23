'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { FileIcon, ServerIcon, SparklesIcon, LineChartIcon, CheckIcon, GlobeIcon, InvoiceIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';

export default function DataRoomPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Data Room" 
        description="Gerencie documentos, templates e integrações em um só lugar"
        badge="Data Room"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} />
            Configurações
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Novo Item
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Documentos */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow group cursor-pointer"
                 onClick={() => router.push('/data-room/documentos')}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <FileIcon size={48} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Gestão
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Documentos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Organize, categorize e gerencie todos os seus documentos importantes em um local centralizado.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">245 documentos</span>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Acessar
                </Button>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow group cursor-pointer"
                 onClick={() => router.push('/data-room/templates')}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <InvoiceIcon size={48} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Produtividade
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Templates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acelere seu trabalho com templates prontos para documentos, contratos e relatórios.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">18 templates</span>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Explorar
                </Button>
              </div>
            </div>

            {/* Integrações */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow group cursor-pointer"
                 onClick={() => router.push('/data-room/integracoes')}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <ServerIcon size={48} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Conectividade
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Integrações</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte suas ferramentas favoritas e automatize fluxos de trabalho.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">12 conectadas</span>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Configurar
                </Button>
              </div>
            </div>
          </div>

          {/* Seção de estatísticas */}
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Estatísticas do Data Room</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="text-center">
                 <div className="flex items-center justify-center mb-2 text-muted-foreground">
                   <FileIcon size={24} />
                 </div>
                 <div className="text-2xl font-bold text-foreground">245</div>
                 <div className="text-sm text-muted-foreground">Documentos Totais</div>
               </div>
               <div className="text-center">
                 <div className="flex items-center justify-center mb-2 text-muted-foreground">
                   <CheckIcon size={24} />
                 </div>
                 <div className="text-2xl font-bold text-foreground">18</div>
                 <div className="text-sm text-muted-foreground">Templates Ativos</div>
               </div>
               <div className="text-center">
                 <div className="flex items-center justify-center mb-2 text-muted-foreground">
                   <ServerIcon size={24} />
                 </div>
                 <div className="text-2xl font-bold text-foreground">12</div>
                 <div className="text-sm text-muted-foreground">Integrações</div>
               </div>
               <div className="text-center">
                 <div className="flex items-center justify-center mb-2 text-muted-foreground">
                   <SparklesIcon size={24} />
                 </div>
                 <div className="text-2xl font-bold text-foreground">98%</div>
                 <div className="text-sm text-muted-foreground">Automação</div>
               </div>
             </div>
          </div>

          {/* Recursos adicionais */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Recursos Adicionais</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="bg-card border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="text-muted-foreground">
                     <SparklesIcon size={20} />
                   </div>
                   <div>
                     <div className="font-medium text-foreground">IA para Documentos</div>
                     <div className="text-xs text-muted-foreground">Análise automática de conteúdo</div>
                   </div>
                 </div>
               </div>
               <div className="bg-card border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="text-muted-foreground">
                     <LineChartIcon size={20} />
                   </div>
                   <div>
                     <div className="font-medium text-foreground">Analytics Avançado</div>
                     <div className="text-xs text-muted-foreground">Métricas de uso e performance</div>
                   </div>
                 </div>
               </div>
               <div className="bg-card border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="text-muted-foreground">
                     <GlobeIcon size={20} />
                   </div>
                   <div>
                     <div className="font-medium text-foreground">Colaboração Global</div>
                     <div className="text-xs text-muted-foreground">Trabalhe em equipe em tempo real</div>
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