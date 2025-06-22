import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMcpServerById } from '@/lib/db/queries';
import { testMcpServerConnection } from '@/lib/ai/mcp-client';
import { z } from 'zod';

const testMcpServerSchema = z.object({
  serverId: z.string().uuid('ID do servidor inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverId } = testMcpServerSchema.parse(body);

    const mcpServer = await getMcpServerById({ id: serverId });

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

    const isConnectionSuccessful = await testMcpServerConnection(mcpServer);

    return NextResponse.json({
      success: isConnectionSuccessful,
      message: isConnectionSuccessful 
        ? 'Conexão bem-sucedida' 
        : 'Falha na conexão',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao testar conexão MCP:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha na conexão'
      },
      { status: 500 }
    );
  }
} 