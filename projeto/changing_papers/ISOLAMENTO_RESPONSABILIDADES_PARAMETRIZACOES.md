# 🏗️ Isolamento de Responsabilidades + Parametrizações Avançadas

**Data:** 30-1-2025  
**Versão:** 1.0  
**Status:** Especificação Técnica  
**Complementa:** `FUNDACAO_MULTI_TENANT_SIMPLIFICADA.md`

---

## 📊 SUMÁRIO EXECUTIVO

### 🎯 **Objetivo**
Definir arquitetura de serviços com isolamento de responsabilidades e sistema de parametrizações avançadas para suporte completo a BYOC (Bring Your Own Cloud).

### 🔑 **Princípios Arquiteturais**
- **Separação de Responsabilidades** (SRP) rigorosa
- **Dependency Injection** para flexibilidade
- **Provider Abstraction** para intercambialidade
- **Configuration-Driven** development
- **Fail-Safe Defaults** com fallbacks

### ✅ **Benefícios Esperados**
- **Testabilidade 90%+** (mocking fácil)
- **Flexibilidade BYOC** (troca de providers sem código)
- **Manutenção simplificada** (responsabilidades isoladas)
- **Deployment flexível** (configurações por ambiente)
- **Vendor independence** (sem lock-in)

---

## 🏛️ ARQUITETURA DE ISOLAMENTO

### **Camadas de Responsabilidade**
```
┌─────────────────────┐
│   API Routes        │ ← HTTP/REST interface
├─────────────────────┤
│   Application       │ ← Use cases e orchestration
├─────────────────────┤
│   Domain Services   │ ← Business logic
├─────────────────────┤
│   Repository        │ ← Data access abstraction
├─────────────────────┤
│   Infrastructure    │ ← External services (DB, LLM, Storage)
└─────────────────────┘
```

### **Service Layer Pattern**
```typescript
// Base abstrata para todos os services
abstract class TenantService<T> {
  constructor(
    protected organizationId: string,
    protected repository: Repository<T>,
    protected config: ServiceConfig
  ) {}
  
  protected async withTransaction<R>(
    operation: () => Promise<R>
  ): Promise<R> {
    // Transaction management
  }
  
  protected async checkPermissions(
    userId: string, 
    action: string
  ): Promise<void> {
    // Permission validation
  }
}
```

---

## 🔧 ISOLAMENTO POR DOMÍNIO

### **Domain Services**

#### **ChatDomainService**
```typescript
interface ChatDomainService {
  // Core chat operations
  createChat(request: CreateChatRequest): Promise<Chat>;
  addMessage(chatId: string, message: MessageRequest): Promise<Message>;
  generateResponse(chatId: string, context: ChatContext): Promise<AIResponse>;
  
  // Business rules
  validateChatAccess(userId: string, chatId: string): Promise<boolean>;
  calculateTokenUsage(messages: Message[]): number;
  applyChatPolicies(chat: Chat): Chat;
}

class ChatDomainServiceImpl implements ChatDomainService {
  constructor(
    private chatRepo: ChatRepository,
    private messageRepo: MessageRepository,
    private aiProvider: AIProvider,
    private quotaService: QuotaService
  ) {}
  
  async createChat(request: CreateChatRequest): Promise<Chat> {
    // 1. Validate quota
    await this.quotaService.checkUserQuota(request.userId, 'chats');
    
    // 2. Apply business rules
    const chat = this.applyChatPolicies(request);
    
    // 3. Persist
    const createdChat = await this.chatRepo.create(chat);
    
    // 4. Update quota
    await this.quotaService.incrementUsage(request.userId, 'chats', 1);
    
    return createdChat;
  }
}
```

#### **DocumentDomainService**
```typescript
interface DocumentDomainService {
  uploadDocument(file: FileUpload, userId: string): Promise<Document>;
  processDocument(docId: string): Promise<ProcessingResult>;
  searchDocuments(query: SearchQuery): Promise<SearchResult>;
  
  // Business logic
  validateFileType(file: FileUpload): boolean;
  extractText(file: FileUpload): Promise<string>;
  generateEmbeddings(text: string): Promise<number[]>;
}
```

