'use client';

import type { User } from '@/lib/db/schema';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusIcon, SidebarLeftIcon } from './icons';
import { SidebarHistory } from './sidebar-history';
import { SidebarUserNav } from './sidebar-user-nav';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useRouter, usePathname } from 'next/navigation';

export function AppSidebar({ user }: { user: User | undefined }) {
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex items-center justify-between px-2 py-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {state === 'expanded' ? (
                  <span className="text-xl font-bold">Humana</span>
                ) : (
                  <span className="text-xl font-bold">H</span>
                )}
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {state === 'expanded' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      className="p-2 h-fit"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push('/');
                        router.refresh();
                      }}
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end">New Chat</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={toggleSidebar}
                  >
                    <SidebarLeftIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={state === 'collapsed' ? 'right' : 'bottom'}>
                  {state === 'expanded' ? 'Collapse' : 'Expand'} Sidebar
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <>
            <div className="px-2 py-2">
              <div className="space-y-1">
                {state === 'collapsed' ? (
                  <>
                    {/* My Companion */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/"
                          onClick={() => {
                            setOpenMobile(false);
                          }}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">🏠</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">My Companion</TooltipContent>
                    </Tooltip>

                    {/* University */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/university"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">🎓</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">University</TooltipContent>
                    </Tooltip>

                    {/* Studio */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/studio"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">🎨</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Studio</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {/* My Companion */}
                    <Link
                      href="/"
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">🏠</span>
                      </div>
                      <span className="flex-1">My Companion</span>
                    </Link>

                    {/* University */}
                    <Link
                      href="/university"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">🎓</span>
                      </div>
                      <span className="flex-1">University</span>
                    </Link>

                    {/* Studio */}
                    <Link
                      href="/studio"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">🎨</span>
                      </div>
                      <span className="flex-1">Studio</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Data Room */}
            <div className="px-2 py-2">
              {state === 'expanded' && (
                <div className="text-xs font-semibold text-muted-foreground tracking-wider px-2 mb-2">
                  Data Room
                </div>
              )}
              <div className="space-y-1">
                {state === 'collapsed' ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/data-room/documentos"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">📄</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Documentos</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/data-room/templates"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">📋</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Templates</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/data-room/integracoes"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <span className="text-sm">🔗</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Integrações</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Link
                      href="/data-room/documentos"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">📄</span>
                      </div>
                      <span className="flex-1">Documentos</span>
                    </Link>
                    <Link
                      href="/data-room/templates"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">📋</span>
                      </div>
                      <span className="flex-1">Templates</span>
                    </Link>
                    <Link
                      href="/data-room/integracoes"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <span className="text-sm">🔗</span>
                      </div>
                      <span className="flex-1">Integrações</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        {state === 'expanded' && <SidebarHistory user={user} />}
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
