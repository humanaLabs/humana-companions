# 🔧 Blueprint: Arquitetura de Tecnologia

## 🎯 Estratégia de Produto: SaaS vs BYOC

### **☁️ SaaS Strategy (Free, Pro, Business)**
**Infraestrutura e Modelos Humana:**
- **Cloud Infrastructure:** Humana gerencia toda infraestrutura (AWS/Azure/GCP)
- **Shared LLM Models:** Modelos otimizados da Humana disponibilizados para consumo
- **Multi-tenancy:** Clientes compartilham infraestrutura com isolamento por organização
- **Managed Services:** Humana gerencia updates, scaling, monitoring, backup
- **Cost Efficiency:** Economia de escala compartilhada entre clientes
- **Fast Time-to-Market:** Deploy imediato, configuração mínima

**Target:** SME e organizações que priorizam velocidade e custo-benefício

### **🏢 BYOC Strategy (Enterprise Custom)**
**Governança e Infraestrutura do Cliente:**
- **Customer Infrastructure:** Cliente mantém dados em sua própria infra
- **Custom LLM Endpoints:** Cliente usa seus próprios modelos (Azure OpenAI, local, etc.)
- **Full Data Sovereignty:** Dados nunca saem do ambiente do cliente
- **Custom Compliance:** Atende regulamentações específicas (HIPAA, SOX, etc.)
- **Enterprise Governance:** Controle total sobre access, audit, retention
- **Configuration over Deployment:** Humana conecta via endpoints, não deploy containers

**Target:** Enterprise e setores altamente regulamentados (healthcare, finance)

### **🔄 Hybrid Approach**
**Configuração Flexível por Necessidade:**
- **Gradual Migration:** Cliente pode migrar gradualmente de SaaS para BYOC
- **Mixed Workloads:** Alguns companions em SaaS, outros em BYOC
- **Unified Interface:** Mesma experiência independente da infraestrutura
- **Seamless Management:** Gestão centralizada via Humana platform

---

## 🎯 Princípios Arquiteturais

### 1. **🔀 Agnóstico Tecnológico**
- **LLM Provider Agnostic:** Suporte a múltiplos provedores via interfaces padronizadas
- **Database Agnostic:** Abstração de persistência adaptável a diferentes SGBDs
- **Infrastructure Agnostic:** Deploy flexível (cloud, on-premises, hybrid)

### 2. **🏢 Enterprise-First**
- **Segurança:** Zero-trust, criptografia estratégica por mercado
- **Compliance:** LGPD, GDPR, SOC2, ISO27001 conforme necessidade
- **Auditabilidade:** Logs detalhados e rastreabilidade completa

### 3. **📈 Escalabilidade**
- **Horizontal Scaling:** Microserviços containerizados
- **Performance:** Cache inteligente e otimizações
- **Resilience:** Circuit breakers e graceful degradation

### 4. **⚙️ Parametrização Total**
- **Configuration over Convention:** Flexibilidade máxima via configuração
- **Adapter Pattern Everywhere:** Abstração de todos os providers
- **BYOC via Endpoints:** Integração com infraestrutura do cliente
- **Zero Vendor Lock-in:** Cliente escolhe tecnologias e providers

## 🏢 **Arquitetura Multi-Tenant: Segregação Total**

### **🔒 Isolamento de Dados por Organização**

#### **🚨 STATUS ATUAL vs DESEJADO**

**❌ Schema Atual (Parcial Multi-Tenancy):**
```typescript
// ✅ Totalmente Multi-Tenant
Companion: { organizationId: uuid }
Organization: { /* tenant root */ }
CompanionFeedback: via companion.organizationId
CompanionInteraction: via companion.organizationId

// ❌ Problemas de Isolamento (User-Scoped apenas)
User: { /* NO organizationId */ }
Chat: { userId, /* NO organizationId */ }
Document: { userId, /* NO organizationId */ }  
McpServer: { userId, /* NO organizationId */ }
ProjectFolder: { userId, /* NO organizationId */ }
Message: via chat.userId (indirect)
Vote: via chat.userId (indirect)
```

**✅ Schema Desejado (Full Multi-Tenancy):**
```typescript
// ALL objects MUST have organizationId for complete tenant isolation
interface MultiTenantEntity {
  organizationId: uuid  // MANDATORY for ALL entities
  /* entity-specific fields */
}

// User belongs to multiple organizations
User: { 
  primaryOrganizationId?: uuid  // Default organization
  /* user profile data */
}

UserOrganization: {
  userId: uuid
  organizationId: uuid
  role: string
  permissions: Permission[]
}

// ALL other entities MUST be organization-scoped
Chat: { organizationId: uuid, userId: uuid }
Document: { organizationId: uuid, userId: uuid }
McpServer: { organizationId: uuid, userId: uuid }
ProjectFolder: { organizationId: uuid, userId: uuid }
```

