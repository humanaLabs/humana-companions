export interface DifyAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint?: string;
  apiKey?: string;
}

// Função para obter agentes configurados
function getConfiguredDifyAgents(): Array<DifyAgent> {
  return [
    {
      id: process.env.NEXT_PUBLIC_DIFY_AGENT_GENERAL || 'app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      name: 'Assistente Geral',
      description: 'Agente para assistência geral e perguntas diversas',
      category: 'Assistência',
    },
    {
      id: process.env.NEXT_PUBLIC_DIFY_AGENT_CODE || 'app-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
      name: 'Assistente de Código',
      description: 'Especializado em ajuda com programação e desenvolvimento',
      category: 'Desenvolvimento',
    },
    {
      id: process.env.NEXT_PUBLIC_DIFY_AGENT_MEDICAL || 'app-zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
      name: 'Consultor Médico',
      description: 'Agente especializado em questões de saúde e medicina',
      category: 'Saúde',
    },
    {
      id: process.env.NEXT_PUBLIC_DIFY_AGENT_LEGAL || 'app-wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww',
      name: 'Consultor Jurídico',
      description: 'Especializado em questões legais e jurídicas',
      category: 'Jurídico',
    },
  ];
}

export const difyAgents: Array<DifyAgent> = getConfiguredDifyAgents();

export const DEFAULT_DIFY_AGENT: string = process.env.NEXT_PUBLIC_DIFY_AGENT_DEFAULT || 'app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// Função para buscar agentes do Dify via API
export async function fetchDifyAgents(apiKey: string, baseUrl: string): Promise<DifyAgent[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/apps`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar agentes: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Mapear a resposta da API do Dify para nossa estrutura
    return data.data?.map((app: any) => ({
      id: app.id,
      name: app.name,
      description: app.description || 'Agente do Dify',
      category: app.mode || 'Geral',
      endpoint: `${baseUrl}/v1/chat-messages`,
      apiKey: apiKey,
    })) || difyAgents;
  } catch (error) {
    console.error('Erro ao buscar agentes do Dify:', error);
    return difyAgents; // Retorna agentes padrão em caso de erro
  }
} 