const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function checkUserPermissions() {
  if (!process.env.POSTGRES_URL) {
    console.log('❌ POSTGRES_URL não encontrada no .env.local');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Email do usuário para verificar
  const targetEmail = process.argv[2] || 'admin@humana-ai.com';

  try {
    console.log('🔍 VERIFICADOR DE PERMISSÕES DE USUÁRIO');
    console.log('=====================================');
    console.log(`📧 Verificando: ${targetEmail}`);
    console.log('');

    // Buscar informações completas do usuário
    const userInfo = await db.execute(`
      SELECT 
        u.id as user_id,
        u.email,
        u."isMasterAdmin",
        r.id as role_id,
        r.name as role_name,
        r."displayName" as role_display,
        r.permissions as role_permissions,
        ur."isActive" as role_active,
        ur."assignedAt" as assigned_at
      FROM "User" u
      LEFT JOIN "UserRole" ur ON u.id = ur."userId" AND ur."isActive" = true
      LEFT JOIN "Role" r ON ur."roleId" = r.id
      WHERE u.email = '${targetEmail}'
      ORDER BY ur."assignedAt" DESC
    `);

    if (userInfo.length === 0) {
      console.log(`❌ Usuário ${targetEmail} não encontrado!`);
      return;
    }

    const user = userInfo[0];
    console.log('👤 INFORMAÇÕES DO USUÁRIO:');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.user_id}`);
    console.log(`👑 Master Admin: ${user.isMasterAdmin ? 'Sim' : 'Não'}`);
    console.log('');

    // Mostrar roles do usuário
    console.log('🎭 ROLES ATRIBUÍDAS:');
    console.log('─'.repeat(40));

    if (!user.role_id) {
      console.log('❌ Nenhuma role atribuída ao usuário');
    } else {
      userInfo.forEach((roleInfo, index) => {
        if (roleInfo.role_id) {
          console.log(
            `   ${index + 1}. ${roleInfo.role_display} (${roleInfo.role_name})`,
          );
          console.log(`      🆔 Role ID: ${roleInfo.role_id}`);
          console.log(
            `      ✅ Ativa: ${roleInfo.role_active ? 'Sim' : 'Não'}`,
          );
          console.log(
            `      📅 Atribuída em: ${new Date(roleInfo.assigned_at).toLocaleString('pt-BR')}`,
          );
          console.log('');
        }
      });
    }

    // Mostrar permissões detalhadas
    console.log('🔐 PERMISSÕES DETALHADAS:');
    console.log('─'.repeat(40));

    const allPermissions = new Set();

    // Se é Master Admin, tem todas as permissões
    if (user.isMasterAdmin) {
      console.log('👑 MASTER ADMIN - Acesso total ao sistema');
      console.log('✅ Todas as permissões são concedidas automaticamente');
      console.log('');
    }

    // Mostrar permissões específicas dos roles
    userInfo.forEach((roleInfo) => {
      if (roleInfo.role_permissions && roleInfo.role_active) {
        const permissions = roleInfo.role_permissions;

        console.log(`📋 Permissões da role "${roleInfo.role_display}":`);

        if (Array.isArray(permissions)) {
          permissions.forEach((perm, index) => {
            allPermissions.add(perm);
            const [resource, action] = perm.split('.');
            console.log(`   ${index + 1}. ${perm}`);
            console.log(`      📂 ${resource} → ${action}`);
          });
        } else {
          console.log('   ❌ Formato de permissões inválido');
        }
        console.log('');
      }
    });

    // Resumo final
    console.log('📊 RESUMO FINAL:');
    console.log('─'.repeat(40));
    console.log(`👤 Usuário: ${user.email}`);
    console.log(`👑 Master Admin: ${user.isMasterAdmin ? 'Sim' : 'Não'}`);
    console.log(
      `🎭 Roles ativas: ${userInfo.filter((r) => r.role_active).length}`,
    );
    console.log(`🔐 Permissões únicas: ${allPermissions.size}`);

    if (user.isMasterAdmin) {
      console.log('🌟 Status: ACESSO TOTAL (Master Admin)');
    } else if (allPermissions.size > 0) {
      console.log('✅ Status: ACESSO LIMITADO (Baseado em roles)');
    } else {
      console.log('❌ Status: SEM PERMISSÕES');
    }

    console.log('\n🎯 PERMISSÕES SOLICITADAS PELO USUÁRIO:');
    console.log('─'.repeat(40));

    const requiredPermissions = [
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

    let hasAllRequired = true;
    requiredPermissions.forEach((required, index) => {
      const hasPermission = user.isMasterAdmin || allPermissions.has(required);
      const status = hasPermission ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${required}`);

      if (!hasPermission) {
        hasAllRequired = false;
      }
    });

    console.log('─'.repeat(40));
    console.log(
      `🎯 Status das permissões solicitadas: ${hasAllRequired ? '✅ TODAS CONFIGURADAS' : '❌ ALGUMAS FALTANDO'}`,
    );

    if (!hasAllRequired && !user.isMasterAdmin) {
      console.log('\n💡 COMO CORRIGIR:');
      console.log(
        `   Execute: node scripts/setup-admin-permissions.js ${targetEmail}`,
      );
    }
  } catch (error) {
    console.error('💥 Erro ao verificar permissões:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
console.log('');
checkUserPermissions().catch(console.error);
