import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  createMcpServer, 
  getMcpServersByUserId 
} from '@/lib/db/queries';
import { z } from 'zod';

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

    const body = await request.json();
    const validatedData = createMcpServerSchema.parse(body);

    const [newMcpServer] = await createMcpServer({
      ...validatedData,
      userId: session.user.id,
    });

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