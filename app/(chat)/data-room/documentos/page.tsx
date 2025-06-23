import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function DocumentosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 p-8">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Documentos
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Gerencie e organize seus documentos de forma inteligente
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              📄 Data Room
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card border rounded-lg p-4">
            <div className="flex gap-3">
              <button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <span className="text-sm">+</span>
                Novo Documento
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <span className="text-sm">↑</span>
                Upload
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  className="pl-8 pr-4 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              </div>
              <select className="px-3 py-2 border rounded-lg bg-background text-foreground">
                <option>Todos os tipos</option>
                <option>PDF</option>
                <option>Word</option>
                <option>Excel</option>
                <option>PowerPoint</option>
              </select>
            </div>
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Document Card 1 */}
            <div className="bg-card border rounded-lg p-4 hover:shadow-lg transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-lg">📄</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <span className="text-gray-500 text-sm">⋯</span>
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