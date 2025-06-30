-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO - ORGANIZAÇÕES PADRÃO
-- ============================================================================
-- Este script cria as organizações necessárias para o funcionamento do sistema
-- Execute este script diretamente no banco para acelerar o processo

-- 1. ORGANIZAÇÃO GUEST (para usuários temporários)
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
  'guest-organization-id',
  'Guest Organization',
  'Organização padrão para usuários guest e temporários',
  '{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}',
  '[]',
  '[]',
  '[]', 
  '[]',
  'system',
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 2. ORGANIZAÇÃO PADRÃO (para usuários cadastrados sem organização específica)
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
  'default-organization-id',
  'Organização Padrão',
  'Organização padrão para usuários cadastrados que não possuem organização específica',
  '{"timezone": "America/Sao_Paulo", "language": "pt-BR", "llm_provider": "azure-openai", "default_model": "gpt-4o"}',
  '[{"name": "Colaboração", "description": "Trabalhar em equipe de forma eficiente"}, {"name": "Inovação", "description": "Buscar sempre novas soluções"}, {"name": "Qualidade", "description": "Entregar o melhor resultado possível"}]',
  '[{"id": "general", "name": "Geral", "description": "Equipe geral da organização"}]',
  '[{"id": "member", "name": "Membro", "description": "Membro da organização"}, {"id": "admin", "name": "Administrador", "description": "Administrador da organização"}]', 
  '[]',
  'system',
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 3. USUÁRIO SISTEMA (se não existir)
INSERT INTO "User" (
  "id",
  "email",
  "password",
  "isMasterAdmin",
  "plan",
  "messagesSent"
) VALUES (
  'system',
  'system@humana.ai',
  '$2b$10$dummy.hash.for.system.user.that.cannot.login',
  true,
  'pro',
  0
) ON CONFLICT ("id") DO NOTHING;

-- 4. VERIFICAÇÃO E RELATÓRIO
DO $$
DECLARE
    guest_count INTEGER;
    default_count INTEGER;
    system_count INTEGER;
BEGIN
    -- Contar organizações criadas
    SELECT COUNT(*) INTO guest_count FROM "Organization" WHERE "id" = 'guest-organization-id';
    SELECT COUNT(*) INTO default_count FROM "Organization" WHERE "id" = 'default-organization-id';
    SELECT COUNT(*) INTO system_count FROM "User" WHERE "id" = 'system';
    
    -- Relatório
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RELATÓRIO DE CONFIGURAÇÃO - ORGANIZAÇÕES PADRÃO';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Organização Guest: % (% = configurada)', 
        CASE WHEN guest_count > 0 THEN '✅ CRIADA' ELSE '❌ FALHOU' END, guest_count;
    RAISE NOTICE 'Organização Padrão: % (% = configurada)', 
        CASE WHEN default_count > 0 THEN '✅ CRIADA' ELSE '❌ FALHOU' END, default_count;
    RAISE NOTICE 'Usuário Sistema: % (% = configurado)', 
        CASE WHEN system_count > 0 THEN '✅ CRIADO' ELSE '❌ FALHOU' END, system_count;
    RAISE NOTICE '============================================================================';
    
    -- Instruções para uso
    RAISE NOTICE 'INSTRUÇÕES DE USO:';
    RAISE NOTICE '- Usuários GUEST sempre usam: guest-organization-id';
    RAISE NOTICE '- Usuários CADASTRADOS sem org específica usam: default-organization-id';
    RAISE NOTICE '- Use estas IDs no código para atribuir organizações automaticamente';
    RAISE NOTICE '============================================================================';
END $$; 