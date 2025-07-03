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

  // SOLUÇÃO TEMPORÁRIA: Contornar problema do middleware para Master Admins
  let organizationId = request.headers.get('x-organization-id');
  
  if (!organizationId) {
    // Tentar obter da sessão
    organizationId = session.user.organizationId || null;
    
    if (!organizationId) {
      if (session.user.isMasterAdmin) {
        // Master Admin pode usar organização padrão
        organizationId = '00000000-0000-0000-0000-000000000003';
        console.log('🔧 History API - Master Admin usando organização padrão:', organizationId);
      } else {
        console.error('❌ History API - No organizationId found for regular user');
        return new ChatSDKError(
          'bad_request:api',
          'Organization context missing',
        ).toResponse();
      }
    }
  }

  console.log('🔍 History API - organizationId:', organizationId, 'user:', session.user.email);

  const chats = await getChatsByUserId({
    id: session.user.id,
    organizationId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
