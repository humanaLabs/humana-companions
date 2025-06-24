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

async function makeMasterAdmin() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  const targetEmail = 'eduibrahim@yahoo.com.br';

  try {
    console.log(`🔍 Procurando usuário ${targetEmail}...`);
    
    // Buscar o usuário atual
    const currentUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, targetEmail));

    if (currentUsers.length === 0) {
      console.log(`❌ Usuário ${targetEmail} não encontrado`);
      console.log('📋 Listando todos os usuários existentes:');
      
      const allUsers = await db.select().from(user);
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. Email: ${u.email}, ID: ${u.id}, MasterAdmin: ${u.isMasterAdmin}`);
      });
      
      return;
    }

    const currentUser = currentUsers[0];
    console.log('✅ Usuário encontrado:', {
      id: currentUser.id,
      email: currentUser.email,
      isMasterAdmin: currentUser.isMasterAdmin
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
      console.log('🎉 Usuário atualizado com sucesso!');
      console.log('👑 Agora é MasterAdmin:', updatedUsers[0].email);
      console.log('🆔 ID:', updatedUsers[0].id);
      console.log('🔐 isMasterAdmin:', updatedUsers[0].isMasterAdmin);
    } else {
      console.log('❌ Falha na atualização');
    }

  } catch (error) {
    console.error('💥 Erro ao atualizar usuário:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

// Executar o script
makeMasterAdmin().catch(console.error); 