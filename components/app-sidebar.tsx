'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { ProjectFolder } from '@/lib/db/schema';

import {
  PlusIcon,
  SidebarLeftIcon,
  HomeIcon,
  BoxIcon,
  ServerIcon,
  CodeIcon,
  ChevronDownIcon,
  MoreIcon,
  TrashIcon,
} from '@/components/icons';
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
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar, state } = useSidebar();

  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [folderChats, setFolderChats] = useState<Record<string, any[]>>({});
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
  ];

  // Load folders on component mount
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/user/permissions');
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan);
        }
      } catch {}
    }
    fetchPlan();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newFolderName.trim(),
            color: colors[Math.floor(Math.random() * colors.length)],
          }),
        });

        if (response.ok) {
          const newFolder = await response.json();
          setFolders([...folders, newFolder]);
          setNewFolderName('');
          setIsCreating(false);
          toast.success('Pasta criada com sucesso!');
        } else {
          toast.error('Erro ao criar pasta');
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        toast.error('Erro ao criar pasta');
      }
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders?id=${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFolders(folders.filter((folder) => folder.id !== folderId));
        toast.success('Pasta excluída com sucesso!');
      } else {
        toast.error('Erro ao excluir pasta');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Erro ao excluir pasta');
    }
  };

  const loadFolderChats = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/chats?folderId=${folderId}`);
      if (response.ok) {
        const chats = await response.json();
        setFolderChats((prev) => ({ ...prev, [folderId]: chats }));
      }
    } catch (error) {
      console.error('Error loading folder chats:', error);
    }
  };

  const toggleFolderExpansion = async (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      // Load chats when expanding
      if (!folderChats[folderId]) {
        await loadFolderChats(folderId);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFolderName('');
    }
  };

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
                  <TooltipContent side="right">New Chat</TooltipContent>
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
                <TooltipContent
                  side={state === 'collapsed' ? 'right' : 'bottom'}
                >
                  {state === 'expanded' ? 'Collapse' : 'Expand'} Sidebar
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user && (
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
                    <TooltipContent side="right">My Companion</TooltipContent>
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
                  {/* Pastas de Projetos - Collapsed */}
                  {folders.map((folder) => (
                    <Tooltip key={folder.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group cursor-pointer">
                          <div className="flex items-center justify-center w-6 h-6">
                            <div
                              className={`w-3 h-3 rounded-full ${folder.color}`}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {folder.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
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
                    <span className="flex-1">My Companion</span>
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
                    href="/aplicativos"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <BoxIcon size={16} />
                    </div>
                    <span className="flex-1">Aplicativos</span>
                  </Link>

                  {/* Seção Pastas de Projetos - Expanded */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group w-full cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-3 flex-1"
                      >
                        <div className="flex items-center justify-center w-6 h-6">
                          <div
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            <ChevronDownIcon size={16} />
                          </div>
                        </div>
                        <span className="flex-1 text-left">Pastas</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreating(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted-foreground/20 rounded"
                      >
                        <PlusIcon size={12} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="ml-6 space-y-1">
                        {isCreating && (
                          <div className="flex items-center gap-2 px-2 py-1">
                            <div className="w-3 h-3 rounded-full bg-muted" />
                            <Input
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={handleKeyPress}
                              onBlur={() => {
                                if (!newFolderName.trim()) {
                                  setIsCreating(false);
                                }
                              }}
                              placeholder="Nome da pasta"
                              className="h-6 text-xs border-0 bg-transparent focus:bg-muted px-1"
                              autoFocus
                            />
                          </div>
                        )}
                        {folders.map((folder) => (
                          <div key={folder.id} className="space-y-1">
                            <button
                              type="button"
                              className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors group cursor-pointer"
                              onClick={() => toggleFolderExpansion(folder.id)}
                            >
                              <div
                                className={`transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}
                              >
                                <ChevronDownIcon size={12} />
                              </div>
                              <div
                                className={`w-3 h-3 rounded-full ${folder.color}`}
                              />
                              <span className="flex-1">{folder.name}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted-foreground/20 rounded cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreIcon size={12} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-32"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteFolder(folder.id)
                                    }
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <TrashIcon size={12} />
                                    <span className="ml-2">Excluir</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </button>

                            {/* Conversas da pasta */}
                            {expandedFolders.has(folder.id) && (
                              <div className="ml-6 space-y-1">
                                {folderChats[folder.id]?.map((chat) => (
                                  <Link
                                    key={chat.id}
                                    href={`/chat/${chat.id}`}
                                    onClick={() => setOpenMobile(false)}
                                    className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                                    <span className="flex-1 truncate">
                                      {chat.title}
                                    </span>
                                  </Link>
                                )) || (
                                  <div className="px-2 py-1 text-xs text-muted-foreground/70">
                                    Nenhuma conversa
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {state === 'expanded' && <SidebarHistory user={user} />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton
          type="button"
          className="w-full mb-2 bg-muted text-foreground border border-muted-foreground/20 hover:bg-muted/80 transition-colors cursor-pointer"
          onClick={() => {
            window.location.href = '/pricing';
          }}
          title="Gerenciar plano"
        >
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted-foreground/20 text-muted-foreground text-xs font-bold">
              {userPlan === 'guest'
                ? 'G'
                : userPlan === 'free'
                  ? 'F'
                  : userPlan === 'pro'
                    ? 'P'
                    : 'P'}
            </span>
            {userPlan === 'guest' && 'Usuário Convidado'}
            {userPlan === 'free' && 'Plano Free'}
            {userPlan === 'pro' && 'Plano Pro'}
            {!userPlan && 'Pricing'}
          </span>
        </SidebarMenuButton>
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
