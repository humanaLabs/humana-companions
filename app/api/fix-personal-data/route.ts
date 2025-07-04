import { db } from '@/lib/db';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  return await applyFix();
}

export async function POST() {
  return await applyFix();
}

async function applyFix() {
  try {
    console.log('🔧 Iniciando correção de dados pessoais...');

    // 1. Verificar conexão do banco
    console.log('0. Testando conexão do banco...');
    await db.execute('SELECT 1;');
    console.log('✅ Conexão com banco funcionando!');

    // 2. Verificar estrutura atual das tabelas
    console.log('0.1. Verificando estrutura atual do Chat...');
    const chatStructure = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Chat' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 Estrutura atual do Chat:', Array.from(chatStructure));

    // 3. Remover organizationId das tabelas pessoais
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
    
    console.log('10. Verificando nova estrutura do Chat...');
    const newChatStructure = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Chat' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 Nova estrutura do Chat:', Array.from(newChatStructure));
    
    console.log('11. Adicionando índices...');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_chat_user_updated" ON "Chat" ("userId", "updatedAt" DESC);');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_document_user_created" ON "Document" ("userId", "createdAt" DESC);');
    await db.execute('CREATE INDEX IF NOT EXISTS "idx_message_chat_created" ON "Message_v2" ("chatId", "createdAt" DESC);');
    
    console.log('✅ Correção de dados pessoais concluída!');

    return new Response(`
      <html>
        <body style="font-family: monospace; padding: 20px;">
          <h1>✅ Correção Aplicada com Sucesso!</h1>
          <p>🔧 Dados pessoais foram corrigidos</p>
          <p>🔄 <strong>Atualize a página principal para ver suas conversas!</strong></p>
          <hr>
          <h3>📋 Estrutura Aplicada:</h3>
          <ul>
            <li>✅ Removido organizationId das tabelas pessoais</li>
            <li>✅ Adicionado updatedAt ao Chat</li>
            <li>✅ Criados índices para performance</li>
          </ul>
          <p><a href="/" style="color: blue;">← Voltar para o chat</a></p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('❌ Erro na correção:', error);
    return new Response(`
      <html>
        <body style="font-family: monospace; padding: 20px;">
          <h1>❌ Erro na Correção</h1>
          <pre>${error instanceof Error ? error.message : 'Erro desconhecido'}</pre>
          <p><a href="/" style="color: blue;">← Voltar para o chat</a></p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
} 