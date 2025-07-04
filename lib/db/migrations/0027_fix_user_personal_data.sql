-- 🔧 Migração: Correção de Dados Pessoais do Usuário
-- Remove organizationId de tabelas que devem ser pessoais (conversas, documentos)

-- 1. Chat - Conversas devem pertencer ao usuário, não à organização
ALTER TABLE "Chat" 
DROP COLUMN IF EXISTS "organizationId";

-- 2. Document - Documentos do Data Room devem pertencer ao usuário
ALTER TABLE "Document" 
DROP COLUMN IF EXISTS "organizationId";

-- 3. Message_v2 - Mensagens pertencem ao usuário via chat
ALTER TABLE "Message_v2" 
DROP COLUMN IF EXISTS "organizationId";

-- 4. Vote_v2 - Votos pertencem ao usuário via chat
ALTER TABLE "Vote_v2" 
DROP COLUMN IF EXISTS "organizationId";

-- 5. Stream - Streams pertencem ao usuário via chat
ALTER TABLE "Stream" 
DROP COLUMN IF EXISTS "organizationId";

-- 6. Suggestion - Sugestões pertencem ao usuário via documento
ALTER TABLE "Suggestion" 
DROP COLUMN IF EXISTS "organizationId";

-- 7. Adicionar updatedAt ao Chat se não existir (para auditoria)
ALTER TABLE "Chat" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- 8. Atualizar timestamps existentes
UPDATE "Chat" 
SET "updatedAt" = "createdAt" 
WHERE "updatedAt" IS NULL;

-- 9. Tornar updatedAt NOT NULL
ALTER TABLE "Chat" 
ALTER COLUMN "updatedAt" SET NOT NULL;

-- 10. Adicionar índices para performance (sem organizationId)
CREATE INDEX IF NOT EXISTS "idx_chat_user_created" ON "Chat" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_document_user_created" ON "Document" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_message_chat_created" ON "Message_v2" ("chatId", "createdAt" DESC);

-- 11. Remover índices antigos com organizationId se existirem
DROP INDEX IF EXISTS "idx_chat_org_user";
DROP INDEX IF EXISTS "idx_document_org_user";
DROP INDEX IF EXISTS "idx_message_org_chat"; 