import { auth } from '@/app/(auth)/auth';
import { createCompanion, getCompanionsByUserId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const companions = await getCompanionsByUserId({ 
      userId: session.user.id! 
    });
    
    return NextResponse.json({ companions });
  } catch (error) {
    console.error('Erro ao buscar companions:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar companions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { name, instruction } = await request.json();

    if (!name || !instruction) {
      return NextResponse.json(
        { error: 'Nome e instrução são obrigatórios' },
        { status: 400 }
      );
    }

    const [companion] = await createCompanion({
      name: name.trim(),
      instruction: instruction.trim(),
      userId: session.user.id!,
    });

    return NextResponse.json({ companion }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar companion:', error);
    return NextResponse.json(
      { error: 'Falha ao criar companion' },
      { status: 500 }
    );
  }
} 