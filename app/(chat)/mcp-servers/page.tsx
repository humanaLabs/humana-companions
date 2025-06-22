'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { McpServersList } from '@/components/mcp-servers-list';
import { McpServerForm } from '@/components/mcp-server-form';
import type { McpServer } from '@/lib/db/schema';
import { toast } from 'sonner';

export default function McpServersPage() {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

  const fetchMcpServers = async () => {
    try {
      const response = await fetch('/api/mcp-servers');
      if (response.ok) {
        const data = await response.json();
        setMcpServers(data);
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

  useEffect(() => {
    fetchMcpServers();
  }, []);

  const handleCreateSuccess = (newServer: McpServer) => {
    setMcpServers(prev => [newServer, ...prev]);
    setShowForm(false);
    toast.success('Servidor MCP criado com sucesso!');
  };

  const handleUpdateSuccess = (updatedServer: McpServer) => {
    setMcpServers(prev => 
      prev.map(server => 
        server.id === updatedServer.id ? updatedServer : server
      )
    );
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
        setMcpServers(prev => prev.filter(server => server.id !== serverId));
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando servidores MCP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">Servidores MCP</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus servidores Model Context Protocol
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Servidor
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {showForm && (
          <div className="mb-6">
            <McpServerForm 
              onSuccess={handleCreateSuccess}
              onCancel={handleCancelCreate}
            />
          </div>
        )}

        {editingServer && (
          <div className="mb-6">
            <McpServerForm 
              server={editingServer}
              onSuccess={handleUpdateSuccess}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

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
      </div>
    </div>
  );
} 