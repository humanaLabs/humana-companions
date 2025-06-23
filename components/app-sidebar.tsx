'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { PlusIcon, SidebarLeftIcon, HomeIcon, BoxIcon, SparklesIcon, FileIcon, ServerIcon, CodeIcon } from '@/components/icons';
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
                  <>
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
                            <HomeIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">My Companions</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/data-room"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <ServerIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Data Room</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/mcp-servers"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <CodeIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Ferramentas</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/studio"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <SparklesIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Studio</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/aplicativos"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <BoxIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Aplicativos</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/university"
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <BoxIcon size={16} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">University</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Link
                      href="/"
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <HomeIcon size={16} />
                      </div>
                      <span className="flex-1">My Companions</span>
                    </Link>
                    <Link
                      href="/data-room"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <ServerIcon size={16} />
                      </div>
                      <span className="flex-1">Data Room</span>
                    </Link>
                    <Link
                      href="/mcp-servers"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <CodeIcon size={16} />
                      </div>
                      <span className="flex-1">Ferramentas</span>
                    </Link>
                    <Link
                      href="/studio"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <SparklesIcon size={16} />
                      </div>
                      <span className="flex-1">Studio</span>
                    </Link>
                    <Link
                      href="/aplicativos"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <BoxIcon size={16} />
                      </div>
                      <span className="flex-1">Aplicativos</span>
                    </Link>
                    <Link
                      href="/university"
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <BoxIcon size={16} />
                      </div>
                      <span className="flex-1">University</span>
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
