import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados do usuário no banco para verificar isMasterAdmin
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isMasterAdmin = userData.length > 0 ? userData[0].isMasterAdmin : false;
    const canCreateOrganization = session.user.type === 'regular';

    return NextResponse.json({
      canCreateOrganization,
      isMasterAdmin,
      userId: session.user.id,
      type: session.user.type,
      email: session.user.email
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 