import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { document } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para criação de documentos
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  content: z.string().optional(),
  kind: z.enum(['text', 'code', 'image', 'sheet']).default('text'),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
  content: z.string().optional(),
});

// GET /api/documents - Listar documentos do usuário
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    // TODO: Implementar organizationId quando schema for normalizado
    // Por enquanto, filtrar apenas por userId
    const documents = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
      })
      .from(document)
      .where(eq(document.userId, session.user.id))
      .orderBy(desc(document.createdAt));

    return NextResponse.json({ 
      documents,
      total: documents.length 
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar documentos' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Criar novo documento
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createDocumentSchema.parse(body);

    const [newDocument] = await db
      .insert(document)
      .values({
        title: validatedData.title,
        content: validatedData.content || '',
        kind: validatedData.kind,
        userId: session.user.id,
        createdAt: new Date(),
      })
      .returning({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
      });

    return NextResponse.json({ 
      document: newDocument,
      message: 'Documento criado com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    
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
      { error: 'Falha ao criar documento' },
      { status: 500 }
    );
  }
}

// PUT /api/documents - Atualizar documento (bulk update)
export async function PUT(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      );
    }

    const validatedData = updateDocumentSchema.parse(updateData);

    // Verificar se o documento existe e pertence ao usuário
    const existingDocument = await db
      .select()
      .from(document)
      .where(and(
        eq(document.id, id),
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
        eq(document.id, id),
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

// DELETE /api/documents - Deletar documento
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o documento existe e pertence ao usuário
    const existingDocument = await db
      .select()
      .from(document)
      .where(and(
        eq(document.id, id),
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
        eq(document.id, id),
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