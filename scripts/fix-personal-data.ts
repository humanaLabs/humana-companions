import { db } from '../lib/db/index';

console.log('🔧 Iniciando correção de dados pessoais...');

async function fixPersonalData() {
  try {
    // 1. Remover organizationId das tabelas pessoais
    console.log('1. Removendo organizationId do Chat...');
    await db.execute('ALTER TABLE "Chat" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('2. Removendo organizationId do Document...');
    await db.execute('ALTER TABLE "Document" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('3. Removendo organizationId do Message_v2...');
    await db.execute('ALTER TABLE "Message_v2" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('4. Removendo organizationId do Vote_v2...');
    await db.execute('ALTER TABLE "Vote_v2" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('5. Removendo organizationId do Stream...');
    await db.execute('ALTER TABLE "Stream" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('6. Removendo organizationId do Suggestion...');
    await db.execute('ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "organizationId";');
    
    console.log('7. Adicionando updatedAt ao Chat...');
    await db.execute('ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();');
    
    console.log('8. Atualizando timestamps...');
    await db.execute('UPDATE "Chat" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;');
    
    console.log('9. Tornando updatedAt NOT NULL...');
    await db.execute('ALTER TABLE "Chat" ALTER COLUMN "updatedAt" SET NOT NULL;');
    
    console.log('10. Adicionando índices...');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_chat_user_updated" ON "Chat" ("userId", "updatedAt" DESC);');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_document_user_created" ON "Document" ("userId", "createdAt" DESC);');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_message_chat_created" ON "Message_v2" ("chatId", "createdAt" DESC);');
    
    console.log('✅ Correção de dados pessoais concluída!');
    console.log('🔄 Agora atualize a página para ver suas conversas voltarem!');

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
  
  process.exit();
}

fixPersonalData(); 