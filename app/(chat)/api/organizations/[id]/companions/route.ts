import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCompanionsByOrganizationId } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const organizationId = params.id;
    
    const companions = await getCompanionsByOrganizationId({
      organizationId,
      userId: session.user.id,
    });

    return NextResponse.json(companions);
  } catch (error: any) {
    console.error('Error fetching organization companions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 