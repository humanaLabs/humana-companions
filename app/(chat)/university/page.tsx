import { PageHeader } from '@/components/page-header';
import { FileIcon, SparklesIcon, BoxIcon, LineChartIcon, CheckCircleFillIcon, GlobeIcon, UserIcon, CheckIcon } from '@/components/icons';

export default function UniversityPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader
          title="University"
          description="Centro de aprendizado e desenvolvimento"
          showBackButton={true}
        />
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-muted-foreground">
                  <FileIcon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Cursos</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Explore nossa biblioteca de cursos estruturados para desenvolver suas habilidades
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>12 cursos disponíveis</span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-muted-foreground">
                  <SparklesIcon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Treinamentos</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Participe de treinamentos práticos e workshops interativos
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>8 treinamentos ativos</span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-muted-foreground">
                  <BoxIcon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Biblioteca</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Acesse materiais de referência, documentação e recursos educacionais
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>150+ recursos disponíveis</span>
              </div>
            </div>
          </div>

          {/* Seção de estatísticas */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Seu Progresso</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2 text-muted-foreground">
                  <CheckCircleFillIcon size={20} />
                </div>
                <div className="text-2xl font-bold text-foreground">3</div>
                <div className="text-xs text-muted-foreground">Cursos Concluídos</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2 text-muted-foreground">
                  <GlobeIcon size={20} />
                </div>
                <div className="text-2xl font-bold text-foreground">12h</div>
                <div className="text-xs text-muted-foreground">Tempo de Estudo</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2 text-muted-foreground">
                  <LineChartIcon size={20} />
                </div>
                <div className="text-2xl font-bold text-foreground">85%</div>
                <div className="text-xs text-muted-foreground">Taxa de Conclusão</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2 text-muted-foreground">
                  <CheckIcon size={20} />
                </div>
                <div className="text-2xl font-bold text-foreground">2</div>
                <div className="text-xs text-muted-foreground">Certificados</div>
              </div>
            </div>
          </div>

          {/* Recursos adicionais */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recursos Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">
                  <CheckIcon size={20} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Certificações</div>
                  <div className="text-xs text-muted-foreground">Obtenha certificados reconhecidos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">
                  <GlobeIcon size={20} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Comunidade</div>
                  <div className="text-xs text-muted-foreground">Conecte-se com outros estudantes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">
                  <LineChartIcon size={20} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Analytics</div>
                  <div className="text-xs text-muted-foreground">Acompanhe seu progresso</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 