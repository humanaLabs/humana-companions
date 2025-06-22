-- Primeiro, adicionar campos como nullable
ALTER TABLE "Companion" ALTER COLUMN "instruction" DROP NOT NULL;
ALTER TABLE "Companion" ADD COLUMN "role" text;
ALTER TABLE "Companion" ADD COLUMN "responsibilities" json;
ALTER TABLE "Companion" ADD COLUMN "expertises" json;
ALTER TABLE "Companion" ADD COLUMN "sources" json;
ALTER TABLE "Companion" ADD COLUMN "rules" json;
ALTER TABLE "Companion" ADD COLUMN "contentPolicy" json;
ALTER TABLE "Companion" ADD COLUMN "skills" json;
ALTER TABLE "Companion" ADD COLUMN "fallbacks" json;

-- Migrar dados existentes: converter instruction para nova estrutura
UPDATE "Companion" SET 
  "role" = 'Companion Personalizado',
  "responsibilities" = '["Auxiliar o usuário com base nas instruções fornecidas"]'::json,
  "expertises" = '[{"area": "Assistência Geral", "topics": ["Conversação", "Suporte"]}]'::json,
  "sources" = '[{"type": "Instruções do Usuário", "description": "Baseado nas instruções personalizadas fornecidas pelo usuário"}]'::json,
  "rules" = '[{"type": "tone", "description": "Seguir as instruções fornecidas pelo usuário"}]'::json,
  "contentPolicy" = '{"allowed": ["Assistência geral conforme instruções"], "disallowed": ["Conteúdo não especificado nas instruções"]}'::json
WHERE "role" IS NULL;

-- Agora tornar os campos obrigatórios NOT NULL
ALTER TABLE "Companion" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "Companion" ALTER COLUMN "responsibilities" SET NOT NULL;
ALTER TABLE "Companion" ALTER COLUMN "expertises" SET NOT NULL;
ALTER TABLE "Companion" ALTER COLUMN "sources" SET NOT NULL;
ALTER TABLE "Companion" ALTER COLUMN "rules" SET NOT NULL;
ALTER TABLE "Companion" ALTER COLUMN "contentPolicy" SET NOT NULL;