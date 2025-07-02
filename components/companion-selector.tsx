'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon } from './icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import type { Companion } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface CompanionSelectorProps {
  selectedCompanionId?: string;
  onCompanionChange: (companionId: string | undefined) => void;
  className?: string;
}

export function CompanionSelector({
  selectedCompanionId,
  onCompanionChange,
  className,
}: CompanionSelectorProps) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCompanion = companions.find(c => c.id === selectedCompanionId);

  useEffect(() => {
    async function fetchCompanions() {
      try {
        const response = await fetch('/api/companions');
        if (response.ok) {
          const data = await response.json();
          setCompanions(data.companions || []);
        }
      } catch (error) {
        console.error('Erro ao carregar companions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanions();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex items-center gap-2 px-2 h-[34px] data-[state=open]:bg-accent',
            className
          )}
          disabled={isLoading}
        >
          <span className="text-sm font-medium">
            {isLoading 
              ? 'Carregando...' 
              : selectedCompanion?.name || 'Companion Super Hero'
            }
          </span>
          <ChevronDownIcon size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          onClick={() => {
            console.log('Selecionando Companion Super Hero');
            onCompanionChange(undefined);
          }}
          className="cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="font-medium">Companion Super Hero</span>
            <span className="text-xs text-muted-foreground">
              Usar comportamento padrão
            </span>
          </div>
        </DropdownMenuItem>
        {companions.map((companion) => (
          <DropdownMenuItem
            key={companion.id}
            onClick={() => {
              console.log('Selecionando companion:', companion.name);
              onCompanionChange(companion.id);
            }}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{companion.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {companion.role || companion.instruction?.slice(0, 60) || 'Companion personalizado'}
                {companion.instruction && companion.instruction.length > 60 && '...'}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 