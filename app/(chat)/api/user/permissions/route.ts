import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMasterAdmin = session.user.role === 'master_admin';
    const canCreateOrganization = isMasterAdmin;

    return NextResponse.json({
      canCreateOrganization,
      isMasterAdmin,
      userId: session.user.id,
      role: session.user.role || 'user'
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 