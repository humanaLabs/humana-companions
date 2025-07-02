'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { BotIcon, SparklesIcon, RouteIcon, LineChartIcon, UserIcon } from '@/components/icons';
import Link from 'next/link';

export default function CompanionsDesignerPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Comp Designer" 
        description="Desenvolva assistentes IA especializados para sua organização"
        showBackButton={true}
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Companions Designer Card */}
          <Card className="p-8 mb-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-muted-foreground">
                <div className="w-16 h-16 flex items-center justify-center">
                  <div className="scale-[4]">
                    <BotIcon />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Companions Designer
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Desenvolva assistentes IA especializados com personalidades, 
                conhecimentos e habilidades específicas para sua organização.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left">
                <div className="text-sm text-muted-foreground">
                  ✓ Personalidades customizadas<br/>
                  ✓ Base de conhecimento
                </div>
                <div className="text-sm text-muted-foreground">
                  ✓ Habilidades específicas<br/>
                  ✓ Integração com sistemas
                </div>
              </div>
              <Link href="/companions" className="w-full max-w-sm">
                <Button size="lg" className="w-full">
                  Criar Novo Companion
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
                    <UserIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Personalidades Únicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Defina características comportamentais específicas para cada companion, 
                      criando assistentes com personalidades distintas e apropriadas.
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
                    <h4 className="font-semibold text-foreground mb-2">Conhecimento Especializado</h4>
                    <p className="text-sm text-muted-foreground">
                      Treine companions com bases de conhecimento específicas do seu domínio, 
                      incluindo documentos, procedimentos e expertise técnica.
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
                    <h4 className="font-semibold text-foreground mb-2">Habilidades Avançadas</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure capacidades específicas como análise de dados, 
                      geração de relatórios, integração com APIs e automação de tarefas.
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
                    <h4 className="font-semibold text-foreground mb-2">Performance Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitore o desempenho dos companions com métricas detalhadas 
                      sobre interações, satisfação do usuário e eficiência.
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
              <Link href="/companions" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Novo Companion</h4>
                    <p className="text-xs text-muted-foreground">
                      Criar do zero
                    </p>
                  </div>
                </Card>
              </Link>
              
              <Link href="/companions" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Template Especialista</h4>
                    <p className="text-xs text-muted-foreground">
                      Usar modelo pré-definido
                    </p>
                  </div>
                </Card>
              </Link>
              
              <Link href="/companions" className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground mb-2">Clonar Existente</h4>
                    <p className="text-xs text-muted-foreground">
                      Duplicar e personalizar
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