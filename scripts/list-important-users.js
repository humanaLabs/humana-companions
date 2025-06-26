const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, not, like } = require('drizzle-orm');
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

async function listImportantUsers() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🔍 Buscando usuários importantes (não-convidados)...\n');

    // Buscar usuários que NÃO são guests
    const importantUsers = await db
      .select()
      .from(user)
      .where(not(like(user.email, 'guest-%')));

    if (importantUsers.length === 0) {
      console.log('❌ Nenhum usuário não-convidado encontrado');
      return;
    }

    console.log(
      `✅ Encontrados ${importantUsers.length} usuário(s) importantes:\n`,
    );
    console.log('─'.repeat(100));

    importantUsers.forEach((u, index) => {
      const adminBadge = u.isMasterAdmin ? '👑 MASTER ADMIN' : '👤 Regular';

      console.log(`${index + 1}. ${adminBadge}`);
      console.log(`   📧 Email: ${u.email}`);
      console.log(`   🆔 ID: ${u.id}`);
      console.log(`   🔐 Tem Senha: ${u.password ? '✅' : '❌'}`);
      console.log('─'.repeat(100));
    });

    // Estatísticas
    const masterAdmins = importantUsers.filter((u) => u.isMasterAdmin);
    const regularUsers = importantUsers.filter((u) => !u.isMasterAdmin);

    console.log('\n📊 ESTATÍSTICAS IMPORTANTES:');
    console.log(`👑 Master Admins: ${masterAdmins.length}`);
    console.log(`👤 Usuários Regulares: ${regularUsers.length}`);
    console.log(`📈 Total Importantes: ${importantUsers.length}`);

    if (masterAdmins.length > 0) {
      console.log('\n👑 MASTER ADMINS ATUAIS:');
      masterAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (ID: ${admin.id})`);
      });
    }
  } catch (error) {
    console.error('💥 Erro ao buscar usuários:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
listImportantUsers().catch(console.error);
