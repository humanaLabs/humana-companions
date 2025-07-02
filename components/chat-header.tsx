'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { CompanionSelector } from '@/components/companion-selector';
import { McpSelector } from '@/components/mcp-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, LoaderIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from './toast';
import { guestRegex } from '@/lib/constants';
import type { Session } from 'next-auth';

function PureChatHeader({
  chatId,
  selectedCompanionId,
  onCompanionChange,
  selectedMcpServerIds,
  onMcpServersChange,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedCompanionId?: string;
  onCompanionChange: (companionId: string | undefined) => void;
  selectedMcpServerIds: string[];
  onMcpServersChange: (serverIds: string[]) => void;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open, state } = useSidebar();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  const { width: windowWidth } = useWindowSize();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b border-border/40 md:border-b-0">
      {(state === 'collapsed' || !open || windowWidth < 768) && (
        <SidebarToggle />
      )}

      {!isReadonly && (
        <>
          <CompanionSelector
            selectedCompanionId={selectedCompanionId}
            onCompanionChange={onCompanionChange}
            className="flex md:flex"
          />
          <McpSelector
            selectedMcpServerIds={selectedMcpServerIds}
            onMcpServersChange={onMcpServersChange}
            className="hidden md:flex"
          />
        </>
      )}

      {/* Actions - no lado direito */}
      <div className="ml-auto flex items-center gap-2">
        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Novo Chat</TooltipContent>
          </Tooltip>
        )}

        {/* User Menu */}
        {status === 'loading' ? (
          <div className="w-7 h-7 bg-zinc-500/30 rounded-full animate-pulse flex items-center justify-center">
            <div className="animate-spin text-zinc-500">
              <LoaderIcon size={12} />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="user-menu-header"
                className="w-7 h-7 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Image
                  src={`https://avatar.vercel.sh/${session.user?.email}`}
                  alt={session.user?.email ?? 'User Avatar'}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-testid="user-menu-dropdown"
              side="bottom"
              align="end"
              className="w-[200px] mr-2"
            >
              {/* User Info Section */}
              <div className="px-3 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://avatar.vercel.sh/${session.user?.email}`}
                    alt={session.user?.email ?? 'User Avatar'}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {isGuest ? 'Usuário Convidado' : session.user?.email}
                    </span>
                    {isGuest && (
                      <span className="text-xs text-muted-foreground truncate font-mono">
                        {session.user?.id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
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
                    if (status !== 'authenticated') {
                      toast({
                        type: 'error',
                        description:
                          'Checking authentication status, please try again!',
                      });
                      return;
                    }

                    if (isGuest) {
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
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedCompanionId === nextProps.selectedCompanionId &&
    JSON.stringify(prevProps.selectedMcpServerIds) ===
      JSON.stringify(nextProps.selectedMcpServerIds)
  );
});
