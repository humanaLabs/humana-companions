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
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
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
    const { id, message, selectedChatModel, selectedVisibilityType, selectedDifyAgent } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

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
        // Se um agente Dify foi selecionado, usar ele ao invés do modelo padrão
        if (selectedDifyAgent && selectedDifyAgent !== 'none') {
          try {
            const difyApiKey = process.env.DIFY_API_KEY;
            const difyBaseUrl = process.env.DIFY_BASE_URL;

            if (!difyApiKey || !difyBaseUrl) {
              throw new Error('Configuração do Dify não encontrada');
            }

            const lastMessage = messages[messages.length - 1];
            const userMessage = lastMessage.content;

            const difyResponse = await fetch(`${difyBaseUrl}/v1/chat-messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${difyApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: {},
                query: userMessage,
                response_mode: 'streaming',
                conversation_id: id,
                user: session.user.id,
              }),
            });

            if (!difyResponse.ok) {
              const errorText = await difyResponse.text();
              console.error('Erro do Dify:', difyResponse.status, errorText);
              throw new Error(`Erro do Dify: ${difyResponse.status} - ${difyResponse.statusText}`);
            }

            // Processar stream do Dify
            const reader = difyResponse.body?.getReader();
            if (!reader) {
              throw new Error('Não foi possível ler a resposta do Dify');
            }

            let assistantResponse = '';
            const assistantId = generateUUID();
            const decoder = new TextDecoder();

            // Adicionar mensagem inicial para indicar que o agente está respondendo
            dataStream.writeData({
              type: 'append-message',
              message: JSON.stringify({
                id: assistantId,
                role: 'assistant',
                content: '',
                parts: [],
                createdAt: new Date().toISOString(),
              }),
            });

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const dataStr = line.slice(6).trim();
                      if (dataStr === '[DONE]') {
                        break;
                      }

                      const data = JSON.parse(dataStr);
                      console.log('Dify response data:', data);
                      
                      // Diferentes tipos de eventos do Dify
                      if (data.event === 'message' || data.event === 'agent_message') {
                        const content = data.answer || data.content || '';
                        if (content) {
                          assistantResponse += content;
                          dataStream.writeData({
                            type: 'text-delta',
                            textDelta: content,
                          });
                        }
                      } else if (data.event === 'message_end') {
                        // Fim da mensagem
                        break;
                      } else if (data.event === 'error') {
                        console.error('Erro do Dify:', data);
                        throw new Error(`Erro do agente Dify: ${data.message || 'Erro desconhecido'}`);
                      }
                    } catch (parseError) {
                      console.error('Erro ao parsear resposta do Dify:', parseError, 'Line:', line);
                      // Continuar processamento mesmo com erro de parse
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }

            // Salvar mensagem do assistente
            if (assistantResponse && session.user?.id) {
              try {
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: 'assistant',
                      parts: [{ type: 'text', text: assistantResponse }],
                      attachments: [],
                      createdAt: new Date(),
                    },
                  ],
                });
                console.log('Mensagem do agente Dify salva com sucesso');
              } catch (saveError) {
                console.error('Erro ao salvar mensagem do Dify:', saveError);
              }
            }

            return;
          } catch (error) {
            console.error('Erro ao executar agente Dify:', error);
            
            // Enviar mensagem de erro para o usuário
            dataStream.writeData({
              type: 'text-delta',
              textDelta: `\n\n❌ Erro ao executar agente Dify: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nUsando modelo padrão...\n\n`,
            });
            
            // Em caso de erro, continuar com o modelo padrão
          }
        }

        // Lógica padrão para modelos normais
        const result = await streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel.includes('reasoning')
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
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
