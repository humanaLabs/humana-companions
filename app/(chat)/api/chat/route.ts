import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getCompanionById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  getActiveMcpServersByUserId,
  getUserPlanAndMessagesSent,
  incrementUserMessagesSent,
  getOrganizationForUser,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import {
  listMcpTools,
  testMcpTool,
  setMcpToolsContext,
} from '@/lib/ai/tools/list-mcp-tools';
import { getMcpToolsFromServers } from '@/lib/ai/mcp-client';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { companionToSystemPrompt } from '@/lib/ai/companion-prompt';
import { getOrganizationId } from '@/lib/tenant-context';
import { checkQuotaBeforeAction } from '@/lib/middleware/quota-enforcement';
import { incrementUsage } from '@/lib/db/queries';

// Flag para controlar se a lógica de limites está ativa
const ENABLE_MESSAGE_LIMITS = false;

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      selectedCompanionId,
      selectedMcpServerIds = [],
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Limite de mensagens por plano (DESABILITADO)
    if (ENABLE_MESSAGE_LIMITS) {
      const { plan, messagesSent } = await getUserPlanAndMessagesSent(
        session.user.id,
      );
      let maxMessages = 10;
      if (plan === 'guest') maxMessages = 3;
      if (plan === 'pro') maxMessages = Number.POSITIVE_INFINITY;
      if (messagesSent >= maxMessages) {
        return new Response(
          JSON.stringify({ error: 'limit_reached', plan, maxMessages }),
          { status: 403 },
        );
      }

      // Incrementa contador de mensagens
      await incrementUserMessagesSent(session.user.id);
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    console.log(`🔍 Debug Rate Limit:`, {
      userId: session.user.id,
      userType,
      messageCount,
      maxAllowed: entitlementsByUserType[userType].maxMessagesPerDay,
      willBlock: false, // Desabilitado para desenvolvimento
    });

    // Rate limit desabilitado temporariamente para desenvolvimento
    // if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
    //   return new ChatSDKError('rate_limit:chat').toResponse();
    // }

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new ChatSDKError(
        'forbidden:chat',
        'Organization context required',
      ).toResponse();
    }

    // Get appropriate org based on user type
    const finalOrgId = await getOrganizationForUser(
      session.user.id,
      session.user.type || userType,
      organizationId,
    );

    // 🛡️ VERIFICAÇÃO DE QUOTA - Bloquear se limites atingidos
    try {
      // Criar NextRequest mock com headers necessários
      const mockRequest = Object.assign(request, {
        headers: new Headers(request.headers)
      });
      mockRequest.headers.set('x-organization-id', finalOrgId);
      
      const quotaCheck = await checkQuotaBeforeAction({ 
        request: mockRequest as any, 
        config: { 
          quotaType: 'messages_daily', 
          actionType: 'send' 
        } 
      });
      
      if (!quotaCheck.allowed && quotaCheck.error) {
        return new Response(
          JSON.stringify({
            error: quotaCheck.error.message,
            quotaType: quotaCheck.error.quotaType,
            current: quotaCheck.error.current,
            limit: quotaCheck.error.limit,
            type: 'quota_exceeded'
          }),
          { 
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (quotaError) {
      console.error('Erro na verificação de quota:', quotaError);
      // Continuar com a operação se houver erro na verificação de quota
    }

    const chat = await getChatById({ id, organizationId: finalOrgId });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
        organizationId: finalOrgId,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({
      id,
      organizationId: finalOrgId,
    });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          organizationId: finalOrgId,
          createdAt: new Date(),
        },
      ],
    });

    // 📊 TRACKING DE USO - Incrementar contador de mensagens
    try {
      await incrementUsage({
        userId: session.user.id,
        organizationId: finalOrgId,
        usageType: 'messages_daily',
        amount: 1,
      });
      console.log('✅ Uso de mensagem registrado');
    } catch (trackingError) {
      console.error('❌ Erro ao registrar uso de mensagem:', trackingError);
      // Não falhar a operação por erro de tracking
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id, organizationId: finalOrgId });

    const stream = createDataStream({
      execute: async (dataStream) => {
        // Buscar companion se selecionado
        let companionInstruction: string | undefined;
        if (selectedCompanionId) {
          try {
            const companion = await getCompanionById({
              id: selectedCompanionId,
              organizationId: finalOrgId,
            });
            if (companion && companion.userId === session.user.id) {
              companionInstruction = companionToSystemPrompt(companion);
            }
          } catch (error) {
            console.error('Erro ao buscar companion:', error);
          }
        }

        // Função para verificar se a mensagem pode precisar de ferramentas MCP
        const messageNeedsMcpTools = (message: string): boolean => {
          const mcpKeywords = [
            'mcp',
            'ferramenta',
            'tool',
            'api',
            'openai',
            'gpt',
            'claude',
            'criar',
            'create',
            'gerar',
            'generate',
            'buscar',
            'search',
            'analisar',
            'analyze',
            'processar',
            'process',
            'traduzir',
            'translate',
            'resumir',
            'summarize',
            'imagem',
            'image',
            'arquivo',
            'file',
            'upload',
            'download',
            'lista',
            'list',
            'deletar',
            'delete',
            'modificar',
            'modify',
            'assistente',
            'assistant',
            'batch',
            'transcricao',
            'transcription',
            'moderacao',
            'moderation',
            'embedding',
            'fine-tuning',
            'vector',
            'thread',
            'run',
          ];

          const lowerMessage = message.toLowerCase();
          return mcpKeywords.some((keyword) => lowerMessage.includes(keyword));
        };

        // Buscar ferramentas MCP dos servidores selecionados (sob demanda)
        let mcpTools = {};
        console.log(
          '🔍 DEBUG MCP - selectedMcpServerIds:',
          selectedMcpServerIds,
        );

        // Verificar se há servidores selecionados E se a mensagem pode precisar de MCP
        const userMessage = message.content || '';
        const forceMcp =
          userMessage.startsWith('/mcp') ||
          userMessage.includes('listMcpTools') ||
          userMessage.includes('testMcpTool');
        const shouldLoadMcpTools =
          selectedMcpServerIds &&
          selectedMcpServerIds.length > 0 &&
          (forceMcp || messageNeedsMcpTools(userMessage));

        if (shouldLoadMcpTools) {
          try {
            const reason = forceMcp
              ? 'comando forçado (/mcp ou ferramenta específica)'
              : 'palavras-chave detectadas';
            console.log(
              `🔍 Carregando ferramentas MCP (${reason}). ${selectedMcpServerIds.length} servidores selecionados:`,
              selectedMcpServerIds,
            );

            // Buscar apenas os servidores selecionados
            const allMcpServers = await getActiveMcpServersByUserId({
              userId: session.user.id,
            });
            console.log(
              '📋 Todos os servidores MCP do usuário:',
              allMcpServers.map((s) => ({
                id: s.id,
                name: s.name,
                isActive: s.isActive,
              })),
            );

            const selectedServers = allMcpServers.filter((server) =>
              selectedMcpServerIds.includes(server.id),
            );
            console.log(
              '✅ Servidores selecionados encontrados:',
              selectedServers.map((s) => ({
                id: s.id,
                name: s.name,
                url: s.url,
              })),
            );

            if (selectedServers.length > 0) {
              console.log(
                `📡 Conectando a ${selectedServers.length} servidores MCP selecionados`,
              );

              // Timeout para ferramentas MCP
              const mcpToolsPromise = getMcpToolsFromServers(selectedServers);
              const toolsTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MCP tools timeout')), 2000),
              );

              console.log('⏳ Iniciando carregamento de ferramentas MCP...');
              const toolsResult = await Promise.race([
                mcpToolsPromise,
                toolsTimeoutPromise,
              ]);
              console.log(
                '📦 Resultado do carregamento de ferramentas:',
                typeof toolsResult,
                Object.keys(toolsResult || {}),
              );

              if (toolsResult && typeof toolsResult === 'object') {
                mcpTools = toolsResult as Record<string, any>;
                console.log(
                  `🔧 Carregadas ${Object.keys(mcpTools).length} ferramentas MCP de ${selectedServers.length} servidores:`,
                  Object.keys(mcpTools),
                );
              } else {
                console.log('⚠️ Ferramentas MCP inválidas, usando objeto vazio');
                mcpTools = {};
              }
            } else {
              console.log(
                '📭 Nenhum servidor MCP selecionado encontrado nos dados do usuário',
              );
            }
          } catch (error) {
            console.error(
              '⚠️ Erro ao carregar MCP selecionados (continuando sem MCP):',
              error instanceof Error ? error.message : 'Erro desconhecido',
            );
            console.error('Stack trace:', error);
            mcpTools = {};
          }
        } else {
          if (selectedMcpServerIds && selectedMcpServerIds.length > 0) {
            console.log(
              '🚫 Servidores MCP selecionados, mas mensagem não parece precisar de MCP. Pulando carregamento.',
            );
          } else {
            console.log(
              '🚫 Nenhum servidor MCP selecionado (array vazio ou undefined)',
            );
          }
        }

        // Definir contexto das ferramentas MCP para a ferramenta listMcpTools
        setMcpToolsContext(mcpTools);

        const allTools: any = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          listMcpTools,
          testMcpTool,
          ...mcpTools,
        };

        console.log(
          '🎯 Total de ferramentas sendo passadas para o modelo:',
          Object.keys(allTools).length,
        );
        console.log('🎯 Nomes das ferramentas:', Object.keys(allTools));

        const result = await streamText({
          model: myProvider.languageModel(selectedChatModel),
          system:
            companionInstruction ||
            systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools: selectedChatModel.includes('reasoning')
            ? []
            : ([
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
                'listMcpTools',
                'testMcpTool',
                ...Object.keys(mcpTools),
              ] as any),
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: allTools,
          onStepFinish: async ({ stepType, toolCalls, toolResults }) => {
            console.log('🔧 STEP FINISHED:', stepType);
            if (toolCalls && toolCalls.length > 0) {
              console.log(
                '🔧 FERRAMENTAS CHAMADAS:',
                toolCalls.map((tc) => tc.toolName),
              );
            }
            if (toolResults && toolResults.length > 0) {
              console.log(
                '✅ RESULTADOS DAS FERRAMENTAS:',
                toolResults.map((tr) => ({
                  tool: tr.toolName,
                  result: tr.result,
                })),
              );
            }
            if (stepType === 'tool-result') {
              console.log(
                '🔧 Ferramenta chamada:',
                toolCalls?.map((tc) => tc.toolName),
              );
              console.log(
                '🔧 Resultados:',
                toolResults?.map((tr) => tr.result),
              );
            }
          },
          onFinish: async ({ response }) => {
            console.log(
              '🏁 Stream finalizado. Mensagens:',
              response.messages.length,
            );
            console.log(
              '🏁 Última mensagem:',
              response.messages[response.messages.length - 1],
            );

            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                console.log(
                  '💾 Salvando mensagem do assistente:',
                  assistantMessage.parts,
                );

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      organizationId: finalOrgId,
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (error) {
                console.error('Failed to save assistant message:', error);
              }
            }
          },
        });

        result.consumeStream();
        result.mergeIntoDataStream(dataStream);
      },
    });

    const streamContext = getStreamContext();
    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    }

    return new Response(stream);
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new ChatSDKError(
        'forbidden:chat',
        'Organization context required',
      ).toResponse();
    }

    const chat = await getChatById({ id: chatId, organizationId });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.visibility === 'private' && chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const streamIds = await getStreamIdsByChatId({ chatId });

    if (!streamIds.length) {
      return new ChatSDKError('not_found:stream').toResponse();
    }

    const recentStreamId = streamIds.at(-1);

    if (!recentStreamId) {
      return new ChatSDKError('not_found:stream').toResponse();
    }

    const emptyDataStream = createDataStream({
      execute: () => {},
    });

    const stream = await streamContext.resumableStream(
      recentStreamId,
      () => emptyDataStream,
    );

    /*
     * For when the generation is streaming during SSR
     * but the resumable stream has concluded at this point.
     */
    if (!stream) {
      const messages = await getMessagesByChatId({
        id: chatId,
        organizationId,
      });
      const mostRecentMessage = messages.at(-1);

      if (!mostRecentMessage) {
        return new Response(emptyDataStream, { status: 200 });
      }

      if (mostRecentMessage.role !== 'assistant') {
        return new Response(emptyDataStream, { status: 200 });
      }

      const messageCreatedAt = new Date(mostRecentMessage.createdAt);

      if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
        return new Response(emptyDataStream, { status: 200 });
      }

      const restoredStream = createDataStream({
        execute: (buffer) => {
          buffer.writeData({
            type: 'append-message',
            message: JSON.stringify(mostRecentMessage),
          });
        },
      });

      return new Response(restoredStream, { status: 200 });
    }

    return new Response(stream, { status: 200 });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    return new ChatSDKError(
      'forbidden:chat',
      'Organization context required',
    ).toResponse();
  }
  const chat = await getChatById({ id, organizationId });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
