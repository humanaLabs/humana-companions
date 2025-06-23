import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExperimentalButtonShowcase } from '@/components/experimental/experimental-button';

export default async function ComponentsLabPage() {
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
              <Link 
                href="/experimental"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-block"
              >
                ← Voltar para Experimental
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Laboratório de Componentes
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Teste e desenvolva novos componentes UI de forma isolada
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🧪 Experimental
            </div>
          </div>

          {/* Component Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buttons & Inputs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Botões & Inputs
              </h3>
              <div className="space-y-4">
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105">
                  Botão Gradiente
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600">
                  Botão Tracejado
                </button>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Input com animação..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Cards & Layouts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cards & Layouts
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Card Animado</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Com hover effect</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white">Card com Borda</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Destaque lateral colorido</p>
                </div>
              </div>
            </div>

            {/* Interactive Elements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Elementos Interativos
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input type="checkbox" id="experimental-toggle" className="sr-only" />
                    <label 
                      htmlFor="experimental-toggle" 
                      className="block w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer transition-colors duration-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 translate-x-0.5 translate-y-0.5"></div>
                    </label>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Toggle Customizado</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{width: '60%'}}></div>
                </div>
                
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Experimental Components Showcase */}
          <ExperimentalButtonShowcase />

          {/* Component Playground */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Playground de Componentes
            </h2>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Preview</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-32 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">Componente de Exemplo</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Controles</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cor Principal
                      </label>
                      <input 
                        type="color" 
                        defaultValue="#3b82f6"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tamanho
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Pequeno</option>
                        <option>Médio</option>
                        <option>Grande</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Texto
                      </label>
                      <input 
                        type="text" 
                        defaultValue="Componente de Exemplo"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
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