require('dotenv').config();
const postgres = require('postgres');

const GUEST_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000002';
const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000003';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function fixMissingOrganizationId() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      '❌ POSTGRES_URL ou DATABASE_URL não encontrada nas variáveis de ambiente',
    );
    console.log(
      'Verifique se o arquivo .env.local existe e contém POSTGRES_URL',
    );
    return;
  }

  console.log(
    '🔗 Conectando ao banco:',
    databaseUrl.replace(/\/\/.*@/, '//***:***@'),
  );

  const sql = postgres(databaseUrl);

  try {
    // Testar conexão
    await sql`SELECT 1`;
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar e criar organizações padrão
    console.log('\n🏢 Criando organizações padrão...');

    // Criar usuário sistema se não existir
    await sql`
      INSERT INTO "User" (id, email, plan, "isMasterAdmin", "messagesSent")
      VALUES (${SYSTEM_USER_ID}::uuid, 'system@humana.ai', 'pro', true, 0)
      ON CONFLICT (id) DO NOTHING
    `;

    // Criar organização Guest
    await sql`
      INSERT INTO "Organization" (id, name, description, "tenantConfig", values, teams, positions, "orgUsers", "userId")
      VALUES (${GUEST_ORGANIZATION_ID}::uuid, 'Guest Organization', 'Organização padrão para usuários guest e temporários', 
              ${'{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}'}::json,
              ${'[]'}::json, ${'[]'}::json, ${'[]'}::json, ${'[]'}::json, ${SYSTEM_USER_ID}::uuid)
      ON CONFLICT (id) DO NOTHING
    `;

    // Criar organização Padrão (Humana AI)
    await sql`
      INSERT INTO "Organization" (id, name, description, "tenantConfig", values, teams, positions, "orgUsers", "userId")
      VALUES (${DEFAULT_ORGANIZATION_ID}::uuid, 'Humana AI', 'Organização padrão para usuários cadastrados na plataforma Humana Companions', 
              ${'{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}'}::json,
              ${'[{"name": "Colaboração", "description": "Trabalhar em equipe de forma eficiente"}, {"name": "Inovação", "description": "Buscar sempre novas soluções"}, {"name": "Qualidade", "description": "Entregar o melhor resultado possível"}]'}::json,
              ${'[{"id": "general", "name": "Geral", "description": "Equipe geral da organização"}]'}::json,
              ${'[{"id": "member", "name": "Membro", "description": "Membro da organização"}, {"id": "admin", "name": "Administrador", "description": "Administrador da organização"}]'}::json,
              ${'[]'}::json, ${SYSTEM_USER_ID}::uuid)
      ON CONFLICT (id) DO NOTHING
    `;

    console.log('✅ Organizações padrão criadas');

    // 2. Lista de tabelas que precisam da coluna organizationId
    const tables = [
      { name: 'Chat', hasUserId: true },
      { name: 'Document', hasUserId: true },
      { name: 'McpServer', hasUserId: true },
      { name: 'ProjectFolder', hasUserId: true },
      { name: 'Message_v2', hasUserId: false },
      { name: 'Vote_v2', hasUserId: false },
      { name: 'Suggestion', hasUserId: true },
      { name: 'Stream', hasUserId: false },
    ];

    for (const table of tables) {
      console.log(`\n🔧 Processando tabela ${table.name}...`);

      // Verificar se a coluna já existe
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${table.name} AND column_name = 'organizationId'
      `;

      if (columnCheck.length === 0) {
        console.log(
          `  ➕ Adicionando coluna organizationId na tabela ${table.name}`,
        );

        try {
          // Adicionar coluna
          await sql.unsafe(
            `ALTER TABLE "${table.name}" ADD COLUMN "organizationId" UUID`,
          );

          // Adicionar foreign key constraint
          await sql.unsafe(`
            ALTER TABLE "${table.name}" 
            ADD CONSTRAINT "${table.name}_organizationId_fkey" 
            FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
          `);

          console.log(
            `  ✅ Coluna organizationId adicionada na tabela ${table.name}`,
          );
        } catch (error) {
          console.log(
            `  ⚠️ Erro ao adicionar coluna (pode já existir): ${error.message}`,
          );
        }
      } else {
        console.log(
          `  ✅ Coluna organizationId já existe na tabela ${table.name}`,
        );
      }

      // Atualizar registros sem organizationId
      const nullCount = await sql.unsafe(`
        SELECT COUNT(*) as count FROM "${table.name}" WHERE "organizationId" IS NULL
      `);

      if (Number.parseInt(nullCount[0].count) > 0) {
        console.log(
          `  🔄 Atualizando ${nullCount[0].count} registros sem organizationId...`,
        );

        if (table.hasUserId) {
          // Para tabelas com userId, determinar organização baseada no tipo de usuário
          await sql.unsafe(`
            UPDATE "${table.name}" 
            SET "organizationId" = CASE
              WHEN EXISTS (
                SELECT 1 FROM "User" u 
                WHERE u.id = "${table.name}"."userId" 
                AND u.email LIKE 'guest-%'
              ) THEN '${GUEST_ORGANIZATION_ID}'::uuid
              ELSE '${DEFAULT_ORGANIZATION_ID}'::uuid
            END
            WHERE "organizationId" IS NULL
          `);
        } else {
          // Para tabelas sem userId direto, usar organização padrão
          await sql.unsafe(`
            UPDATE "${table.name}" 
            SET "organizationId" = '${DEFAULT_ORGANIZATION_ID}'::uuid
            WHERE "organizationId" IS NULL
          `);
        }

        console.log(`  ✅ Registros atualizados na tabela ${table.name}`);
      }

      // Tornar a coluna NOT NULL se necessário
      try {
        const notNullCheck = await sql`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_name = ${table.name} AND column_name = 'organizationId'
        `;

        if (notNullCheck[0]?.is_nullable === 'YES') {
          await sql.unsafe(
            `ALTER TABLE "${table.name}" ALTER COLUMN "organizationId" SET NOT NULL`,
          );
          console.log(
            `  ✅ Coluna organizationId definida como NOT NULL na tabela ${table.name}`,
          );
        }
      } catch (error) {
        console.log(
          `  ⚠️ Erro ao definir NOT NULL (pode já estar configurado): ${error.message}`,
        );
      }
    }

    // 3. Verificação final
    console.log('\n📊 Verificação final...');
    const orgs =
      await sql`SELECT id, name FROM "Organization" ORDER BY "createdAt"`;
    console.log('🏢 Organizações disponíveis:', orgs);

    for (const table of tables) {
      const nullCheck = await sql.unsafe(`
        SELECT COUNT(*) as count FROM "${table.name}" WHERE "organizationId" IS NULL
      `);
      console.log(`💬 ${table.name} sem organizationId: ${nullCheck[0].count}`);
    }

    console.log('\n🎉 Correção concluída com sucesso!');
    console.log('\n📋 CONFIGURAÇÃO:');
    console.log(`👥 Organização Guest: ${GUEST_ORGANIZATION_ID}`);
    console.log(`🏛️ Organização Humana AI: ${DEFAULT_ORGANIZATION_ID}`);
  } catch (error) {
    console.error('❌ Erro ao corrigir organizationId:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sql.end();
  }
}

fixMissingOrganizationId();
