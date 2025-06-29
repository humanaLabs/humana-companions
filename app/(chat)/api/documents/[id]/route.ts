import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { document } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
  content: z.string().optional(),
});

// GET /api/documents/[id] - Buscar documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const documentData = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
      })
      .from(document)
      .where(and(
        eq(document.id, params.id),
        eq(document.userId, session.user.id)
      ))
      .limit(1);

    if (documentData.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      document: documentData[0] 
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar documento' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Atualizar documento específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateDocumentSchema.parse(body);

    // Verificar se o documento existe e pertence ao usuário
    const existingDocument = await db
      .select()
      .from(document)
      .where(and(
        eq(document.id, params.id),
        eq(document.userId, session.user.id)
      ))
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const [updatedDocument] = await db
      .update(document)
      .set(validatedData)
      .where(and(
        eq(document.id, params.id),
        eq(document.userId, session.user.id)
      ))
      .returning({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
      });

    return NextResponse.json({ 
      document: updatedDocument,
      message: 'Documento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao atualizar documento' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Deletar documento específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Verificar se o documento existe e pertence ao usuário
    const existingDocument = await db
      .select()
      .from(document)
      .where(and(
        eq(document.id, params.id),
        eq(document.userId, session.user.id)
      ))
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    await db
      .delete(document)
      .where(and(
        eq(document.id, params.id),
        eq(document.userId, session.user.id)
      ));

    return NextResponse.json({ 
      message: 'Documento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return NextResponse.json(
      { error: 'Falha ao deletar documento' },
      { status: 500 }
    );
  }
} 