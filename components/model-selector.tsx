'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { models as chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { allowedModels } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    allowedModels.includes(chatModel.id),
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  // Agrupar modelos por provider
  const modelsByProvider = useMemo(() => {
    const grouped = availableChatModels.reduce((acc, model) => {
      const provider = model.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    }, {} as Record<string, typeof availableChatModels>);

    return grouped;
  }, [availableChatModels]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {Object.entries(modelsByProvider).map(([provider, models], index) => (
          <div key={provider}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="capitalize">
              {provider} Models
            </DropdownMenuLabel>
            {models.map((chatModel) => {
              const { id } = chatModel;

              return (
                <DropdownMenuItem
                  data-testid={`model-selector-item-${id}`}
                  key={id}
                  onSelect={() => {
                    setOpen(false);

                    startTransition(() => {
                      setOptimisticModelId(id);
                      saveChatModelAsCookie(id);
                    });
                  }}
                  data-active={id === optimisticModelId}
                  asChild
                >
                  <button
                    type="button"
                    className="gap-4 group/item flex flex-row justify-between items-center w-full"
                  >
                    <div className="flex flex-col gap-1 items-start">
                      <div>{chatModel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {chatModel.description}
                      </div>
                    </div>

                    <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      <CheckCircleFillIcon />
                    </div>
                  </button>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
