const { db } = require('../lib/db');
const { eq, and, or, inArray, not } = require('drizzle-orm');
const { user, userRole, role } = require('../lib/db/schema');

const ADMINS_TO_KEEP = [
  '491f8c1a-6755-46cf-907c-d7195a25f603', // admin@humana.com
  'b00e5284-aa20-4b6a-9248-b7546b16499a', // eduibrahim@yahoo.com.br
  'ac2dad93-5f45-460e-820a-330acb42f611', // admin@humana-ai.com
];

const DEMO_USER_ID = 'fa40ea73-0d2f-43da-9f45-6b984fe98f74'; // demo@demo.com

async function main() {
  console.log('🔄 Iniciando atualização dos master admins...');

  try {
    // 1. Remover flag de master admin dos usuários que não estão na lista
    const updatedUsers = await db
      .update(user)
      .set({ isMasterAdmin: false })
      .where(
        and(
          eq(user.isMasterAdmin, true),
          not(inArray(user.id, ADMINS_TO_KEEP)),
        ),
      )
      .returning();

    console.log(
      '✅ Usuários removidos da lista de master admin:',
      updatedUsers.map((u) => u.email).join(', '),
    );

    // 2. Atualizar demo@demo.com para usuário normal
    const updatedDemo = await db
      .update(user)
      .set({
        isMasterAdmin: false,
      })
      .where(eq(user.id, DEMO_USER_ID))
      .returning();

    if (updatedDemo.length > 0) {
      console.log('✅ Usuário demo atualizado:', updatedDemo[0].email);
    }

    // 3. Remover todas as roles admin dos usuários que não são mais master admin
    const adminRoles = await db
      .select()
      .from(role)
      .where(eq(role.name, 'admin'));

    if (adminRoles.length > 0) {
      const removedRoles = await db
        .delete(userRole)
        .where(
          and(
            eq(userRole.roleId, adminRoles[0].id),
            not(inArray(userRole.userId, ADMINS_TO_KEEP)),
          ),
        )
        .returning();

      console.log('✅ Roles admin removidas:', removedRoles.length);
    }

    // 4. Confirmar status final
    const remainingAdmins = await db
      .select()
      .from(user)
      .where(eq(user.isMasterAdmin, true));

    console.log('\n🎯 Master Admins restantes:');
    remainingAdmins.forEach((admin) => {
      console.log(`- ${admin.email} (${admin.id})`);
    });

    console.log('\n✨ Processo finalizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
