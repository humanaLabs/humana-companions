'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { difyAgents, fetchDifyAgents, type DifyAgent } from '@/lib/ai/dify-agents';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

interface DifyAgentSelectorProps {
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
  className?: string;
  apiKey?: string;
  baseUrl?: string;
}

export function DifyAgentSelector({
  selectedAgentId,
  onAgentSelect,
  className,
  apiKey,
  baseUrl,
}: DifyAgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [optimisticAgentId, setOptimisticAgentId] = useOptimistic(selectedAgentId);
  const [agents, setAgents] = useState<DifyAgent[]>(difyAgents);
  const [loading, setLoading] = useState(false);

  // Buscar agentes do Dify se API key e base URL estiverem disponíveis
  useEffect(() => {
    if (apiKey && baseUrl) {
      setLoading(true);
      fetchDifyAgents(apiKey, baseUrl)
        .then(setAgents)
        .finally(() => setLoading(false));
    }
  }, [apiKey, baseUrl]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === optimisticAgentId),
    [optimisticAgentId, agents],
  );

  // Agrupar agentes por categoria
  const agentsByCategory = useMemo(() => {
    const grouped = agents.reduce((acc, agent) => {
      const category = agent.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(agent);
      return acc;
    }, {} as Record<string, DifyAgent[]>);

    return grouped;
  }, [agents]);

  const handleAgentSelect = (agentId: string) => {
    setOpen(false);
    startTransition(() => {
      setOptimisticAgentId(agentId);
      onAgentSelect(agentId);
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="dify-agent-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
          disabled={loading}
        >
          {loading ? 'Carregando...' : selectedAgent?.name || 'Selecionar Agente'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {Object.entries(agentsByCategory).map(([category, categoryAgents], index) => (
          <div key={category}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>
              {category}
            </DropdownMenuLabel>
            {categoryAgents.map((agent) => {
              const { id } = agent;

              return (
                <DropdownMenuItem
                  data-testid={`dify-agent-selector-item-${id}`}
                  key={id}
                  onSelect={() => handleAgentSelect(id)}
                  data-active={id === optimisticAgentId}
                  asChild
                >
                  <button
                    type="button"
                    className="gap-4 group/item flex flex-row justify-between items-center w-full"
                  >
                    <div className="flex flex-col gap-1 items-start">
                      <div>{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {agent.description}
                      </div>
                    </div>

                    <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      <CheckCircleFillIcon />
                    </div>
                  </button>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 