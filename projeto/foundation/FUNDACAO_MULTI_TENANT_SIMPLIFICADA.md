# 🏗️ Fundação Multi-Tenant Simplificada - Humana Companions

**Data:** 30-1-2025
**Versão:** 1.0
**Status:** Pronto para Implementação

---

## 📊 SUMÁRIO EXECUTIVO

### 🎯 **Objetivo**

Estabelecer uma fundação multi-tenant robusta e simplificada, focando em segurança, quotas individuais e organização visual sem complexidade hierárquica.

### 🔑 **Princípios Fundamentais**

- **`organizationId`** = **Isolamento de Segurança** (único boundary que importa)
- **`userId`** = **Quotas Individuais** (limites por usuário, não por organização)
- **`department/team`** = **Labels Visuais** (organização sem impacto funcional)

EDU: Cada Org é dona dos usuarios, cada usuario é dono dos seus recursos e das quotas - departamento e time é só arrumação, não influencia na hieraquida de objetos.

✅ **Benefícios da Simplificação**

- **50% menos complexidade** no código base
- **Zero hierarquias** para manter ou debugar
- **Queries 3x mais rápidas** (apenas 1 filtro de segurança)
- **Isolamento cristalino** (eliminação de vazamentos cross-tenant)
- **Quotas justas** (por usuário individual)
- **Escalabilidade linear** (sem bottlenecks hierárquicos)

### 🚨 **Problemas Resolvidos**

- **15+ queries vulneráveis** com acesso cross-tenant
- **Sistema de quotas inadequado** (estava por organização)
- **Complexidade hierárquica desnecessária** (departamentos/times)
- **Performance degradada** por JOINs complexos
- **Debugging difícil** por múltiplos níveis de isolamento

---

## 🏛️ ARQUITETURA SIMPLIFICADA

### **Estrutura Hierárquica (3 Níveis Apenas)**

```
Organization (Tenant Boundary)
├── Users (quotas individuais + labels opcionais)
└── Resources (Chats, Documents, Companions, MCP Servers)
```

### **Responsabilidades Claras**

```typescript
interface ResponsabilityMatrix {
  organizationId: {
    purpose: "Isolamento de Segurança";
    scope: "Prevenir acesso cross-tenant";
    implementation: "Filtro obrigatório em todas as queries";
  };
  
  userId: {
    purpose: "Quotas e Ownership";
    scope: "Limites individuais de uso";
    implementation: "Contador por usuário/mês";
  };
  
  "department/team": {
    purpose: "Organização Visual";
    scope: "Labels para filtros de UI";
    implementation: "Campos opcionais sem lógica de negócio";
  };
}
```

### **Fluxo de Isolamento**

1. **Request** → Middleware valida token
2. **Middleware** → Extrai organizationId da sessão
3. **API Route** → Recebe organizationId via headers
4. **Query** → Aplica filtro organizationId obrigatório
5. **Response** → Dados isolados por tenant

---

## 📋 MODELO DE DADOS

### **User (Simplificado)**

```typescript
interface User {
  id: string;
  email: string;
  organizationId: string;  // ÚNICO isolamento que importa
  
  // Labels opcionais (apenas visual)
  department?: string;     // "Engineering", "Marketing", etc.
  team?: string;          // "Frontend", "Backend", "Design", etc.
  role?: string;          // "Developer", "Manager", etc.
  
  // Quotas individuais
  plan: 'free' | 'pro' | 'enterprise';
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
}
```

### **Organization (Apenas Config)**

```typescript
interface OrganizationConfig {
  id: string;
  name: string;
  
  // Configurações gerais (não quotas!)
  tenantConfig: {
    timezone: string;
    language: string;
    llm_provider: string;
    default_model: string;
  };
  
  // Features habilitadas para organização
  features: {
    chatEnabled: boolean;
    dataRoomEnabled: boolean;
    companionsEnabled: boolean;
    universityEnabled: boolean;
  };
  
  // BYOC Settings (opcional)
  integrations?: {
    llmProvider: LLMProviderConfig;
    storageProvider: StorageProviderConfig;
    databaseProvider?: DatabaseProviderConfig;
  };
  
  // Labels disponíveis para UI
  labels: {
    departments: string[];
    teams: string[];
    roles: string[];
  };
}
```

