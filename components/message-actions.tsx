import type { Message } from 'ai';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';
import { useSession } from 'next-auth/react';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon, TrashIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  onMessageDeleted,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  onMessageDeleted?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  const { data: session } = useSession();
  const user = session?.user;

  if (isLoading) return null;
  if (message.role === 'user') return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                if (!user?.id || !user?.organizationId) return;
                
                mutate<Array<Vote>>(
                  `/api/vote?chatId=${chatId}&messageId=${message.id}`,
                  (currentVotes: Array<Vote> | undefined) => {
                    const organizationId = user.organizationId;
                    if (!currentVotes || !organizationId) return currentVotes;

                    const existingVoteIndex = currentVotes.findIndex(
                      (vote) => vote.messageId === message.id
                    );

                    if (existingVoteIndex !== -1) {
                      // Update existing vote
                      const updatedVotes = [...currentVotes];
                      updatedVotes[existingVoteIndex] = {
                        ...updatedVotes[existingVoteIndex],
                        isUpvoted: true,
                      };
                      return updatedVotes;
                    }

                    // Add new vote
                    return [
                      ...currentVotes,
                      {
                        organizationId,
                        chatId,
                        messageId: message.id,
                        isUpvoted: true,
                      },
                    ];
                  },
                  false
                );

                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: 'Upvoting Response...',
                  success: () => {
                    return 'Upvoted Response!';
                  },
                  error: 'Failed to upvote response.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                if (!user?.id || !user?.organizationId) return;
                
                mutate<Array<Vote>>(
                  `/api/vote?chatId=${chatId}&messageId=${message.id}`,
                  (currentVotes: Array<Vote> | undefined) => {
                    const organizationId = user.organizationId;
                    if (!currentVotes || !organizationId) return currentVotes;

                    const existingVoteIndex = currentVotes.findIndex(
                      (vote) => vote.messageId === message.id
                    );

                    if (existingVoteIndex !== -1) {
                      // Update existing vote
                      const updatedVotes = [...currentVotes];
                      updatedVotes[existingVoteIndex] = {
                        ...updatedVotes[existingVoteIndex],
                        isUpvoted: false,
                      };
                      return updatedVotes;
                    }

                    // Add new vote
                    return [
                      ...currentVotes,
                      {
                        organizationId,
                        chatId,
                        messageId: message.id,
                        isUpvoted: false,
                      },
                    ];
                  },
                  false
                );

                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down',
                  }),
                });

                toast.promise(downvote, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    return 'Downvoted Response!';
                  },
                  error: 'Failed to downvote response.',
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-delete"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto hover:text-red-500"
              variant="outline"
              onClick={async () => {
                const deleteConfirm = window.confirm('Tem certeza que deseja excluir esta mensagem?');
                
                if (!deleteConfirm) return;

                const deletion = fetch(`/api/message?messageId=${message.id}&chatId=${chatId}`, {
                  method: 'DELETE',
                });

                toast.promise(deletion, {
                  loading: 'Excluindo mensagem...',
                  success: () => {
                    onMessageDeleted?.();
                    return 'Mensagem excluída!';
                  },
                  error: 'Falha ao excluir mensagem.',
                });
              }}
            >
              <TrashIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Excluir Mensagem</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
