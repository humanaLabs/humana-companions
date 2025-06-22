import { tool } from 'ai';
import { z } from 'zod';

export const listMcpTools = (mcpTools: Record<string, any>) => 
  tool({
    description: 'Lista todas as ferramentas MCP (Model Context Protocol) disponíveis no momento',
    parameters: z.object({
      includeDetails: z.boolean().optional().describe('Se deve incluir detalhes das ferramentas (descrição, parâmetros)'),
    }),
    execute: async ({ includeDetails = false }) => {
      console.log('🔍 Executando listMcpTools com', Object.keys(mcpTools).length, 'ferramentas');
      
      const mcpToolNames = Object.keys(mcpTools);
      
      if (mcpToolNames.length === 0) {
        const message = 'Nenhuma ferramenta MCP está disponível no momento. Você pode adicionar servidores MCP através do seletor "Servidores MCP" no cabeçalho do chat.';
        console.log('📭 Resultado:', message);
        return message;
      }

      const toolsInfo = mcpToolNames.map(toolName => {
        const tool = mcpTools[toolName];
        
        if (includeDetails) {
          return {
            name: toolName,
            description: tool.description || 'Sem descrição disponível',
            parameters: tool.parameters ? Object.keys(tool.parameters.properties || {}) : [],
            server: toolName.split('_')[0] // Extrai o nome do servidor do prefixo
          };
        } else {
          return {
            name: toolName,
            server: toolName.split('_')[0]
          };
        }
      });

      // Agrupar por servidor
      const groupedByServer = toolsInfo.reduce((acc, tool) => {
        const serverName = tool.server;
        if (!acc[serverName]) {
          acc[serverName] = [];
        }
        acc[serverName].push(tool);
        return acc;
      }, {} as Record<string, any[]>);

      // Criar uma resposta em texto formatado
      let response = `🔧 **Ferramentas MCP Disponíveis**\n\n`;
      response += `📊 **Resumo:** ${mcpToolNames.length} ferramentas de ${Object.keys(groupedByServer).length} servidor(es)\n\n`;
      
      Object.entries(groupedByServer).forEach(([serverName, tools]) => {
        response += `🖥️ **Servidor "${serverName}":**\n`;
        tools.forEach(tool => {
          if (includeDetails) {
            response += `  • ${tool.name}\n`;
            response += `    - Descrição: ${tool.description}\n`;
            if (tool.parameters.length > 0) {
              response += `    - Parâmetros: ${tool.parameters.join(', ')}\n`;
            }
          } else {
            response += `  • ${tool.name}\n`;
          }
        });
        response += '\n';
      });

      console.log('✅ Resultado formatado:', response.substring(0, 200) + '...');
      return response;
    },
  }); 