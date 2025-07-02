import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getMcpServerById, 
  updateMcpServer, 
  deleteMcpServer 
} from '@/lib/db/queries';
import { z } from 'zod';

const updateMcpServerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  url: z.string().url('URL inválida'),
  transport: z.enum(['sse', 'stdio']),
  description: z.string().optional(),
  isActive: z.boolean(),
  authType: z.enum(['none', 'bearer', 'basic', 'apikey']),
  authToken: z.string().optional(),
  authUsername: z.string().optional(),
  authPassword: z.string().optional(),
  authHeaderName: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get organizationId from middleware headers
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context missing' },
        { status: 400 }
      );
    }

    const mcpServer = await getMcpServerById({ id, organizationId });

    if (!mcpServer) {
      return NextResponse.json(
        { error: 'Servidor MCP não encontrado' },
        { status: 404 }
      );
    }

    if (mcpServer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json(mcpServer);
  } catch (error) {
    console.error('Erro ao buscar servidor MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateMcpServerSchema.parse(body);

    const [updatedMcpServer] = await updateMcpServer({
      id,
      ...validatedData,
      userId: session.user.id,
    });

    if (!updatedMcpServer) {
      return NextResponse.json(
        { error: 'Servidor MCP não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMcpServer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar servidor MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const [deletedMcpServer] = await deleteMcpServer({
      id,
      userId: session.user.id,
    });

    if (!deletedMcpServer) {
      return NextResponse.json(
        { error: 'Servidor MCP não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Servidor MCP excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir servidor MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 