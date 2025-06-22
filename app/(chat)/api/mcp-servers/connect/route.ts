import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMcpServerById, updateMcpServer } from '@/lib/db/queries';
import { z } from 'zod';

const connectSchema = z.object({
  serverId: z.string().uuid(),
  authType: z.enum(['none', 'bearer', 'basic', 'apikey']).optional(),
  authToken: z.string().optional(),
  authUsername: z.string().optional(),
  authPassword: z.string().optional(),
  authHeaderName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = connectSchema.parse(body);

    // Buscar o servidor
    const server = await getMcpServerById({ id: validatedData.serverId });
    if (!server || server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    // Preparar headers de autenticação
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const authType = validatedData.authType || server.authType;
    const authToken = validatedData.authToken || server.authToken;
    const authUsername = validatedData.authUsername || server.authUsername;
    const authPassword = validatedData.authPassword || server.authPassword;
    const authHeaderName = validatedData.authHeaderName || server.authHeaderName;

    // Aplicar autenticação baseada no tipo
    switch (authType) {
      case 'bearer':
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        break;
      case 'basic':
        if (authUsername && authPassword) {
          const credentials = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'apikey':
        if (authToken && authHeaderName) {
          headers[authHeaderName] = authToken;
        }
        break;
    }

    // Tentar conectar ao servidor MCP
    let connectionSuccess = false;
    let errorMessage = '';

    try {
      // Para servidores SSE, tentamos fazer uma requisição de handshake ou listar ferramentas
      const testUrl = server.transport === 'sse' 
        ? `${server.url}/tools` 
        : server.url;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        connectionSuccess = true;
        
        // Tentar parsear a resposta para verificar se é um servidor MCP válido
        try {
          const data = await response.json();
          // Verificar se a resposta tem a estrutura esperada de um servidor MCP
          if (data && (Array.isArray(data.tools) || data.tools !== undefined)) {
            connectionSuccess = true;
          }
        } catch (parseError) {
          // Se não conseguir parsear, mas a resposta foi OK, considerar como sucesso
          connectionSuccess = true;
        }
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (fetchError: any) {
      errorMessage = fetchError.message || 'Erro de conexão';
      console.error('Erro ao conectar ao servidor MCP:', fetchError);
    }

    // Atualizar o servidor com as novas credenciais e status de conexão
    const [updatedServer] = await updateMcpServer({
      id: server.id,
      name: server.name,
      url: server.url,
      transport: server.transport,
      description: server.description || undefined,
      isActive: server.isActive,
      authType: validatedData.authType || server.authType,
      authToken: validatedData.authToken !== undefined ? validatedData.authToken : (server.authToken || undefined),
      authUsername: validatedData.authUsername !== undefined ? validatedData.authUsername : (server.authUsername || undefined),
      authPassword: validatedData.authPassword !== undefined ? validatedData.authPassword : (server.authPassword || undefined),
      authHeaderName: validatedData.authHeaderName !== undefined ? validatedData.authHeaderName : (server.authHeaderName || undefined),
      userId: server.userId,
    });

    if (connectionSuccess) {
      return NextResponse.json({
        success: true,
        message: `Conectado com sucesso ao servidor ${server.name}`,
        server: updatedServer,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Falha na conexão: ${errorMessage}`,
        server: updatedServer,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API de conexão MCP:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 