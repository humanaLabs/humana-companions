#!/usr/bin/env node

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Conexão com o banco
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrada no .env');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixOrphanChats() {
  console.log('🔍 Verificando chats órfãos no banco...\n');

  try {
    // 1. Verificar chats sem organizationId
    console.log('📊 Verificando chats sem organizationId...');
    const orphanChats = await sql`
      SELECT 
        c."id",
        c."title", 
        c."userId",
        c."organizationId",
        c."visibility",
        c."createdAt"
      FROM "Chat" c 
      WHERE c."organizationId" IS NULL
      ORDER BY c."createdAt" DESC
      LIMIT 10;
    `;

    console.log(
      `📋 Encontrados ${orphanChats.length} chats órfãos (sem organizationId)\n`,
    );

    if (orphanChats.length > 0) {
      console.log('🗂️ Primeiros 10 chats órfãos encontrados:');
      orphanChats.forEach((chat, index) => {
        console.log(
          `  ${index + 1}. ID: ${chat.id.substring(0, 8)}... | Título: "${chat.title}" | Usuário: ${chat.userId.substring(0, 8)}... | Criado: ${chat.createdAt.toISOString()}`,
        );
      });
      console.log('');

      // 2. Corrigir chats órfãos atribuindo organizationId baseado no tipo de usuário
      console.log('🔧 Corrigindo chats órfãos...');

      // Para cada chat órfão, determinar qual organização usar
      for (const chat of orphanChats) {
        console.log(`  📝 Corrigindo chat ${chat.id.substring(0, 8)}...`);

        // Buscar dados do usuário
        const [user] = await sql`
          SELECT "id", "email", "plan"
          FROM "User" 
          WHERE "id" = ${chat.userId}
        `;

        if (!user) {
          console.log(
            `    ⚠️ Usuário ${chat.userId} não encontrado, removendo chat...`,
          );
          // Remover mensagens primeiro
          await sql`DELETE FROM "Message_v2" WHERE "chatId" = ${chat.id}`;
          await sql`DELETE FROM "Vote_v2" WHERE "chatId" = ${chat.id}`;
          await sql`DELETE FROM "Stream" WHERE "chatId" = ${chat.id}`;
          // Remover chat
          await sql`DELETE FROM "Chat" WHERE "id" = ${chat.id}`;
          console.log(`    🗑️ Chat órfão removido`);
          continue;
        }

        // Determinar organização baseada no tipo de usuário
        let organizationId;
        if (user.plan === 'guest' || user.email.startsWith('guest-')) {
          organizationId = '00000000-0000-0000-0000-000000000002'; // GUEST_ORGANIZATION_ID
          console.log(
            `    👥 Usuário guest detectado, usando organização guest`,
          );
        } else {
          // Verificar se usuário tem organização própria
          const [userOrg] = await sql`
            SELECT "id" FROM "Organization" 
            WHERE "userId" = ${user.id}
            ORDER BY "createdAt" ASC
            LIMIT 1
          `;

          if (userOrg) {
            organizationId = userOrg.id;
            console.log(
              `    🏢 Usando organização própria do usuário: ${organizationId.substring(0, 8)}...`,
            );
          } else {
            organizationId = '00000000-0000-0000-0000-000000000003'; // DEFAULT_ORGANIZATION_ID
            console.log(
              `    🏛️ Usuário sem organização, usando organização padrão`,
            );
          }
        }

        // Atualizar chat com organizationId
        await sql`
          UPDATE "Chat" 
          SET "organizationId" = ${organizationId}
          WHERE "id" = ${chat.id}
        `;

        // Atualizar mensagens associadas
        await sql`
          UPDATE "Message_v2" 
          SET "organizationId" = ${organizationId}
          WHERE "chatId" = ${chat.id}
        `;

        // Atualizar votos associados
        await sql`
          UPDATE "Vote_v2" 
          SET "organizationId" = ${organizationId}
          WHERE "chatId" = ${chat.id}
        `;

        console.log(
          `    ✅ Chat corrigido com organizationId: ${organizationId.substring(0, 8)}...`,
        );
      }
    }

    // 3. Verificar mensagens órfãs (sem organizationId)
    console.log('\n📨 Verificando mensagens órfãs...');
    const orphanMessages = await sql`
      SELECT COUNT(*) as count
      FROM "Message_v2" m 
      WHERE m."organizationId" IS NULL
    `;

    const orphanMessageCount = orphanMessages[0].count;
    console.log(
      `📋 Encontradas ${orphanMessageCount} mensagens órfãs (sem organizationId)`,
    );

    if (orphanMessageCount > 0) {
      console.log('🔧 Corrigindo mensagens órfãs...');
      await sql`
        UPDATE "Message_v2" 
        SET "organizationId" = (
          SELECT c."organizationId" 
          FROM "Chat" c 
          WHERE c."id" = "Message_v2"."chatId"
        )
        WHERE "Message_v2"."organizationId" IS NULL
        AND EXISTS (
          SELECT 1 FROM "Chat" c 
          WHERE c."id" = "Message_v2"."chatId" 
          AND c."organizationId" IS NOT NULL
        )
      `;
      console.log('✅ Mensagens órfãs corrigidas');
    }

    // 4. Verificar votos órfãos
    console.log('\n🗳️ Verificando votos órfãos...');
    const orphanVotes = await sql`
      SELECT COUNT(*) as count
      FROM "Vote_v2" v 
      WHERE v."organizationId" IS NULL
    `;

    const orphanVoteCount = orphanVotes[0].count;
    console.log(
      `📋 Encontrados ${orphanVoteCount} votos órfãos (sem organizationId)`,
    );

    if (orphanVoteCount > 0) {
      console.log('🔧 Corrigindo votos órfãos...');
      await sql`
        UPDATE "Vote_v2" 
        SET "organizationId" = (
          SELECT c."organizationId" 
          FROM "Chat" c 
          WHERE c."id" = "Vote_v2"."chatId"
        )
        WHERE "Vote_v2"."organizationId" IS NULL
        AND EXISTS (
          SELECT 1 FROM "Chat" c 
          WHERE c."id" = "Vote_v2"."chatId" 
          AND c."organizationId" IS NOT NULL
        )
      `;
      console.log('✅ Votos órfãos corrigidos');
    }

    // 5. Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('==========================================');

    const finalOrphanChats = await sql`
      SELECT COUNT(*) as count FROM "Chat" WHERE "organizationId" IS NULL
    `;
    console.log(`🗂️ Chats órfãos restantes: ${finalOrphanChats[0].count}`);

    const finalOrphanMessages = await sql`
      SELECT COUNT(*) as count FROM "Message_v2" WHERE "organizationId" IS NULL
    `;
    console.log(
      `📨 Mensagens órfãs restantes: ${finalOrphanMessages[0].count}`,
    );

    const finalOrphanVotes = await sql`
      SELECT COUNT(*) as count FROM "Vote_v2" WHERE "organizationId" IS NULL
    `;
    console.log(`🗳️ Votos órfãos restantes: ${finalOrphanVotes[0].count}`);

    console.log('==========================================');
    console.log('\n🎉 Limpeza de chats órfãos concluída!');
  } catch (error) {
    console.error('❌ Erro ao corrigir chats órfãos:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Executar o script
fixOrphanChats();
