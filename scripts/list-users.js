const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
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

async function listUsers() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🔍 Buscando todos os usuários no banco...\n');

    // Buscar todos os usuários
    const allUsers = await db.select().from(user);

    if (allUsers.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco');
      return;
    }

    console.log(`✅ Encontrados ${allUsers.length} usuário(s):\n`);
    console.log('─'.repeat(80));

    allUsers.forEach((u, index) => {
      const isGuest = u.email.match(/^guest-\d+$/);
      const adminBadge = u.isMasterAdmin ? '👑 MASTER ADMIN' : '👤 Regular';
      const guestBadge = isGuest ? '🚶 Guest' : '✅ Registrado';

      console.log(`${index + 1}. ${adminBadge} | ${guestBadge}`);
      console.log(`   📧 Email: ${u.email}`);
      console.log(`   🆔 ID: ${u.id}`);
      console.log(`   🔐 Tem Senha: ${u.password ? '✅' : '❌'}`);
      console.log('─'.repeat(80));
    });

    // Estatísticas
    const masterAdmins = allUsers.filter((u) => u.isMasterAdmin).length;
    const regularUsers = allUsers.filter(
      (u) => !u.isMasterAdmin && !u.email.match(/^guest-\d+$/),
    ).length;
    const guestUsers = allUsers.filter((u) =>
      u.email.match(/^guest-\d+$/),
    ).length;

    console.log('\n📊 ESTATÍSTICAS:');
    console.log(`👑 Master Admins: ${masterAdmins}`);
    console.log(`👤 Usuários Regulares: ${regularUsers}`);
    console.log(`🚶 Usuários Convidados: ${guestUsers}`);
    console.log(`📈 Total: ${allUsers.length}`);
  } catch (error) {
    console.error('💥 Erro ao buscar usuários:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
listUsers().catch(console.error);
