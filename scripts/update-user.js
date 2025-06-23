const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');

// Schema simplificado para o script
const { pgTable, uuid, varchar, boolean } = require('drizzle-orm/pg-core');

const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  isMasterAdmin: boolean('isMasterAdmin').notNull().default(false),
});

async function updateUser() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🔍 Procurando usuário guest-1750352907765...');
    
    // Buscar o usuário atual
    const currentUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, 'guest-1750352907765'));

    if (currentUsers.length === 0) {
      console.log('❌ Usuário guest-1750352907765 não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', currentUsers[0]);

    // Atualizar o email para Eduardo Ibrahim
    const updatedUsers = await db
      .update(user)
      .set({ email: 'Eduardo Ibrahim' })
      .where(eq(user.email, 'guest-1750352907765'))
      .returning();

    if (updatedUsers.length > 0) {
      console.log('🎉 Usuário atualizado com sucesso!');
      console.log('📧 Novo email:', updatedUsers[0].email);
      console.log('🆔 ID:', updatedUsers[0].id);
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
updateUser().catch(console.error); 