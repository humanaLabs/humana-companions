const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
const { config } = require('dotenv');
const bcrypt = require('bcrypt');

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

async function resetUserPassword() {
  // Verificações de segurança
  if (!process.env.POSTGRES_URL) {
    console.log('❌ POSTGRES_URL não encontrada no .env.local');
    process.exit(1);
  }

  // Verificar se estamos em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    console.log('🚨 ERRO: Este script não pode ser executado em produção!');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Usuário e senha a serem resetados
  const targetEmail = process.argv[2] || 'eduibrahim@yahoo.com.br';
  const newPassword = process.argv[3] || '1234567890';

  try {
    console.log('🔐 RESETAR SENHA DE USUÁRIO');
    console.log('============================');
    console.log(`📧 Usuário: ${targetEmail}`);
    console.log(`🔑 Nova Senha: ${newPassword}`);
    console.log('');

    // 1. Verificar se usuário existe
    console.log('🔍 Verificando se usuário existe...');
    const existingUsers = await db
      .select({
        id: user.id,
        email: user.email,
        isMasterAdmin: user.isMasterAdmin
      })
      .from(user)
      .where(eq(user.email, targetEmail));

    if (existingUsers.length === 0) {
      console.log('❌ Usuário não encontrado!');
      console.log(`📧 Email: ${targetEmail} não existe na base de dados.`);
      console.log('');
      console.log('💡 USO DO SCRIPT:');
      console.log('   node scripts/reset-user-password.js [email] [nova-senha]');
      console.log('   node scripts/reset-user-password.js user@exemplo.com minhasenha');
      console.log('   node scripts/reset-user-password.js  # Usa padrões: eduibrahim@yahoo.com.br / 1234567890');
      process.exit(1);
    }

    const existingUser = existingUsers[0];
    console.log('✅ Usuário encontrado!');
    console.log(`   📧 Email: ${existingUser.email}`);
    console.log(`   🆔 ID: ${existingUser.id}`);
    console.log(`   👑 Master Admin: ${existingUser.isMasterAdmin ? 'Sim' : 'Não'}`);
    console.log('');

    // 2. Confirmar operação
    console.log('⚠️ ATENÇÃO: Esta operação irá RESETAR a senha do usuário!');
    console.log('🔐 A senha atual será substituída pela nova senha.');
    console.log('');

    // 3. Gerar hash da nova senha
    console.log('🔐 Gerando hash da nova senha...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 4. Atualizar senha no banco
    console.log('💾 Atualizando senha no banco de dados...');
    const updatedUsers = await db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.email, targetEmail))
      .returning({
        id: user.id,
        email: user.email,
        isMasterAdmin: user.isMasterAdmin
      });

    if (updatedUsers.length > 0) {
      const updated = updatedUsers[0];
      console.log('\n🎉 SUCESSO! Senha resetada com sucesso!');
      console.log('='.repeat(50));
      console.log(`👤 Usuário: ${updated.email}`);
      console.log(`🆔 ID: ${updated.id}`);
      console.log(`🔑 Nova Senha: ${newPassword}`);
      console.log(`👑 Master Admin: ${updated.isMasterAdmin ? 'Sim' : 'Não'}`);
      console.log('='.repeat(50));

      console.log('\n📝 COMO FAZER LOGIN:');
      console.log('1. Acesse: http://localhost:3000/login');
      console.log(`2. Email: ${targetEmail}`);
      console.log(`3. Senha: ${newPassword}`);
      console.log('4. ✅ Login realizado com nova senha!');
    } else {
      console.log('❌ Falha na atualização da senha');
    }

  } catch (error) {
    console.error('💥 Erro ao resetar senha:', error);

    if (error.code === '23505') {
      console.log('⚠️ Erro de constraint no banco de dados!');
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Verificar dependências
try {
  require('bcrypt');
} catch (error) {
  console.log('❌ Dependência bcrypt não encontrada!');
  console.log('💡 Execute: npm install bcrypt');
  process.exit(1);
}

// Executar o script
resetUserPassword().catch(console.error); 