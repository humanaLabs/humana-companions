# Arquitetura Proposta - MCP Integration

## 📋 Visão Geral

A integração MCP (Model Context Protocol) transformará nossa arquitetura atual em um sistema **context-aware** onde LLMs têm acesso dinâmico ao estado completo da aplicação através de um protocolo padronizado.

## 🏗️ Arquitetura Geral

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMANA COMPANIONS                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                            │
│  ├── Chat Interface                                            │
│  ├── Context Inspector                                         │
│  ├── Tool Status Dashboard                                     │
│  └── MCP Debug Panel                                          │
├─────────────────────────────────────────────────────────────────┤
│  Backend (API Routes)                                          │
│  ├── /api/chat (MCP-enabled)                                  │
│  ├── /api/mcp/status                                          │
│  ├── /api/mcp/context                                         │
│  └── /api/mcp/tools                                           │
├─────────────────────────────────────────────────────────────────┤
│  MCP Layer                                                     │
│  ├── MCP Server                                               │
│  ├── Context Manager                                          │
│  ├── Tool Registry                                            │
│  └── Session Manager                                          │
├─────────────────────────────────────────────────────────────────┤
│  AI Integration                                                │
│  ├── AI SDK (MCP-compatible)                                  │
│  ├── Provider Adapters                                        │
│  ├── Dify Bridge                                              │
│  └── Context Injection                                        │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                    │
│  ├── PostgreSQL (Core Data)                                   │
│  ├── Redis (Context Cache)                                    │
│  ├── Vector Store (Embeddings)                                │
│  └── Session Store                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Decisões Arquiteturais

### 1. MCP Server Architecture

**Decisão**: Servidor MCP dedicado como processo separado
**Justificativa**: 
- Isolamento de falhas
- Escalabilidade independente
- Melhor debugging
- Compatibilidade com especificação MCP

```typescript
// lib/mcp/server.ts
export class HumanaMCPServer {
  private server: MCPServer;
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;
  
  constructor() {
    this.server = new MCPServer({
      name: 'humana-companions',
      version: '1.0.0',
    });
    
    this.setupTools();
    this.setupContextProviders();
  }
  
  private setupTools() {
    // Registrar todas as tools MCP
    this.toolRegistry.register([
      new DocumentTool(),
      new ArtifactTool(),
      new DifyAgentTool(),
      new DatabaseTool(),
      new WeatherTool(),
    ]);
  }
}
```

### 2. Context Management Strategy

**Decisão**: Context dinâmico baseado em sessão com cache inteligente
**Justificativa**:
- Performance otimizada
- Contexto relevante por usuário
- Cache hit rate alto
- Memória controlada

```typescript
// lib/mcp/context-manager.ts
export class ContextManager {
  private cache: RedisCache;
  private providers: ContextProvider[];
  
  async getContext(sessionId: string, userId: string): Promise<Context> {
    const cacheKey = `context:${sessionId}:${userId}`;
    
    // Tentar cache primeiro
    const cached = await this.cache.get(cacheKey);
    if (cached && !this.isStale(cached)) {
      return cached;
    }
    
    // Construir contexto dinâmico
    const context = await this.buildContext(sessionId, userId);
    await this.cache.set(cacheKey, context, { ttl: 300 }); // 5min
    
    return context;
  }
  
  private async buildContext(sessionId: string, userId: string): Promise<Context> {
    const contexts = await Promise.all([
      this.getUserContext(userId),
      this.getSessionContext(sessionId),
      this.getArtifactContext(sessionId),
      this.getRecentMessages(sessionId),
      this.getActiveTools(),
    ]);
    
    return this.mergeContexts(contexts);
  }
}
```

### 3. Tool Registry Architecture

**Decisão**: Registry centralizado com descoberta automática
**Justificativa**:
- Facilita adição de novas tools
- Versionamento de tools
- Permissões granulares
- Métricas centralizadas

```typescript
// lib/mcp/tool-registry.ts
export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private permissions: PermissionManager;
  private metrics: MetricsCollector;
  
  register(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.setupToolMetrics(tool);
  }
  
  async executeTool(
    toolName: string, 
    params: any, 
    context: ExecutionContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // Verificar permissões
    await this.permissions.checkPermission(
      context.userId, 
      toolName, 
      params
    );
    
    // Executar com métricas
    const startTime = Date.now();
    try {
      const result = await tool.execute(params, context);
      this.metrics.recordSuccess(toolName, Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.recordError(toolName, error);
      throw error;
    }
  }
}
```

