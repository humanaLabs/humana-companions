#!/usr/bin/env node

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Conexão com o banco (usando as mesmas configurações do projeto)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrada no .env');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function setupOrganizations() {
  console.log('🚀 Configurando organizações padrão no banco...\n');

  try {
    // 1. Criar usuário sistema
    console.log('👤 Criando usuário sistema...');
    await sql`
      INSERT INTO "User" (
        "id",
        "email",
        "password",
        "isMasterAdmin",
        "plan",
        "messagesSent"
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'system@humana.ai',
        '$2b$10$dummy.hash.for.system.user.that.cannot.login',
        true,
        'pro',
        0
      ) ON CONFLICT ("id") DO NOTHING;
    `;
    console.log('✅ Usuário sistema criado/verificado\n');

    // 2. Criar organização guest
    console.log('👥 Criando organização GUEST...');
    await sql`
      INSERT INTO "Organization" (
        "id",
        "name", 
        "description",
        "tenantConfig",
        "values",
        "teams", 
        "positions",
        "orgUsers",
        "userId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        '00000000-0000-0000-0000-000000000002',
        'Guest Organization',
        'Organização padrão para usuários guest e temporários',
        '{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}',
        '[]',
        '[]',
        '[]', 
        '[]',
        '00000000-0000-0000-0000-000000000001',
        NOW(),
        NOW()
      ) ON CONFLICT ("id") DO NOTHING;
    `;
    console.log('✅ Organização GUEST criada/verificada');

    // 3. Criar organização padrão
    console.log('🏛️ Criando organização PADRÃO...');
    await sql`
      INSERT INTO "Organization" (
        "id",
        "name", 
        "description",
        "tenantConfig",
        "values",
        "teams", 
        "positions",
        "orgUsers",
        "userId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        '00000000-0000-0000-0000-000000000003',
        'Organização Padrão',
        'Organização padrão para usuários cadastrados que não possuem organização específica',
        '{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}',
        '[{"name": "Colaboração", "description": "Trabalhar em equipe de forma eficiente"}, {"name": "Inovação", "description": "Buscar sempre novas soluções"}, {"name": "Qualidade", "description": "Entregar o melhor resultado possível"}]',
        '[{"id": "general", "name": "Geral", "description": "Equipe geral da organização"}]',
        '[{"id": "member", "name": "Membro", "description": "Membro da organização"}, {"id": "admin", "name": "Administrador", "description": "Administrador da organização"}]', 
        '[]',
        '00000000-0000-0000-0000-000000000001',
        NOW(),
        NOW()
      ) ON CONFLICT ("id") DO NOTHING;
    `;
    console.log('✅ Organização PADRÃO criada/verificada\n');

    // 4. Verificar o que foi criado
    console.log('🔍 Verificando configuração...');
    const [guestOrg] =
      await sql`SELECT "id", "name" FROM "Organization" WHERE "id" = '00000000-0000-0000-0000-000000000002'`;
    const [defaultOrg] =
      await sql`SELECT "id", "name" FROM "Organization" WHERE "id" = '00000000-0000-0000-0000-000000000003'`;
    const [systemUser] =
      await sql`SELECT "id", "email" FROM "User" WHERE "id" = '00000000-0000-0000-0000-000000000001'`;

    console.log('📊 RELATÓRIO FINAL:');
    console.log('==========================================');
    console.log(`👥 Organização Guest: ${guestOrg ? '✅ ATIVA' : '❌ FALHOU'}`);
    console.log(
      `🏛️ Organização Padrão: ${defaultOrg ? '✅ ATIVA' : '❌ FALHOU'}`,
    );
    console.log(`👤 Usuário Sistema: ${systemUser ? '✅ ATIVO' : '❌ FALHOU'}`);
    console.log('==========================================\n');

    console.log('📋 INSTRUÇÕES DE USO:');
    console.log(
      '- Usuários GUEST sempre usam: 00000000-0000-0000-0000-000000000002',
    );
    console.log(
      '- Usuários CADASTRADOS sem org específica usam: 00000000-0000-0000-0000-000000000003',
    );
    console.log(
      '- Use estas IDs no código para atribuir organizações automaticamente',
    );
    console.log('\n🎉 Configuração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao configurar organizações:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Executar o script
setupOrganizations();
