# Arquitetura Proposta - MCP Integration

## Visão Geral
Arquitetura futura com Model Context Protocol (MCP) implementado, criando uma camada unificada de contexto e tools que funciona com qualquer LLM.

## Diagrama C4 - Arquitetura Proposta

```mermaid
graph TB
    User[👤 Usuário] --> App[Humana Companions]
    App --> AISDKCore[🧠 AI SDK Core]
    
    AISDKCore --> MCPClient[🔄 MCP Client]
    MCPClient --> MCPServer[🏗️ MCP Server]
    
    MCPServer --> ContextStore[📚 Context Store]
    MCPServer --> ToolRegistry[🛠️ Tool Registry]
    MCPServer --> ProviderBridge[🌉 Provider Bridge]
    
    ProviderBridge --> OpenAI[🔵 OpenAI]
    ProviderBridge --> Anthropic[🟣 Anthropic]
    ProviderBridge --> Google[🔴 Google]
    ProviderBridge --> DifyAgents[🤖 Dify Agents]
    
    ToolRegistry --> MCPTools[🔧 MCP Tools]
    MCPTools --> CreateDoc[📄 Create Document]
    MCPTools --> UpdateDoc[✏️ Update Document]
    MCPTools --> Weather[🌤️ Get Weather]
    MCPTools --> Suggestions[💡 Request Suggestions]
    MCPTools --> NewTools[⭐ New Advanced Tools]
    
    ContextStore --> SharedContext[🔗 Shared Context]
    ContextStore --> VectorStore[📊 Vector Store]
    ContextStore --> Database[(🗄️ Database)]
    
    style App fill:#e1f5fe
    style MCPClient fill:#ffeb3b
    style MCPServer fill:#ffeb3b
    style ContextStore fill:#e8f5e8
    style ToolRegistry fill:#fff3e0
    style ProviderBridge fill:#f3e5f5
    style SharedContext fill:#e8f5e8
```

## Novos Componentes

### **🔄 MCP Client**
- **Função**: Interface cliente para comunicação com MCP Server
- **Localização**: `lib/ai/mcp/client.ts`
- **Responsabilidade**: Abstração do protocolo MCP para AI SDK

### **🏗️ MCP Server**
- **Função**: Servidor central de contexto e tools
- **Localização**: `lib/ai/mcp/server.ts`
- **Responsabilidade**: Gerenciar contexto, tools e providers

### **📚 Context Store**
- **Função**: Armazenamento unificado de contexto
- **Localização**: `lib/ai/mcp/context-store.ts`
- **Capacidades**: 
  - Context sharing entre LLMs
  - Vector embeddings para contexto semântico
  - Persistência de contexto longo

### **🛠️ Tool Registry**
- **Função**: Registro centralizado de tools MCP
- **Localização**: `lib/ai/mcp/tool-registry.ts`
- **Capacidades**:
  - Tools compatíveis com qualquer LLM
  - Plugin architecture para novos tools
  - Validation e security para tools

### **🌉 Provider Bridge**
- **Função**: Ponte unificada para todos os providers
- **Localização**: `lib/ai/mcp/provider-bridge.ts`
- **Capacidades**:
  - Abstração unificada de providers
  - Load balancing entre providers
  - Fallback automático

## Benefícios da Mudança

### **1. Contexto Unificado**
- ✅ Contexto compartilhado entre todos os LLMs
- ✅ Context window virtualmente ilimitado
- ✅ Contexto semântico com embeddings
- ✅ Persistência de conversas longas

### **2. Tools Padronizados**
- ✅ Tools funcionam com qualquer LLM
- ✅ Plugin architecture para extensibilidade
- ✅ Validation e security centralizados
- ✅ Performance otimizada

### **3. Provider Agnostic**
- ✅ Adicionar novos providers sem mudanças no core
- ✅ Switch automático entre providers
- ✅ Load balancing inteligente
- ✅ Fallback e redundância

### **4. Integração Dify Unificada**
- ✅ Dify agents usam mesmo contexto que AI SDK
- ✅ Tools compartilhados entre sistemas
- ✅ Configuração unificada

## Fluxo Proposto de Dados

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as App
    participant AI as AI SDK
    participant MC as MCP Client
    participant MS as MCP Server
    participant CS as Context Store
    participant TR as Tool Registry
    participant PB as Provider Bridge
    participant P as Provider
    
    U->>A: Mensagem
    A->>AI: Processar com LLM
    AI->>MC: Request via MCP
    MC->>MS: MCP Protocol
    MS->>CS: Buscar contexto relevante
    CS->>MS: Contexto + embeddings
    MS->>PB: Enviar para melhor provider
    PB->>P: Request otimizado
    P->>PB: Resposta + tool calls
    PB->>MS: Resposta processada
    MS->>TR: Executar tools via registry
    TR->>MS: Resultado tools
    MS->>CS: Atualizar contexto
    MS->>MC: Resposta final
    MC->>AI: Resultado MCP
    AI->>A: Resultado completo
    A->>U: Exibir resposta
```

## Arquitetura de Deployment

```mermaid
graph TB
    subgraph "Frontend"
        NextJS[Next.js App]
    end
    
    subgraph "Backend"
        APIRoutes[API Routes]
        MCPServer[MCP Server]
    end
    
    subgraph "Storage"
        PostgreSQL[(PostgreSQL)]
        VectorDB[(Vector DB)]
        Redis[(Redis Cache)]
    end
    
    subgraph "External"
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
        Google[Google AI API]
        Dify[Dify API]
    end
    
    NextJS --> APIRoutes
    APIRoutes --> MCPServer
    MCPServer --> PostgreSQL
    MCPServer --> VectorDB
    MCPServer --> Redis
    MCPServer --> OpenAI
    MCPServer --> Anthropic
    MCPServer --> Google
    MCPServer --> Dify
```

## Métricas Esperadas

- **Providers suportados**: Ilimitado (plugin architecture)
- **Tools disponíveis**: Extensível via plugins
- **Context sharing**: 100% entre todos os providers
- **Complexidade de configuração**: Baixa (auto-discovery)
- **Time to add new provider**: ~2-3 horas
- **Performance**: +40% com context caching
- **Reliability**: +60% com fallback automático

## Fases de Implementação

### **Fase 1: Core MCP (Semana 1-2)**
- Implementar MCP Client básico
- Criar MCP Server foundation
- Migrar 1 provider (OpenAI) para MCP

### **Fase 2: Context Store (Semana 3-4)**
- Implementar Context Store
- Adicionar vector embeddings
- Migrar tools existentes

### **Fase 3: Provider Bridge (Semana 5-6)**
- Migrar todos os providers
- Implementar load balancing
- Adicionar fallback logic

### **Fase 4: Dify Integration (Semana 7-8)**
- Integrar Dify agents via MCP
- Unificar configuração
- Otimização e testes

---

**🚀 Esta arquitetura MCP transformará nosso sistema AI em uma plataforma unificada, escalável e provider-agnostic.** 