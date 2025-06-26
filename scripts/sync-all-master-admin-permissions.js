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

// Permissões completas do Super Admin
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

async function syncAllMasterAdminPermissions() {
  if (!process.env.POSTGRES_URL) {
    console.log('❌ POSTGRES_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🔄 SINCRONIZADOR DE PERMISSÕES MASTER ADMIN');
    console.log('============================================');
    console.log('📋 Aplicando permissões Super Admin a todos os Master Admins');
    console.log('');

    // 1. Buscar todos os Master Admins
    console.log('🔍 Buscando todos os Master Admins...');
    const masterAdmins = await db
      .select()
      .from(user)
      .where(eq(user.isMasterAdmin, true));

    console.log(`✅ Encontrados ${masterAdmins.length} Master Admins`);
    console.log('');

    // 2. Garantir que existe a role Super Admin
    console.log('🎭 Verificando role Super Admin...');
    const existingRoles = await db
      .select()
      .from(role)
      .where(eq(role.name, 'super_admin'));

    let superAdminRole;

    if (existingRoles.length === 0) {
      // Criar nova role
      console.log('📝 Criando role Super Admin...');
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
      console.log('🔄 Atualizando role Super Admin...');
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

    console.log('');

    // 3. Processar cada Master Admin
    console.log('👥 PROCESSANDO MASTER ADMINS:');
    console.log('─'.repeat(50));

    let processedCount = 0;
    let alreadyConfiguredCount = 0;
    let newAssignmentsCount = 0;

    for (const admin of masterAdmins) {
      console.log(`\n📧 Processando: ${admin.email}`);
      console.log(`🆔 ID: ${admin.id}`);

      // Verificar se já tem a role
      const existingUserRoles = await db
        .select()
        .from(userRole)
        .where(
          and(
            eq(userRole.userId, admin.id),
            eq(userRole.roleId, superAdminRole.id),
            eq(userRole.isActive, true),
          ),
        );

      if (existingUserRoles.length === 0) {
        // Atribuir role ao usuário
        console.log('   📋 Atribuindo role Super Admin...');
        const newUserRole = await db
          .insert(userRole)
          .values({
            userId: admin.id,
            roleId: superAdminRole.id,
            assignedBy: admin.id, // Self-assigned
            isActive: true,
          })
          .returning();

        console.log(`   ✅ Role atribuída: ${newUserRole[0].id}`);
        newAssignmentsCount++;
      } else {
        console.log('   ℹ️ Já possui role Super Admin');
        alreadyConfiguredCount++;
      }

      processedCount++;
    }

    // 4. Mostrar resumo final
    console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log('='.repeat(50));
    console.log(`👥 Master Admins processados: ${processedCount}`);
    console.log(`✅ Já configurados: ${alreadyConfiguredCount}`);
    console.log(`🆕 Novas atribuições: ${newAssignmentsCount}`);
    console.log(
      `🎭 Role Super Admin: ${superAdminRole.displayName} (${superAdminRole.id})`,
    );
    console.log(
      `🔐 Permissões configuradas: ${SUPER_ADMIN_PERMISSIONS.length}`,
    );

    // 5. Mostrar todas as permissões configuradas
    console.log('\n🔐 PERMISSÕES APLICADAS A TODOS:');
    console.log('─'.repeat(40));
    SUPER_ADMIN_PERMISSIONS.forEach((permission, index) => {
      const [resource, action] = permission.split('.');
      console.log(`   ${index + 1}. ${permission}`);
      console.log(`      📂 ${resource} → ${action}`);
    });

    // 6. Verificar status final de todos os Master Admins
    console.log('\n👑 STATUS FINAL DOS MASTER ADMINS:');
    console.log('─'.repeat(50));

    const finalStatus = await db.execute(`
      SELECT 
        u.email,
        u.id,
        COUNT(ur.id) as role_count
      FROM "User" u
      LEFT JOIN "UserRole" ur ON u.id = ur."userId" 
        AND ur."roleId" = '${superAdminRole.id}' 
        AND ur."isActive" = true
      WHERE u."isMasterAdmin" = true
      GROUP BY u.email, u.id
      ORDER BY u.email
    `);

    finalStatus.forEach((admin, index) => {
      const status = admin.role_count > 0 ? '✅ CONFIGURADO' : '❌ PENDENTE';
      console.log(`   ${index + 1}. ${status}`);
      console.log(`      📧 ${admin.email}`);
      console.log(`      🆔 ${admin.id}`);
      console.log(`      🎭 Roles: ${admin.role_count}`);
    });

    console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(
      '👑 Todos os Master Admins agora têm as mesmas permissões Super Admin',
    );
  } catch (error) {
    console.error('💥 Erro na sincronização:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
console.log('');
syncAllMasterAdminPermissions().catch(console.error);
