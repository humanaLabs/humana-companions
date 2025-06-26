const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function analyzeGuestAges() {
  // Configurar conexão com o banco
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🕒 ANÁLISE DE IDADE DOS USUÁRIOS CONVIDADOS');
    console.log('==========================================\n');

    // 1. Buscar todos os guests com timestamps
    const guestUsers = await db.execute(sql`
      SELECT 
        id, 
        email, 
        CAST(SUBSTRING(email FROM 'guest-([0-9]+)') AS BIGINT) as guest_timestamp,
        CASE 
          WHEN CAST(SUBSTRING(email FROM 'guest-([0-9]+)') AS BIGINT) IS NOT NULL 
          THEN to_timestamp(CAST(SUBSTRING(email FROM 'guest-([0-9]+)') AS BIGINT) / 1000)
          ELSE NULL 
        END as created_at
      FROM "User" 
      WHERE email ~ '^guest-[0-9]+$'
      ORDER BY guest_timestamp DESC
    `);

    if (guestUsers.length === 0) {
      console.log('❌ Nenhum usuário convidado encontrado!');
      return;
    }

    console.log(`📊 Total de usuários convidados: ${guestUsers.length}\n`);

    // 2. Analisar por faixas de tempo
    const now = new Date();
    const timeRanges = {
      'última hora': 1000 * 60 * 60,
      'últimas 24h': 1000 * 60 * 60 * 24,
      'últimos 7 dias': 1000 * 60 * 60 * 24 * 7,
      'últimos 30 dias': 1000 * 60 * 60 * 24 * 30,
      'mais de 30 dias': Infinity,
    };

    console.log('📈 DISTRIBUIÇÃO POR IDADE:');
    console.log('─'.repeat(50));

    Object.entries(timeRanges).forEach(([label, maxAge]) => {
      const count = guestUsers.filter((user) => {
        if (!user.guest_timestamp) return false;
        const age = now.getTime() - Number(user.guest_timestamp);
        return maxAge === Infinity
          ? age > timeRanges['últimos 30 dias']
          : age <= maxAge;
      }).length;

      console.log(
        `${label.padEnd(20)} │ ${count.toString().padStart(6)} usuários`,
      );
    });

    // 3. Mostrar alguns exemplos recentes e antigos
    console.log('\n📋 EXEMPLOS DE USUÁRIOS:');
    console.log('─'.repeat(70));

    console.log('\n🕒 Mais recentes (últimos 5):');
    guestUsers.slice(0, 5).forEach((user, index) => {
      const createdAt = new Date(Number(user.guest_timestamp));
      const ageHours =
        (now.getTime() - Number(user.guest_timestamp)) / (1000 * 60 * 60);
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(
        `      Criado: ${createdAt.toLocaleString()} (${ageHours.toFixed(1)}h atrás)`,
      );
    });

    console.log('\n⏰ Mais antigos (últimos 5):');
    guestUsers
      .slice(-5)
      .reverse()
      .forEach((user, index) => {
        const createdAt = new Date(Number(user.guest_timestamp));
        const ageDays =
          (now.getTime() - Number(user.guest_timestamp)) /
          (1000 * 60 * 60 * 24);
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(
          `      Criado: ${createdAt.toLocaleString()} (${ageDays.toFixed(1)} dias atrás)`,
        );
      });

    // 4. Estatísticas de uso (chats criados)
    console.log('\n💬 ESTATÍSTICAS DE USO:');
    console.log('─'.repeat(50));

    const guestUsage = await db.execute(sql`
      SELECT 
        u.email,
        COUNT(c.id) as chat_count,
        COUNT(m.id) as message_count
      FROM "User" u
      LEFT JOIN "Chat" c ON u.id = c."userId"
      LEFT JOIN "Message_v2" m ON c.id = m."chatId"
      WHERE u.email ~ '^guest-[0-9]+$'
      GROUP BY u.id, u.email
      HAVING COUNT(c.id) > 0
      ORDER BY COUNT(c.id) DESC
      LIMIT 10
    `);

    if (guestUsage.length > 0) {
      console.log('🏆 Top 10 guests por atividade:');
      guestUsage.forEach((usage, index) => {
        console.log(`   ${index + 1}. ${usage.email}`);
        console.log(
          `      💭 ${usage.chat_count} chats, 💬 ${usage.message_count} mensagens`,
        );
      });
    }

    // 5. Guests sem atividade
    const inactiveGuests = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "User" u
      LEFT JOIN "Chat" c ON u.id = c."userId"
      WHERE u.email ~ '^guest-[0-9]+$' AND c.id IS NULL
    `);

    console.log(
      `\n🚫 Usuários convidados sem atividade: ${inactiveGuests[0].count}`,
    );

    // 6. Recomendações de limpeza
    console.log('\n💡 RECOMENDAÇÕES DE LIMPEZA:');
    console.log('─'.repeat(50));

    const oldGuests = guestUsers.filter((user) => {
      const ageDays =
        (now.getTime() - Number(user.guest_timestamp)) / (1000 * 60 * 60 * 24);
      return ageDays > 1; // Mais de 1 dia
    });

    const veryOldGuests = guestUsers.filter((user) => {
      const ageDays =
        (now.getTime() - Number(user.guest_timestamp)) / (1000 * 60 * 60 * 24);
      return ageDays > 7; // Mais de 7 dias
    });

    console.log(`🟡 Guests > 1 dia: ${oldGuests.length} (podem ser limpos)`);
    console.log(
      `🔴 Guests > 7 dias: ${veryOldGuests.length} (devem ser limpos)`,
    );

    console.log('\n📋 COMANDOS SUGERIDOS:');
    if (oldGuests.length > 0) {
      console.log('# Simular limpeza (guests > 1 dia):');
      console.log('node scripts/cleanup-old-guests.js --days=1 --dry-run');
      console.log('');
      console.log('# Executar limpeza (guests > 1 dia):');
      console.log('node scripts/cleanup-old-guests.js --days=1 --force');
    }
  } catch (error) {
    console.error('💥 Erro durante análise:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Executar o script
analyzeGuestAges().catch(console.error);
