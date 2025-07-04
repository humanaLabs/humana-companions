import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getPersonalChatsByUserId } from '@/lib/db/personal-queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  console.log('🔍 Personal History API - user:', session.user.email, 'userId:', session.user.id);

  // Buscar conversas pessoais do usuário (sem organizationId)
  const chats = await getPersonalChatsByUserId({
    userId: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  console.log('✅ Personal History API - Found chats:', chats.chats?.length || 0);

  return Response.json(chats);
}
