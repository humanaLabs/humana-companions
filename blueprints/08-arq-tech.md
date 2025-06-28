# 🔧 Blueprint: Arquitetura de Tecnologia

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

## 📦 BYOC via Parametrização de Endpoints

### **🔄 Estratégia: Configuration over Deployment**

Ao invés de deploy de containers na infraestrutura do cliente, utilizamos **configuração de endpoints** para integração total:

#### **🔌 Endpoint Configuration System**
```typescript
interface CustomerInfrastructure {
  organizationId: string
  
  // Database endpoints (cliente configura seus próprios)
  database: {
    primary: DatabaseEndpoint
    replica?: DatabaseEndpoint
    backup?: DatabaseEndpoint
  }
  
  // Storage endpoints (S3, Azure Blob, GCS do cliente)
  storage: {
    documents: StorageEndpoint
    attachments: StorageEndpoint
    exports: StorageEndpoint
  }
  
  // LLM endpoints (modelos do cliente ou APIs privadas)
  llm: {
    primary: LLMEndpoint
    fallback?: LLMEndpoint
    embedding: LLMEndpoint
  }
  
  // Monitoring endpoints (observabilidade do cliente)
  monitoring: {
    metrics: MonitoringEndpoint
    logs: LoggingEndpoint
    alerts: AlertingEndpoint
  }
  
  // Authentication endpoints (SSO do cliente)
  authentication: {
    sso: SSOEndpoint
    userDirectory: DirectoryEndpoint
  }
}

class BYOCManager {
  constructor(private configResolver: ConfigResolver) {}
  
  async validateCustomerInfrastructure(config: CustomerInfrastructure): Promise<ValidationResult> {
    const results = await Promise.all([
      this.validateDatabaseEndpoint(config.database.primary),
      this.validateStorageEndpoint(config.storage.documents),
      this.validateLLMEndpoint(config.llm.primary),
      this.validateMonitoringEndpoint(config.monitoring.metrics),
      this.validateSSOEndpoint(config.authentication.sso)
    ])
    
    return this.aggregateValidationResults(results)
  }
  
  async switchToCustomerInfrastructure(organizationId: string): Promise<void> {
    const config = this.configResolver.resolve<CustomerInfrastructure>('customerInfra', { organizationId })
    
    // Switch adapters para usar endpoints do cliente
    await this.databaseManager.switchToCustomerDatabase(config.database)
    await this.storageManager.switchToCustomerStorage(config.storage)
    await this.llmManager.switchToCustomerLLM(config.llm)
    await this.monitoringManager.switchToCustomerMonitoring(config.monitoring)
  }
}
```

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