### **🎯 Modelos de Isolamento Multi-Tenant**

#### **🔧 1. Row-Level Security (SaaS Free/Pro)**
**Implementação atual - adequada para tiers básicos:**

```sql
-- RLS Policy Example
CREATE POLICY organization_isolation ON companions
FOR ALL TO app_user
USING (organizationId = current_setting('app.current_organization_id')::uuid);

-- Applied to ALL tables
CREATE POLICY organization_isolation ON chats
FOR ALL TO app_user  
USING (organizationId = current_setting('app.current_organization_id')::uuid);
```

#### **🏗️ 2. Schema-per-Tenant (Business Tier)**
**Para clientes que exigem isolamento de schema:**

```typescript
class SchemaPerTenantManager {
  async createTenantSchema(organizationId: uuid): Promise<void> {
    const schemaName = `org_${organizationId.replace('-', '_')}`
    
    // Create dedicated schema
    await this.db.execute(`CREATE SCHEMA ${schemaName}`)
    
    // Deploy ALL tables to tenant schema
    await this.deployTenantTables(schemaName)
    
    // Configure tenant connection
    await this.configureTenantConnection(organizationId, schemaName)
  }
  
  async routeToTenantSchema(organizationId: uuid): Promise<DatabaseConnection> {
    const schemaName = this.getTenantSchema(organizationId)
    return this.getConnectionForSchema(schemaName)
  }
}
```

#### **🗄️ 3. Database-per-Tenant (Enterprise/BYOC)**
**Para clientes enterprise com compliance requirements:**

```typescript
class DatabasePerTenantManager {
  async provisionTenantDatabase(organizationId: uuid): Promise<TenantDatabase> {
    const dbName = `humana_${organizationId.replace('-', '_')}`
    
    // Create dedicated database
    const tenantDb = await this.createDatabase(dbName)
    
    // Deploy schema and migrations
    await this.deployFullSchema(tenantDb)
    
    // Configure dedicated connection pool
    const connectionPool = await this.createConnectionPool(tenantDb)
    
    return {
      organizationId,
      databaseName: dbName,
      connectionPool,
      isolationLevel: 'database'
    }
  }
  
  async routeToTenantDatabase(organizationId: uuid): Promise<DatabaseConnection> {
    const tenantConfig = await this.getTenantConfig(organizationId)
    
    if (tenantConfig.isolationLevel === 'database') {
      return this.getTenantConnection(organizationId)
    }
    
    throw new Error(`Tenant ${organizationId} not configured for database isolation`)
  }
}
```

### **⚖️ Tenant-Aware Application Layer**

#### **🔒 Middleware de Isolamento**
**TODAS as requests devem ser tenant-aware:**

```typescript
class TenantIsolationMiddleware {
  async middleware(req: Request, res: Response, next: NextFunction) {
    // Extract organization context
    const organizationId = this.extractOrganizationId(req)
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' })
    }
    
    // Validate user access to organization
    const hasAccess = await this.validateUserOrganizationAccess(
      req.user.id, 
      organizationId
    )
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to organization' })
    }
    
    // Set tenant context for all database operations
    await this.setTenantContext(organizationId)
    
    // Continue with tenant-isolated context
    req.organizationId = organizationId
    next()
  }
  
  private async setTenantContext(organizationId: uuid): Promise<void> {
    // Set RLS context
    await this.db.execute(
      `SET app.current_organization_id = '${organizationId}'`
    )
    
    // Route to appropriate tenant isolation strategy
    const tenantConfig = await this.getTenantConfig(organizationId)
    
    if (tenantConfig.isolationType === 'schema') {
      await this.routeToTenantSchema(organizationId)
    } else if (tenantConfig.isolationType === 'database') {
      await this.routeToTenantDatabase(organizationId)
    }
    // RLS is default
  }
}
```

#### **📊 Tenant-Scoped APIs**
**TODAS as APIs devem respeitar isolamento organizacional:**

