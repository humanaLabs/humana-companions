'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Globe, Server, CheckCircle, XCircle, TestTube, Eye, X, Link, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { McpServer } from '@/lib/db/schema';
import { toast } from 'sonner';

interface McpServersListProps {
  servers: McpServer[];
  onEdit: (server: McpServer) => void;
  onDelete: (serverId: string) => void;
}

export function McpServersList({ servers, onEdit, onDelete }: McpServersListProps) {
  const [testingServers, setTestingServers] = useState<Set<string>>(new Set());
  const [connectingServers, setConnectingServers] = useState<Set<string>>(new Set());
  const [serverTools, setServerTools] = useState<Record<string, Array<{ name: string; description?: string }>>>({});
  const [showToolsModal, setShowToolsModal] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null);
  const [authData, setAuthData] = useState({
    authType: 'none' as 'none' | 'bearer' | 'basic' | 'apikey',
    authToken: '',
    authUsername: '',
    authPassword: '',
    authHeaderName: 'X-API-Key',
  });

  // Função para buscar ferramentas de um servidor
  const fetchServerTools = async (server: McpServer) => {
    console.log(`🔧 Iniciando busca de ferramentas para servidor: ${server.name} (ID: ${server.id})`);
    
    try {
      const url = `/api/mcp-servers/${server.id}/tools`;
      console.log(`📡 Fazendo requisição para: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Status da resposta: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`📦 Resposta recebida:`, result);
        
        if (result.success && result.tools) {
          console.log(`✅ ${result.tools.length} ferramentas carregadas para ${server.name}`);
          setServerTools(prev => ({
            ...prev,
            [server.id]: result.tools
          }));
        } else {
          console.log(`⚠️ Resposta sem sucesso para ${server.name}:`, result.message || 'Sem ferramentas');
          // Se não conseguiu carregar, marca como vazio
          setServerTools(prev => ({
            ...prev,
            [server.id]: []
          }));
        }
      } else {
        console.log(`❌ Erro HTTP ${response.status} para ${server.name}`);
        // Se houve erro, marca como vazio
        setServerTools(prev => ({
          ...prev,
          [server.id]: []
        }));
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar ferramentas de ${server.name}:`, error);
      // Se houve erro, marca como vazio
      setServerTools(prev => ({
        ...prev,
        [server.id]: []
      }));
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
          toast.error(`❌ ${result.message || 'Falha na conexão'} com ${server.name}`);
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

  const handleConnect = async (server: McpServer) => {
    // Abrir modal de autenticação
    setAuthData({
      authType: server.authType || 'none',
      authToken: server.authToken || '',
      authUsername: server.authUsername || '',
      authPassword: server.authPassword || '',
      authHeaderName: server.authHeaderName || 'X-API-Key',
    });
    setShowAuthModal(server.id);
  };

  const handleConfirmConnect = async () => {
    const server = servers.find(s => s.id === showAuthModal);
    if (!server) return;

    setConnectingServers(prev => new Set(prev).add(server.id));

    try {
      const response = await fetch('/api/mcp-servers/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          serverId: server.id,
          ...authData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`🔗 Conectado com sucesso ao ${server.name}!`);
          setShowAuthModal(null);
          // Recarregar ferramentas após conexão bem-sucedida
          fetchServerTools(server);
        } else {
          toast.error(`❌ ${result.message || 'Falha na conexão'}`);
        }
      } else {
        toast.error(`❌ Erro ao conectar ao ${server.name}`);
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error(`❌ Erro ao conectar ao ${server.name}`);
    } finally {
      setConnectingServers(prev => {
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
  const authModalServer = servers.find(s => s.id === showAuthModal);

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
                    
                    {/* Status do sistema (ativo/inativo) */}
                    {server.isActive ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        ⚡ Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        ⏸️ Inativo
                      </Badge>
                    )}
                    
                    {/* Status de conectividade (online/offline) - só mostra se estiver ativo */}
                    {server.isActive && (
                      serverTools[server.id] !== undefined ? (
                        serverTools[server.id].length > 0 ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            🌐 Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                            ⚠️ Offline
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          ⏳ Carregando...
                        </Badge>
                      )
                    )}
                    
                    {/* Status de autenticação (conectado/desconectado) - só mostra se estiver ativo e online */}
                    {server.isActive && serverTools[server.id] && serverTools[server.id].length > 0 && (
                      server.isConnected ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          ✓ Conectado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          🔐 Não conectado
                        </Badge>
                      )
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
                      ) : serverTools[server.id] !== undefined ? (
                        <Badge variant="outline" className="text-xs text-red-600">
                          Nenhuma ferramenta
                        </Badge>
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
                  {/* Botão Conectar - só aparece se estiver online mas não conectado */}
                  {server.isActive && 
                   serverTools[server.id] && 
                   serverTools[server.id].length > 0 && 
                   !server.isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(server)}
                      disabled={connectingServers.has(server.id)}
                      className="flex items-center gap-1"
                    >
                      <Link size={14} />
                      {connectingServers.has(server.id) ? 'Conectando...' : 'Conectar'}
                    </Button>
                  )}

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

      {/* Modal de Autenticação */}
      {showAuthModal && authModalServer && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAuthModal(null)}
        >
          <div 
            className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold">
                  Conectar ao Servidor
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(null)}
                className="flex items-center gap-1"
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-900">{authModalServer.name}</div>
                <div className="text-sm text-blue-700">{authModalServer.url}</div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Autenticação</Label>
                <Select
                  value={authData.authType}
                  onValueChange={(value) => setAuthData(prev => ({ 
                    ...prev, 
                    authType: value as 'none' | 'bearer' | 'basic' | 'apikey'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="apikey">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authData.authType === 'bearer' && (
                <div className="space-y-2">
                  <Label>Bearer Token</Label>
                  <Input
                    type="password"
                    value={authData.authToken}
                    onChange={(e) => setAuthData(prev => ({ ...prev, authToken: e.target.value }))}
                    placeholder="seu-bearer-token-aqui"
                  />
                </div>
              )}

              {authData.authType === 'basic' && (
                <>
                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <Input
                      value={authData.authUsername}
                      onChange={(e) => setAuthData(prev => ({ ...prev, authUsername: e.target.value }))}
                      placeholder="seu-usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={authData.authPassword}
                      onChange={(e) => setAuthData(prev => ({ ...prev, authPassword: e.target.value }))}
                      placeholder="sua-senha"
                    />
                  </div>
                </>
              )}

              {authData.authType === 'apikey' && (
                <>
                  <div className="space-y-2">
                    <Label>Nome do Header</Label>
                    <Input
                      value={authData.authHeaderName}
                      onChange={(e) => setAuthData(prev => ({ ...prev, authHeaderName: e.target.value }))}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={authData.authToken}
                      onChange={(e) => setAuthData(prev => ({ ...prev, authToken: e.target.value }))}
                      placeholder="sua-api-key-aqui"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAuthModal(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmConnect}
                  disabled={connectingServers.has(authModalServer.id)}
                  className="flex-1"
                >
                  {connectingServers.has(authModalServer.id) ? 'Conectando...' : 'Conectar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 