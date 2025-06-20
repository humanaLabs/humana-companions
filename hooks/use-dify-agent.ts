import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_DIFY_AGENT, type DifyAgent } from '@/lib/ai/dify-agents';

export function useDifyAgent() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_DIFY_AGENT);
  const [isExecuting, setIsExecuting] = useState(false);

  // Carregar agente selecionado do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dify-selected-agent');
      if (saved) {
        setSelectedAgentId(saved);
      }
    }
  }, []);

  const selectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    // Salvar no localStorage para persistir a seleção
    if (typeof window !== 'undefined') {
      localStorage.setItem('dify-selected-agent', agentId);
    }
  }, []);

  const executeAgent = useCallback(async (
    agent: DifyAgent, 
    message: string,
    conversationId?: string
  ) => {
    if (!agent.endpoint || !agent.apiKey) {
      throw new Error('Configuração do agente incompleta');
    }

    setIsExecuting(true);
    
    try {
      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${agent.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: message,
          response_mode: 'streaming',
          conversation_id: conversationId || '',
          user: 'user-' + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na execução do agente: ${response.statusText}`);
      }

      return response;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    selectedAgentId,
    selectAgent,
    executeAgent,
    isExecuting,
  };
} 