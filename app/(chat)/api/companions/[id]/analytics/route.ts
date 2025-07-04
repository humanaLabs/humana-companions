import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCompanionAnalytics } from '@/lib/db/queries';

// GET /api/companions/[id]/analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context missing' },
        { status: 400 }
      );
    }
    
    const analytics = await getCompanionAnalytics(id, organizationId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching companion analytics:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 