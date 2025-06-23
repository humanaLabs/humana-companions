'use client';

import { useState, useEffect } from 'react';
import { Server, CheckCircle, Wrench, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { McpServersList } from '@/components/mcp-servers-list';
import { McpServerForm } from '@/components/mcp-server-form';
import type { McpServer } from '@/lib/db/schema';
import { toast } from 'sonner';

export function McpServersPageClient() {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [serverStats, setServerStats] = useState({
    totalTools: 0,
    connectedServers: 0,
    activeServers: 0,
  });

  const fetchMcpServers = async () => {
    try {
      const response = await fetch('/api/mcp-servers');
      if (response.ok) {
        const data = await response.json();
        setMcpServers(data);
        updateServerStats(data);
      } else {
        toast.error('Erro ao carregar servidores MCP');
      }
    } catch (error) {
      console.error('Erro ao buscar servidores MCP:', error);
      toast.error('Erro ao carregar servidores MCP');
    } finally {
      setIsLoading(false);
    }
  };

  const updateServerStats = async (servers: McpServer[]) => {
    const activeServers = servers.filter(server => server.isActive).length;
    let totalTools = 0;
    let connectedServers = 0;

    // Buscar ferramentas de cada servidor ativo
    for (const server of servers) {
      if (server.isActive) {
        try {
          const toolsResponse = await fetch(`/api/mcp-servers/${server.id}/tools`);
          if (toolsResponse.ok) {
            const toolsData = await toolsResponse.json();
            if (toolsData.success && toolsData.tools) {
              totalTools += toolsData.tools.length;
              connectedServers++;
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar ferramentas do servidor ${server.name}:`, error);
        }
      }
    }

    setServerStats({
      totalTools,
      connectedServers,
      activeServers,
    });
  };

  useEffect(() => {
    fetchMcpServers();
  }, []);

  useEffect(() => {
    const handleNewServer = () => {
      setShowForm(true);
    };

    window.addEventListener('mcp-servers:new', handleNewServer);
    return () => window.removeEventListener('mcp-servers:new', handleNewServer);
  }, []);

  const handleCreateSuccess = (newServer: McpServer) => {
    const updatedServers = [newServer, ...mcpServers];
    setMcpServers(updatedServers);
    updateServerStats(updatedServers);
    setShowForm(false);
    toast.success('Servidor MCP criado com sucesso!');
  };

  const handleUpdateSuccess = (updatedServer: McpServer) => {
    const updatedServers = mcpServers.map(server => 
      server.id === updatedServer.id ? updatedServer : server
    );
    setMcpServers(updatedServers);
    updateServerStats(updatedServers);
    setEditingServer(null);
    toast.success('Servidor MCP atualizado com sucesso!');
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor MCP?')) {
      return;
    }

    try {
      const response = await fetch(`/api/mcp-servers/${serverId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedServers = mcpServers.filter(server => server.id !== serverId);
        setMcpServers(updatedServers);
        updateServerStats(updatedServers);
        toast.success('Servidor MCP excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir servidor MCP');
      }
    } catch (error) {
      console.error('Erro ao excluir servidor MCP:', error);
      toast.error('Erro ao excluir servidor MCP');
    }
  };

  const handleEdit = (server: McpServer) => {
    setEditingServer(server);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingServer(null);
  };

  const handleCancelCreate = () => {
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando servidores MCP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showForm && (
        <McpServerForm 
          onSuccess={handleCreateSuccess}
          onCancel={handleCancelCreate}
        />
      )}

      {editingServer && (
        <McpServerForm 
          server={editingServer}
          onSuccess={handleUpdateSuccess}
          onCancel={handleCancelEdit}
        />
      )}

      {!showForm && !editingServer && (
        <>
          {/* Dashboard MCP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Servidores</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {serverStats.connectedServers} de {serverStats.activeServers}
              </p>
              <p className="text-sm text-muted-foreground">conectados</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Ferramentas</span>
              </div>
              <p className="text-2xl font-bold mt-1">{serverStats.totalTools}</p>
              <p className="text-sm text-muted-foreground">disponíveis</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Status</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {serverStats.connectedServers > 0 ? 'ON' : 'OFF'}
              </p>
              <p className="text-sm text-muted-foreground">
                {serverStats.connectedServers > 0 ? 'operacional' : 'desconectado'}
              </p>
            </div>
          </div>

          {mcpServers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="text-lg font-medium mb-2">Nenhum servidor MCP configurado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione servidores MCP para estender as capacidades do chat com ferramentas externas.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Adicionar Primeiro Servidor
              </Button>
            </div>
          ) : (
            <McpServersList 
              servers={mcpServers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}