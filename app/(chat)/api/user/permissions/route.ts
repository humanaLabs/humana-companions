import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMasterAdmin = false; // No master admin concept in current UserType
    const canCreateOrganization = session.user.type === 'regular';

    return NextResponse.json({
      canCreateOrganization,
      isMasterAdmin,
      userId: session.user.id,
      type: session.user.type
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 