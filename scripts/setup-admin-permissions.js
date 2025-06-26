const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, and } = require('drizzle-orm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Schema simplificado para o script
const {
  pgTable,
  uuid,
  varchar,
  boolean,
  json,
  timestamp,
  text,
} = require('drizzle-orm/pg-core');

const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  isMasterAdmin: boolean('isMasterAdmin').notNull().default(false),
});

const role = pgTable('Role', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('displayName', { length: 100 }).notNull(),
  description: text('description'),
  permissions: json('permissions').notNull(),
  isSystemRole: boolean('isSystemRole').notNull().default(false),
  organizationId: uuid('organizationId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

const userRole = pgTable('UserRole', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull(),
  roleId: uuid('roleId').notNull(),
  organizationId: uuid('organizationId'),
  teamId: uuid('teamId'),
  assignedBy: uuid('assignedBy').notNull(),
  assignedAt: timestamp('assignedAt').notNull().defaultNow(),
  expiresAt: timestamp('expiresAt'),
  isActive: boolean('isActive').notNull().default(true),
  metadata: json('metadata'),
});

// Permissões solicitadas pelo usuário
const SUPER_ADMIN_PERMISSIONS = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'teams.read',
  'teams.create',
  'teams.update',
  'teams.delete',
  'teams.manage_members',
  'companions.read',
  'companions.create',
  'companions.update',
  'companions.delete',
  'admin.dashboard',
  'admin.audit',
  'studio.read',
  'studio.create',
  'dataroom.read',
  'dataroom.manage',
  'mcp.read',
  'mcp.manage',
];