```typescript
// ❌ WRONG - User-scoped query
async getChats(userId: uuid) {
  return await db.select().from(chat).where(eq(chat.userId, userId))
}

// ✅ CORRECT - Tenant-scoped query  
async getChats(organizationId: uuid, userId: uuid) {
  return await db.select().from(chat).where(
    and(
      eq(chat.organizationId, organizationId),
      eq(chat.userId, userId)
    )
  )
}

// ✅ CORRECT - Tenant-aware companion query
async getCompanions(organizationId: uuid) {
  return await db.select().from(companion).where(
    eq(companion.organizationId, organizationId)
  )
}

// ✅ CORRECT - Cross-tenant prevention
async shareDocument(docId: uuid, targetUserId: uuid, requestingUserId: uuid) {
  const document = await this.getDocument(docId)
  const targetUser = await this.getUser(targetUserId)
  
  // Verify both users belong to same organization
  const sharedOrganizations = await this.getSharedOrganizations(
    requestingUserId, 
    targetUserId
  )
  
  if (!sharedOrganizations.includes(document.organizationId)) {
    throw new Error('Cross-tenant document sharing not allowed')
  }
  
  // Proceed with sharing...
}
```

### **🔍 Audit & Compliance per Tenant**

#### **📋 Tenant-Scoped Audit Trails**
**Logs e audit trails isolados por organização:**

```typescript
interface TenantAuditLog {
  organizationId: uuid
  userId: uuid
  action: string
  resourceType: string
  resourceId: uuid
  timestamp: Date
  ipAddress: string
  userAgent: string
  compliance: {
    regulation: 'LGPD' | 'GDPR' | 'HIPAA' | 'SOX'
    retentionPeriod: number
    encryptionRequired: boolean
  }
}

class TenantAuditManager {
  async logAction(
    organizationId: uuid,
    userId: uuid,
    action: AuditAction
  ): Promise<void> {
    const organization = await this.getOrganization(organizationId)
    
    const auditLog: TenantAuditLog = {
      organizationId,
      userId,
      ...action,
      timestamp: new Date(),
      compliance: this.getComplianceConfig(organization)
    }
    
    // Store in tenant-specific audit table/schema
    await this.storeTenantAuditLog(auditLog)
  }
  
  async getTenantAuditLogs(
    organizationId: uuid,
    filters: AuditFilters
  ): Promise<TenantAuditLog[]> {
    // NEVER allow cross-tenant audit access
    return await this.queryTenantAuditLogs(organizationId, filters)
  }
}
```

## 🤖 **Arquitetura Multi-Agent & Organizacional**

### **🏢 Organization-Companion Integration**

#### **🔗 Shared Data Architecture**
**Database Schema Design para estrutura organizacional compartilhada:**

```typescript
// Organization schema
interface Organization {
  id: uuid
  values: OrganizationalValues[]          // Valores compartilhados
  teams: TeamStructure[]                  // Estrutura de equipes
  positions: PositionHierarchy[]          // Hierarquia de posições
  policies: CompliancePolicy[]            // Políticas corporativas
  brandGuidelines: BrandAssets            // Guidelines de marca
  knowledgeBase: SharedKnowledgeBase      // Base de conhecimento comum
}

// Companion schema com integração organizacional
interface Companion {
  organizationId: uuid                    // Link para organização
  positionId: string                      // Posição na hierarquia
  linkedTeamId: string                    // Equipe vinculada
  inheritedPolicies: PolicyReference[]   // Políticas herdadas
  sharedCapabilities: CapabilityAccess[]  // Capacidades compartilhadas
  interCompanionAccess: AccessLevel[]     // Níveis de acesso entre companions
}
```

#### **⚙️ Policy Inheritance System**
**Companions herdam automaticamente políticas organizacionais:**

```typescript
class CompanionPolicyManager {
  async generateSystemPrompt(companionId: uuid): Promise<string> {
    const companion = await getCompanion(companionId)
    const organization = await getOrganization(companion.organizationId)
    
    // Inject organizational values and policies
    const prompt = this.mergePromptWithOrganizationalPolicies(
      companion.basePrompt,
      organization.values,
      organization.policies,
      organization.brandGuidelines
    )
    
    return prompt
  }
  
  private mergePromptWithOrganizationalPolicies(
    basePrompt: string,
    values: OrganizationalValues[],
    policies: CompliancePolicy[],
    brandGuidelines: BrandAssets
  ): string {
    // Auto-inject organizational context
    return `${basePrompt}
    
## ORGANIZATIONAL CONTEXT
### Company Values
${values.map(v => `- ${v.title}: ${v.description}`).join('\n')}

### Compliance Requirements  
${policies.map(p => `- ${p.regulation}: ${p.requirements}`).join('\n')}

