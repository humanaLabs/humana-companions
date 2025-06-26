const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
const { config } = require('dotenv');
const bcrypt = require('bcrypt');

// Importar função de permissões
const {
  addPermissionsToNewMasterAdmin,
} = require('./setup-admin-permissions.js');

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

async function createNewAdmin() {
  // Configurar conexão com o banco
  if (!process.env.POSTGRES_URL) {
    console.log('❌ POSTGRES_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Email e senha do novo admin
  const targetEmail = process.argv[2];
  const targetPassword = process.argv[3] || 'admin123'; // Senha padrão

  if (!targetEmail || targetEmail === 'seu-email@exemplo.com') {
    console.log('❌ Por favor, forneça um email válido!');
    console.log('📋 USO:');
    console.log(
      '   node scripts/create-new-admin.js seu-email@exemplo.com [senha]',
    );
    console.log(
      '   node scripts/create-new-admin.js joao@exemplo.com minhasenha',
    );
    console.log(
      '   node scripts/create-new-admin.js admin@empresa.com  # Usa senha padrão: admin123',
    );
    process.exit(1);
  }

  try {
    console.log('👑 CRIADOR DE NOVO MASTER ADMIN');
    console.log('===============================');
    console.log(`📧 Email: ${targetEmail}`);
    console.log(`🔐 Senha: ${targetPassword}`);
    console.log('');

    // 1. Verificar se usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, targetEmail));

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      console.log('⚠️ Usuário já existe!');
      console.log(`   📧 Email: ${existing.email}`);
      console.log(
        `   👑 Master Admin: ${existing.isMasterAdmin ? 'Sim' : 'Não'}`,
      );

      if (existing.isMasterAdmin) {
        console.log('✅ Usuário já é Master Admin. Nada a fazer!');
        return;
      } else {
        console.log('🔄 Promovendo usuário existente para Master Admin...');
        const updated = await db
          .update(user)
          .set({ isMasterAdmin: true })
          .where(eq(user.email, targetEmail))
          .returning();

        console.log('✅ Usuário promovido com sucesso!');
        console.log(`👑 ${updated[0].email} agora é Master Admin`);

        // Aplicar permissões Super Admin automaticamente
        try {
          console.log('🔐 Aplicando permissões Super Admin...');
          await addPermissionsToNewMasterAdmin(existing.id, existing.id);
        } catch (permError) {
          console.warn(
            '⚠️ Erro ao aplicar permissões automáticas:',
            permError.message,
          );
          console.log(
            '💡 Execute: node scripts/setup-admin-permissions.js para configurar manualmente',
          );
        }
        return;
      }
    }

    // 2. Gerar hash da senha
    console.log('🔐 Gerando hash da senha...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(targetPassword, saltRounds);

    // 3. Criar novo usuário
    console.log('👤 Criando novo usuário...');
    const newUsers = await db
      .insert(user)
      .values({
        email: targetEmail,
        password: hashedPassword,
        isMasterAdmin: true, // Já criar como master admin
      })
      .returning();

    if (newUsers.length > 0) {
      const newUser = newUsers[0];
      console.log('\n🎉 SUCESSO! Novo Master Admin criado!');
      console.log('='.repeat(50));
      console.log('👑 Novo Master Admin:', newUser.email);
      console.log('🆔 ID:', newUser.id);
      console.log('🔐 Senha:', targetPassword);
      console.log('👑 Master Admin:', newUser.isMasterAdmin);
      console.log('='.repeat(50));

      // 4. Mostrar todos os admins
      console.log('\n📊 TODOS OS MASTER ADMINS ATUAIS:');
      console.log('─'.repeat(40));
      const allAdmins = await db.execute(`
        SELECT email, id FROM "User" WHERE "isMasterAdmin" = true ORDER BY email
      `);

      allAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email}`);
        console.log(`      🆔 ${admin.id}`);
      });
      console.log('─'.repeat(40));

      // Aplicar permissões Super Admin automaticamente
      try {
        console.log('\n🔐 Aplicando permissões Super Admin automaticamente...');
        await addPermissionsToNewMasterAdmin(newUser.id, newUser.id);
      } catch (permError) {
        console.warn(
          '⚠️ Erro ao aplicar permissões automáticas:',
          permError.message,
        );
        console.log(
          '💡 Execute: node scripts/setup-admin-permissions.js para configurar manualmente',
        );
      }

      // 5. Instrucões de login
      console.log('\n📝 COMO FAZER LOGIN:');
      console.log('1. Acesse: http://localhost:3000/login');
      console.log(`2. Email: ${targetEmail}`);
      console.log(`3. Senha: ${targetPassword}`);
      console.log('4. ✅ Você terá acesso total como Master Admin!');
    } else {
      console.log('❌ Falha na criação do usuário');
    }
  } catch (error) {
    console.error('💥 Erro ao criar usuário:', error);

    if (error.code === '23505') {
      // Unique constraint violation
      console.log('⚠️ Email já existe no banco de dados!');
      console.log(
        '💡 Use: node scripts/make-custom-admin.js para promover usuário existente',
      );
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
createNewAdmin().catch(console.error);
