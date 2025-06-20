'use client';

import { useState } from 'react';
import { DifyAgentSelector } from './dify-agent-selector';
import { useDifyAgent } from '@/hooks/use-dify-agent';
import { difyAgents } from '@/lib/ai/dify-agents';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

export function DifyAgentDemo() {
  const { selectedAgentId, selectAgent, executeAgent, isExecuting } = useDifyAgent();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const selectedAgent = difyAgents.find(agent => agent.id === selectedAgentId);

  const handleExecute = async () => {
    if (!selectedAgent || !message.trim()) return;

    try {
      setResponse('Executando agente...');
      
      // Para demonstração, vamos simular uma resposta
      // Em produção, isso usaria a API real do Dify
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResponse(`Resposta do agente "${selectedAgent.name}":\n\nVocê enviou: "${message}"\n\nEsta é uma resposta simulada. Configure as variáveis de ambiente NEXT_PUBLIC_DIFY_API_KEY e NEXT_PUBLIC_DIFY_BASE_URL para usar agentes reais do Dify.`);
    } catch (error) {
      setResponse(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Demonstração de Agentes Dify</CardTitle>
        <CardDescription>
          Teste a integração com agentes do Dify. Selecione um agente e envie uma mensagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Selecionar Agente:
          </label>
          <DifyAgentSelector
            selectedAgentId={selectedAgentId}
            onAgentSelect={selectAgent}
            className="w-full"
          />
        </div>

        {selectedAgent && (
          <div className="p-3 bg-muted rounded-md">
            <h4 className="font-medium">{selectedAgent.name}</h4>
            <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Categoria: {selectedAgent.category}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Mensagem:
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            rows={3}
          />
        </div>

        <Button 
          onClick={handleExecute}
          disabled={isExecuting || !message.trim()}
          className="w-full"
        >
          {isExecuting ? 'Executando...' : 'Executar Agente'}
        </Button>

        {response && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Resposta:
            </label>
            <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 