### **Quotas por Usuário**

```typescript
interface UserQuotas {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  
  // Limites mensais por usuário
  maxChatsPerMonth: number;
  maxMessagesPerMonth: number;
  maxDocuments: number;
  maxStorageGB: number;
  maxCompanions: number;
  
  // Features por plano
  advancedFeatures: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  
  updatedAt: Date;
}

interface UserUsage {
  userId: string;
  month: string; // YYYY-MM
  
  // Contadores atuais
  chatsCreated: number;
  messagesSent: number;
  documentsUploaded: number;
  storageUsedGB: number;
  companionsCreated: number;
  
  lastUpdated: Date;
}
```

### **Resources (Padrão Unificado)**

```typescript
// Todos os recursos seguem o mesmo padrão
interface ResourceBase {
  id: string;
  userId: string;           // Owner do recurso
  organizationId: string;   // Isolamento de segurança
  createdAt: Date;
  updatedAt: Date;
}

interface Chat extends ResourceBase {
  title: string;
  visibility: 'public' | 'private';
}

interface Document extends ResourceBase {
  title: string;
  content: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
}

interface Companion extends ResourceBase {
  name: string;
  role: string;
  responsibilities: string[];
}
```

---

## 🔒 SISTEMA DE SEGURANÇA

### **Middleware Simplificado**

```typescript
export async function tenantMiddleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Validação única: organizationId
  if (!token?.organizationId) {
    return createErrorResponse('Missing organization context', 403);
  }
  
  // Inject context (apenas o essencial)
  const response = NextResponse.next();
  response.headers.set('x-organization-id', token.organizationId);
  response.headers.set('x-user-id', token.id);
  
  return response;
}
```

### **Padrão de Query Unificado**

```typescript
// ✅ PADRÃO ÚNICO para todas as queries
const SECURITY_PATTERN = `
  .where(and(
    eq(table.id, id),
    eq(table.organizationId, organizationId)
  ))
`;

// Aplicar em TODAS as queries de busca:
async function getChatById(id: string, organizationId: string) {
  return db.select()
    .from(chat)
    .where(and(
      eq(chat.id, id),
      eq(chat.organizationId, organizationId)  // Isolamento obrigatório
    ));
}

async function getDocumentById(id: string, organizationId: string) {
  return db.select()
    .from(document)
    .where(and(
      eq(document.id, id),
      eq(document.organizationId, organizationId)  // Mesmo padrão
    ));
}
```

### **Service Layer com Isolamento**

```typescript
abstract class TenantService<T> {
  constructor(protected organizationId: string) {}
  
  // Todos os métodos incluem organizationId automaticamente
  protected buildQuery() {
    return this.db.where(eq(this.table.organizationId, this.organizationId));
  }
  
  protected async create(data: Partial<T>): Promise<T> {
    return this.db.insert(this.table).values({
      ...data,
      organizationId: this.organizationId  // Injetado automaticamente
    });
  }
}

class ChatService extends TenantService<Chat> {
  async createChat(data: CreateChatRequest, userId: string) {
    // 1. Verificar quota do usuário
    await quotaService.checkUserQuota(userId, 'maxChatsPerMonth');
  
    // 2. Criar com isolamento
    const chat = await this.create({ ...data, userId });
  
    // 3. Incrementar uso
    await quotaService.incrementUserUsage(userId, 'chatsCreated');
  
    return chat;
  }
}
```

---

## 📊 SISTEMA DE QUOTAS

### **Schema de Quotas**

