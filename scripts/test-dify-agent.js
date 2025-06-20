#!/usr/bin/env node

/**
 * Script para testar a comunicação com um agente Dify específico
 * 
 * Uso:
 * node scripts/test-dify-agent.js [AGENT_ID] [MESSAGE]
 * 
 * Exemplo:
 * node scripts/test-dify-agent.js app-12345678-1234-1234-1234-123456789abc "Olá, como você está?"
 */

require('dotenv').config({ path: '.env.local' });

const DIFY_API_KEY = process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;
const DIFY_BASE_URL = process.env.DIFY_BASE_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://api.dify.ai';

async function testDifyAgent(agentId, message) {
  if (!DIFY_API_KEY) {
    console.error('❌ Erro: DIFY_API_KEY não encontrada');
    console.log('Configure no .env.local:');
    console.log('DIFY_API_KEY=app-xxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  if (!agentId) {
    console.error('❌ Erro: ID do agente não fornecido');
    console.log('Uso: node scripts/test-dify-agent.js [AGENT_ID] [MESSAGE]');
    process.exit(1);
  }

  if (!message) {
    message = 'Olá, este é um teste de conexão. Como você está?';
  }

  console.log('🧪 Testando agente Dify...');
  console.log(`📡 Base URL: ${DIFY_BASE_URL}`);
  console.log(`🔑 API Key: ${DIFY_API_KEY.substring(0, 10)}...`);
  console.log(`🤖 Agent ID: ${agentId}`);
  console.log(`💬 Mensagem: "${message}"`);
  console.log('');

  try {
    const response = await fetch(`${DIFY_BASE_URL}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'streaming',
        conversation_id: '',
        user: `test-user-${Date.now()}`,
      }),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na requisição:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return;
    }

    console.log('✅ Conexão estabelecida! Processando stream...\n');

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('❌ Não foi possível ler o stream da resposta');
      return;
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let eventCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            eventCount++;
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]') {
              console.log('🏁 Stream finalizado');
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              console.log(`📨 Evento ${eventCount}:`, data.event);
              
              if (data.event === 'message' || data.event === 'agent_message') {
                const content = data.answer || data.content || '';
                if (content) {
                  process.stdout.write(content);
                  fullResponse += content;
                }
              } else if (data.event === 'message_end') {
                console.log('\n✅ Mensagem concluída');
                break;
              } else if (data.event === 'error') {
                console.error('\n❌ Erro do agente:', data);
                break;
              } else {
                console.log(`ℹ️  Evento desconhecido: ${data.event}`);
              }
            } catch (parseError) {
              console.error(`❌ Erro ao parsear linha ${eventCount}:`, parseError.message);
              console.error('Linha problemática:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('\n\n📋 Resumo do teste:');
    console.log(`✅ Eventos processados: ${eventCount}`);
    console.log(`📝 Resposta completa (${fullResponse.length} caracteres):`);
    console.log('─'.repeat(50));
    console.log(fullResponse || '(resposta vazia)');
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🌐 Verifique sua conexão com a internet');
    } else if (error.message.includes('401')) {
      console.log('🔑 Verifique se sua API Key está correta');
    } else if (error.message.includes('404')) {
      console.log('🔍 Verifique se o ID do agente está correto');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const agentId = process.argv[2];
  const message = process.argv[3];
  
  testDifyAgent(agentId, message);
}

module.exports = { testDifyAgent }; 