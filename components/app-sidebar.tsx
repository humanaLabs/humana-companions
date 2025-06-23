'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { PlusIcon, SidebarLeftIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar, state } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                {state === 'expanded' ? (
                  <Image 
                    src="/images/LogobrancoHumana.svg" 
                    alt="Humana AI" 
                    width={150} 
                    height={35}
                    priority
                    style={{ objectFit: 'contain' }}
                    className="invert dark:invert-0"
                  />
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
                    <TooltipContent side="right">Cockpit</TooltipContent>
                  </Tooltip>
                ) : (
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
                    <span className="flex-1">Cockpit</span>
                  </Link>
                )}
              </div>
            </div>
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
