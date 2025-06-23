'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ApiResponse {
  status: number;
  data: any;
  error?: string;
  timestamp: string;
}

export default function ApiPlaygroundPage() {
  const [endpoint, setEndpoint] = useState('/api/experimental');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "message": "Teste experimental",\n  "data": {\n    "component": "api-playground",\n    "timestamp": "' + new Date().toISOString() + '"\n  }\n}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const executeRequest = async () => {
    setLoading(true);
    
    try {
      const requestHeaders = JSON.parse(headers);
      const requestBody = method !== 'GET' ? JSON.parse(body) : undefined;

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (requestBody) {
        fetchOptions.body = JSON.stringify(requestBody);
      }

      const res = await fetch(endpoint, fetchOptions);
      const data = await res.json();

      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResponse({
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 p-8">
        <div className="max-w-7xl w-full mx-auto space-y-6">
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
                API Playground
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Teste APIs experimentais de forma segura e isolada
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              🚀 API Testing
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Panel */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Configurar Requisição
                </h2>

                {/* Method and Endpoint */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="/api/experimental"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>

                  {/* Headers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Headers (JSON)
                    </label>
                    <textarea
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                    />
                  </div>

                  {/* Body (only for non-GET methods) */}
                  {method !== 'GET' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Body (JSON)
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                      />
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    onClick={executeRequest}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Executando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Executar Requisição
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMethod('GET');
                      setEndpoint('/api/experimental');
                    }}
                    className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg transition-colors"
                  >
                    Status API
                  </button>
                  <button
                    onClick={() => {
                      setMethod('POST');
                      setEndpoint('/api/experimental');
                    }}
                    className="px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-lg transition-colors"
                  >
                    Teste POST
                  </button>
                </div>
              </div>
            </div>

            {/* Response Panel */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Resposta
                </h2>

                {response ? (
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status:
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        response.status >= 200 && response.status < 300
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : response.status >= 400
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {response.status} {response.status === 0 ? 'Network Error' : ''}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timestamp:
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {response.timestamp}
                      </span>
                    </div>

                    {/* Response Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dados da Resposta
                      </label>
                      <pre className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs overflow-auto">
                        {response.error ? response.error : formatJson(response.data)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>Execute uma requisição para ver a resposta</p>
                    </div>
                  </div>
                )}
              </div>

              {/* API Documentation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  📚 APIs Experimentais Disponíveis
                </h3>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div><code>/api/experimental</code> - Status e informações da API experimental</div>
                  <div><code>/api/experimental/test</code> - Endpoint de teste (em desenvolvimento)</div>
                  <div><code>/api/experimental/debug</code> - Debug e logs (em desenvolvimento)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 