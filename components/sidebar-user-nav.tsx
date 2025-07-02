'use client';

import { ChevronUp } from 'lucide-react';
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

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

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
              state === 'expanded' ? 'md:w-[calc(100%-16px)]' : 'md:w-[180px]',
            )}
          >
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
