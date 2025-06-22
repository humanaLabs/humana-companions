'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ServerIcon, CheckIcon } from './icons';
import type { McpServer } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface McpSelectorProps {
  selectedMcpServerIds: string[];
  onMcpServersChange: (serverIds: string[]) => void;
  className?: string;
}

export function McpSelector({
  selectedMcpServerIds,
  onMcpServersChange,
  className,
}: McpSelectorProps) {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMcpServers = async () => {
      try {
        const response = await fetch('/api/mcp-servers');
        if (response.ok) {
          const servers = await response.json();
          setMcpServers(servers.filter((s: McpServer) => s.isActive));
        }
      } catch (error) {
        console.error('Erro ao carregar servidores MCP:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMcpServers();
  }, []);

  const toggleServer = (serverId: string) => {
    const newSelection = selectedMcpServerIds.includes(serverId)
      ? selectedMcpServerIds.filter(id => id !== serverId)
      : [...selectedMcpServerIds, serverId];
    
    onMcpServersChange(newSelection);
  };

  const selectedServersCount = selectedMcpServerIds.length;
  const availableServersCount = mcpServers.length;

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn("h-fit px-2 py-1.5", className)}
      >
        <ServerIcon className="w-4 h-4" />
        <span className="sr-only md:not-sr-only ml-2">Carregando...</span>
      </Button>
    );
  }

  if (availableServersCount === 0) {
    return null; // Não mostrar se não há servidores
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-fit px-2 py-1.5 gap-2", className)}
        >
          <ServerIcon className="w-4 h-4" />
          <span className="sr-only md:not-sr-only">
            Servidores MCP
          </span>
          {selectedServersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedServersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>
          Servidores MCP ({availableServersCount} disponíveis)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {mcpServers.map((server) => {
          const isSelected = selectedMcpServerIds.includes(server.id);
          
          return (
            <DropdownMenuItem
              key={server.id}
              onClick={() => toggleServer(server.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center",
                isSelected ? "bg-primary border-primary" : "border-border"
              )}>
                {isSelected && <CheckIcon className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{server.name}</div>
                {server.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {server.description}
                  </div>
                )}
              </div>
              <Badge variant={server.isActive ? "default" : "secondary"} className="text-xs">
                {server.transport.toUpperCase()}
              </Badge>
            </DropdownMenuItem>
          );
        })}
        
        {selectedServersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onMcpServersChange([])}
              className="text-muted-foreground"
            >
              Limpar seleção
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 