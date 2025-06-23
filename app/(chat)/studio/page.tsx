'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

export default function StudioPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Studio" 
        description="Ferramentas de design para criar organizações e companions"
        showBackButton={true}
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Designer */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Organization Designer
                </h3>
                <p className="text-muted-foreground">
                  Crie e gerencie estruturas organizacionais complexas com hierarquias, 
                  departamentos e fluxos de trabalho personalizados.
                </p>
                <div className="flex flex-col space-y-2 w-full">
                  <div className="text-sm text-muted-foreground">
                    ✓ Estruturas hierárquicas<br/>
                    ✓ Departamentos customizados<br/>
                    ✓ Fluxos de trabalho<br/>
                    ✓ Visualização interativa
                  </div>
                </div>
                <Link href="/organizations" className="w-full">
                  <Button className="w-full">
                    Abrir Organization Designer
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Companions Designer */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Companions Designer
                </h3>
                <p className="text-muted-foreground">
                  Desenvolva assistentes IA especializados com personalidades, 
                  conhecimentos e habilidades específicas para sua organização.
                </p>
                <div className="flex flex-col space-y-2 w-full">
                  <div className="text-sm text-muted-foreground">
                    ✓ Personalidades customizadas<br/>
                    ✓ Base de conhecimento<br/>
                    ✓ Habilidades específicas<br/>
                    ✓ Integração com sistemas
                  </div>
                </div>
                <Link href="/companions" className="w-full">
                  <Button className="w-full">
                    Abrir Companions Designer
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Seção de recursos adicionais */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Recursos do Studio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <h4 className="font-semibold text-foreground">Criação Rápida</h4>
                    <p className="text-sm text-muted-foreground">
                      Templates pré-configurados para começar rapidamente
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔄</span>
                  <div>
                    <h4 className="font-semibold text-foreground">Sincronização</h4>
                    <p className="text-sm text-muted-foreground">
                      Mantenha organizações e companions sempre atualizados
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <h4 className="font-semibold text-foreground">Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitore performance e uso dos seus designs
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 