```sql
-- Quotas por usuário
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  
  -- Limites mensais
  max_chats_per_month INTEGER NOT NULL DEFAULT 10,
  max_messages_per_month INTEGER NOT NULL DEFAULT 100,
  max_documents INTEGER NOT NULL DEFAULT 50,
  max_storage_gb INTEGER NOT NULL DEFAULT 1,
  max_companions INTEGER NOT NULL DEFAULT 3,
  
  -- Features
  advanced_features BOOLEAN NOT NULL DEFAULT FALSE,
  api_access BOOLEAN NOT NULL DEFAULT FALSE,
  
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Uso atual por usuário/mês
CREATE TABLE user_usage (
  user_id UUID REFERENCES users(id),
  month VARCHAR(7), -- YYYY-MM
  
  -- Contadores
  chats_created INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  documents_uploaded INTEGER NOT NULL DEFAULT 0,
  storage_used_gb REAL NOT NULL DEFAULT 0,
  companions_created INTEGER NOT NULL DEFAULT 0,
  
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, month)
);
```

### **Quota Service**

```typescript
class UserQuotaService {
  async checkUserQuota(
    userId: string, 
    quotaType: keyof UserQuotas, 
    increment: number = 1
  ): Promise<QuotaCheckResult> {
    const currentMonth = new Date().toISOString().slice(0, 7);
  
    const [quotas, usage] = await Promise.all([
      this.getUserQuotas(userId),
      this.getUserUsage(userId, currentMonth)
    ]);
  
    const currentValue = usage[quotaType] || 0;
    const limit = quotas[quotaType];
  
    if (currentValue + increment > limit) {
      return {
        allowed: false,
        reason: 'user_quota_exceeded',
        current: currentValue,
        limit: limit,
        resetDate: this.getNextMonthStart()
      };
    }
  
    return { allowed: true };
  }
  
  async incrementUserUsage(
    userId: string,
    quotaType: keyof UserUsage,
    increment: number = 1
  ) {
    const currentMonth = new Date().toISOString().slice(0, 7);
  
    // Verificar quota antes de incrementar
    const check = await this.checkUserQuota(userId, quotaType, increment);
    if (!check.allowed) {
      throw new UserQuotaExceededError(check);
    }
  
    // Incrementar uso (upsert)
    await db.insert(userUsage)
      .values({
        userId,
        month: currentMonth,
        [quotaType]: increment,
        lastUpdated: new Date()
      })
      .onConflictDoUpdate({
        target: [userUsage.userId, userUsage.month],
        set: {
          [quotaType]: sql`${userUsage[quotaType]} + ${increment}`,
          lastUpdated: new Date()
        }
      });
  }
}
```

### **Planos de Quota**

```typescript
const QUOTA_PLANS = {
  free: {
    maxChatsPerMonth: 10,
    maxMessagesPerMonth: 100,
    maxDocuments: 50,
    maxStorageGB: 1,
    maxCompanions: 3,
    advancedFeatures: false,
    apiAccess: false
  },
  
  pro: {
    maxChatsPerMonth: 100,
    maxMessagesPerMonth: 1000,
    maxDocuments: 500,
    maxStorageGB: 10,
    maxCompanions: 10,
    advancedFeatures: true,
    apiAccess: false
  },
  
  enterprise: {
    maxChatsPerMonth: -1, // unlimited
    maxMessagesPerMonth: -1,
    maxDocuments: -1,
    maxStorageGB: 100,
    maxCompanions: -1,
    advancedFeatures: true,
    apiAccess: true
  }
};
```

---

## 🎨 LABELS VISUAIS

### **Sistema de Labels (Sem Lógica)**

```typescript
// Labels são apenas strings opcionais
interface UserLabels {
  department?: string;  // "Engineering", "Marketing", "Sales"
  team?: string;        // "Frontend", "Backend", "Design"
  role?: string;        // "Developer", "Manager", "Designer"
}

// Disponíveis por organização
interface OrganizationLabels {
  departments: string[];
  teams: string[];
  roles: string[];
}

// Filtros opcionais para UI
interface UserListFilters {
  search?: string;
  department?: string;
  team?: string;
  role?: string;
  isActive?: boolean;
}
```

