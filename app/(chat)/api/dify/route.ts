import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { agentId, message, conversationId, apiKey, baseUrl } = await request.json();

    if (!agentId || !message || !apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: agentId, message, apiKey, baseUrl' },
        { status: 400 }
      );
    }

    // Fazer a requisição para o Dify
    const difyResponse = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'streaming',
        conversation_id: conversationId || '',
        user: `user-${Date.now()}`,
      }),
    });

    if (!difyResponse.ok) {
      return NextResponse.json(
        { error: `Erro do Dify: ${difyResponse.statusText}` },
        { status: difyResponse.status }
      );
    }

    // Retornar o stream do Dify diretamente
    return new NextResponse(difyResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Erro na API do Dify:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para listar agentes disponíveis
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const baseUrl = searchParams.get('baseUrl');

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: apiKey, baseUrl' },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/v1/apps`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro do Dify: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Mapear para nossa estrutura
    const agents = data.data?.map((app: any) => ({
      id: app.id,
      name: app.name,
      description: app.description || 'Agente do Dify',
      category: app.mode || 'Geral',
    })) || [];

    return NextResponse.json({ agents });

  } catch (error) {
    console.error('Erro ao buscar agentes do Dify:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 