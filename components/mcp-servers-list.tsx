'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Globe, Server, CheckCircle, XCircle, TestTube, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { McpServer } from '@/lib/db/schema';
import { toast } from 'sonner';

interface McpServersListProps {
  servers: McpServer[];
  onEdit: (server: McpServer) => void;
  onDelete: (serverId: string) => void;
}

export function McpServersList({ servers, onEdit, onDelete }: McpServersListProps) {
  const [testingServers, setTestingServers] = useState<Set<string>>(new Set());
  const [serverTools, setServerTools] = useState<Record<string, Array<{ name: string; description?: string }>>>({});
  const [showToolsModal, setShowToolsModal] = useState<string | null>(null);

  // Função para buscar ferramentas de um servidor
  const fetchServerTools = async (server: McpServer) => {
    try {
      const response = await fetch('/api/mcp-servers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId: server.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.tools) {
          setServerTools(prev => ({
            ...prev,
            [server.id]: result.tools
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ferramentas:', error);
    }
  };

  // Buscar ferramentas de todos os servidores ativos ao carregar
  useEffect(() => {
    servers.forEach(server => {
      if (server.isActive) {
        fetchServerTools(server);
      }
    });
  }, [servers]);

  const handleTestConnection = async (server: McpServer) => {
    setTestingServers(prev => new Set(prev).add(server.id));

    try {
      const response = await fetch('/api/mcp-servers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId: server.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`✅ Conexão com ${server.name} bem-sucedida!`);
        } else {
          toast.error(`❌ Falha na conexão com ${server.name}`);
        }
      } else {
        toast.error(`❌ Erro ao testar conexão com ${server.name}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error(`❌ Erro ao testar conexão com ${server.name}`);
    } finally {
      setTestingServers(prev => {
        const newSet = new Set(prev);
        newSet.delete(server.id);
        return newSet;
      });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransportIcon = (transport: string) => {
    return transport === 'sse' ? <Globe size={16} /> : <Server size={16} />;
  };

  const getTransportLabel = (transport: string) => {
    return transport === 'sse' ? 'SSE' : 'STDIO';
  };

  const selectedServer = servers.find(s => s.id === showToolsModal);
  const selectedServerTools = showToolsModal ? serverTools[showToolsModal] || [] : [];

  return (
    <>
      <div className="space-y-4">
        {servers.map((server) => (
          <Card key={server.id} className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{server.name}</h3>
                    {server.isActive ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✓ Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        ✗ Disconnected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    Servidor remoto: {server.url}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ferramentas disponíveis:</span>
                    <div className="flex gap-2 flex-wrap">
                      {serverTools[server.id] && serverTools[server.id].length > 0 ? (
                        serverTools[server.id].slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool.name.replace(/^.*_/, '')}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Carregando...
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => setShowToolsModal(server.id)}
                      className="text-sm font-bold ml-2 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                      disabled={!serverTools[server.id] || serverTools[server.id].length === 0}
                    >
                      {serverTools[server.id] ? serverTools[server.id].length : '...'}
                      {serverTools[server.id] && serverTools[server.id].length > 0 && (
                        <Eye size={14} className="ml-1" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(server)}
                    disabled={testingServers.has(server.id)}
                    className="flex items-center gap-1"
                  >
                    <TestTube size={14} />
                    {testingServers.has(server.id) ? 'Testando...' : 'Testar'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(server)}
                    className="flex items-center gap-1"
                  >
                    <Edit size={14} />
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(server.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Ferramentas */}
      {showToolsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowToolsModal(null)}
        >
          <div 
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  Ferramentas do {selectedServer?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedServerTools.length} ferramentas disponíveis
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowToolsModal(null)}
                className="flex items-center gap-1"
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
                             <div className="grid grid-cols-1 gap-3">
                 {selectedServerTools.map((tool, index) => (
                   <div
                     key={index}
                     className="p-4 border rounded-lg"
                   >
                     <div className="font-medium text-sm mb-1">
                       {tool.name.replace(/^.*_/, '')}
                     </div>
                     <div className="text-xs text-muted-foreground mb-2">
                       {tool.name}
                     </div>
                     {tool.description && (
                       <div className="text-sm text-muted-foreground">
                         {tool.description}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
              
              {selectedServerTools.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ferramenta encontrada
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 