'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { CompanionSelector } from '@/components/companion-selector';
import { McpSelector } from '@/components/mcp-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { Session } from 'next-auth';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedCompanionId,
  onCompanionChange,
  selectedMcpServerIds,
  onMcpServersChange,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedModelId: string;
  selectedCompanionId?: string;
  onCompanionChange: (companionId: string | undefined) => void;
  selectedMcpServerIds: string[];
  onMcpServersChange: (serverIds: string[]) => void;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open, state } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b border-border/40 md:border-b-0">
      {(state === 'collapsed' || !open || windowWidth < 768) && (
        <SidebarToggle />
      )}

      {!isReadonly && (
        <>
          <ModelSelector
            session={session}
            selectedModelId={selectedModelId}
            className="flex md:flex"
          />
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

      {/* New Chat Button - no lado direito */}
      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 flex items-center justify-center ml-auto"
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
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedCompanionId === nextProps.selectedCompanionId &&
    JSON.stringify(prevProps.selectedMcpServerIds) ===
      JSON.stringify(nextProps.selectedMcpServerIds)
  );
});
