// Test script for companion persistence
const { createServiceContainer } = require('../lib/services/container/service-container.ts');

async function testCompanionPersistence() {
  console.log('🚀 Testing Companion Persistence...\n');
  
  try {
    // Create service container
    const container = await createServiceContainer('test-org-123');
    const companionService = container.getCompanionDomainService();
    
    console.log('✅ Service container created successfully');
    
    // Test companion creation
    const testCompanion = {
      name: 'Teste Database Companion',
      role: 'Especialista em Testes',
      responsibilities: [
        'Testar funcionalidades do sistema',
        'Validar persistência no banco',
        'Garantir integridade dos dados'
      ],
      expertises: [
        {
          area: 'Testes de Software',
          topics: ['Testes Unitários', 'Testes de Integração', 'TDD']
        }
      ],
      sources: [
        {
          type: 'Knowledge Base',
          description: 'Base de conhecimento sobre testes'
        }
      ],
      rules: [
        {
          type: 'tone',
          description: 'Seja técnico e preciso'
        }
      ],
      contentPolicy: {
        allowed: ['Testes', 'Desenvolvimento', 'Qualidade'],
        disallowed: ['Informações pessoais', 'Dados sensíveis']
      },
      skills: [],
      fallbacks: {
        ambiguous: 'Preciso de mais detalhes sobre o que você quer testar.',
        out_of_scope: 'Isso está fora do escopo de testes de software.',
        unknown: 'Não tenho informações sobre esse tópico específico.'
      }
    };
    
    // Create companion
    console.log('📝 Creating companion...');
    const createResult = await companionService.createCompanion(testCompanion);
    
    if (createResult.success) {
      console.log('✅ Companion created successfully!');
      console.log(`🆔 ID: ${createResult.data.id}`);
      console.log(`📛 Name: ${createResult.data.name}`);
      console.log(`👤 Role: ${createResult.data.role}\n`);
      
      // Test listing companions
      console.log('📋 Listing companions...');
      const listResult = await companionService.listCompanions();
      
      if (listResult.success) {
        console.log(`✅ Found ${listResult.data.length} companions in database`);
        listResult.data.forEach((companion, index) => {
          console.log(`${index + 1}. ${companion.name} (${companion.role})`);
        });
      } else {
        console.log('❌ Failed to list companions:', listResult.error);
      }
      
    } else {
      console.log('❌ Failed to create companion:', createResult.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCompanionPersistence().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
}); 