import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMcpServerById, updateMcpServerConnectionStatus } from '@/lib/db/queries';
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

    // Get organizationId from middleware headers
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context missing' },
        { status: 400 }
      );
    }

    const mcpServer = await getMcpServerById({ id: serverId, organizationId });

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

    const testResult = await testMcpServerConnection(mcpServer);

    // Atualizar status de conexão no banco
    await updateMcpServerConnectionStatus({
      id: serverId,
      isConnected: testResult.success && testResult.isAuthenticated === true,
      connectionError: testResult.error || null,
      organizationId,
    });

    return NextResponse.json({
      success: testResult.success,
      isAuthenticated: testResult.isAuthenticated,
      message: testResult.success 
        ? 'Conexão bem-sucedida' 
        : testResult.error || 'Falha na conexão',
      tools: testResult.tools || [],
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