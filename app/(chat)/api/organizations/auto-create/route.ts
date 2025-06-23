import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createDefaultOrganization } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id || session.user.type === 'guest') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await createDefaultOrganization(
      session.user.id, 
      session.user.email || 'unknown@example.com'
    );
    
    return NextResponse.json({ 
      success: true,
      organization,
      message: 'Organização padrão criada com sucesso' 
    });
  } catch (error) {
    console.error('Error creating default organization:', error);
    return NextResponse.json(
      { error: 'Erro ao criar organização padrão' },
      { status: 500 }
    );
  }
} 