import { tool } from 'ai';
import { z } from 'zod';

// Variável global para armazenar as ferramentas MCP
let currentMcpTools: Record<string, any> = {};

export const setMcpToolsContext = (tools: Record<string, any>) => {
  currentMcpTools = tools;
  console.log('🔧 CONTEXTO DEFINIDO:', Object.keys(tools).length, 'ferramentas');
  console.log('🔧 NOMES DAS FERRAMENTAS NO CONTEXTO:', Object.keys(tools));
};

export const testMcpTool = tool({
  description: 'Ferramenta de teste MCP',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔧 EXECUTANDO testMcpTool - TESTE NOVO NOME');
    
    const result = {
      status: 'TESTE FUNCIONANDO',
      message: 'Esta é uma ferramenta de teste',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ RETORNANDO TESTE:', result);
    return result;
  },
});

export const listMcpTools = tool({
  description: 'Lista ferramentas MCP disponíveis dinamicamente',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔧 EXECUTANDO listMcpTools - DEBUG COMPLETO');
    console.log('🔧 currentMcpTools keys:', Object.keys(currentMcpTools));
    console.log('🔧 currentMcpTools length:', Object.keys(currentMcpTools).length);
    
    const allKeys = Object.keys(currentMcpTools);
    console.log('🔧 TODAS AS CHAVES:', allKeys);
    
    const mcpToolNames = Object.keys(currentMcpTools).filter(name => {
      const hasUnderscore = name.includes('_');
      const isNotNative = !['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions', 'listMcpTools', 'testMcpTool'].includes(name);
      console.log(`🔧 Analisando ${name}: underscore=${hasUnderscore}, notNative=${isNotNative}`);
      return hasUnderscore && isNotNative;
    });
    
    console.log('🔧 FERRAMENTAS MCP FILTRADAS:', mcpToolNames);
    
    const result = {
      status: 'Sistema MCP funcionando!',
      toolCount: mcpToolNames.length,
      servers: mcpToolNames.length > 0 ? [...new Set(mcpToolNames.map(name => name.split('_')[0]))] : [],
      tools: mcpToolNames.slice(0, 10),
      message: mcpToolNames.length > 0 ? `Encontradas ${mcpToolNames.length} ferramentas MCP` : 'Nenhuma ferramenta MCP disponível',
      debug: {
        totalKeys: allKeys.length,
        allKeys: allKeys,
        filteredKeys: mcpToolNames
      }
    };
    
    console.log('✅ RETORNANDO listMcpTools:', result);
    return result;
  },
}); 