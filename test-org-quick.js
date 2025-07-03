// Teste rápido para organizations
const fetch = require('node-fetch');

async function testOrganizations() {
  try {
    console.log('🔍 Testando API de Organizations...');
    
    const response = await fetch('http://localhost:3001/api/organizations', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ OK - 401 Unauthorized (esperado sem autenticação)');
      return true;
    }
    
    if (response.status === 500) {
      const error = await response.text();
      console.log('❌ Erro 500:', error);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Resposta:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

testOrganizations(); 