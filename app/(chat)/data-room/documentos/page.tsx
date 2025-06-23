import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

export default async function DocumentosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Documentos" 
        description="Gerencie e organize seus documentos de forma inteligente"
        badge="📄 Data Room"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload size={16} />
            Upload
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Novo Documento
          </Button>
        </div>
      </PageHeader>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Search and Filters Bar */}
          <div className="flex gap-2 justify-end">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar documentos..."
                className="pl-8 pr-4 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            </div>
            <select className="px-3 py-2 border rounded-lg bg-background text-foreground">
              <option>Todos os tipos</option>
              <option>PDF</option>
              <option>Word</option>
              <option>Excel</option>
              <option>PowerPoint</option>
            </select>
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Document Card 1 */}
            <div className="bg-card border rounded-lg p-4 hover:shadow-lg transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">📄</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-muted rounded">
                    <span className="text-muted-foreground text-sm">⋯</span>
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-foreground mb-1 truncate">
                Relatório Mensal.pdf
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Modificado há 2 horas
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>2.3 MB</span>
                <span>PDF</span>
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-muted/50 rounded-lg border-2 border-dashed border-muted p-6 hover:border-muted-foreground/50 transition-colors cursor-pointer">
              <div className="text-center">
                <span className="text-4xl text-muted-foreground block mb-3">📁</span>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  ou clique para selecionar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 