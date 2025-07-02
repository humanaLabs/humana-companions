import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
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

  // Get organizationId from middleware headers
  const organizationId = request.headers.get('x-organization-id');
  if (!organizationId) {
    return new ChatSDKError(
      'bad_request:api',
      'Organization context missing',
    ).toResponse();
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    organizationId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