### 4. AI SDK Integration

**Decisão**: Adapter pattern para integração com AI SDK
**Justificativa**:
- Compatibilidade com AI SDK existente
- Suporte a múltiplos providers
- Migração gradual
- Fallback para sistema atual

```typescript
// lib/ai/mcp-adapter.ts
export class MCPAdapter {
  private mcpClient: MCPClient;
  private aiSDK: any;
  
  async streamText(config: StreamTextConfig): Promise<StreamTextResult> {
    // Enriquecer config com contexto MCP
    const enrichedConfig = await this.enrichWithMCPContext(config);
    
    // Usar AI SDK com contexto MCP
    return this.aiSDK.streamText(enrichedConfig);
  }
  
  private async enrichWithMCPContext(config: StreamTextConfig) {
    const context = await this.mcpClient.getContext(config.sessionId);
    
    return {
      ...config,
      messages: [
        ...this.buildContextMessages(context),
        ...config.messages,
      ],
      tools: {
        ...config.tools,
        ...this.buildMCPTools(),
      },
    };
  }
}
```

## 🎯 Estrutura de Dados

### Context Schema
```typescript
interface MCPContext {
  sessionId: string;
  userId: string;
  timestamp: Date;
  
  // Contexto do usuário
  user: {
    id: string;
    preferences: UserPreferences;
    history: ConversationSummary[];
  };
  
  // Contexto da sessão
  session: {
    id: string;
    artifacts: Artifact[];
    activeTools: string[];
    recentMessages: Message[];
  };
  
  // Contexto da aplicação
  application: {
    availableTools: ToolDefinition[];
    systemStatus: SystemStatus;
    capabilities: string[];
  };
  
  // Contexto dinâmico
  dynamic: {
    currentTime: Date;
    userLocation?: Location;
    activeAgents: DifyAgent[];
    pendingTasks: Task[];
  };
}
```

### Tool Definition Schema
```typescript
interface MCPToolDefinition {
  name: string;
  description: string;
  version: string;
  
  // Parâmetros
  parameters: {
    type: 'object';
    properties: Record<string, JSONSchema>;
    required: string[];
  };
  
  // Metadados
  metadata: {
    category: string;
    permissions: Permission[];
    rateLimit: RateLimit;
    cacheable: boolean;
  };
  
  // Execução
  execute: (params: any, context: ExecutionContext) => Promise<ToolResult>;
}
```

## 📊 APIs e Endpoints

### MCP Server Endpoints
```typescript
// Endpoints internos do MCP Server
POST /mcp/context/get      // Obter contexto
POST /mcp/context/update   // Atualizar contexto
POST /mcp/tools/list       // Listar tools disponíveis
POST /mcp/tools/execute    // Executar tool
GET  /mcp/status           // Status do servidor
GET  /mcp/metrics          // Métricas de uso
```

### API Routes Modificadas
```typescript
// app/(chat)/api/chat/route.ts - Modificado para MCP
export async function POST(request: Request) {
  const { messages, sessionId, userId } = await request.json();
  
  // Usar MCP Adapter em vez de AI SDK direto
  const mcpAdapter = new MCPAdapter();
  
  const result = await mcpAdapter.streamText({
    model: selectedModel,
    messages,
    sessionId,
    userId,
    tools: {
      // Tools serão injetadas automaticamente via MCP
    },
  });
  
  return result.toAIStreamResponse();
}
```

## 🔄 Fluxo de Dados

### Fluxo de Conversa com MCP
```
1. Usuário envia mensagem
2. Frontend → /api/chat
3. API Route → MCP Adapter
4. MCP Adapter → MCP Server (get context)
5. MCP Server → Context Manager
6. Context Manager → Múltiplos providers
7. Context agregado → MCP Adapter
8. MCP Adapter → AI SDK (com contexto)
9. AI SDK → LLM Provider
10. LLM resposta → AI SDK
11. AI SDK → Tool execution (se necessário)
12. Tool results → MCP Server
13. Resposta final → Frontend
```

