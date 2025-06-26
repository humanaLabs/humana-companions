const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
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

async function makeCustomAdmin() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Email do usuário que você quer tornar admin
  // Mude aqui para seu email ou passe como argumento
  const targetEmail = process.argv[2] || 'seu-email@exemplo.com';

  if (targetEmail === 'seu-email@exemplo.com') {
    console.log('❌ Por favor, forneça um email válido!');
    console.log('Uso: node scripts/make-custom-admin.js seu-email@exemplo.com');
    process.exit(1);
  }

  try {
    console.log(`🔍 Procurando usuário ${targetEmail}...`);

    // Buscar o usuário atual
    const currentUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, targetEmail));

    if (currentUsers.length === 0) {
      console.log(`❌ Usuário ${targetEmail} não encontrado`);
      console.log('📋 Listando todos os usuários não-convidados existentes:');

      const allUsers = await db.execute(`
        SELECT email, id, "isMasterAdmin" 
        FROM "User" 
        WHERE email NOT LIKE 'guest-%'
        ORDER BY "isMasterAdmin" DESC, email ASC
      `);

      console.log('\n📊 USUÁRIOS DISPONÍVEIS:');
      console.log('─'.repeat(80));
      allUsers.forEach((u, index) => {
        const badge = u.isMasterAdmin ? '👑 MASTER ADMIN' : '👤 Regular';
        console.log(`${index + 1}. ${badge}`);
        console.log(`   📧 ${u.email}`);
        console.log(`   🆔 ${u.id}`);
        console.log('─'.repeat(80));
      });

      return;
    }

    const currentUser = currentUsers[0];
    console.log('✅ Usuário encontrado:', {
      id: currentUser.id,
      email: currentUser.email,
      isMasterAdmin: currentUser.isMasterAdmin,
    });

    if (currentUser.isMasterAdmin) {
      console.log('ℹ️ Usuário já é MasterAdmin!');
      return;
    }

    // Atualizar o usuário para MasterAdmin
    const updatedUsers = await db
      .update(user)
      .set({ isMasterAdmin: true })
      .where(eq(user.email, targetEmail))
      .returning();

    if (updatedUsers.length > 0) {
      console.log('\n🎉 SUCESSO! Usuário atualizado para MasterAdmin!');
      console.log('='.repeat(50));
      console.log('👑 Novo MasterAdmin:', updatedUsers[0].email);
      console.log('🆔 ID:', updatedUsers[0].id);
      console.log('🔐 isMasterAdmin:', updatedUsers[0].isMasterAdmin);
      console.log('='.repeat(50));

      // Mostrar estatísticas finais
      const allAdmins = await db.execute(`
        SELECT email FROM "User" WHERE "isMasterAdmin" = true
      `);

      console.log('\n📊 TODOS OS MASTER ADMINS ATUAIS:');
      allAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email}`);
      });
    } else {
      console.log('❌ Falha na atualização');
    }
  } catch (error) {
    console.error('💥 Erro ao atualizar usuário:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
console.log('');
console.log('👑 CRIADOR DE MASTER ADMIN PERSONALIZADO');
console.log('=======================================');
console.log('Uso: node scripts/make-custom-admin.js seu-email@exemplo.com');
console.log('');

makeCustomAdmin().catch(console.error);
