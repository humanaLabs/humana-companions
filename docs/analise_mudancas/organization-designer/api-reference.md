# 🔌 API Reference - Organization Designer

## 📋 Visão Geral

Esta documentação apresenta todas as APIs REST implementadas para o sistema Organization Designer, incluindo endpoints, parâmetros, respostas e exemplos de uso.

## 🏢 Organizations API

### **📚 Endpoints Disponíveis**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/organizations` | Lista organizações do usuário |
| `POST` | `/api/organizations` | Cria nova organização |
| `GET` | `/api/organizations/[id]` | Busca organização específica |
| `PUT` | `/api/organizations/[id]` | Atualiza organização |
| `DELETE` | `/api/organizations/[id]` | Remove organização |
| `POST` | `/api/organizations/generate` | Gera organização com IA |
| `GET` | `/api/organizations/[id]/companions` | Lista companions da organização |

---

## 📝 Detalhamento dos Endpoints

### **1. GET /api/organizations**

Lista todas as organizações do usuário autenticado com estatísticas.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>` (via NextAuth)

#### **Resposta de Sucesso (200)**
```json
{
  "success": true,
  "data": [
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
      "values": [...],
      "teams": [...],
      "positions": [...],
      "orgUsers": [...],
      "userId": "user_456",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "companionsCount": 5
    }
  ]
}
```

#### **Resposta de Erro (401)**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### **2. POST /api/organizations**

Cria uma nova organização.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **Body**: JSON com dados da organização

#### **Corpo da Requisição**
```json
{
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
        "Questionar o status quo"
      ]
    }
  ],
  "teams": [
    {
      "id": "team_product",
      "name": "Produto",
      "description": "Equipe responsável pelo desenvolvimento",
      "members": ["user_123"]
    }
  ],
  "positions": [
    {
      "id": "pos_ceo",
      "title": "Chief Executive Officer",
      "description": "Responsável pela estratégia geral",
      "reports_to": null,
      "r_and_r": [
        "Definir visão estratégica",
        "Liderar equipe executiva"
      ],
      "companions": []
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

#### **Resposta de Sucesso (201)**
```json
{
  "success": true,
  "data": {
    "id": "org_789",
    "name": "Humana AI",
    "description": "Plataforma de aprendizado corporativo com IA",
    // ... dados completos da organização criada
    "createdAt": "2024-01-15T14:20:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  }
}
```

#### **Resposta de Erro (400)**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

### **3. GET /api/organizations/[id]**

Busca uma organização específica pelo ID.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **URL**: `id` - UUID da organização

#### **Resposta de Sucesso (200)**
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Humana AI",
    "description": "Plataforma de aprendizado corporativo com IA",
    // ... dados completos da organização
  }
}
```

#### **Resposta de Erro (404)**
```json
{
  "success": false,
  "error": "Organization not found"
}
```

#### **Resposta de Erro (403)**
```json
{
  "success": false,
  "error": "Access denied. You don't own this organization."
}
```

---

### **4. PUT /api/organizations/[id]**

Atualiza uma organização existente.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **URL**: `id` - UUID da organização
- **Body**: JSON com dados atualizados

#### **Corpo da Requisição**
```json
{
  "name": "Humana AI - Atualizada",
  "description": "Nova descrição da plataforma",
  // ... outros campos que deseja atualizar
}
```

#### **Resposta de Sucesso (200)**
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Humana AI - Atualizada",
    "description": "Nova descrição da plataforma",
    // ... dados completos atualizados
    "updatedAt": "2024-01-15T16:45:00Z"
  }
}
```

---

### **5. DELETE /api/organizations/[id]**

Remove uma organização e todos os companions vinculados.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **URL**: `id` - UUID da organização

#### **Resposta de Sucesso (200)**
```json
{
  "success": true,
  "message": "Organization and 3 companions deleted successfully"
}
```

#### **Resposta de Erro (404)**
```json
{
  "success": false,
  "error": "Organization not found"
}
```

---

### **6. POST /api/organizations/generate**

Gera uma organização completa usando IA, incluindo companions para cada posição.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **Body**: JSON com dados básicos

#### **Corpo da Requisição**
```json
{
  "name": "Humana AI",
  "description": "Plataforma de aprendizado corporativo com IA",
  "orgChart": "CEO, CTO, Head de Produto, Desenvolvedor Senior, Designer UX"
}
```

#### **Resposta de Sucesso (201)**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org_456",
      "name": "Humana AI",
      "description": "Plataforma de aprendizado corporativo com IA",
      // ... estrutura organizacional completa gerada pela IA
    },
    "companions": [
      {
        "id": "comp_123",
        "name": "CEO.ai",
        "role": "Chief Executive Officer AI Assistant",
        "organizationId": "org_456",
        "positionId": "pos_ceo"
      },
      {
        "id": "comp_124",
        "name": "CTO.ai",
        "role": "Chief Technology Officer AI Assistant",
        "organizationId": "org_456",
        "positionId": "pos_cto"
      }
      // ... outros companions gerados
    ],
    "stats": {
      "organizationCreated": true,
      "companionsCreated": 5,
      "positionsCount": 5,
      "teamsCount": 3,
      "valuesCount": 4
    }
  }
}
```

#### **Resposta de Erro (400)**
```json
{
  "success": false,
  "error": "Invalid input data",
  "details": "Name, description and orgChart are required"
}
```

#### **Resposta de Erro (500)**
```json
{
  "success": false,
  "error": "Failed to generate organization",
  "details": "AI generation failed or invalid response format"
}
```

---

### **7. GET /api/organizations/[id]/companions**

Lista todos os companions vinculados a uma organização.

#### **Parâmetros**
- **Headers**: `Authorization: Bearer <token>`
- **URL**: `id` - UUID da organização

#### **Resposta de Sucesso (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "comp_123",
      "name": "CEO.ai",
      "role": "Chief Executive Officer AI Assistant",
      "organizationId": "org_456",
      "positionId": "pos_ceo",
      "linkedTeamId": "team_executive",
      "responsibilities": [
        "Definir estratégia organizacional",
        "Tomar decisões executivas"
      ],
      "expertises": [
        {
          "area": "Liderança Estratégica",
          "topics": ["Planejamento", "Visão de Negócio"]
        }
      ],
      "createdAt": "2024-01-15T14:20:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    }
    // ... outros companions
  ]
}
```

