-- Tabela para armazenar configurações de providers BYOC por organização
CREATE TABLE IF NOT EXISTS provider_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL, -- 'llm', 'storage', 'database', 'vector', 'email'
  provider_name VARCHAR(100) NOT NULL, -- 'openai', 'azure-openai', 's3', 'vercel-blob', etc.
  enabled BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Se é o provider primário para este tipo
  is_fallback BOOLEAN DEFAULT false, -- Se é usado como fallback
  priority INTEGER DEFAULT 100, -- Ordem de prioridade (menor = maior prioridade)
  
  -- Configurações criptografadas
  credentials JSONB NOT NULL DEFAULT '{}', -- API keys, secrets (encrypted)
  settings JSONB NOT NULL DEFAULT '{}', -- Configurações gerais (não-sensíveis)
  
  -- Metadados
  metadata JSONB DEFAULT '{}', -- Nome amigável, descrição, versão
  
  -- Health check tracking
  last_health_check TIMESTAMP,
  health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'unhealthy', 'unknown'
  health_details JSONB DEFAULT '{}',
  
  -- Migration tracking
  migration_status VARCHAR(20) DEFAULT 'stable', -- 'stable', 'migrating', 'failed'
  migration_details JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(organization_id, provider_type, provider_name),
  CHECK (provider_type IN ('llm', 'storage', 'database', 'vector', 'email')),
  CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  CHECK (migration_status IN ('stable', 'migrating', 'failed'))
);

-- Índices para performance
CREATE INDEX idx_provider_configurations_org_type ON provider_configurations(organization_id, provider_type);
CREATE INDEX idx_provider_configurations_enabled ON provider_configurations(organization_id, provider_type, enabled);
CREATE INDEX idx_provider_configurations_primary ON provider_configurations(organization_id, provider_type, is_primary) WHERE is_primary = true;
CREATE INDEX idx_provider_configurations_health ON provider_configurations(health_status, last_health_check);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_provider_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_provider_configurations_updated_at
  BEFORE UPDATE ON provider_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_configurations_updated_at();

-- Função para garantir apenas um provider primário por tipo/organização
CREATE OR REPLACE FUNCTION ensure_single_primary_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como primário, desmarcar outros
  IF NEW.is_primary = true THEN
    UPDATE provider_configurations 
    SET is_primary = false 
    WHERE organization_id = NEW.organization_id 
      AND provider_type = NEW.provider_type 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary
  BEFORE INSERT OR UPDATE ON provider_configurations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_provider();

-- Inserir configurações padrão para organizações existentes
INSERT INTO provider_configurations (
  organization_id, 
  provider_type, 
  provider_name, 
  enabled, 
  is_primary, 
  credentials, 
  settings,
  metadata
)
SELECT 
  o.id as organization_id,
  'llm' as provider_type,
  'openai' as provider_name,
  true as enabled,
  true as is_primary,
  '{}' as credentials, -- Será configurado via interface
  '{"model": "gpt-4", "temperature": 0.7}' as settings,
  '{"name": "OpenAI (Default)", "description": "Default OpenAI provider"}' as metadata
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configurations pc 
  WHERE pc.organization_id = o.id AND pc.provider_type = 'llm'
);

INSERT INTO provider_configurations (
  organization_id, 
  provider_type, 
  provider_name, 
  enabled, 
  is_primary, 
  credentials, 
  settings,
  metadata
)
SELECT 
  o.id as organization_id,
  'storage' as provider_type,
  'vercel-blob' as provider_name,
  true as enabled,
  true as is_primary,
  '{}' as credentials,
  '{"bucket": "default"}' as settings,
  '{"name": "Vercel Blob (Default)", "description": "Default blob storage provider"}' as metadata
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configurations pc 
  WHERE pc.organization_id = o.id AND pc.provider_type = 'storage'
);

COMMENT ON TABLE provider_configurations IS 'Armazena configurações de providers BYOC por organização com suporte a migration e fallback';
COMMENT ON COLUMN provider_configurations.credentials IS 'Credenciais sensíveis criptografadas (API keys, secrets)';
COMMENT ON COLUMN provider_configurations.is_primary IS 'Provider primário para este tipo na organização';
COMMENT ON COLUMN provider_configurations.is_fallback IS 'Provider usado como fallback em caso de falha do primário';
COMMENT ON COLUMN provider_configurations.priority IS 'Ordem de prioridade para seleção de providers (menor = maior prioridade)'; 