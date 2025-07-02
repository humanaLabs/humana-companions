const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runProviderMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../lib/db/migrations/0024_provider_configurations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executando migração de provider configurations...');
    
    // Executar a migração
    await client.query(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');

    // Verificar se a tabela foi criada
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'provider_configurations'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Tabela provider_configurations criada com sucesso');
      
      // Verificar se há dados padrão
      const countResult = await client.query('SELECT COUNT(*) as count FROM provider_configurations');
      console.log(`📊 Configurações padrão inseridas: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ Tabela não foi criada');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

runProviderMigration(); 