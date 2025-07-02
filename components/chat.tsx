'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Flag para controlar se a lógica de limites está ativa
const ENABLE_MESSAGE_LIMITS = false;

function ChatInner({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [selectedCompanionId, setSelectedCompanionId] = useState<
    string | undefined
  >();
  const [selectedMcpServerIds, setSelectedMcpServerIds] = useState<string[]>(
    [],
  );

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
      selectedCompanionId: selectedCompanionId,
      selectedMcpServerIds: selectedMcpServerIds,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: async (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
      if (error instanceof Response && error.status === 403) {
        try {
          const data = await error.json();
          if (data?.error === 'limit_reached') {
            setLimitInfo({ plan: data.plan, maxMessages: data.maxMessages });
            setLimitModalOpen(true);
            setInputBlocked(true);
          }
        } catch (e) {
          console.log('Erro ao ler JSON do erro 403:', e);
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams?.get?.('query') ?? undefined;

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    plan: string;
    maxMessages: number;
  } | null>(null);
  const [inputBlocked, setInputBlocked] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState<number | null>(null);
  const [messagesLimit, setMessagesLimit] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  // Intercepta mensagens para verificar limite ANTES de enviar
  const customAppend: typeof append = async (message, chatRequestOptions) => {
    // Verificação proativa de limite ANTES de enviar (DESABILITADA)
    if (ENABLE_MESSAGE_LIMITS) {
      // Buscar dados atualizados para ter certeza do limite atual
      try {
        const res = await fetch('/api/user/permissions');
        if (res.ok) {
          const data = await res.json();
          const currentUsed = data.messagesSent || 0;
          let currentLimit = 10;
          if (data.plan === 'guest') currentLimit = 3;
          if (data.plan === 'pro') currentLimit = Number.POSITIVE_INFINITY;

          // Verificar se já atingiu o limite
          if (
            currentUsed >= currentLimit &&
            currentLimit !== Number.POSITIVE_INFINITY
          ) {
            console.log('🚫 Limite atingido - bloqueando envio:', {
              currentUsed,
              currentLimit,
              plan: data.plan,
            });

            // Bloquear e mostrar popup
            setLimitInfo({ plan: data.plan, maxMessages: currentLimit });
            setLimitModalOpen(true);
            setInputBlocked(true);
            setMessagesUsed(currentUsed);
            setMessagesLimit(currentLimit);

            // Atualizar sidebar também
            window.dispatchEvent(new CustomEvent('messagesSent'));

            return null; // NÃO enviar a mensagem
          }

          // Atualizar estados com dados mais recentes
          setMessagesUsed(currentUsed);
          setMessagesLimit(currentLimit);
        }
      } catch (error) {
        console.error('Erro ao verificar limite:', error);
      }
    }

    try {
      return await append(message, chatRequestOptions);
    } catch (err: any) {
      console.log('Erro no customAppend:', err);
      if (ENABLE_MESSAGE_LIMITS && err instanceof Response) {
        try {
          const data = await err.json();
          if (data?.error === 'limit_reached') {
            setLimitInfo({ plan: data.plan, maxMessages: data.maxMessages });
            setLimitModalOpen(true);
            setInputBlocked(true);
            return null;
          }
        } catch (e) {
          console.log('Erro ao ler JSON do erro:', e);
        }
      }
      throw err;
    }
  };

  // Bloquear input imediatamente após atingir o limite (ao enviar a última mensagem permitida)
  useEffect(() => {
    if (limitInfo && limitModalOpen) {
      setInputBlocked(true);
    }
  }, [limitInfo, limitModalOpen]);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      customAppend({
        role: 'user',
        content: query,
      });
      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, customAppend, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  // Checar limite ao montar (DESABILITADO)
  useEffect(() => {
    if (ENABLE_MESSAGE_LIMITS) {
      async function checkLimitOnMount() {
        try {
          const res = await fetch('/api/user/permissions');
          if (res.ok) {
            const data = await res.json();
            let maxMessages = 10;
            if (data.plan === 'guest') maxMessages = 3;
            if (data.plan === 'pro') maxMessages = Number.POSITIVE_INFINITY;

            const currentUsed = data.messagesSent ?? 0;

            setMessagesUsed(currentUsed);
            setMessagesLimit(maxMessages);
            setUserPlan(data.plan);

            // Verificar se já atingiu o limite e bloquear input SILENCIOSAMENTE
            if (
              currentUsed >= maxMessages &&
              maxMessages !== Number.POSITIVE_INFINITY
            ) {
              console.log(
                '🚫 Limite já atingido ao carregar chat (bloqueando silenciosamente):',
                {
                  currentUsed,
                  maxMessages,
                  plan: data.plan,
                },
              );

              setLimitInfo({
                plan: data.plan,
                maxMessages: maxMessages,
              });
              setInputBlocked(true);
              // NÃO abrir modal automaticamente - apenas ao interagir
            }
          }
        } catch (error) {
          console.error('Erro ao verificar limite inicial:', error);
        }
      }
      checkLimitOnMount();
    }
  }, []);

  // Atualizar contador ao enviar mensagem com sucesso (DESABILITADO)
  useEffect(() => {
    if (
      ENABLE_MESSAGE_LIMITS &&
      messages.length > 0 &&
      messages[messages.length - 1].role === 'user'
    ) {
      // Buscar do backend o valor atualizado
      fetch('/api/user/permissions')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const currentUsed = data.messagesSent ?? 0;
            let currentLimit = 10;
            if (data.plan === 'guest') currentLimit = 3;
            if (data.plan === 'pro') currentLimit = Number.POSITIVE_INFINITY;

            setMessagesUsed(currentUsed);
            setMessagesLimit(currentLimit);

            // Verificar se atingiu o limite após envio - bloquear silenciosamente
            if (
              currentUsed >= currentLimit &&
              currentLimit !== Number.POSITIVE_INFINITY
            ) {
              console.log(
                '🚫 Limite atingido após envio - bloqueando silenciosamente',
              );
              setLimitInfo({ plan: data.plan, maxMessages: currentLimit });
              setInputBlocked(true);
              // NÃO mostrar modal automaticamente - apenas na próxima interação
            }

            // Disparar evento para atualizar sidebar
            window.dispatchEvent(new CustomEvent('messagesSent'));
          }
        });
    }
  }, [messages]);

  // Função para mostrar popup quando usuário tentar interagir com input bloqueado
  const handleBlockedInputInteraction = () => {
    if (inputBlocked && limitInfo) {
      console.log(
        '👆 Usuário tentou interagir com input bloqueado - mostrando popup',
      );
      setLimitModalOpen(true);
    }
  };

  return (
    <div>
      {/* Modal de Limite de Mensagens (DESABILITADO) */}
      <Dialog
        open={ENABLE_MESSAGE_LIMITS && limitModalOpen}
        onOpenChange={setLimitModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite de mensagens atingido</DialogTitle>
            <DialogDescription>
              {limitInfo?.plan === 'free' &&
                'Você atingiu o limite de 10 mensagens no plano Free.\nPara continuar conversando, faça upgrade para o plano Pro.'}
              {limitInfo?.plan === 'guest' &&
                'Você atingiu o limite de 3 mensagens como convidado. Crie uma conta gratuita para liberar mais mensagens ou assine o plano Pro para mensagens ilimitadas.'}
              {limitInfo?.plan === 'pro' &&
                'Você está no plano Pro e não deveria ver este aviso. Se isso acontecer, contate o suporte.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {limitInfo?.plan === 'free' && (
              <Button
                variant="default"
                onClick={() => {
                  setLimitModalOpen(false);
                  window.location.href = '/upgrade';
                }}
              >
                Fazer upgrade para Pro
              </Button>
            )}
            {limitInfo?.plan === 'guest' && (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="default"
                  onClick={() => {
                    setLimitModalOpen(false);
                    window.location.href = '/register';
                  }}
                >
                  Criar conta gratuita
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setLimitModalOpen(false);
                    window.location.href = '/upgrade';
                  }}
                >
                  Assinar plano Pro
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="mt-2 w-full">
                    Fechar
                  </Button>
                </DialogClose>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Fim do Modal */}
      <div className="flex flex-col min-w-0 h-dvh md:h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedCompanionId={selectedCompanionId}
          onCompanionChange={setSelectedCompanionId}
          selectedMcpServerIds={selectedMcpServerIds}
          onMcpServersChange={setSelectedMcpServerIds}
          isReadonly={isReadonly}
          session={session}
        />

        <div className="flex-1 overflow-hidden">
          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
            session={session}
            selectedCompanionId={selectedCompanionId}
          />
        </div>

        <div className="flex-shrink-0 bg-background">
          <form className="flex mx-auto px-2 md:px-4 py-4 gap-2 w-full md:max-w-3xl">
            {!isReadonly &&
              (ENABLE_MESSAGE_LIMITS && inputBlocked ? (
                <Tooltip className="relative w-full">
                  <TooltipTrigger asChild className="w-full">
                    <MultimodalInput
                      className="w-full"
                      chatId={id}
                      input={input}
                      setInput={setInput}
                      handleSubmit={handleSubmit}
                      status={status}
                      stop={stop}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      messages={messages}
                      setMessages={setMessages}
                      append={customAppend}
                      selectedVisibilityType={visibilityType}
                      disabled={true}
                      onInputClick={handleBlockedInputInteraction}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Limite de mensagens atingido. Assine o plano Pro para
                    continuar.
                  </TooltipContent>
                </Tooltip>
              ) : (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={customAppend}
                  selectedVisibilityType={visibilityType}
                  disabled={false}
                />
              ))}
          </form>
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </div>
  );
}

export function Chat(props: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ChatInner {...props} />
    </Suspense>
  );
}
