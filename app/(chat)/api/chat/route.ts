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
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { listMcpTools } from '@/lib/ai/tools/list-mcp-tools';
import { getMcpToolsFromServers } from '@/lib/ai/mcp-client';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';

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
    const { id, message, selectedChatModel, selectedVisibilityType, selectedCompanionId, selectedMcpServerIds = [] } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
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
      willBlock: false // Desabilitado para desenvolvimento
    });

    // Rate limit desabilitado temporariamente para desenvolvimento
    // if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
    //   return new ChatSDKError('rate_limit:chat').toResponse();
    // }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

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
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: async (dataStream) => {
        // Buscar companion se selecionado
        let companionInstruction: string | undefined;
        if (selectedCompanionId) {
          try {
            const companion = await getCompanionById({ id: selectedCompanionId });
            if (companion && companion.userId === session.user.id) {
              companionInstruction = companion.instruction;
            }
          } catch (error) {
            console.error('Erro ao buscar companion:', error);
          }
        }

        // Buscar ferramentas MCP dos servidores selecionados (sob demanda)
        let mcpTools = {};
        console.log('🔍 DEBUG MCP - selectedMcpServerIds:', selectedMcpServerIds);
        
        if (selectedMcpServerIds && selectedMcpServerIds.length > 0) {
          try {
            console.log(`🔍 Carregando ${selectedMcpServerIds.length} servidores MCP selecionados:`, selectedMcpServerIds);
            
            // Buscar apenas os servidores selecionados
            const allMcpServers = await getActiveMcpServersByUserId({ userId: session.user.id });
            console.log('📋 Todos os servidores MCP do usuário:', allMcpServers.map(s => ({ id: s.id, name: s.name, isActive: s.isActive })));
            
            const selectedServers = allMcpServers.filter(server => 
              selectedMcpServerIds.includes(server.id)
            );
            console.log('✅ Servidores selecionados encontrados:', selectedServers.map(s => ({ id: s.id, name: s.name, url: s.url })));
            
            if (selectedServers.length > 0) {
              console.log(`📡 Conectando a ${selectedServers.length} servidores MCP selecionados`);
              
              // Timeout para ferramentas MCP
              const mcpToolsPromise = getMcpToolsFromServers(selectedServers);
              const toolsTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('MCP tools timeout')), 2000)
              );
              
              console.log('⏳ Iniciando carregamento de ferramentas MCP...');
              const toolsResult = await Promise.race([mcpToolsPromise, toolsTimeoutPromise]);
              console.log('📦 Resultado do carregamento de ferramentas:', typeof toolsResult, Object.keys(toolsResult || {}));
              
              if (toolsResult && typeof toolsResult === 'object') {
                mcpTools = toolsResult as Record<string, any>;
                console.log(`🔧 Carregadas ${Object.keys(mcpTools).length} ferramentas MCP de ${selectedServers.length} servidores:`, Object.keys(mcpTools));
              } else {
                console.log('⚠️ Ferramentas MCP inválidas, usando objeto vazio');
                mcpTools = {};
              }
            } else {
              console.log('📭 Nenhum servidor MCP selecionado encontrado nos dados do usuário');
            }
          } catch (error) {
            console.error('⚠️ Erro ao carregar MCP selecionados (continuando sem MCP):', error instanceof Error ? error.message : 'Erro desconhecido');
            console.error('Stack trace:', error);
            mcpTools = {};
          }
        } else {
          console.log('🚫 Nenhum servidor MCP selecionado (array vazio ou undefined)');
        }

        // Usar diretamente o modelo selecionado (Azure ou fallback)
        console.log('🤖 Iniciando streamText com modelo:', selectedChatModel);
        console.log('🔧 Ferramentas disponíveis:', Object.keys({
          getWeather: true,
          createDocument: true,
          updateDocument: true,
          requestSuggestions: true,
          listMcpTools: true,
          ...mcpTools,
        }));
        
        const result = await streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: companionInstruction || systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel.includes('reasoning')
              ? []
              : ([
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'listMcpTools',
                  ...Object.keys(mcpTools),
                ] as any),
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            listMcpTools: listMcpTools(mcpTools),
            ...mcpTools,
          },
          onFinish: async ({ response }) => {
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

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
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
      return new Response(await streamContext.resumableStream(streamId, () => stream));
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

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

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
    const messages = await getMessagesByChatId({ id: chatId });
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

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
