# 🏗️ Arquitetura de Referência - Humana Companions

**Data:** 30-1-2025  
**Versão:** 1.0  
**Status:** Guia de Implementação  

---

## 🎯 **VISÃO GERAL**

Arquitetura em camadas com isolamento de responsabilidades e multi-tenancy nativo.

---

## 📐 **CAMADAS DE RESPONSABILIDADE**

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

### **🔄 Fluxo de Dados**
```
Request → Middleware → Route → Application → Domain → Repository → Infrastructure
```

---

## 🏛️ **COMPONENTES PRINCIPAIS**

### **1. API Layer**
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { organizationId } = await getSession(request);
  const body = await request.json();
  
  const result = await chatApplication.createChat({
    ...body,
    organizationId
  });
  
  return Response.json(result);
}
```

### **2. Application Layer**
```typescript
// lib/application/chat-application.ts
export class ChatApplication {
  constructor(
    private chatService: ChatService,
    private quotaService: QuotaService
  ) {}
  
  async createChat(request: CreateChatRequest) {
    // Orchestrate use case
    await this.quotaService.checkQuota(request.userId);
    const chat = await this.chatService.create(request);
    await this.quotaService.incrementUsage(request.userId);
    return chat;
  }
}
```

### **3. Domain Services**
```typescript
// lib/domain/chat-service.ts
export class ChatService {
  constructor(
    private chatRepo: ChatRepository,
    private aiProvider: AIProvider
  ) {}
  
  async create(request: CreateChatRequest): Promise<Chat> {
    // Business logic only
    const chat = this.buildChat(request);
    this.validateChat(chat);
    return this.chatRepo.save(chat);
  }
}
```

### **4. Repository Layer**
```typescript
// lib/repository/chat-repository.ts
export class ChatRepository {
  async save(chat: Chat): Promise<Chat> {
    return db.insert(chats).values({
      ...chat,
      organizationId: chat.organizationId // Always isolated
    });
  }
  
  async findByUser(userId: string, organizationId: string) {
    return db.select().from(chats)
      .where(and(
        eq(chats.userId, userId),
        eq(chats.organizationId, organizationId) // Tenant isolation
      ));
  }
}
```

### **5. Infrastructure Layer**
```typescript
// lib/infrastructure/openai-provider.ts
export class OpenAIProvider implements AIProvider {
  async generateResponse(messages: Message[]): Promise<string> {
    // External service integration
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages
    });
    return response.choices[0].message.content;
  }
}
```

---

## 🔐 **ISOLAMENTO MULTI-TENANT**

### **Tenant Boundary**
```typescript
interface TenantContext {
  organizationId: string;  // ÚNICO isolamento necessário
  userId: string;         // Owner dos recursos
}
```

### **Middleware de Tenant**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = getSession(request);
  
  // Inject tenant context
  request.headers.set('x-organization-id', session.organizationId);
  request.headers.set('x-user-id', session.userId);
}
```

### **Repository Base**
```typescript
abstract class TenantRepository<T> {
  protected addTenantFilter(query: any, organizationId: string) {
    return query.where(eq(this.table.organizationId, organizationId));
  }
  
  // All queries auto-filtered by organizationId
}
```

---

## 🎛️ **CONFIGURAÇÕES HIERÁRQUICAS**

### **Níveis de Config**
```
Global (System) 
  ↓
Organization (Per-tenant)
  ↓  
User (Per-user)
  ↓
Runtime (Dynamic)
```

### **Config Resolution**
```typescript
class ConfigService {
  async get<T>(path: string, context: TenantContext): Promise<T> {
    // 1. Check user config
    const userConfig = await this.getUserConfig(context.userId, path);
    if (userConfig) return userConfig;
    
    // 2. Check org config  
    const orgConfig = await this.getOrgConfig(context.organizationId, path);
    if (orgConfig) return orgConfig;
    
    // 3. Fall back to global
    return this.getGlobalConfig(path);
  }
}
```

---

## 🔌 **PROVIDER SYSTEM**

### **Provider Abstraction**
```typescript
interface AIProvider {
  generateResponse(input: AIRequest): Promise<AIResponse>;
  listModels(): Promise<Model[]>;
}

interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
}

interface DatabaseProvider {
  query<T>(sql: string, params: any[]): Promise<T[]>;
}
```

### **Provider Factory**
```typescript
class ProviderFactory {
  createAIProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'openai': return new OpenAIProvider(config);
      case 'azure': return new AzureProvider(config);
      case 'anthropic': return new AnthropicProvider(config);
    }
  }
}
```

---

## 📊 **ESTRUTURA DE DIRETÓRIOS**