#### **CompanionDomainService**
```typescript
interface CompanionDomainService {
  createCompanion(request: CreateCompanionRequest): Promise<Companion>;
  trainCompanion(companionId: string, data: TrainingData): Promise<void>;
  generateResponse(companionId: string, input: string): Promise<string>;
  
  // AI orchestration
  selectBestModel(companion: Companion, context: string): AIModel;
  combineResponses(responses: AIResponse[]): string;
  applyPersonality(response: string, companion: Companion): string;
}
```

### **Repository Pattern**
```typescript
interface Repository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findByUserId(userId: string, organizationId: string): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string, organizationId: string): Promise<void>;
}

class ChatRepository implements Repository<Chat> {
  constructor(private db: Database) {}
  
  async findById(id: string, organizationId: string): Promise<Chat | null> {
    return this.db.query(`
      SELECT * FROM chats 
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);
  }
  
  // Isolamento automático em todas as queries
  private addTenantFilter(query: QueryBuilder): QueryBuilder {
    return query.where('organization_id', this.organizationId);
  }
}
```

---

## ⚙️ SISTEMA DE PARAMETRIZAÇÕES

### **Configuration Architecture**
```typescript
interface ConfigurationSystem {
  // Hierarchical configuration
  global: GlobalConfig;           // System-wide defaults
  organization: OrganizationConfig; // Per-tenant overrides  
  user: UserConfig;              // Per-user preferences
  runtime: RuntimeConfig;        // Dynamic configurations
}

interface ConfigurationProvider {
  get<T>(path: string, defaultValue?: T): Promise<T>;
  set(path: string, value: any): Promise<void>;
  watch(path: string, callback: (value: any) => void): void;
  invalidate(path: string): Promise<void>;
}
```

### **BYOC Provider System**

#### **LLM Provider Abstraction**
```typescript
interface LLMProvider {
  name: string;
  generateResponse(input: LLMRequest): Promise<LLMResponse>;
  generateStream(input: LLMRequest): AsyncGenerator<LLMChunk>;
  listModels(): Promise<LLMModel[]>;
  validateConfig(config: LLMConfig): Promise<boolean>;
}

class OpenAIProvider implements LLMProvider {
  constructor(private config: OpenAIConfig) {}
  
  async generateResponse(input: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: input.model || this.config.defaultModel,
        messages: input.messages,
        temperature: input.temperature || 0.7
      })
    });
    
    return this.parseResponse(response);
  }
}

class AzureOpenAIProvider implements LLMProvider {
  constructor(private config: AzureConfig) {}
  
  async generateResponse(input: LLMRequest): Promise<LLMResponse> {
    // Azure-specific implementation
    const response = await fetch(this.config.endpoint, {
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      // Azure-specific request format
    });
    
    return this.parseResponse(response);
  }
}
```

#### **Storage Provider Abstraction**
```typescript
interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiry: number): Promise<string>;
}

class S3StorageProvider implements StorageProvider {
  constructor(private config: S3Config) {}
  
  async upload(file: File, path: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
      Body: file.buffer,
      ContentType: file.mimetype
    });
    
    await this.s3Client.send(command);
    return `https://${this.config.bucket}.s3.amazonaws.com/${path}`;
  }
}

class AzureBlobProvider implements StorageProvider {
  constructor(private config: AzureBlobConfig) {}
  
  async upload(file: File, path: string): Promise<string> {
    const blobClient = this.containerClient.getBlockBlobClient(path);
    await blobClient.upload(file.buffer, file.size);
    return blobClient.url;
  }
}
```

#### **Database Provider Abstraction**
```typescript
interface DatabaseProvider {
  query<T>(sql: string, params: any[]): Promise<T[]>;
  transaction<T>(operations: () => Promise<T>): Promise<T>;
  migrate(version: string): Promise<void>;
}

class PostgreSQLProvider implements DatabaseProvider {
  constructor(private config: PostgreSQLConfig) {}
  
