'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { BoxIcon, SparklesIcon, RouteIcon, LineChartIcon } from '@/components/icons';
import Link from 'next/link';

export default function OrganizationDesignerPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Org Center" 
        description="Crie e gerencie estruturas organizacionais complexas"
        showBackButton={true}
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Organization Designer Card */}
          <Card className="p-8 mb-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-muted-foreground">
                <div className="w-16 h-16 flex items-center justify-center">
                  <BoxIcon size={64} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Organization Designer
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Crie e gerencie estruturas organizacionais complexas com hierarquias, 
                departamentos e fluxos de trabalho personalizados.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left">
                <div className="text-sm text-muted-foreground">
                  ✓ Estruturas hierárquicas<br/>
                  ✓ Departamentos customizados
                </div>
                <div className="text-sm text-muted-foreground">
                  ✓ Fluxos de trabalho<br/>
                  ✓ Visualização interativa
                </div>
              </div>
              <Link href="/organizations" className="w-full max-w-sm">
                <Button size="lg" className="w-full">
                  Iniciar Design Organizacional
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recursos específicos */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Recursos Avançados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-muted-foreground mt-1">
                    <BoxIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Hierarquias Flexíveis</h4>
                    <p className="text-sm text-muted-foreground">
                      Crie estruturas organizacionais que se adaptam ao crescimento da empresa, 
                      com suporte a múltiplos níveis hierárquicos e departamentos cruzados.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-muted-foreground mt-1">
                    <RouteIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Fluxos Personalizados</h4>
                    <p className="text-sm text-muted-foreground">
                      Defina processos de trabalho específicos para cada departamento, 
                      com aprovações automáticas e notificações inteligentes.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-muted-foreground mt-1">
                    <SparklesIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Templates Inteligentes</h4>
                    <p className="text-sm text-muted-foreground">
                      Utilize modelos pré-configurados para diferentes tipos de organizações 
                      ou crie seus próprios templates personalizados.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-muted-foreground mt-1">
                    <LineChartIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Analytics Organizacional</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitore a eficiência organizacional com métricas detalhadas 
                      sobre performance de departamentos e fluxos de trabalho.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/organizations" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Nova Organização</h4>
                    <p className="text-xs text-muted-foreground">
                      Criar do zero
                    </p>
                  </div>
                </Card>
              </Link>
              
              <Link href="/organizations" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Usar Template</h4>
                    <p className="text-xs text-muted-foreground">
                      Começar com modelo
                    </p>
                  </div>
                </Card>
              </Link>
              
              <Link href="/organizations" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Importar Dados</h4>
                    <p className="text-xs text-muted-foreground">
                      De sistema existente
                    </p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 