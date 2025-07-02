import { auth } from '@/app/(auth)/auth';
import { getCompanionById, updateCompanion, deleteCompanion } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { updateCompanionSchema } from '../schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Get organizationId from middleware headers
  const organizationId = request.headers.get('x-organization-id');
  
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization context missing' },
      { status: 400 }
    );
  }

  try {
    const resolvedParams = await params;
    const companion = await getCompanionById({ 
      id: resolvedParams.id,
      organizationId 
    });
    
    if (!companion) {
      return NextResponse.json(
        { error: 'Companion não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o companion pertence ao usuário
    if (companion.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ companion });
  } catch (error) {
    console.error('Erro ao buscar companion:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar companion' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateCompanionSchema.parse(body);

    const resolvedParams = await params;
    const [companion] = await updateCompanion({
      id: resolvedParams.id,
      ...validatedData,
      userId: session.user.id!,
    });

    if (!companion) {
      return NextResponse.json(
        { error: 'Companion não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ companion });
  } catch (error) {
    console.error('Erro ao atualizar companion:', error);
    
    if (error instanceof Error && 'issues' in error) {
      // Erro de validação Zod
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao atualizar companion' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const [companion] = await deleteCompanion({
      id: resolvedParams.id,
      userId: session.user.id!,
    });

    if (!companion) {
      return NextResponse.json(
        { error: 'Companion não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir companion:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir companion' },
      { status: 500 }
    );
  }
} 