### Fluxo de Tool Execution
```
1. LLM solicita tool execution
2. AI SDK → MCP Adapter
3. MCP Adapter → MCP Server
4. MCP Server → Tool Registry
5. Tool Registry → Specific Tool
6. Tool executa → Database/API
7. Result → Tool Registry
8. Tool Registry → MCP Server
9. MCP Server → MCP Adapter
10. MCP Adapter → AI SDK
11. AI SDK → LLM Provider
12. LLM incorpora result → Resposta
```

## 🎨 Integração com Sistema Atual

### Compatibilidade com Dify
```typescript
// lib/ai/dify-mcp-bridge.ts
export class DifyMCPBridge {
  async bridgeContext(difyAgent: DifyAgent, mcpContext: MCPContext) {
    // Converter contexto MCP para formato Dify
    const difyContext = this.convertMCPToDify(mcpContext);
    
    // Enriquecer chamada Dify com contexto
    return {
      ...difyAgent.defaultConfig,
      inputs: {
        ...difyAgent.defaultConfig.inputs,
        context: difyContext,
      },
    };
  }
}
```

### Migração Gradual
```typescript
// Feature flag para migração gradual
const USE_MCP = process.env.ENABLE_MCP === 'true';

export async function getChatCompletion(config: ChatConfig) {
  if (USE_MCP) {
    return mcpAdapter.streamText(config);
  } else {
    return aiSDK.streamText(config);
  }
}
```

## 🔐 Segurança e Permissões

### Permission System
```typescript
interface MCPPermission {
  userId: string;
  toolName: string;
  actions: ('read' | 'write' | 'execute')[];
  conditions: {
    timeWindow?: TimeWindow;
    rateLimit?: RateLimit;
    dataScope?: DataScope;
  };
}

class PermissionManager {
  async checkPermission(
    userId: string,
    toolName: string,
    params: any
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const toolPermission = permissions.find(p => p.toolName === toolName);
    
    if (!toolPermission) {
      throw new UnauthorizedError(`No permission for tool ${toolName}`);
    }
    
    // Verificar condições específicas
    await this.checkConditions(toolPermission.conditions, params);
    
    return true;
  }
}
```

## 📈 Monitoramento e Métricas

### Métricas MCP
```typescript
interface MCPMetrics {
  // Performance
  contextBuildTime: number;
  toolExecutionTime: number;
  cacheHitRate: number;
  
  // Usage
  toolUsageCount: Record<string, number>;
  contextSize: number;
  activeConnections: number;
  
  // Errors
  errorRate: number;
  errorsByType: Record<string, number>;
  
  // Business
  userSatisfaction: number;
  featureAdoption: number;
}
```

## 🎯 Alternativas Consideradas

### Alternativa A: Integração Direta no AI SDK
**Prós**: Menor complexidade, sem servidor adicional
**Contras**: Menos flexibilidade, difícil debugging, não segue padrão MCP
**Decisão**: Rejeitada - não segue especificação MCP

### Alternativa B: MCP como Middleware
**Prós**: Integração mais simples, menos mudanças
**Contras**: Menor controle, performance subótima
**Decisão**: Rejeitada - não oferece benefícios completos MCP

### **Alternativa C: Servidor MCP Dedicado (ESCOLHIDA)**
**Prós**: Máxima flexibilidade, debugging superior, escalabilidade
**Contras**: Maior complexidade inicial
**Decisão**: Aceita - oferece todos os benefícios MCP

## 🚀 Benefícios Esperados

### Técnicos
- **Context-aware responses** - Respostas baseadas em contexto completo
- **Tool coordination** - Tools trabalhando de forma coordenada
- **Better debugging** - Visibilidade completa do fluxo
- **Scalable architecture** - Arquitetura preparada para crescimento

### Negócio
- **Improved user experience** - Respostas mais relevantes e precisas
- **Faster development** - Adição de features mais rápida
- **Better insights** - Métricas detalhadas de uso
- **Competitive advantage** - Tecnologia de ponta

## 📋 Próximos Passos

1. **Criar diagramas detalhados** (diagramas.md)
2. **Definir fases de implementação** (implementacao-fases.md)
3. **Planejar estratégia de testes** (validacao-testes.md)
4. **Protótipo MCP básico** para validação
5. **Aprovação stakeholders** para prosseguir 