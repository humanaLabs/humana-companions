import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default function UniversityPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader 
          title="University" 
          description="Centro de aprendizado e recursos educacionais"
        />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo à University
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore cursos, tutoriais e recursos para maximizar seu uso da plataforma Humana Companions
            </p>
          </div>

          {/* Categorias de Conteúdo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Guias Básicos</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aprenda os fundamentos da plataforma
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Tutoriais Avançados</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Técnicas avançadas e melhores práticas
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">IA & Companions</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Como criar e otimizar seus companions
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gestão de Times</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Organize e gerencie equipes eficientemente
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🔗</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Integrações</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Conecte com outras ferramentas e sistemas
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Casos de Uso</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Exemplos práticos e casos reais
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Em breve
                </div>
              </div>
            </Card>
          </div>

          {/* Status de Desenvolvimento */}
          <Card className="p-6 bg-card border rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-4xl">🚧</div>
              <h2 className="text-xl font-semibold text-foreground">Em Desenvolvimento</h2>
              <p className="text-muted-foreground">
                A University está sendo desenvolvida para oferecer uma experiência completa de aprendizado. 
                Em breve você terá acesso a cursos interativos, certificações e muito mais!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 