### Brand Guidelines
- Voice & Tone: ${brandGuidelines.voiceAndTone}
- Communication Style: ${brandGuidelines.communicationStyle}
- Do's and Don'ts: ${brandGuidelines.restrictions.join(', ')}
`
  }
}
```

### **🔄 Multi-Agent Communication Framework**

#### **📡 Inter-Companion Communication Protocol**
**Companions se comunicam via message passing system:**

```typescript
interface CompanionMessage {
  fromCompanionId: uuid
  toCompanionId: uuid | 'broadcast'
  messageType: 'knowledge_share' | 'workflow_handoff' | 'collaboration_request'
  payload: any
  organizationId: uuid
  permissions: MessagePermission[]
}

class InterCompanionCommunication {
  async shareKnowledge(fromId: uuid, knowledge: KnowledgeAsset): Promise<void> {
    const eligibleCompanions = await this.getEligibleCompanions(fromId, knowledge.accessLevel)
    
    for (const companion of eligibleCompanions) {
      await this.sendMessage({
        fromCompanionId: fromId,
        toCompanionId: companion.id,
        messageType: 'knowledge_share',
        payload: knowledge,
        organizationId: companion.organizationId,
        permissions: this.calculatePermissions(fromId, companion.id)
      })
    }
  }
  
  async handoffWorkflow(fromId: uuid, toId: uuid, context: WorkflowContext): Promise<void> {
    const canHandoff = await this.validateHandoffPermissions(fromId, toId, context)
    
    if (canHandoff) {
      await this.transferWorkflowContext(fromId, toId, context)
      await this.notifyWorkflowTransfer(fromId, toId, context)
    }
  }
}
```

#### **🧠 Shared Knowledge & Skill Libraries**
**Sistema de compartilhamento de conhecimento e habilidades:**

```typescript
interface SharedCapability {
  id: uuid
  name: string
  type: 'skill' | 'knowledge' | 'integration' | 'tool'
  organizationId: uuid
  accessLevel: 'public' | 'team' | 'department' | 'restricted'
  sourceCompanionId: uuid
  beneficiaryCompanions: uuid[]
  usageMetrics: CapabilityUsage[]
}

class SharedCapabilityManager {
  async shareCapability(companionId: uuid, capability: Capability): Promise<void> {
    const companion = await getCompanion(companionId)
    const organization = await getOrganization(companion.organizationId)
    
    // Determine access level based on organizational hierarchy
    const accessLevel = this.determineAccessLevel(companion, capability)
    
    // Find eligible companions
    const eligibleCompanions = await this.findEligibleCompanions(
      organization.id, 
      accessLevel, 
      capability.type
    )
    
    // Create shared capability
    await this.createSharedCapability({
      ...capability,
      organizationId: organization.id,
      accessLevel,
      sourceCompanionId: companionId,
      beneficiaryCompanions: eligibleCompanions.map(c => c.id)
    })
  }
}
```

### **📊 Organizational Analytics & Intelligence**

#### **🔍 Cross-Companion Analytics**
**Analytics agregado através de todos os companions organizacionais:**

```typescript
interface OrganizationalIntelligence {
  organizationId: uuid
  totalCompanions: number
  knowledgeAssets: number
  sharedCapabilities: number
  collaborationMetrics: {
    interCompanionMessages: number
    workflowHandoffs: number
    knowledgeSharing: number
    collaborativeSessions: number
  }
  performanceMetrics: {
    averageResponseTime: number
    successRate: number
    userSatisfaction: number
    knowledgeUtilization: number
  }
  insights: {
    topSharedKnowledge: KnowledgeAsset[]
    mostActiveCompanions: CompanionMetrics[]
    collaborationPatterns: CollaborationPattern[]
    improvementOpportunities: Insight[]
  }
}
```

---

## 🏗️ Stack Tecnológico

### Frontend
```typescript
// Core Framework
Framework: "Next.js 15"
Language: "TypeScript"
Styling: "Tailwind CSS v4"
State: "Zustand + React Query"

// UI Components
Components: "Radix UI + shadcn/ui"
Icons: "Lucide React + ASCII/Emojis"
Animations: "Framer Motion"
Charts: "Recharts"

// Development
Bundler: "Turbopack"
Linting: "Biome"
Testing: "Playwright + Vitest"
```

### Backend
```typescript
// Core
Runtime: "Node.js 20+"
Framework: "Next.js API Routes"
Language: "TypeScript"
Validation: "Zod"

// Database
ORM: "Drizzle ORM"
Primary: "PostgreSQL" // Default
Support: ["MySQL", "SQLite", "MongoDB"]

// AI/LLM
SDK: "Vercel AI SDK"
Providers: ["OpenAI", "Azure", "Google", "Anthropic", "Local"]
Protocol: "MCP (Model Context Protocol)"

// Infrastructure
Containers: "Docker"
Orchestration: "Kubernetes"
Monitoring: "OpenTelemetry"
```