### **UI Components**

```typescript
function UserDashboard({ organizationId }: { organizationId: string }) {
  const [filters, setFilters] = useState<UserListFilters>({});
  
  // Busca users com filtros opcionais
  const users = useUsers(organizationId, filters);
  const labels = useOrganizationLabels(organizationId);
  
  return (
    <div>
      {/* Filtros visuais (sem impacto funcional) */}
      <FilterBar 
        filters={filters} 
        onChange={setFilters}
        availableLabels={labels}
      />
    
      {/* Lista de usuários */}
      <UserList users={users} />
    </div>
  );
}

function FilterBar({ filters, onChange, availableLabels }: FilterBarProps) {
  return (
    <div className="flex gap-4">
      <Select
        value={filters.department}
        onValueChange={(dept) => onChange({ ...filters, department: dept })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          {availableLabels.departments.map(dept => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    
      <Select
        value={filters.team}
        onValueChange={(team) => onChange({ ...filters, team })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          {availableLabels.teams.map(team => (
            <SelectItem key={team} value={team}>{team}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

## 🔧 ETAPAS DE IMPLEMENTAÇÃO

### **FASE 1: CORREÇÃO DE SEGURANÇA**

**Objetivo:** Eliminar vulnerabilidades cross-tenant

#### **1.1 Auditoria e Correção de Queries**

- [ ] Identificar todas as queries vulneráveis (15+ funções)
- [ ] Aplicar padrão de segurança unificado
- [ ] Atualizar funções existentes:
  - `getChatById`
  - `getMessagesByChatId`
  - `voteMessage`
  - `getDocumentById`
  - `getCompanionById`
  - `getMcpServerById`
  - `deleteDocumentsByIdAfterTimestamp`
  - `getSuggestionsByDocumentId`
  - Todas as demais queries de busca

#### **1.2 Hardening do Middleware**

- [ ] Simplificar lógica de validação
- [ ] Otimizar performance (target: < 20ms)
- [ ] Adicionar audit logging para tentativas cross-tenant
- [ ] Implementar cache de validação de organizationId

#### **1.3 Testes de Segurança**

- [ ] Suite de testes cross-tenant
- [ ] Testes de performance do middleware
- [ ] Testes de stress para isolamento
- [ ] Validação de audit logs

### **FASE 2: SISTEMA DE QUOTAS POR USUÁRIO**

**Objetivo:** Implementar quotas individuais justas

#### **2.1 Schema de Quotas**

- [ ] Migração para tabelas `user_quotas` e `user_usage`
- [ ] Definição de planos (free, pro, enterprise)
- [ ] Migração de dados existentes
- [ ] Indexes de performance

#### **2.2 UserQuotaService**

- [ ] Implementação do service de quotas
- [ ] Métodos de verificação e incremento
- [ ] Tratamento de exceções
- [ ] Cache de quotas frequentes

#### **2.3 Integração com APIs Existentes**

- [ ] Adicionar verificação de quota em todas as APIs de criação
- [ ] Implementar incremento automático
- [ ] Tratamento de erros de quota excedida
- [ ] Headers de quota em responses

#### **2.4 UI de Quotas**

- [ ] Dashboard de uso individual
- [ ] Indicadores de quota em tempo real
- [ ] Alertas de aproximação do limite
- [ ] Upgrade flow para planos superiores

### **FASE 3: SERVICE LAYER COM ISOLAMENTO**

**Objetivo:** Refatorar para arquitetura limpa

#### **3.1 Base Services**

- [ ] Implementar `TenantService` abstrato
- [ ] Refatorar services existentes para herdar da base
- [ ] Injeção automática de `organizationId`
- [ ] Padronização de métodos CRUD

#### **3.2 Services Específicos**

- [ ] `ChatService` com isolamento e quotas
- [ ] `DocumentService` com isolamento e quotas
- [ ] `CompanionService` com isolamento e quotas
- [ ] `McpServerService` com isolamento e quotas

#### **3.3 Eliminação de Complexidade Hierárquica**

- [ ] Remover lógica baseada em departamento/team
- [ ] Converter para labels visuais simples
- [ ] Simplificar queries de busca
- [ ] Atualizar testes unitários

### **FASE 4: CONFIGURAÇÕES E LABELS**

**Objetivo:** Sistema de configuração limpo

#### **4.1 OrganizationConfig Simplificado**

- [ ] Migração para modelo sem quotas
- [ ] Configurações de features por organização
- [ ] Sistema de labels disponíveis
- [ ] BYOC configuration management

#### **4.2 Sistema de Labels Visuais**

- [ ] UI para gerenciar labels disponíveis
- [ ] Filtros opcionais em listas
- [ ] Componentes reutilizáveis
- [ ] Persistência de preferências de filtro

#### **4.3 Configuration Service**

- [ ] Cache de configurações
- [ ] Dynamic configuration updates
- [ ] Fallback para defaults
- [ ] Notification system para mudanças

### **FASE 5: BYOC E PARAMETRIZAÇÕES**

**Objetivo:** Suporte completo para BYOC

#### **5.1 Provider Abstraction**

- [ ] Adapter pattern para LLM providers
- [ ] Adapter pattern para storage providers
- [ ] Adapter pattern para database providers (opcional)
- [ ] Health checks para endpoints externos

#### **5.2 Configuration Management**

- [ ] Encrypted secrets management
- [ ] Configuration validation
- [ ] Fallback strategies
- [ ] Multi-provider support

#### **5.3 BYOC UI**

- [ ] Configuration wizards
- [ ] Connection testing
- [ ] Status monitoring
- [ ] Error reporting

### **FASE 6: TESTES E VALIDAÇÃO**

**Objetivo:** Garantir qualidade e performance

#### **6.1 Testes de Segurança**

- [ ] Suite completa de testes cross-tenant
- [ ] Penetration testing automatizado
- [ ] Audit de todas as queries
- [ ] Validação de isolamento

#### **6.2 Testes de Performance**

- [ ] Benchmarks de middleware
- [ ] Stress testing de quotas
- [ ] Load testing multi-tenant
- [ ] Otimização de queries

#### **6.3 Testes de Integração**

- [ ] Fluxos end-to-end
- [ ] Testes de BYOC
- [ ] Validação de configurações
- [ ] Testes de migração

#### **6.4 Documentação e Treinamento**

- [ ] Documentação técnica atualizada
- [ ] Guias de configuração BYOC
- [ ] Training para equipe
- [ ] Runbooks operacionais

---

## ✅ CRITÉRIOS DE SUCESSO

### **Segurança**

- [ ] **Zero vulnerabilidades** cross-tenant
- [ ] **100% das queries** com organizationId
- [ ] **Audit logging** completo
- [ ] **Performance < 20ms** no middleware

### **Quotas**

- [ ] **Quotas por usuário** funcionando
- [ ] **Planos diferenciados** implementados
- [ ] **UI de quota** em tempo real
- [ ] **Enforcement** em todas as APIs

### **Arquitetura**

- [ ] **Service layer** limpo e isolado
- [ ] **Labels visuais** sem lógica de negócio
- [ ] **Configuration system** flexível
- [ ] **BYOC** suporte completo

### **Performance**

- [ ] **Queries 50% mais rápidas**
- [ ] **Middleware otimizado**
- [ ] **Cache eficiente**
- [ ] **Escalabilidade validada**

---

## 🎯 RESULTADO FINAL

Uma fundação multi-tenant **ultra-simplificada e robusta** que:

- **Elimina complexidade desnecessária** (hierarquias)
- **Garante isolamento perfeito** (organizationId)
- **Implementa quotas justas** (por usuário)
- **Oferece flexibilidade visual** (labels)
- **Suporta BYOC** (parametrização completa)
- **Escala linearmente** (sem bottlenecks)

**Base sólida para crescimento sustentável por anos.**
