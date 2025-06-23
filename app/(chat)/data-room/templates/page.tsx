import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function TemplatesPage() {
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
                Templates
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Modelos prontos para acelerar seu trabalho
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              📋 Templates
            </div>
          </div>

          {/* Template Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Templates */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-lg">🏢</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Business
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">Plano de Negócios</p>
                    <p className="text-xs text-muted-foreground">Estrutura completa</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">Proposta Comercial</p>
                    <p className="text-xs text-muted-foreground">Modelo profissional</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Legal Templates */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">⚖️</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Jurídico
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">Contrato de Serviços</p>
                    <p className="text-xs text-muted-foreground">Modelo padrão</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">NDA</p>
                    <p className="text-xs text-muted-foreground">Acordo de confidencialidade</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing Templates */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <span className="text-lg">📢</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Marketing
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">Plano de Marketing</p>
                    <p className="text-xs text-muted-foreground">Estratégia completa</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">Apresentação Pitch</p>
                    <p className="text-xs text-muted-foreground">Para investidores</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 