## 🔌 Arquitetura de Parametrização (Core Strategy)

### **🎯 Filosofia: Configuration over Convention**

A arquitetura é fundamentada na **parametrização total** para máxima flexibilidade:

#### **📋 Configuração por Camadas**
```typescript
interface ConfigurationLayer {
  global: GlobalConfig           // Padrões da plataforma
  organization: OrganizationConfig // Específico por organização
  team: TeamConfig              // Específico por equipe  
  user: UserConfig              // Específico por usuário
}

// Resolução hierárquica: User > Team > Organization > Global
class ConfigResolver {
  resolve<T>(configKey: string, context: ConfigContext): T {
    return this.user[configKey] || 
           this.team[configKey] || 
           this.organization[configKey] || 
           this.global[configKey]
  }
}
```

#### **🔌 Adapter Pattern para Tudo**
```typescript
// Database Adapter Pattern
interface DatabaseAdapter {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'custom'
  endpoint: string
  credentials: EncryptedCredentials
  connectionPool: ConnectionPoolConfig
  
  // Core operations
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
  migrate(): Promise<void>
  healthCheck(): Promise<HealthStatus>
}

// LLM Provider Adapter Pattern  
interface LLMAdapter {
  type: 'openai' | 'azure' | 'google' | 'anthropic' | 'local' | 'custom'
  endpoint: string
  apiKey: EncryptedApiKey
  modelConfig: ModelConfiguration
  
  // Core operations
  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>
  streamText(request: StreamTextRequest): AsyncIterable<TextStreamPart>
  calculateCost(usage: TokenUsage): Promise<CostCalculation>
  healthCheck(): Promise<HealthStatus>
}

// Storage Adapter Pattern
interface StorageAdapter {
  type: 's3' | 'azure-blob' | 'gcs' | 'local' | 'custom'
  endpoint: string
  credentials: EncryptedCredentials
  bucketConfig: BucketConfiguration
  
  // Core operations
  upload(file: File, path: string): Promise<UploadResult>
  download(path: string): Promise<File>
  delete(path: string): Promise<void>
  list(prefix: string): Promise<FileList>
  healthCheck(): Promise<HealthStatus>
}

// Monitoring Adapter Pattern
interface MonitoringAdapter {
  type: 'datadog' | 'newrelic' | 'grafana' | 'custom'
  endpoint: string
  credentials: EncryptedCredentials
  
  // Core operations
  recordMetric(metric: Metric): Promise<void>
  recordEvent(event: Event): Promise<void>
  createAlert(alert: AlertConfig): Promise<void>
  healthCheck(): Promise<HealthStatus>
}
```

### **⚙️ Vantagens da Estratégia de Parametrização**

#### **🚀 Para o Cliente:**
- **Zero vendor lock-in:** Escolha livre de providers
- **Cost optimization:** Uso de recursos existentes
- **Compliance control:** Dados na infraestrutura preferida
- **Easy migration:** Mudança de providers sem redeploy
- **Performance tuning:** Configuração específica por necessidade

#### **🏗️ Para a Humana:**
- **Easier deployment:** Sem necessidade de containers no cliente
- **Easier maintenance:** Updates centralizados
- **Market flexibility:** Atende qualquer mercado/regulamentação
- **Faster onboarding:** Configuração vs deployment
- **Reduced support:** Menos complexidade operacional

## 🔌 Arquitetura de Provedores (Atualizada)

### LLM Provider Abstraction

