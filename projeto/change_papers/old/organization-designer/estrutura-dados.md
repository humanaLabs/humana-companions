# 🗄️ Estrutura de Dados - Organization Designer

## 📊 Schema do Banco de Dados

### **🏢 Tabela Organization**

```sql
CREATE TABLE "Organization" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text NOT NULL,
  "tenantConfig" json NOT NULL,
  values json NOT NULL,
  teams json NOT NULL,
  positions json NOT NULL,
  "orgUsers" json NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"(id),
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
```

### **🤖 Tabela Companion (Atualizada)**

```sql
ALTER TABLE "Companion" ADD COLUMN "organizationId" uuid REFERENCES "Organization"(id);
ALTER TABLE "Companion" ADD COLUMN "positionId" text;
ALTER TABLE "Companion" ADD COLUMN "linkedTeamId" text;
```

## 🏗️ Estrutura JSON da Organization

### **⚙️ TenantConfig**
```typescript
interface TenantConfig {
  timezone: string;           // "America/Sao_Paulo"
  language: string;           // "pt-BR"
  llm_provider: string;       // "azure-openai"
  default_model: string;      // "gpt-4o"
}
```

### **🎯 Values (Valores Organizacionais)**
```typescript
interface OrganizationalValue {
  name: string;               // "Inovação"
  description: string;        // "Buscamos sempre novas soluções"
  expected_behaviors: string[]; // ["Experimentar novas tecnologias", "Questionar status quo"]
}
```

### **👥 Teams (Equipes)**
```typescript
interface Team {
  id: string;                 // "team_product"
  name: string;               // "Produto"
  description: string;        // "Equipe responsável pelo desenvolvimento"
  members: string[];          // ["user_123", "user_456"]
}
```

### **💼 Positions (Posições/Cargos)**
```typescript
interface Position {
  id: string;                 // "pos_ceo"
  title: string;              // "Chief Executive Officer"
  description: string;        // "Responsável pela estratégia geral"
  reports_to: string | null;  // "pos_board" ou null
  r_and_r: string[];          // ["Definir visão estratégica", "Liderar equipe executiva"]
  companions: CompanionRef[]; // Companions vinculados a esta posição
}

interface CompanionRef {
  companion_id: string;       // "comp_ceo_ai"
  name: string;               // "CEO.ai"
  status: string;             // "active" | "inactive"
  linked_team_id: string;     // "team_executive"
}
```

### **👤 OrgUsers (Usuários da Organização)**
```typescript
interface OrgUser {
  user_id: string;            // UUID do usuário
  position_id: string;        // ID da posição
  role: string;               // "admin" | "member" | "viewer"
  permissions: string[];      // ["read_org", "write_org", "manage_companions"]
}
```

## 🔗 Relacionamentos

### **Organization ↔ Companion**
- **Tipo**: 1:N (Uma organização pode ter muitos Companions)
- **Chave**: `organizationId` na tabela Companion
- **Campos adicionais**:
  - `positionId`: ID da posição na estrutura JSON
  - `linkedTeamId`: ID da equipe vinculada

### **User ↔ Organization**
- **Tipo**: 1:N (Um usuário pode criar muitas organizações)
- **Chave**: `userId` na tabela Organization
- **Regra**: Usuário criador é automaticamente administrador

### **User ↔ Companion**
- **Tipo**: 1:N (Um usuário pode possuir muitos Companions)
- **Chave**: `userId` na tabela Companion
- **Regra**: Companions gerados ficam com o criador da organização

## 📝 Tipos TypeScript

### **Interface Principal**
```typescript
interface OrganizationStructure {
  id?: string;
  name: string;
  description: string;
  tenantConfig: TenantConfig;
  values: OrganizationalValue[];
  teams: Team[];
  positions: Position[];
  orgUsers: OrgUser[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### **Schema de Validação Zod**
```typescript
const organizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  tenantConfig: z.object({
    timezone: z.string(),
    language: z.string(),
    llm_provider: z.string(),
    default_model: z.string(),
  }),
  values: z.array(z.object({
    name: z.string(),
    description: z.string(),
    expected_behaviors: z.array(z.string()),
  })),
  teams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    members: z.array(z.string()),
  })),
  positions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    reports_to: z.string().nullable(),
    r_and_r: z.array(z.string()),
    companions: z.array(z.object({
      companion_id: z.string(),
      name: z.string(),
      status: z.string(),
      linked_team_id: z.string(),
    })),
  })),
  orgUsers: z.array(z.object({
    user_id: z.string(),
    position_id: z.string(),
    role: z.string(),
    permissions: z.array(z.string()),
  })),
});
```

## 📈 Exemplo de Dados

### **Organização Completa**
```json
{
  "id": "org_123",
  "name": "Humana AI",
  "description": "Plataforma de aprendizado corporativo com IA",
  "tenantConfig": {
    "timezone": "America/Sao_Paulo",
    "language": "pt-BR",
    "llm_provider": "azure-openai",
    "default_model": "gpt-4o"
  },
  "values": [
    {
      "name": "Inovação",
      "description": "Buscamos sempre novas soluções tecnológicas",
      "expected_behaviors": [
        "Experimentar novas tecnologias",
        "Questionar o status quo",
        "Propor melhorias contínuas"
      ]
    }
  ],
  "teams": [
    {
      "id": "team_product",
      "name": "Produto",
      "description": "Equipe responsável pelo desenvolvimento de produto",
      "members": ["user_123", "user_456"]
    }
  ],
  "positions": [
    {
      "id": "pos_ceo",
      "title": "Chief Executive Officer",
      "description": "Responsável pela estratégia geral da empresa",
      "reports_to": null,
      "r_and_r": [
        "Definir visão estratégica de longo prazo",
        "Liderar equipe executiva",
        "Representar empresa externamente"
      ],
      "companions": [
        {
          "companion_id": "comp_ceo_ai",
          "name": "CEO.ai",
          "status": "active",
          "linked_team_id": "team_executive"
        }
      ]
    }
  ],
  "orgUsers": [
    {
      "user_id": "user_123",
      "position_id": "pos_ceo",
      "role": "admin",
      "permissions": ["read_org", "write_org", "manage_companions"]
    }
  ]
}
```

## 🔄 Migrações Aplicadas

### **Migração 0011 - Tabela Organization**
- Criação da tabela Organization
- Campos JSON para estrutura flexível
- Relacionamento com User

### **Migração 0012 - Vinculação Companions**
- Adição de `organizationId` (FK para Organization)
- Adição de `positionId` (ID da posição na estrutura JSON)
- Adição de `linkedTeamId` (ID da equipe vinculada)

## 📊 Índices Recomendados

```sql
-- Índices para performance
CREATE INDEX idx_organization_user_id ON "Organization"("userId");
CREATE INDEX idx_companion_organization_id ON "Companion"("organizationId");
CREATE INDEX idx_companion_user_org ON "Companion"("userId", "organizationId");
```

## 🔍 Queries Principais

### **Buscar Organizações do Usuário**
```sql
SELECT * FROM "Organization" 
WHERE "userId" = $1 
ORDER BY "createdAt" DESC;
```

### **Buscar Companions da Organização**
```sql
SELECT * FROM "Companion" 
WHERE "organizationId" = $1 AND "userId" = $2 
ORDER BY "createdAt" DESC;
```

### **Estatísticas da Organização**
```sql
SELECT 
  o.*,
  COUNT(c.id) as companions_count
FROM "Organization" o
LEFT JOIN "Companion" c ON c."organizationId" = o.id
WHERE o."userId" = $1
GROUP BY o.id;
``` 