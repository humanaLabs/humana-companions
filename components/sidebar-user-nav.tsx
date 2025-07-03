'use client';

import { ChevronUp, Building2 } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';
import { useOrganizationContext } from '@/hooks/use-organization-context';
import { usePermissions } from '@/hooks/use-permissions';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const { currentOrganization, organizations, switchOrganization } = useOrganizationContext();
  const { isMasterAdmin } = usePermissions();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

  // DEBUG TEMPORÁRIO: Verificar valores
  console.log('🔍 SIDEBAR DEBUG:', {
    isMasterAdmin,
    organizationsLength: organizations.length,
    organizations: organizations.map(o => ({ id: o.id, name: o.name })),
    currentOrganization: currentOrganization ? { id: currentOrganization.id, name: currentOrganization.name } : null,
    userEmail: data?.user?.email,
    showOrgSelector: isMasterAdmin || organizations.length > 1
  });

  // Mostrar seletor de organização se for master admin ou se houver múltiplas orgs
  const showOrgSelector = isMasterAdmin || organizations.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-auto py-2 w-[calc(100%-20px)]"
              >
                <Image
                  src={`https://avatar.vercel.sh/${user.email}`}
                  alt={user.email ?? 'User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {state === 'expanded' && (
                  <>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span
                        data-testid="user-email"
                        className="truncate text-sm"
                      >
                        {isGuest ? 'Usuário Convidado' : user?.email}
                      </span>
                      {isGuest && (
                        <span className="text-[10px] text-muted-foreground/50 truncate w-full font-mono leading-tight">
                          {user.id}
                        </span>
                      )}
                      {/* Organização Atual */}
                      {showOrgSelector && currentOrganization && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 truncate w-full mt-0.5">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{currentOrganization.name}</span>
                        </div>
                      )}
                    </div>
                    <ChevronUp className="ml-auto" />
                  </>
                )}
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side={state === 'collapsed' ? 'right' : 'top'}
            align="start"
            className={cn(
              'w-[calc(var(--sidebar-width-icon)_-_8px)]',
              'sm:w-[160px]',
              state === 'expanded' ? 'md:w-[calc(100%-16px)]' : 'md:w-[220px]',
            )}
          >
            {/* Seletor de Organização para Master Admin */}
            {showOrgSelector && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Organização Ativa
                </div>
                {organizations.map((org) => {
                  const isSelected = currentOrganization?.id === org.id;
                  return (
                    <DropdownMenuItem
                      key={org.id}
                      className="cursor-pointer"
                      onSelect={() => switchOrganization(org.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center min-w-0">
                          <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{org.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              data-testid="user-nav-item-preferences"
              className="cursor-pointer"
              onSelect={() => router.push('/preferences')}
            >
              ⚙️ Preferências
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-pricing"
              className="cursor-pointer"
              onSelect={() => router.push('/pricing')}
            >
              💎 Gerenciar Plano
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-quotas"
              className="cursor-pointer"
              onSelect={() => router.push('/quotas')}
            >
              📊 Quotas
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-mcp-servers"
              className="cursor-pointer"
              onSelect={() => router.push('/mcp-servers')}
            >
              🔧 Servidores MCP
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="user-nav-item-studio"
              className="cursor-pointer"
              onSelect={() => router.push('/studio')}
            >
              Studio
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-university"
              className="cursor-pointer"
              onSelect={() => router.push('/university')}
            >
              University
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-analytics"
              className="cursor-pointer"
              onSelect={() => router.push('/analytics')}
            >
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-admin"
              className="cursor-pointer"
              onSelect={() => router.push('/admin')}
            >
              Administração
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-experimental"
              className="cursor-pointer"
              onSelect={() => router.push('/experimental')}
            >
              Experimental
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (status === 'loading') {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  if (isGuest) {
                    // Fazer logout do guest e redirecionar para login
                    signOut({
                      redirectTo: '/login',
                    });
                  } else {
                    signOut({
                      redirectTo: '/',
                    });
                  }
                }}
              >
                {isGuest ? 'Login to your account' : 'Sign out'}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
