const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { and, like, lt, sql } = require('drizzle-orm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Schema simplificado para o script
const { pgTable, uuid, varchar, boolean } = require('drizzle-orm/pg-core');

const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  isMasterAdmin: boolean('isMasterAdmin').notNull().default(false),
});

// Tabelas relacionadas que precisam ser limpas também
const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull(),
});

const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId').notNull(),
});

const vote = pgTable('Vote_v2', {
  chatId: uuid('chatId').notNull(),
  messageId: uuid('messageId').notNull(),
});

async function cleanupOldGuests() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Configurações de limpeza
  const DAYS_TO_KEEP = 7; // Manter guests dos últimos 7 dias
  const DRY_RUN = process.argv.includes('--dry-run'); // Modo simulação
  const BATCH_SIZE = 100; // Processar em lotes para performance

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

    console.log('🧹 LIMPEZA DE USUÁRIOS CONVIDADOS ANTIGOS');
    console.log('=====================================');
    console.log(`📅 Data de corte: ${cutoffDate.toISOString()}`);
    console.log(
      `🔄 Modo: ${DRY_RUN ? 'SIMULAÇÃO (--dry-run)' : 'EXECUÇÃO REAL'}`,
    );
    console.log(`📦 Tamanho do lote: ${BATCH_SIZE}`);
    console.log('');

    // 1. Buscar usuários guest antigos
    console.log('🔍 Buscando usuários convidados antigos...');

    // Extrair timestamp do email guest-{timestamp}
    const oldGuestUsers = await db.execute(sql`
      SELECT id, email, 
             CAST(SUBSTRING(email FROM 'guest-([0-9]+)') AS BIGINT) as guest_timestamp
      FROM "User" 
      WHERE email ~ '^guest-[0-9]+$'
        AND CAST(SUBSTRING(email FROM 'guest-([0-9]+)') AS BIGINT) < ${cutoffDate.getTime()}
      ORDER BY guest_timestamp ASC
      LIMIT ${BATCH_SIZE}
    `);

    if (oldGuestUsers.length === 0) {
      console.log('✅ Nenhum usuário convidado antigo encontrado!');
      return;
    }

    console.log(
      `📊 Encontrados ${oldGuestUsers.length} usuários convidados antigos`,
    );

    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de usuários que serão removidos:');
    oldGuestUsers.slice(0, 5).forEach((u, index) => {
      const createDate = new Date(Number(u.guest_timestamp));
      console.log(
        `   ${index + 1}. ${u.email} (criado em ${createDate.toLocaleString()})`,
      );
    });

    if (oldGuestUsers.length > 5) {
      console.log(`   ... e mais ${oldGuestUsers.length - 5} usuários`);
    }

    if (DRY_RUN) {
      console.log('\n⚠️  MODO SIMULAÇÃO - Nenhuma alteração será feita');
      console.log('Execute sem --dry-run para limpar efetivamente');
      return;
    }

    // 2. Confirmar antes de deletar
    console.log(
      '\n⚠️  ATENÇÃO: Esta operação irá deletar permanentemente os dados!',
    );

    // Para automação, podemos pular a confirmação
    if (!process.argv.includes('--force')) {
      console.log('Execute com --force para confirmar a operação');
      return;
    }

    // 3. Deletar dados relacionados primeiro (foreign keys)
    console.log('\n🔄 Iniciando limpeza...');

    const userIds = oldGuestUsers.map((u) => u.id);
    let totalDeleted = {
      votes: 0,
      messages: 0,
      chats: 0,
      users: 0,
    };

    // Deletar em lotes para evitar locks longos
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);

      console.log(
        `📦 Processando lote ${Math.floor(i / 10) + 1}/${Math.ceil(userIds.length / 10)}...`,
      );

      // 3a. Buscar chats dos usuários
      const userChats = await db.execute(sql`
        SELECT id FROM "Chat" WHERE "userId" = ANY(${batch})
      `);

      const chatIds = userChats.map((c) => c.id);

      if (chatIds.length > 0) {
        // 3b. Deletar votes
        const deletedVotes = await db.execute(sql`
          DELETE FROM "Vote_v2" WHERE "chatId" = ANY(${chatIds})
        `);
        totalDeleted.votes += deletedVotes.count || 0;

        // 3c. Deletar messages
        const deletedMessages = await db.execute(sql`
          DELETE FROM "Message_v2" WHERE "chatId" = ANY(${chatIds})
        `);
        totalDeleted.messages += deletedMessages.count || 0;

        // 3d. Deletar chats
        const deletedChats = await db.execute(sql`
          DELETE FROM "Chat" WHERE "userId" = ANY(${batch})
        `);
        totalDeleted.chats += deletedChats.count || 0;
      }

      // 3e. Deletar usuários
      const deletedUsers = await db.execute(sql`
        DELETE FROM "User" WHERE id = ANY(${batch})
      `);
      totalDeleted.users += deletedUsers.count || 0;

      // Pequena pausa para não sobrecarregar o banco
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ LIMPEZA CONCLUÍDA!');
    console.log('==================');
    console.log(`🗳️  Votes deletados: ${totalDeleted.votes}`);
    console.log(`💬 Mensagens deletadas: ${totalDeleted.messages}`);
    console.log(`💭 Chats deletados: ${totalDeleted.chats}`);
    console.log(`👤 Usuários deletados: ${totalDeleted.users}`);

    // 4. Estatísticas finais
    const remainingGuests = await db.execute(sql`
      SELECT COUNT(*) as count FROM "User" WHERE email ~ '^guest-[0-9]+$'
    `);

    console.log(
      `\n📊 Usuários convidados restantes: ${remainingGuests[0].count}`,
    );
  } catch (error) {
    console.error('💥 Erro durante limpeza:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
console.log('');
console.log('🧹 SCRIPT DE LIMPEZA DE USUÁRIOS CONVIDADOS');
console.log('==========================================');
console.log('Uso:');
console.log(
  '  node scripts/cleanup-old-guests.js --dry-run    # Simular limpeza',
);
console.log(
  '  node scripts/cleanup-old-guests.js --force      # Executar limpeza',
);
console.log('');

cleanupOldGuests().catch(console.error);
