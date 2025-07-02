import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  createMcpServer, 
  getMcpServersByUserId,
  incrementUsage 
} from '@/lib/db/queries';
import { z } from 'zod';
import { checkQuotaBeforeAction } from '@/lib/middleware/quota-enforcement';

const createMcpServerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  url: z.string().url('URL inválida'),
  transport: z.enum(['sse', 'stdio']).default('sse'),
  description: z.string().optional(),
  authType: z.enum(['none', 'bearer', 'basic', 'apikey']).default('none'),
  authToken: z.string().optional(),
  authUsername: z.string().optional(),
  authPassword: z.string().optional(),
  authHeaderName: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const mcpServers = await getMcpServersByUserId({ 
      userId: session.user.id 
    });

    return NextResponse.json(mcpServers);
  } catch (error) {
    console.error('Erro ao buscar servidores MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // 🛡️ VERIFICAÇÃO DE QUOTA - MCP Servers
    try {
      const quotaCheck = await checkQuotaBeforeAction({ 
        request, 
        config: { 
          quotaType: 'mcp_servers', 
          actionType: 'create' 
        } 
      });
      
      if (!quotaCheck.allowed && quotaCheck.error) {
        return NextResponse.json(
          {
            error: quotaCheck.error.message,
            quotaType: quotaCheck.error.quotaType,
            current: quotaCheck.error.current,
            limit: quotaCheck.error.limit,
            type: 'quota_exceeded'
          },
          { status: 429 }
        );
      }
    } catch (quotaError) {
      console.error('Erro na verificação de quota de MCP servers:', quotaError);
      // Continuar com a operação se houver erro na verificação
    }

    const body = await request.json();
    const validatedData = createMcpServerSchema.parse(body);

    const [newMcpServer] = await createMcpServer({
      ...validatedData,
      userId: session.user.id,
    });

    // 📊 TRACKING DE USO - Incrementar contador de MCP servers
    try {
      const organizationId = request.headers.get('x-organization-id');
      if (organizationId) {
        await incrementUsage({
          userId: session.user.id,
          organizationId,
          usageType: 'mcp_servers',
          amount: 1,
        });
        console.log('✅ Criação de MCP server registrada');
      }
    } catch (trackingError) {
      console.error('❌ Erro ao registrar criação de MCP server:', trackingError);
    }

    return NextResponse.json(newMcpServer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar servidor MCP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 