```typescript
interface LLMProvider {
  id: string
  name: string
  type: 'openai' | 'azure' | 'google' | 'anthropic' | 'local' | 'custom'
  
  // Configuração parametrizável
  config: LLMConfig
  credentials: ProviderCredentials
  endpoint: string // Suporte a endpoints customizados
  
  // Capacidades
  supportedModels: Model[]
  features: ProviderFeature[]
  
  // Limites
  rateLimit: RateLimit
  tokenLimits: TokenLimit
  costModel: CostModel
}

interface LLMConfig {
  endpoint?: string              // Endpoint customizável
  apiVersion?: string
  region?: string
  customHeaders?: Record<string, string>
  timeout?: number
  retryConfig?: RetryConfiguration
  fallbackProvider?: string      // Provider de fallback
}

// Implementação agnóstica com parametrização
class LLMManager {
  private providers: Map<string, LLMProvider>
  
  constructor(private configResolver: ConfigResolver) {}
  
  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    // Resolve configuração baseada no contexto
    const config = this.configResolver.resolve<LLMConfig>('llmConfig', request.context)
    const provider = this.getProvider(config.providerId)
    
    try {
      return await provider.generateText(request)
    } catch (error) {
      // Fallback strategy
      if (config.fallbackProvider) {
        const fallbackProvider = this.getProvider(config.fallbackProvider)
        return await fallbackProvider.generateText(request)
      }
      throw error
    }
  }
  
  async streamText(request: StreamTextRequest): AsyncIterable<TextStreamPart> {
    const config = this.configResolver.resolve<LLMConfig>('llmConfig', request.context)
    const provider = this.getProvider(config.providerId)
    return provider.streamText(request)
  }
}
```

### Database Abstraction (Aprimorada)

```typescript
interface DatabaseAdapter {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'custom'
  connection: ConnectionConfig
  
  // Core operations
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
  
  // Schema management
  migrate(): Promise<void>
  seed(): Promise<void>
  
  // Tenant-specific operations
  createTenantSchema(tenantId: string): Promise<void>
  switchTenant(tenantId: string): Promise<void>
  
  // Health and monitoring
  healthCheck(): Promise<HealthStatus>
  getMetrics(): Promise<DatabaseMetrics>
}

// Drizzle ORM com múltiplos drivers e parametrização
class DatabaseManager {
  private adapters: Map<string, DatabaseAdapter>
  
  constructor(private configResolver: ConfigResolver) {}
  
  async getAdapter(context: ConfigContext): Promise<DatabaseAdapter> {
    const config = this.configResolver.resolve<DatabaseConfig>('databaseConfig', context)
    
    if (!this.adapters.has(config.id)) {
      this.adapters.set(config.id, this.createAdapter(config))
    }
    
    return this.adapters.get(config.id)!
  }
  
  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'postgresql':
        return new PostgreSQLAdapter(config)
      case 'mysql':
        return new MySQLAdapter(config)
      case 'mongodb':
        return new MongoDBAdapter(config)
      case 'custom':
        return new CustomDatabaseAdapter(config)
      default:
        throw new Error(`Unsupported database type: ${config.type}`)
    }
  }
}
```

## 🏢 Multi-tenancy Architecture (Aprimorada)

### Tenant Isolation Models

#### 1. **Database Per Tenant** (Enterprise)
```typescript
interface TenantConfig {
  id: string
  name: string
  isolation: 'database' | 'schema' | 'row-level'
  
  // Configuração parametrizável de infraestrutura
  infrastructure: {
    database: DatabaseConfig
    storage: StorageConfig
    llm: LLMConfig
    monitoring: MonitoringConfig
  }
}

class TenantManager {
  constructor(private configResolver: ConfigResolver) {}
  
  async getTenantDatabase(tenantId: string): Promise<Database> {
    const config = this.configResolver.resolve<TenantConfig>('tenantConfig', { tenantId })
    return this.createDatabase(config.infrastructure.database)
  }
  
  async provisionTenant(tenantConfig: TenantConfig): Promise<void> {
    // Provisiona recursos baseado na configuração
    await this.provisionDatabase(tenantConfig.infrastructure.database)
    await this.provisionStorage(tenantConfig.infrastructure.storage)
    await this.configureLLM(tenantConfig.infrastructure.llm)
    await this.setupMonitoring(tenantConfig.infrastructure.monitoring)
  }
}
```

#### 2. **Schema Per Tenant** (Business)
```sql
-- Configuração dinâmica de schemas
-- Organização A (configuração via endpoint A)
CREATE SCHEMA org_a;
CREATE TABLE org_a.users (...);
CREATE TABLE org_a.companions (...);

-- Organização B (configuração via endpoint B)
CREATE SCHEMA org_b;
CREATE TABLE org_b.users (...);
CREATE TABLE org_b.companions (...);
```

#### 3. **Row-Level Security** (Starter)
```sql
-- RLS Policy (configuração padrão)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
  FOR ALL TO app_role
  USING (organization_id = current_setting('app.current_tenant')::uuid);
```

## 🔐 Segurança e Compliance (Realista)

### **🤔 Estratégia de Criptografia por Mercado**

#### **Análise Pragmática de Necessidade:**

