'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { McpServer } from '@/lib/db/schema';
import { toast } from 'sonner';

interface McpServerFormProps {
  server?: McpServer;
  onSuccess: (server: McpServer) => void;
  onCancel: () => void;
}

export function McpServerForm({ server, onSuccess, onCancel }: McpServerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: server?.name || '',
    url: server?.url || '',
    transport: server?.transport || 'sse' as const,
    description: server?.description || '',
    isActive: server?.isActive ?? true,
    authType: server?.authType || 'none' as const,
    authToken: server?.authToken || '',
    authUsername: server?.authUsername || '',
    authPassword: server?.authPassword || '',
    authHeaderName: server?.authHeaderName || '',
  });

  const isEditing = !!server;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/mcp-servers/${server.id}` : '/api/mcp-servers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedServer = await response.json();
        onSuccess(savedServer);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar servidor MCP');
      }
    } catch (error) {
      console.error('Erro ao salvar servidor MCP:', error);
      toast.error('Erro ao salvar servidor MCP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Servidor MCP' : 'Novo Servidor MCP'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do servidor MCP"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transport">Transporte</Label>
              <Select
                value={formData.transport}
                onValueChange={(value) => handleInputChange('transport', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                  <SelectItem value="stdio">STDIO (em desenvolvimento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://exemplo.com/mcp"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição opcional do servidor MCP"
              rows={3}
            />
          </div>

          {/* Seção de Autenticação */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Autenticação</h3>
            
            <div className="space-y-2">
              <Label htmlFor="authType">Tipo de Autenticação</Label>
              <Select
                value={formData.authType}
                onValueChange={(value) => handleInputChange('authType', value)}
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

            {formData.authType === 'bearer' && (
              <div className="space-y-2">
                <Label htmlFor="authToken">Bearer Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  value={formData.authToken}
                  onChange={(e) => handleInputChange('authToken', e.target.value)}
                  placeholder="seu-bearer-token-aqui"
                />
              </div>
            )}

            {formData.authType === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authUsername">Usuário</Label>
                  <Input
                    id="authUsername"
                    value={formData.authUsername}
                    onChange={(e) => handleInputChange('authUsername', e.target.value)}
                    placeholder="seu-usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authPassword">Senha</Label>
                  <Input
                    id="authPassword"
                    type="password"
                    value={formData.authPassword}
                    onChange={(e) => handleInputChange('authPassword', e.target.value)}
                    placeholder="sua-senha"
                  />
                </div>
              </div>
            )}

            {formData.authType === 'apikey' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authHeaderName">Nome do Header</Label>
                  <Input
                    id="authHeaderName"
                    value={formData.authHeaderName}
                    onChange={(e) => handleInputChange('authHeaderName', e.target.value)}
                    placeholder="X-API-Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authToken">API Key</Label>
                  <Input
                    id="authToken"
                    type="password"
                    value={formData.authToken}
                    onChange={(e) => handleInputChange('authToken', e.target.value)}
                    placeholder="sua-api-key-aqui"
                  />
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Servidor ativo</Label>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 