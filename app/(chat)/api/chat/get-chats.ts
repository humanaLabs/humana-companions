import { auth } from '@/app/(auth)/auth';
import { getPersonalChatsByUserId } from '@/lib/db/personal-queries';
import { ChatSDKError } from '@/lib/errors';

/**
 * @description API para buscar conversas pessoais do usuário
 * As conversas pertencem ao usuário, independente da organização
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const startingAfter = url.searchParams.get('startingAfter');
    const endingBefore = url.searchParams.get('endingBefore');

    // Buscar conversas pessoais do usuário
    const result = await getPersonalChatsByUserId({
      userId: session.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return new ChatSDKError('bad_request:database', 'Failed to get chats').toResponse();
  }
} 