'use client';

import { Building2, ChevronDown, Check } from 'lucide-react';
import { useOrganizationContext } from '@/hooks/use-organization-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function OrganizationSelector() {
  const { currentOrganization, organizations, switchOrganization, isLoading } = useOrganizationContext();
  const { isMasterAdmin } = usePermissions();

  // DEBUG TEMPORÁRIO
  console.log('🔍 OrganizationSelector DEBUG:', {
    isMasterAdmin,
    organizationsLength: organizations.length,
    organizations: organizations.map(o => ({ id: o.id, name: o.name })),
    currentOrganization: currentOrganization ? { id: currentOrganization.id, name: currentOrganization.name } : null,
    isLoading,
    shouldShow: isMasterAdmin || organizations.length > 1
  });

  // Mostrar apenas se for Master Admin ou houver múltiplas organizações
  const shouldShow = isMasterAdmin || organizations.length > 1;

  if (!shouldShow || isLoading) {
    console.log('🚫 OrganizationSelector: Not showing', { shouldShow, isLoading });
    return null;
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-muted bg-background/50 hover:bg-muted/50"
          >
            <Building2 className="h-3 w-3" />
            <span className="text-xs max-w-[120px] truncate">
              {currentOrganization?.name || 'Selecionar Org'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-[200px]">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Organizações Disponíveis
          </div>
          <DropdownMenuSeparator />
          
          {organizations.map((org) => {
            const isSelected = currentOrganization?.id === org.id;
            return (
              <DropdownMenuItem
                key={org.id}
                className="cursor-pointer"
                onSelect={() => {
                  console.log('🔄 Switching to organization:', org.id, org.name);
                  switchOrganization(org.id);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center min-w-0">
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
          
          {organizations.length === 0 && (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground text-xs">Nenhuma organização encontrada</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 