---

## 🔐 Autenticação e Autorização

### **Autenticação**
- Todas as APIs requerem autenticação via NextAuth
- Token JWT deve ser incluído no header `Authorization`
- Sessão deve estar ativa e válida

### **Autorização**
- Usuários só podem acessar organizações que criaram
- Campo `userId` é automaticamente preenchido com o usuário autenticado
- Companions gerados ficam vinculados ao criador da organização

### **Exemplo de Header**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 📊 Schema de Validação

### **Organization Schema (Zod)**
```typescript
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required"),
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

### **Generate Schema (Zod)**
```typescript
const generateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required"),
  orgChart: z.string().min(1, "Org chart is required"),
});
```

---

## 🚨 Códigos de Erro

| Código | Descrição | Situação |
|--------|-----------|----------|
| `200` | OK | Operação realizada com sucesso |
| `201` | Created | Recurso criado com sucesso |
| `400` | Bad Request | Dados inválidos ou malformados |
| `401` | Unauthorized | Token inválido ou expirado |
| `403` | Forbidden | Acesso negado ao recurso |
| `404` | Not Found | Recurso não encontrado |
| `422` | Unprocessable Entity | Erro de validação Zod |
| `500` | Internal Server Error | Erro interno do servidor |

---

## 📈 Exemplos de Uso

### **Criar Organização Simples**
```javascript
const response = await fetch('/api/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "Minha Empresa",
    description: "Uma empresa inovadora",
    tenantConfig: {
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      llm_provider: "azure-openai",
      default_model: "gpt-4o"
    },
    values: [],
    teams: [],
    positions: [],
    orgUsers: []
  })
});

const data = await response.json();
console.log('Organização criada:', data.data.id);
```

### **Gerar Organização com IA**
```javascript
const response = await fetch('/api/organizations/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "TechCorp",
    description: "Empresa de tecnologia focada em IA",
    orgChart: "CEO, CTO, Head de Produto, Desenvolvedor, Designer"
  })
});

const data = await response.json();
console.log('Organização gerada:', data.data.organization.id);
console.log('Companions criados:', data.data.companions.length);
```

### **Listar Organizações**
```javascript
const response = await fetch('/api/organizations', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
data.data.forEach(org => {
  console.log(`${org.name}: ${org.companionsCount} companions`);
});
```

### **Buscar Companions da Organização**
```javascript
const orgId = 'org_123';
const response = await fetch(`/api/organizations/${orgId}/companions`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Companions encontrados:', data.data.length);
```

---

## 🔄 Fluxo de Integração

### **Fluxo Completo de Criação**
```mermaid
sequenceDiagram
    participant C as Client
    participant API as Organizations API
    participant DB as Database
    participant AI as AI Service
    participant COMP as Companions API
    
    C->>API: POST /api/organizations/generate
    API->>AI: Generate organization structure
    AI-->>API: Complete organization JSON
    API->>DB: Save organization
    DB-->>API: Organization ID
    
    loop For each position
        API->>AI: Generate companion for position
        AI-->>API: Companion configuration
        API->>COMP: Create companion
        COMP->>DB: Save companion with organizationId
        DB-->>COMP: Companion ID
        COMP-->>API: Companion created
    end
    
    API-->>C: Organization + Companions created
```

### **Fluxo de Atualização**
```mermaid
sequenceDiagram
    participant C as Client
    participant API as Organizations API
    participant DB as Database
    
    C->>API: PUT /api/organizations/[id]
    API->>DB: Check ownership
    DB-->>API: User authorized
    API->>DB: Update organization
    DB-->>API: Updated data
    API-->>C: Updated organization
```

---

## 🧪 Testes da API

### **Teste de Criação**
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Org",
    "description": "Test organization",
    "tenantConfig": {
      "timezone": "America/Sao_Paulo",
      "language": "pt-BR",
      "llm_provider": "azure-openai",
      "default_model": "gpt-4o"
    },
    "values": [],
    "teams": [],
    "positions": [],
    "orgUsers": []
  }'
```

### **Teste de Geração com IA**
```bash
curl -X POST http://localhost:3000/api/organizations/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "AI Corp",
    "description": "AI-powered company",
    "orgChart": "CEO, CTO, Developer"
  }'
```

### **Teste de Listagem**
```bash
curl -X GET http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Notas de Implementação

### **Performance**
- Queries otimizadas com índices apropriados
- Paginação implementada para listas grandes
- Cache de sessão para reduzir consultas de autenticação

### **Segurança**
- Validação rigorosa de entrada com Zod
- Sanitização de dados JSON
- Verificação de ownership em todas as operações

### **Monitoramento**
- Logs estruturados para todas as operações
- Métricas de performance das APIs
- Alertas para erros de geração com IA

### **Rate Limiting**
- Endpoint `/generate` limitado a 5 requisições por minuto
- Outros endpoints limitados a 100 requisições por minuto
- Proteção contra abuse de recursos de IA 