async function setupAdminPermissions() {
  if (!process.env.POSTGRES_URL) {
    console.log('❌ POSTGRES_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Email do admin principal
  const targetEmail = process.argv[2] || 'admin@humana-ai.com';

  try {
    console.log('👑 CONFIGURADOR DE PERMISSÕES SUPER ADMIN');
    console.log('=========================================');
    console.log(`📧 Configurando para: ${targetEmail}`);
    console.log('');

    // 1. Verificar se usuário existe
    console.log('🔍 Verificando usuário...');
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, targetEmail));

    if (existingUsers.length === 0) {
      console.log(`❌ Usuário ${targetEmail} não encontrado!`);
      console.log(
        '💡 Use o script create-new-admin.js para criar o usuário primeiro.',
      );
      return;
    }

    const targetUser = existingUsers[0];
    console.log(`✅ Usuário encontrado: ${targetUser.email}`);

    // 2. Criar ou atualizar role Super Admin
    console.log('🎭 Configurando role Super Admin...');

    const existingRoles = await db
      .select()
      .from(role)
      .where(eq(role.name, 'super_admin'));

    let superAdminRole;

    if (existingRoles.length === 0) {
      // Criar nova role
      console.log('📝 Criando nova role Super Admin...');
      const newRoles = await db
        .insert(role)
        .values({
          name: 'super_admin',
          displayName: 'Super Admin',
          description:
            'Administrador com acesso completo a todas as funcionalidades do sistema',
          permissions: SUPER_ADMIN_PERMISSIONS,
          isSystemRole: true,
        })
        .returning();

      superAdminRole = newRoles[0];
      console.log(`✅ Role Super Admin criada: ${superAdminRole.id}`);
    } else {
      // Atualizar role existente
      console.log('🔄 Atualizando role Super Admin existente...');
      const updatedRoles = await db
        .update(role)
        .set({
          permissions: SUPER_ADMIN_PERMISSIONS,
          updatedAt: new Date(),
        })
        .where(eq(role.name, 'super_admin'))
        .returning();

      superAdminRole = updatedRoles[0];
      console.log(`✅ Role Super Admin atualizada: ${superAdminRole.id}`);
    }

    // 3. Verificar se usuário já tem a role
    console.log('🔗 Configurando atribuição de role...');
    const existingUserRoles = await db
      .select()
      .from(userRole)
      .where(
        and(
          eq(userRole.userId, targetUser.id),
          eq(userRole.roleId, superAdminRole.id),
          eq(userRole.isActive, true),
        ),
      );

    if (existingUserRoles.length === 0) {
      // Atribuir role ao usuário
      console.log('📋 Atribuindo role Super Admin ao usuário...');
      const newUserRole = await db
        .insert(userRole)
        .values({
          userId: targetUser.id,
          roleId: superAdminRole.id,
          assignedBy: targetUser.id, // Self-assigned para o primeiro admin
          isActive: true,
        })
        .returning();

      console.log(`✅ Role atribuída: ${newUserRole[0].id}`);
    } else {
      console.log('ℹ️ Usuário já possui a role Super Admin');
    }

    // 4. Garantir que é Master Admin
    if (!targetUser.isMasterAdmin) {
      console.log('👑 Promovendo para Master Admin...');
      await db
        .update(user)
        .set({ isMasterAdmin: true })
        .where(eq(user.id, targetUser.id));

      console.log('✅ Usuário promovido para Master Admin');
    }

    // 5. Mostrar resumo das permissões
    console.log('\n📊 RESUMO DAS PERMISSÕES CONFIGURADAS:');
    console.log('='.repeat(50));
    console.log(`👤 Usuário: ${targetUser.email}`);
    console.log(`🆔 ID: ${targetUser.id}`);
    console.log(`👑 Master Admin: Sim`);
    console.log(`🎭 Role: Super Admin (${superAdminRole.id})`);
    console.log('\n🔐 PERMISSÕES ATIVAS:');
    console.log('─'.repeat(40));

    SUPER_ADMIN_PERMISSIONS.forEach((permission, index) => {
      const category = permission.split('.')[0];
      const action = permission.split('.')[1];
      console.log(`   ${index + 1}. ${permission}`);
      console.log(`      📂 ${category} → ${action}`);
    });

    console.log('─'.repeat(40));
    console.log(
      `✅ Total: ${SUPER_ADMIN_PERMISSIONS.length} permissões configuradas`,
    );

    // 6. Verificar outros usuários com a mesma role
    console.log('\n👥 USUÁRIOS COM ROLE SUPER ADMIN:');
    console.log('─'.repeat(40));

    const allSuperAdmins = await db.execute(`
      SELECT u.email, u.id, u."isMasterAdmin"
      FROM "User" u
      INNER JOIN "UserRole" ur ON u.id = ur."userId"
      INNER JOIN "Role" r ON ur."roleId" = r.id
      WHERE r.name = 'super_admin' 
        AND ur."isActive" = true
      ORDER BY u.email
    `);

    allSuperAdmins.forEach((admin, index) => {
      const badge = admin.isMasterAdmin ? '👑 MASTER ADMIN' : '🎭 ROLE ADMIN';
      console.log(`   ${index + 1}. ${badge}`);
      console.log(`      📧 ${admin.email}`);
      console.log(`      🆔 ${admin.id}`);
    });

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('💥 Erro ao configurar permissões:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Função para configurar automaticamente novos master admins
async function addPermissionsToNewMasterAdmin(userId, assignedBy) {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL não encontrada');
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    // Buscar role Super Admin
    const superAdminRoles = await db
      .select()
      .from(role)
      .where(eq(role.name, 'super_admin'));

    if (superAdminRoles.length === 0) {
      throw new Error(
        'Role Super Admin não encontrada. Execute o script de setup primeiro.',
      );
    }

    const superAdminRole = superAdminRoles[0];

    // Verificar se usuário já tem a role
    const existingUserRoles = await db
      .select()
      .from(userRole)
      .where(
        and(
          eq(userRole.userId, userId),
          eq(userRole.roleId, superAdminRole.id),
          eq(userRole.isActive, true),
        ),
      );

    if (existingUserRoles.length === 0) {
      // Atribuir role ao usuário
      await db.insert(userRole).values({
        userId,
        roleId: superAdminRole.id,
        assignedBy,
        isActive: true,
      });

      console.log(`✅ Permissões Super Admin atribuídas automaticamente`);
    }
  } finally {
    await client.end();
  }
}

// Exportar função para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addPermissionsToNewMasterAdmin };
}

// Executar o script
if (require.main === module) {
  console.log('');
  setupAdminPermissions().catch(console.error);
}
