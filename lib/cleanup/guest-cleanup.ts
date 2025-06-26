import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Configurações de limpeza
const CLEANUP_CONFIG = {
  // Manter usuários guest por 24 horas por padrão
  DEFAULT_TTL_HOURS: 24,
  // Limpar usuários inativos após 1 hora
  INACTIVE_TTL_HOURS: 1,
  // Tamanho do lote para performance
  BATCH_SIZE: 50,
  // Máximo de usuários a limpar por execução
  MAX_CLEANUP_PER_RUN: 1000,
};

interface CleanupStats {
  totalFound: number;
  totalDeleted: number;
  inactiveDeleted: number;
  oldDeleted: number;
  errors: number;
}

/**
 * Limpa usuários convidados antigos e inativos
 */
export async function cleanupGuestUsers(options?: {
  ttlHours?: number;
  inactiveTtlHours?: number;
  dryRun?: boolean;
}): Promise<CleanupStats> {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is required');
  }
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  const ttlHours = options?.ttlHours ?? CLEANUP_CONFIG.DEFAULT_TTL_HOURS;
  const inactiveTtlHours =
    options?.inactiveTtlHours ?? CLEANUP_CONFIG.INACTIVE_TTL_HOURS;
  const dryRun = options?.dryRun ?? false;

  const stats: CleanupStats = {
    totalFound: 0,
    totalDeleted: 0,
    inactiveDeleted: 0,
    oldDeleted: 0,
    errors: 0,
  };

  try {
    console.log(
      `🧹 Iniciando limpeza de guests (TTL: ${ttlHours}h, Inativo: ${inactiveTtlHours}h, Dry-run: ${dryRun})`,
    );

    const now = new Date();
    const cutoffTime = now.getTime() - ttlHours * 60 * 60 * 1000;
    const inactiveCutoffTime =
      now.getTime() - inactiveTtlHours * 60 * 60 * 1000;

    // 1. Buscar usuários convidados inativos (mais agressivo)
    const inactiveGuests = await db.execute(sql`
      SELECT u.id, u.email,
             CAST(SUBSTRING(u.email FROM 'guest-([0-9]+)') AS BIGINT) as guest_timestamp
      FROM "User" u
      LEFT JOIN "Chat" c ON u.id = c."userId"
      WHERE u.email ~ '^guest-[0-9]+$' 
        AND c.id IS NULL
        AND CAST(SUBSTRING(u.email FROM 'guest-([0-9]+)') AS BIGINT) < ${inactiveCutoffTime}
      ORDER BY guest_timestamp ASC
      LIMIT ${CLEANUP_CONFIG.MAX_CLEANUP_PER_RUN}
    `);

    stats.totalFound += inactiveGuests.length;

    if (inactiveGuests.length > 0) {
      console.log(
        `🚫 Encontrados ${inactiveGuests.length} usuários inativos para limpeza`,
      );

      if (!dryRun) {
        // Deletar usuários inativos em lotes
        for (
          let i = 0;
          i < inactiveGuests.length;
          i += CLEANUP_CONFIG.BATCH_SIZE
        ) {
          const batch = inactiveGuests.slice(i, i + CLEANUP_CONFIG.BATCH_SIZE);

          try {
            const result = await db.execute(sql`
              DELETE FROM "User" 
              WHERE id IN (${sql.join(
                batch.map((u) => sql`${u.id}`),
                sql`, `,
              )})
            `);

            const deleted = result.count || 0;
            stats.inactiveDeleted += deleted;
            stats.totalDeleted += deleted;
          } catch (error) {
            console.error(
              `❌ Erro ao deletar lote ${i}-${i + batch.length}:`,
              error,
            );
            stats.errors++;
          }

          // Pequena pausa para performance
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } else {
        stats.inactiveDeleted = inactiveGuests.length;
      }
    }

    // 2. Buscar usuários convidados antigos (com atividade, mas expirados)
    const oldActiveGuests = await db.execute(sql`
      SELECT DISTINCT u.id, u.email,
             CAST(SUBSTRING(u.email FROM 'guest-([0-9]+)') AS BIGINT) as guest_timestamp
      FROM "User" u
      INNER JOIN "Chat" c ON u.id = c."userId"
      WHERE u.email ~ '^guest-[0-9]+$' 
        AND CAST(SUBSTRING(u.email FROM 'guest-([0-9]+)') AS BIGINT) < ${cutoffTime}
      ORDER BY guest_timestamp ASC
      LIMIT ${CLEANUP_CONFIG.MAX_CLEANUP_PER_RUN - stats.totalDeleted}
    `);

    stats.totalFound += oldActiveGuests.length;

    if (oldActiveGuests.length > 0) {
      console.log(
        `⏰ Encontrados ${oldActiveGuests.length} usuários antigos com atividade para limpeza`,
      );

      if (!dryRun) {
        // Deletar usuários antigos (precisa limpar chats/mensagens primeiro)
        for (
          let i = 0;
          i < oldActiveGuests.length;
          i += CLEANUP_CONFIG.BATCH_SIZE
        ) {
          const batch = oldActiveGuests.slice(i, i + CLEANUP_CONFIG.BATCH_SIZE);

          try {
            // Buscar chats dos usuários
            const userChats = await db.execute(sql`
              SELECT id FROM "Chat" 
              WHERE "userId" IN (${sql.join(
                batch.map((u) => sql`${u.id}`),
                sql`, `,
              )})
            `);

            const chatIds = userChats.map((c) => c.id);

            if (chatIds.length > 0) {
              // Deletar votes primeiro
              await db.execute(sql`
                DELETE FROM "Vote_v2" 
                WHERE "chatId" IN (${sql.join(
                  chatIds.map((id) => sql`${id}`),
                  sql`, `,
                )})
              `);

              // Deletar mensagens
              await db.execute(sql`
                DELETE FROM "Message_v2" 
                WHERE "chatId" IN (${sql.join(
                  chatIds.map((id) => sql`${id}`),
                  sql`, `,
                )})
              `);

              // Deletar chats
              await db.execute(sql`
                DELETE FROM "Chat" 
                WHERE "userId" IN (${sql.join(
                  batch.map((u) => sql`${u.id}`),
                  sql`, `,
                )})
              `);
            }

            // Deletar usuários
            const result = await db.execute(sql`
              DELETE FROM "User" 
              WHERE id IN (${sql.join(
                batch.map((u) => sql`${u.id}`),
                sql`, `,
              )})
            `);

            const deleted = result.count || 0;
            stats.oldDeleted += deleted;
            stats.totalDeleted += deleted;
          } catch (error) {
            console.error(
              `❌ Erro ao deletar lote antigo ${i}-${i + batch.length}:`,
              error,
            );
            stats.errors++;
          }

          // Pausa maior para operações complexas
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } else {
        stats.oldDeleted = oldActiveGuests.length;
      }
    }

    console.log(`✅ Limpeza concluída:`, {
      ...stats,
      mode: dryRun ? 'SIMULAÇÃO' : 'REAL',
    });

    return stats;
  } catch (error) {
    console.error('💥 Erro durante limpeza automática:', error);
    stats.errors++;
    return stats;
  } finally {
    await client.end();
  }
}

/**
 * Função para ser chamada por um cron job
 */
export async function scheduleGuestCleanup(): Promise<void> {
  try {
    const stats = await cleanupGuestUsers({
      ttlHours: 24, // 24 horas para usuários com atividade
      inactiveTtlHours: 1, // 1 hora para usuários sem atividade
      dryRun: false,
    });

    // Log para monitoramento
    console.log(
      `🕒 [${new Date().toISOString()}] Limpeza automática executada:`,
      stats,
    );

    // Opcional: Enviar métricas para monitoramento
    if (stats.totalDeleted > 100) {
      console.warn(
        `⚠️ Limpeza removeu ${stats.totalDeleted} usuários - verificar se há problema`,
      );
    }
  } catch (error) {
    console.error('💥 Erro na limpeza agendada:', error);
  }
}

/**
 * Verificar se a limpeza é necessária (muitos guests acumulados)
 */
export async function isCleanupNeeded(): Promise<{
  needed: boolean;
  totalGuests: number;
  inactiveGuests: number;
}> {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is required');
  }
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    const [totalResult, inactiveResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*) as count FROM "User" WHERE email ~ '^guest-[0-9]+$'
      `),
      db.execute(sql`
        SELECT COUNT(*) as count
        FROM "User" u
        LEFT JOIN "Chat" c ON u.id = c."userId"
        WHERE u.email ~ '^guest-[0-9]+$' AND c.id IS NULL
      `),
    ]);

    const totalGuests = Number(totalResult[0].count);
    const inactiveGuests = Number(inactiveResult[0].count);

    // Limpeza necessária se:
    // - Mais de 500 guests total OU
    // - Mais de 100 guests inativos
    const needed = totalGuests > 500 || inactiveGuests > 100;

    return {
      needed,
      totalGuests,
      inactiveGuests,
    };
  } finally {
    await client.end();
  }
}
