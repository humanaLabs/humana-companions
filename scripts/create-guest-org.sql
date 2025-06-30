-- Script para criar organização guest fixa
-- Execute este script diretamente no banco para acelerar o processo

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
) ON CONFLICT (id) DO NOTHING; 