**🔴 Criptografia OBRIGATÓRIA:**
- **Healthcare (HIPAA):** Dados médicos → Field-level encryption
- **Financial (PCI/SOX):** Dados financeiros → End-to-end encryption
- **Europa (GDPR):** Dados pessoais → Encryption by design

**🟡 Criptografia RECOMENDADA:**
- **Brasil (LGPD):** Dados sensíveis → Pseudonimização pode ser suficiente
- **Manufacturing:** Propriedade intelectual → Criptografia seletiva

**🟢 Criptografia OPCIONAL:**
- **General Business:** Dados não regulados → TLS + environment secrets

#### **Implementação Incremental:**

```typescript
// Fase 1: Mínimo Viável (1-2 semanas)
interface BasicEncryption {
  hashPasswords: boolean        // ✅ Já implementado via NextAuth
  encryptAPITokens: boolean     // ❌ Implementar para mcpServer
  secureEnvironmentVars: boolean // ❌ Implementar secrets management
}

// Fase 2: Compliance Básica (3-4 semanas) 
interface ComplianceEncryption extends BasicEncryption {
  fieldLevelEncryption: string[]  // Campos sensíveis específicos
  dataExportEncryption: boolean   // LGPD/GDPR data portability
  auditTrailEncryption: boolean   // Logs de auditoria
}

// Fase 3: Enterprise Full (8-12 semanas)
interface EnterpriseEncryption extends ComplianceEncryption {
  endToEndEncryption: boolean     // Apenas healthcare/financial
  customerManagedKeys: boolean    // Enterprise customer control
  zeroKnowledgeArchitecture: boolean // Para máxima segurança
}

class EncryptionService {
  constructor(private configResolver: ConfigResolver) {}
  
  async encrypt(data: string, context: ConfigContext): Promise<string> {
    const config = this.configResolver.resolve<EncryptionConfig>('encryptionConfig', context)
    
    // Aplica criptografia baseada na configuração
    if (config.level === 'basic') {
      return this.basicEncrypt(data, config.key)
    } else if (config.level === 'enterprise') {
      return this.enterpriseEncrypt(data, config.customerKey)
    }
    
    return data // Sem criptografia se não configurado
  }
}
```

### Authentication & Authorization (Parametrizável)

```typescript
// Next-Auth v5 Configuration com parametrização
export const authConfig = {
  providers: [
    // Internal (sempre disponível)
    CredentialsProvider({
      name: "credentials",
      credentials: { /* ... */ },
      authorize: async (credentials) => { /* ... */ }
    }),
    
    // Enterprise SSO (configurável por organização)
    ...this.configResolver.resolve<SSOProvider[]>('ssoProviders', context).map(provider => 
      this.createSSOProvider(provider)
    ),
  ],
  
  // Custom session strategy (parametrizável)
  session: { 
    strategy: "jwt",
    maxAge: this.configResolver.resolve<number>('sessionMaxAge', context) || 8 * 60 * 60
  },
  
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // Inject tenant and permissions baseado na configuração
      if (user) {
        const config = this.configResolver.resolve<AuthConfig>('authConfig', { userId: user.id })
        token.organizationId = user.organizationId
        token.permissions = await getPermissions(user.id, config)
      }
      return token
    }
  }
}
```

## 📦 BYOC Implementation: Enterprise Governance Strategy

### **🔄 Configuration over Deployment Approach**

**Para Clientes Enterprise (Custom Plans):**
BYOC permite que organizações enterprise mantenham controle total de governança através de **configuração de endpoints** da sua própria infraestrutura, ao invés de deployment de containers.

**Diferenciação Fundamental:**
- **SaaS Clients:** Consomem modelos e infraestrutura da Humana
- **BYOC Enterprise:** Humana se conecta à infraestrutura do cliente via endpoints

#### **🔌 Endpoint Configuration System**

**Customer Infrastructure Components:**
- **Database endpoints:** Cliente configura seus próprios databases (primary, replica, backup)
- **Storage endpoints:** S3, Azure Blob, GCS do cliente para documents, attachments, exports
- **LLM endpoints:** Modelos do cliente ou APIs privadas (primary, fallback, embedding)
- **Monitoring endpoints:** Observabilidade do cliente (metrics, logs, alerts)
- **Authentication endpoints:** SSO e user directory do cliente

**BYOC Management Process:**
- Validate customer infrastructure endpoints
- Switch adapters to use customer endpoints
- Monitor health of customer infrastructure
- Handle failover to backup endpoints when needed

#### **✅ Vantagens vs Container Deployment:**

