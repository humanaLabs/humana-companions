import { auth } from '@/app/(auth)/auth';
import { createCompanion, getCompanionsByUserId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { createCompanionSchema } from './schema';

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
    const body = await request.json();
    const validatedData = createCompanionSchema.parse(body);

    const [companion] = await createCompanion({
      ...validatedData,
      userId: session.user.id!,
    });

    return NextResponse.json({ companion }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar companion:', error);
    
    if (error instanceof Error && 'issues' in error) {
      // Erro de validação Zod
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao criar companion' },
      { status: 500 }
    );
  }
} 