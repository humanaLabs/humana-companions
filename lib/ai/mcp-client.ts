import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { McpServer } from '@/lib/db/schema';
import type { Tool } from 'ai';

interface McpTool {
  name: string;
  description?: string;
  inputSchema: any;
}

interface McpClient {
  client: Client;
  transport: SSEClientTransport | StdioClientTransport;
  tools: McpTool[];
}

// Cache para clientes MCP conectados
const mcpClients = new Map<string, McpClient>();

export async function connectToMcpServer(server: McpServer): Promise<McpClient | null> {
  try {
    // Verificar se já existe cliente conectado
    if (mcpClients.has(server.id)) {
      return mcpClients.get(server.id)!;
    }

    let transport: SSEClientTransport | StdioClientTransport;
    
    if (server.transport === 'sse') {
      transport = new SSEClientTransport(new URL(server.url));
    } else {
      // Para stdio, precisaríamos de uma implementação diferente
      // Por agora, vamos focar em SSE
      console.warn(`Transport ${server.transport} não suportado ainda`);
      return null;
    }

    const client = new Client(
      {
        name: `humana-companions-client`,
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await client.connect(transport);

    // Listar ferramentas disponíveis
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools || [];

    const mcpClient: McpClient = {
      client,
      transport,
      tools,
    };

    mcpClients.set(server.id, mcpClient);
    
    console.log(`✅ Conectado ao servidor MCP: ${server.name} com ${tools.length} ferramentas`);
    
    return mcpClient;
  } catch (error) {
    console.error(`❌ Erro ao conectar ao servidor MCP ${server.name}:`, error);
    return null;
  }
}

export async function disconnectFromMcpServer(serverId: string): Promise<void> {
  const mcpClient = mcpClients.get(serverId);
  if (mcpClient) {
    try {
      await mcpClient.client.close();
      mcpClients.delete(serverId);
      console.log(`🔌 Desconectado do servidor MCP: ${serverId}`);
    } catch (error) {
      console.error(`❌ Erro ao desconectar do servidor MCP ${serverId}:`, error);
    }
  }
}

export async function getMcpToolsFromServers(servers: McpServer[]): Promise<Record<string, Tool>> {
  console.log('🔧 getMcpToolsFromServers chamada com servidores:', servers.map(s => ({ id: s.id, name: s.name, isActive: s.isActive })));
  
  const tools: Record<string, Tool> = {};

  // Processar servidores em paralelo com timeout individual
  const activeServers = servers.filter(s => s.isActive);
  console.log('✅ Servidores ativos filtrados:', activeServers.map(s => ({ id: s.id, name: s.name })));
  
  const serverPromises = activeServers.map(async (server) => {
    try {
      // Timeout por servidor
      const serverPromise = (async () => {
        const mcpClient = await connectToMcpServer(server);
        
        if (!mcpClient) {
          return {};
        }

        const serverTools: Record<string, Tool> = {};

        // Converter ferramentas MCP para formato AI SDK
        for (const mcpTool of mcpClient.tools) {
          const toolName = `${server.name}_${mcpTool.name}`;
          
          serverTools[toolName] = {
            description: mcpTool.description || `Ferramenta ${mcpTool.name} do servidor ${server.name}`,
            parameters: mcpTool.inputSchema || {},
            execute: async (args: any) => {
              try {
                const result = await mcpClient.client.callTool({
                  name: mcpTool.name,
                  arguments: args,
                });

                return {
                  result: (result.content as any)?.[0]?.text || 'Ferramenta executada com sucesso',
                  content: result.content,
                };
              } catch (error) {
                console.error(`❌ Erro ao executar ferramenta ${mcpTool.name}:`, error);
                return {
                  result: `Erro ao executar ferramenta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                };
              }
            },
          };
        }
        
        console.log(`✅ Carregadas ${Object.keys(serverTools).length} ferramentas do servidor ${server.name}`);
        return serverTools;
      })();

      // Timeout de 2000ms por servidor
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout servidor ${server.name}`)), 2000)
      );

      return await Promise.race([serverPromise, timeoutPromise]);
    } catch (error) {
      console.error(`❌ Erro ao processar servidor MCP ${server.name}:`, error);
      return {};
    }
  });

  // Aguardar todos os servidores (com seus timeouts individuais)
  const results = await Promise.allSettled(serverPromises);
  
  // Combinar resultados bem-sucedidos
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      console.log('✅ Resultado bem-sucedido:', Object.keys(result.value));
      Object.assign(tools, result.value);
    } else if (result.status === 'rejected') {
      console.log('❌ Resultado rejeitado:', result.reason);
    }
  }

  console.log('🎯 Total de ferramentas retornadas:', Object.keys(tools));
  return tools;
}

export async function testMcpServerConnection(server: McpServer): Promise<{ 
  success: boolean; 
  tools?: Array<{ name: string; description?: string }> 
}> {
  try {
    const mcpClient = await connectToMcpServer(server);
    
    if (!mcpClient) {
      return { success: false };
    }

    // Testar listagem de ferramentas
    const toolsResponse = await mcpClient.client.listTools();
    const tools = toolsResponse.tools?.map(tool => ({
      name: tool.name,
      description: tool.description
    })) || [];
    
    // Desconectar após teste
    await disconnectFromMcpServer(server.id);
    
    return { 
      success: true, 
      tools 
    };
  } catch (error) {
    console.error(`❌ Teste de conexão falhou para ${server.name}:`, error);
    return { success: false };
  }
}

// Cleanup quando o processo terminar
process.on('exit', () => {
  for (const [serverId] of mcpClients) {
    disconnectFromMcpServer(serverId);
  }
});

process.on('SIGINT', () => {
  for (const [serverId] of mcpClients) {
    disconnectFromMcpServer(serverId);
  }
  process.exit(0);
}); 