**🚀 Deployment Advantages:**
- **Zero infrastructure management:** Cliente não gerencia containers
- **Instant deployment:** Configuração vs semanas de deployment
- **Easy maintenance:** Updates automáticos, zero downtime
- **Cost efficiency:** Cliente usa recursos existentes otimizados

**🔒 Security Advantages:**
- **Data sovereignty:** Dados nunca saem da infraestrutura do cliente
- **Network isolation:** Conectividade apenas via endpoints configurados
- **Access control:** Cliente mantém controle total de acesso
- **Compliance:** Conformidade com regulamentações específicas

**📈 Operational Advantages:**
- **Easier scaling:** Auto-scaling nos recursos do cliente
- **Better monitoring:** Integração com ferramentas existentes
- **Unified management:** Uma interface para toda infraestrutura
- **Disaster recovery:** Estratégias existentes do cliente

### **🏥 Health Monitoring & Validation**

```typescript
class EndpointHealthManager {
  async monitorCustomerEndpoints(organizationId: string): Promise<HealthReport> {
    const config = this.configResolver.resolve<CustomerInfrastructure>('customerInfra', { organizationId })
    
    const healthChecks = await Promise.all([
      this.checkDatabaseHealth(config.database.primary),
      this.checkStorageHealth(config.storage.documents),
      this.checkLLMHealth(config.llm.primary),
      this.checkMonitoringHealth(config.monitoring.metrics),
    ])
    
    return {
      organizationId,
      timestamp: new Date(),
      overall: this.calculateOverallHealth(healthChecks),
      details: healthChecks,
      recommendations: this.generateRecommendations(healthChecks)
    }
  }
  
  async handleEndpointFailure(endpoint: string, organizationId: string): Promise<void> {
    const config = this.configResolver.resolve<CustomerInfrastructure>('customerInfra', { organizationId })
    
    // Automatic failover to backup endpoints
    if (config.database.replica && endpoint === 'database') {
      await this.switchToDatabaseReplica(organizationId)
    }
    
    if (config.llm.fallback && endpoint === 'llm') {
      await this.switchToFallbackLLM(organizationId)
    }
    
    // Notify customer
    await this.notifyCustomerOfFailure(organizationId, endpoint)
  }
}
```

## 🔄 CI/CD Pipeline (Simplificado)

### GitHub Actions (Focused on SaaS Deployment)

```yaml
name: Deploy SaaS Platform

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Test adapter patterns
      run: npm run test:adapters
    
    - name: Test endpoint validation
      run: npm run test:endpoints

  deploy-saas:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Vercel
      run: |
        vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
    
    - name: Update configuration system
      run: |
        npm run update-configs
    
    - name: Validate customer endpoints
      run: |
        npm run validate-customer-endpoints

  # BYOC customers não precisam deploy - apenas configuração
  notify-byoc-customers:
    needs: deploy-saas
    runs-on: ubuntu-latest
    steps:
    - name: Notify BYOC customers of updates
      run: |
        node scripts/notify-byoc-updates.js
```

## 📊 Monitoring & Observability (Adapter-Based)

### OpenTelemetry Integration com Adapters

```typescript
class TelemetryManager {
  constructor(private configResolver: ConfigResolver) {}
  
  async initializeForOrganization(organizationId: string): Promise<void> {
    const config = this.configResolver.resolve<MonitoringConfig>('monitoringConfig', { organizationId })
    
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'humana-companions',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: organizationId,
      }),
      instrumentations: [
        new HttpInstrumentation(),
        new DatabaseInstrumentation(),
        new LLMInstrumentation(), // Custom
        new CustomEndpointInstrumentation(config.customEndpoints),
      ],
    })
    
    // Route telemetry para endpoints do cliente se configurado
    if (config.customerEndpoint) {
      sdk.configureExporter(new CustomExporter(config.customerEndpoint))
    }
    
    sdk.start()
  }
}

// Custom Metrics com routing baseado em configuração
class MetricsCollector {
  constructor(private configResolver: ConfigResolver) {}
  
  async recordMetric(metric: Metric, context: ConfigContext): Promise<void> {
    const config = this.configResolver.resolve<MonitoringConfig>('monitoringConfig', context)
    
    // Route para endpoint do cliente se configurado
    if (config.customerEndpoint) {
      await this.sendToCustomerEndpoint(metric, config.customerEndpoint)
    } else {
      await this.sendToDefaultEndpoint(metric)
    }
  }
}
```

---

**Status:** 🟢 Ativo - Atualizado com Estratégia de Parametrização
**Owner:** Engineering Team
**Última Review:** Janeiro 2025 
**Próxima Review:** Fevereiro 2025 