```
lib/
├── application/           # Use cases & orchestration
│   ├── chat-application.ts
│   ├── document-application.ts
│   └── companion-application.ts
│
├── domain/               # Business logic
│   ├── services/
│   │   ├── chat-service.ts
│   │   ├── document-service.ts
│   │   └── companion-service.ts
│   └── models/
│       ├── chat.ts
│       ├── document.ts
│       └── companion.ts
│
├── repository/           # Data access
│   ├── chat-repository.ts
│   ├── document-repository.ts
│   └── companion-repository.ts
│
├── infrastructure/       # External services
│   ├── providers/
│   │   ├── openai-provider.ts
│   │   ├── azure-provider.ts
│   │   └── s3-provider.ts
│   └── config/
│       ├── database.ts
│       └── providers.ts
│
└── shared/              # Cross-cutting
    ├── types.ts
    ├── errors.ts
    └── utils.ts
```

---

## 🚀 **FLUXOS PRINCIPAIS**

### **1. Chat Creation**
```
POST /api/chat
  ↓
Middleware (extract organizationId)
  ↓
Route Handler
  ↓
ChatApplication.createChat()
  ↓
QuotaService.checkQuota() + ChatService.create()
  ↓
ChatRepository.save()
  ↓
Database (with organizationId filter)
```

### **2. Document Processing**
```
POST /api/documents
  ↓
Middleware (tenant context)
  ↓
DocumentApplication.processDocument()
  ↓
DocumentService.extract() + EmbeddingService.generate()
  ↓
DocumentRepository.save() + VectorRepository.store()
  ↓
Storage + Vector Database
```

### **3. Companion Response**
```
POST /api/companions/{id}/chat
  ↓
CompanionApplication.generateResponse()
  ↓
CompanionService.loadContext() + AIProvider.generate()
  ↓
MessageRepository.save()
  ↓
Stream Response
```

---

## ⚙️ **DEPENDENCY INJECTION**

### **Service Container**
```typescript
// lib/di/container.ts
export class ServiceContainer {
  register<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
}

// Setup
container.register('chatRepo', () => new ChatRepository(db));
container.register('aiProvider', () => new OpenAIProvider(config));
container.register('chatService', () => 
  new ChatService(
    container.resolve('chatRepo'),
    container.resolve('aiProvider')
  )
);
```

### **Provider Registration**
```typescript
// Per-organization providers
function registerProviders(container: Container, organizationId: string) {
  const config = getOrgConfig(organizationId);
  
  container.register(`aiProvider:${organizationId}`, () =>
    providerFactory.createAIProvider(config.ai)
  );
  
  container.register(`storageProvider:${organizationId}`, () =>
    providerFactory.createStorageProvider(config.storage)
  );
}
```

---

## 🔍 **PADRÕES DE IMPLEMENTAÇÃO**

### **1. Repository Pattern**
```typescript
interface Repository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findMany(filter: Filter, organizationId: string): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string, organizationId: string): Promise<void>;
}
```

### **2. Service Pattern**
```typescript
abstract class DomainService {
  constructor(protected organizationId: string) {}
  
  protected async validateAccess(userId: string, resourceId: string) {
    // Permission checking
  }
  
  protected async applyBusinessRules<T>(entity: T): Promise<T> {
    // Business logic
  }
}
```

### **3. Application Pattern**
```typescript
abstract class ApplicationService {
  protected async executeUseCase<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    // Cross-cutting concerns: logging, monitoring, etc.
    try {
      return await operation();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

### **API Layer**
- [ ] Routes isoladas por tenant
- [ ] Middleware de autenticação
- [ ] Validação de input
- [ ] Error handling consistente

### **Application Layer**
- [ ] Use cases bem definidos
- [ ] Orchestração de serviços
- [ ] Transaction management
- [ ] Logging e monitoring

### **Domain Layer**
- [ ] Business logic isolada
- [ ] Validações de domínio
- [ ] Invariantes garantidas
- [ ] Testes unitários

### **Repository Layer**
- [ ] Abstração de dados
- [ ] Filtros de tenant automáticos
- [ ] Query optimization
- [ ] Connection pooling

### **Infrastructure Layer**
- [ ] Provider abstraction
- [ ] Configuration management
- [ ] Health checks
- [ ] Fallback strategies

---

## 🎯 **PRÓXIMOS PASSOS**

### **Fase 1: Base Architecture**
1. Implementar camadas básicas
2. Setup dependency injection
3. Configurar tenant isolation
4. Testes de integração

### **Fase 2: Provider System**
1. Abstrair providers externos
2. Implementar BYOC
3. Configuration management
4. Health monitoring

### **Fase 3: Advanced Features**
1. Caching strategies
2. Event system
3. Background jobs
4. Performance optimization

**🎯 Resultado:** Arquitetura robusta, testável e escalável com isolamento perfeito por tenant. 