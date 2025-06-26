const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function cleanupInactiveGuests() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  // Configurações
  const DRY_RUN = process.argv.includes('--dry-run');
  const FORCE = process.argv.includes('--force');

  try {
    console.log('🧹 LIMPEZA DE USUÁRIOS CONVIDADOS INATIVOS');
    console.log('==========================================');
    console.log(
      `🔄 Modo: ${DRY_RUN ? 'SIMULAÇÃO (--dry-run)' : 'EXECUÇÃO REAL'}`,
    );
    console.log('');

    // 1. Buscar guests sem nenhuma atividade
    console.log('🔍 Buscando usuários convidados sem atividade...');

    const inactiveGuests = await db.execute(sql`
      SELECT u.id, u.email,
             CAST(SUBSTRING(u.email FROM 'guest-([0-9]+)') AS BIGINT) as guest_timestamp
      FROM "User" u
      LEFT JOIN "Chat" c ON u.id = c."userId"
      WHERE u.email ~ '^guest-[0-9]+$' 
        AND c.id IS NULL
      ORDER BY guest_timestamp ASC
    `);

    if (inactiveGuests.length === 0) {
      console.log('✅ Nenhum usuário convidado inativo encontrado!');
      return;
    }

    console.log(
      `📊 Encontrados ${inactiveGuests.length} usuários convidados inativos`,
    );

    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de usuários inativos:');
    const now = new Date();
    inactiveGuests.slice(0, 10).forEach((u, index) => {
      const createDate = new Date(Number(u.guest_timestamp));
      const ageHours =
        (now.getTime() - Number(u.guest_timestamp)) / (1000 * 60 * 60);
      console.log(
        `   ${index + 1}. ${u.email} (${ageHours.toFixed(1)}h atrás)`,
      );
    });

    if (inactiveGuests.length > 10) {
      console.log(`   ... e mais ${inactiveGuests.length - 10} usuários`);
    }

    if (DRY_RUN) {
      console.log('\n⚠️  MODO SIMULAÇÃO - Nenhuma alteração será feita');
      console.log(
        `💾 Espaço a ser liberado: ~${inactiveGuests.length} registros`,
      );
      console.log(
        'Execute sem --dry-run e com --force para limpar efetivamente',
      );
      return;
    }

    if (!FORCE) {
      console.log(
        '\n⚠️  ATENÇÃO: Esta operação irá deletar permanentemente os dados!',
      );
      console.log('Execute com --force para confirmar a operação');
      return;
    }

    // 3. Executar limpeza em lotes
    console.log('\n🔄 Iniciando limpeza...');

    const userIds = inactiveGuests.map((u) => u.id);
    let totalDeleted = 0;
    const batchSize = 50;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      console.log(
        `📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(userIds.length / batchSize)}...`,
      );

      // Deletar usuários inativos (não têm foreign keys bloqueando)
      const placeholders = batch.map(() => '?').join(',');
      const result = await db.execute(sql`
        DELETE FROM "User" WHERE id IN (${sql.join(
          batch.map((id) => sql`${id}`),
          sql`, `,
        )})
      `);

      const deleted = result.count || 0;
      totalDeleted += deleted;

      console.log(`   ✅ Deletados: ${deleted} usuários`);

      // Pequena pausa para não sobrecarregar o banco
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ LIMPEZA DE INATIVOS CONCLUÍDA!');
    console.log('================================');
    console.log(`👤 Usuários deletados: ${totalDeleted}`);

    // Estatísticas finais
    const remainingGuests = await db.execute(sql`
      SELECT COUNT(*) as count FROM "User" WHERE email ~ '^guest-[0-9]+$'
    `);

    const remainingInactive = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "User" u
      LEFT JOIN "Chat" c ON u.id = c."userId"
      WHERE u.email ~ '^guest-[0-9]+$' AND c.id IS NULL
    `);

    console.log(
      `📊 Usuários convidados restantes: ${remainingGuests[0].count}`,
    );
    console.log(`🚫 Inativos restantes: ${remainingInactive[0].count}`);

    const savedSpace =
      inactiveGuests.length - Number(remainingInactive[0].count);
    console.log(`💾 Espaço liberado: ${savedSpace} registros limpos`);
  } catch (error) {
    console.error('💥 Erro durante limpeza:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
console.log('🧹 LIMPEZA DE GUESTS INATIVOS');
console.log('============================');
console.log('Uso:');
console.log('  node scripts/cleanup-inactive-guests.js --dry-run    # Simular');
console.log(
  '  node scripts/cleanup-inactive-guests.js --force      # Executar',
);
console.log('');

cleanupInactiveGuests().catch(console.error);