  async query<T>(sql: string, params: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

### **Configuration Management**
```typescript
class ConfigurationService {
  constructor(
    private providers: Map<string, ConfigurationProvider>
  ) {}
  
  async get<T>(
    organizationId: string,
    path: string,
    defaultValue?: T
  ): Promise<T> {
    // Hierarchical lookup: org -> global -> default
    const orgValue = await this.getOrgConfig(organizationId, path);
    if (orgValue !== undefined) return orgValue;
    
    const globalValue = await this.getGlobalConfig(path);
    if (globalValue !== undefined) return globalValue;
    
    return defaultValue;
  }
  
  async getProviderConfig(
    organizationId: string,
    providerType: 'llm' | 'storage' | 'database'
  ): Promise<ProviderConfig> {
    const config = await this.get(organizationId, `providers.${providerType}`);
    return this.validateAndDecrypt(config);
  }
}
```

---

## 🔒 SECRETS MANAGEMENT

### **Encrypted Configuration**
```typescript
interface SecretManager {
  encrypt(value: string): Promise<string>;
  decrypt(encrypted: string): Promise<string>;
  rotateKey(organizationId: string): Promise<void>;
}

class SecretManagerImpl implements SecretManager {
  constructor(private kms: KMSProvider) {}
  
  async encrypt(value: string): Promise<string> {
    const key = await this.kms.getEncryptionKey();
    return this.encryptWithKey(value, key);
  }
  
  // Automatic key rotation
  async rotateKey(organizationId: string): Promise<void> {
    const newKey = await this.kms.generateKey();
    await this.reencryptAllSecrets(organizationId, newKey);
  }
}

interface OrganizationSecrets {
  llm: {
    openai?: { apiKey: string };
    azure?: { apiKey: string; endpoint: string };
    anthropic?: { apiKey: string };
  };
  storage: {
    s3?: { accessKey: string; secretKey: string };
    azure?: { connectionString: string };
  };
  database?: {
    connectionString: string;
  };
}
```

---

## 🔌 DEPENDENCY INJECTION

### **Service Container**
```typescript
interface ServiceContainer {
  register<T>(key: string, factory: () => T): void;
  registerSingleton<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
  resolveWithContext<T>(key: string, context: ServiceContext): T;
}

class ServiceContainerImpl implements ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  
  resolve<T>(key: string): T {
    const definition = this.services.get(key);
    if (!definition) throw new Error(`Service ${key} not registered`);
    
    return definition.factory();
  }
  
  resolveWithContext<T>(key: string, context: ServiceContext): T {
    // Context-aware resolution (e.g., organization-specific providers)
    const organizationId = context.organizationId;
    const configKey = `${key}:${organizationId}`;
    
    if (this.services.has(configKey)) {
      return this.resolve(configKey);
    }
    
    return this.resolve(key);
  }
}
```

### **Service Registration**
```typescript
// Service registration per organization
class ServiceRegistrar {
  static registerServices(
    container: ServiceContainer,
    organizationId: string,
    config: OrganizationConfig
  ) {
    // Register LLM provider based on config
    if (config.integrations?.llmProvider) {
      container.register(`llm:${organizationId}`, () => 
        this.createLLMProvider(config.integrations.llmProvider)
      );
    } else {
      container.register(`llm:${organizationId}`, () => 
        new OpenAIProvider(DEFAULT_OPENAI_CONFIG)
      );
    }
    
    // Register storage provider
    if (config.integrations?.storageProvider) {
      container.register(`storage:${organizationId}`, () =>
        this.createStorageProvider(config.integrations.storageProvider)
      );
    } else {
      container.register(`storage:${organizationId}`, () =>
        new VercelBlobProvider(DEFAULT_BLOB_CONFIG)
      );
    }
    
    // Register domain services with proper dependencies
    container.register(`chatService:${organizationId}`, () => 
      new ChatDomainServiceImpl(
        container.resolve(`chatRepo:${organizationId}`),
        container.resolve(`messageRepo:${organizationId}`),
        container.resolve(`llm:${organizationId}`),
        container.resolve(`quotaService:${organizationId}`)
      )
    );
  }
}
```

---

## 🎛️ FEATURE FLAGS & A/B TESTING

### **Feature Flag System**
```typescript
interface FeatureFlagService {
  isEnabled(flag: string, organizationId: string, userId?: string): Promise<boolean>;
  getVariant(experiment: string, organizationId: string, userId: string): Promise<string>;
  trackEvent(event: string, properties: Record<string, any>): Promise<void>;
}

class FeatureFlagServiceImpl implements FeatureFlagService {
  async isEnabled(
    flag: string, 
    organizationId: string, 
    userId?: string
  ): Promise<boolean> {
    // Check organization-level flags first
    const orgFlags = await this.getOrgFlags(organizationId);
    if (orgFlags[flag] !== undefined) return orgFlags[flag];
    
    // Check user-level flags
    if (userId) {
      const userFlags = await this.getUserFlags(userId);
      if (userFlags[flag] !== undefined) return userFlags[flag];
    }
    
    // Default to global flag
    return this.getGlobalFlag(flag);
  }
  
  async getVariant(
    experiment: string,
    organizationId: string,
    userId: string
  ): Promise<string> {
    const hash = this.hashUser(userId, experiment);
    const config = await this.getExperimentConfig(experiment, organizationId);
    
    return this.selectVariant(hash, config.variants);
  }
}
```

---

## 📊 MONITORING & OBSERVABILITY

### **Service Health Checks**
```typescript
interface HealthCheckService {
  checkHealth(): Promise<HealthStatus>;
  checkProviders(organizationId: string): Promise<ProviderHealth[]>;
}

class HealthCheckServiceImpl implements HealthCheckService {
  async checkProviders(organizationId: string): Promise<ProviderHealth[]> {
    const config = await this.configService.getProviderConfig(organizationId);
    const checks = [];
    
    // Check LLM provider
    if (config.llm) {
      checks.push(this.checkLLMProvider(config.llm));
    }
    
    // Check storage provider
    if (config.storage) {
      checks.push(this.checkStorageProvider(config.storage));
    }
    
    return Promise.all(checks);
  }
  
  private async checkLLMProvider(config: LLMConfig): Promise<ProviderHealth> {
    try {
      const provider = this.providerFactory.createLLMProvider(config);
      const models = await provider.listModels();
      
      return {
        type: 'llm',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        metadata: { modelCount: models.length }
      };
    } catch (error) {
      return {
        type: 'llm',
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}
```

---

## 🔧 ETAPAS DE IMPLEMENTAÇÃO

### **FASE 1: SERVICE LAYER**
- [ ] Implementar base `TenantService`
- [ ] Criar domain services (Chat, Document, Companion)
- [ ] Implementar repository pattern
- [ ] Configurar dependency injection

### **FASE 2: PROVIDER ABSTRACTION**
- [ ] Criar interfaces para LLM, Storage, Database providers
- [ ] Implementar providers concretos (OpenAI, Azure, S3, etc.)
- [ ] Sistema de factory para providers
- [ ] Health checks para cada provider

### **FASE 3: CONFIGURATION SYSTEM**
- [ ] Hierarchical configuration service
- [ ] Secrets management com encryption
- [ ] Environment-specific configs
- [ ] Configuration validation

### **FASE 4: BYOC INTEGRATION**
- [ ] UI para configuração de providers
- [ ] Testing de conexões
- [ ] Migration entre providers
- [ ] Fallback strategies

### **FASE 5: ADVANCED FEATURES**
- [ ] Feature flags system
- [ ] A/B testing infrastructure
- [ ] Monitoring e observability
- [ ] Performance metrics

### **FASE 6: VALIDATION & OPTIMIZATION**
- [ ] Integration testing
- [ ] Performance benchmarks
- [ ] Security validation
- [ ] Documentation completa

---

## ✅ CRITÉRIOS DE SUCESSO

### **Isolamento**
- [ ] **Zero acoplamento** entre domínios
- [ ] **100% testabilidade** com mocks
- [ ] **Service boundaries** bem definidos

### **Parametrizações**
- [ ] **BYOC completo** funcionando
- [ ] **Zero downtime** para mudanças de config
- [ ] **Fallback automático** em caso de falha

### **Performance**
- [ ] **< 100ms** para resolução de dependências
- [ ] **< 50ms** para lookup de configuração
- [ ] **99.9% uptime** dos providers

### **Flexibilidade**
- [ ] **Troca de providers** sem código
- [ ] **A/B testing** operacional
- [ ] **Feature flags** granulares

**🎯 Resultado:** Arquitetura de serviços robusta, flexível e completamente parametrizável para suportar qualquer cenário BYOC. 