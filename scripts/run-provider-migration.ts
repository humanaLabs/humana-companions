import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runProviderMigration() {
  try {
    console.log('🔌 Conectando ao banco de dados...');

    // Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/0024_provider_configurations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executando migração de provider configurations...');
    
    // Executar a migração usando drizzle
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migração executada com sucesso!');

    // Verificar se a tabela foi criada
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'provider_configurations'
      );
    `);

    const tableExists = result[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Tabela provider_configurations criada com sucesso');
      
      // Verificar se há dados padrão
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM provider_configurations`);
      const count = countResult[0]?.count || 0;
      console.log(`📊 Configurações padrão inseridas: ${count}`);
    } else {
      console.log('❌ Tabela não foi criada');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runProviderMigration(); 