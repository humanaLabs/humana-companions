#!/usr/bin/env node

/**
 * Script para listar agentes do Dify e seus IDs
 * 
 * Uso:
 * node scripts/list-dify-agents.js
 * 
 * Certifique-se de ter as variáveis de ambiente configuradas:
 * DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
 * DIFY_BASE_URL=https://api.dify.ai
 */

require('dotenv').config({ path: '.env.local' });

const DIFY_API_KEY = process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;
const DIFY_BASE_URL = process.env.DIFY_BASE_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://api.dify.ai';

async function listDifyAgents() {
  if (!DIFY_API_KEY) {
    console.error('❌ Erro: DIFY_API_KEY não encontrada');
    console.log('Configure no .env.local:');
    console.log('DIFY_API_KEY=app-xxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  console.log('🔍 Buscando agentes do Dify...');
  console.log(`📡 Base URL: ${DIFY_BASE_URL}`);
  console.log(`🔑 API Key: ${DIFY_API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    const response = await fetch(`${DIFY_BASE_URL}/v1/apps`, {
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('📭 Nenhum agente encontrado na sua conta Dify');
      return;
    }

    console.log(`✅ Encontrados ${data.data.length} agente(s):\n`);

    data.data.forEach((app, index) => {
      console.log(`📋 Agente ${index + 1}:`);
      console.log(`   Nome: ${app.name}`);
      console.log(`   ID: ${app.id}`);
      console.log(`   Modo: ${app.mode || 'N/A'}`);
      console.log(`   Descrição: ${app.description || 'Sem descrição'}`);
      console.log('');
    });

    console.log('🔧 Para usar estes agentes, adicione ao seu .env.local:');
    console.log('');
    
    data.data.forEach((app, index) => {
      const envName = `NEXT_PUBLIC_DIFY_AGENT_${app.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      console.log(`${envName}=${app.id}`);
    });

    console.log('');
    console.log('💡 Exemplo de configuração completa:');
    console.log('NEXT_PUBLIC_DIFY_AGENT_DEFAULT=' + data.data[0]?.id);

  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error.message);
    
    if (error.message.includes('401')) {
      console.log('🔑 Verifique se sua API Key está correta');
    } else if (error.message.includes('403')) {
      console.log('🚫 Verifique se sua API Key tem permissões adequadas');
    } else if (error.message.includes('404')) {
      console.log('🌐 Verifique se a Base URL está correta');
    }
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  listDifyAgents();
}

module.exports = { listDifyAgents }; 