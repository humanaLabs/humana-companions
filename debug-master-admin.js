const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { user } = require('./lib/db/schema');
const { eq } = require('drizzle-orm');

async function debugMasterAdmin() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL não encontrada');
    return;
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Buscar todos os usuários
    const users = await db.select().from(user);
    console.log('👥 Usuários encontrados:', users.length);
    
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} - Master Admin: ${u.isMasterAdmin}`);
    });

    // Se há usuários, definir o primeiro como Master Admin
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔧 Definindo ${firstUser.email} como Master Admin...`);
      
      await db
        .update(user)
        .set({ isMasterAdmin: true })
        .where(eq(user.id, firstUser.id));
      
      console.log('✅ Usuário definido como Master Admin!');
    } else {
      console.log('⚠️ Nenhum usuário encontrado no banco');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

debugMasterAdmin(); 