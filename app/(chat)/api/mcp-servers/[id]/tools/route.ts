import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMcpServerById } from '@/lib/db/queries';
import { connectToMcpServer } from '@/lib/ai/mcp-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Iniciando GET /api/mcp-servers/[id]/tools');
    
    const { id } = await params;
    console.log(`📋 ID do servidor: ${id}`);
    
    const session = await auth();
    console.log(`👤 Sessão: ${session?.user?.id ? 'Autenticado' : 'Não autenticado'}`);
    
    if (!session?.user?.id) {
      console.log('❌ Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log(`🔍 Buscando servidor MCP com ID: ${id}`);
    const mcpServer = await getMcpServerById({ id });

    if (!mcpServer) {
      console.log('❌ Servidor MCP não encontrado');
      return NextResponse.json(
        { error: 'Servidor MCP não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📊 Servidor encontrado: ${mcpServer.name} (userId: ${mcpServer.userId})`);

    if (mcpServer.userId !== session.user.id) {
      console.log('❌ Usuário não tem acesso a este servidor');
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    if (!mcpServer.isActive) {
      console.log('⏸️ Servidor inativo');
      return NextResponse.json({
        success: false,
        tools: [],
        message: 'Servidor inativo'
      });
    }

    console.log(`🔧 Conectando ao servidor MCP ${mcpServer.name} usando SDK oficial`);

    // Usar a função que já funciona!
    try {
      const mcpClient = await connectToMcpServer(mcpServer);
      
      if (!mcpClient) {
        console.log(`❌ Falha na conexão com ${mcpServer.name}`);
        return NextResponse.json({
          success: false,
          tools: [],
          message: 'Falha na conexão com o servidor'
        });
      }

      const tools = mcpClient.tools.map(tool => ({
        name: tool.name,
        description: tool.description || 'Sem descrição'
      }));

      console.log(`✅ ${tools.length} ferramentas carregadas de ${mcpServer.name}`);
      
      return NextResponse.json({
        success: true,
        tools,
        message: 'Ferramentas carregadas com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao conectar via MCP SDK:', error);
      return NextResponse.json({
        success: false,
        tools: [],
        message: 'Erro de conexão'
      });
    }

  } catch (error) {
    console.error('❌ Erro geral ao buscar ferramentas do servidor MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 