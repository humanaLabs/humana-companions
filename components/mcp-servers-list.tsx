'use client';

import { useState } from 'react';
import { Edit, Trash2, Globe, Server, CheckCircle, XCircle, TestTube } from 'lucide-react';
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <Card key={server.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {server.name}
                  {server.isActive ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getTransportIcon(server.transport)}
                    {getTransportLabel(server.transport)}
                  </Badge>
                  <Badge variant={server.isActive ? 'default' : 'secondary'}>
                    {server.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">URL:</p>
              <p className="text-sm break-all">{server.url}</p>
            </div>

            {server.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Descrição:</p>
                <p className="text-sm text-muted-foreground">{server.description}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>Criado: {formatDate(server.createdAt)}</p>
              {server.updatedAt !== server.createdAt && (
                <p>Atualizado: {formatDate(server.updatedAt)}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 