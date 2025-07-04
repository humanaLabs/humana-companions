# Fluxo de Dados - Sistema de Agentes Companions

## 🔄 Arquitetura de Dados Completa

```mermaid
graph TB
    subgraph "User Layer"
        USER[👤 Usuário]
        PREF[Preferências]
        HIST[Histórico]
    end
    
    subgraph "Frontend Data Flow"
        UI[Chat Interface]
        STATE[Zustand State]
        CACHE[React Query Cache]
    end
    
    subgraph "API Gateway"
        AUTH[Authentication]
        ROUTE[Router]
        VALID[Validation]
    end
    
    subgraph "Agent Orchestration"
        ORCH[Orchestrator]
        INTENT[Intent Analysis]
        ROUTER[Agent Router]
        COLLAB[Collaboration Manager]
    end
    
    subgraph "Agent Registry"
        REG[Registry]
        ALEX[Alex Config]
        LUNA[Luna Config]
        MORGAN[Morgan Config]
        SAGE[Sage Config]
        SAM[Sam Config]
    end
    
    subgraph "LLM Processing"
        LLM_ROUTE[LLM Router]
        GPT4[OpenAI API]
        GEMINI[Gemini API]
        CLAUDE[Claude API]
        DIFY[Dify API]
    end
    
    subgraph "Memory System"
        MEM_MGR[Memory Manager]
        CONTEXT[Context Store]
        AGENT_MEM[Agent Memory]
        USER_MEM[User Memory]
        CONV_MEM[Conversation Memory]
    end
    
    subgraph "Database Layer"
        AGENTS_DB[(Agents)]
        USERS_DB[(Users)]
        CONV_DB[(Conversations)]
        MEM_DB[(Memory)]
        PREF_DB[(Preferences)]
    end
    
    subgraph "External APIs"
        WEB_SEARCH[Web Search]
        CODE_EXEC[Code Execution]
        IMAGE_API[Image Analysis]
        DOC_API[Documentation]
    end
    
    %% User Flow
    USER --> UI
    UI --> STATE
    STATE --> CACHE
    
    %% Request Flow
    UI --> AUTH
    AUTH --> ROUTE
    ROUTE --> VALID
    VALID --> ORCH
    
    %% Orchestration Flow
    ORCH --> INTENT
    INTENT --> ROUTER
    ROUTER --> REG
    REG --> ALEX
    REG --> LUNA
    REG --> MORGAN
    REG --> SAGE
    REG --> SAM
    
    %% Agent Selection
    ROUTER --> COLLAB
    COLLAB --> LLM_ROUTE
    
    %% LLM Processing
    LLM_ROUTE --> GPT4
    LLM_ROUTE --> GEMINI
    LLM_ROUTE --> CLAUDE
    LLM_ROUTE --> DIFY
    
    %% Memory Integration
    ORCH --> MEM_MGR
    MEM_MGR --> CONTEXT
    MEM_MGR --> AGENT_MEM
    MEM_MGR --> USER_MEM
    MEM_MGR --> CONV_MEM
    
    %% Database Operations
    MEM_MGR --> AGENTS_DB
    MEM_MGR --> USERS_DB
    MEM_MGR --> CONV_DB
    MEM_MGR --> MEM_DB
    MEM_MGR --> PREF_DB
    
    %% External Capabilities
    ALEX --> CODE_EXEC
    LUNA --> IMAGE_API
    SAGE --> WEB_SEARCH
    SAM --> DOC_API
    
    %% Response Flow
    GPT4 --> ORCH
    GEMINI --> ORCH
    CLAUDE --> ORCH
    DIFY --> ORCH
    
    ORCH --> UI
    UI --> USER
    
    %% User Preferences
    USER --> PREF
    PREF --> PREF_DB
    HIST --> CONV_DB
    
    classDef user fill:#e3f2fd,stroke:#1976d2
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2
    classDef api fill:#fff3e0,stroke:#f57c00
    classDef orchestration fill:#e8f5e8,stroke:#2e7d32
    classDef agents fill:#fce4ec,stroke:#c2185b
    classDef llm fill:#f1f8e9,stroke:#33691e
    classDef memory fill:#e0f2f1,stroke:#004d40
    classDef database fill:#e8eaf6,stroke:#3f51b5
    classDef external fill:#fff8e1,stroke:#ff8f00
    
    class USER,PREF,HIST user
    class UI,STATE,CACHE frontend
    class AUTH,ROUTE,VALID api
    class ORCH,INTENT,ROUTER,COLLAB orchestration
    class REG,ALEX,LUNA,MORGAN,SAGE,SAM agents
    class LLM_ROUTE,GPT4,GEMINI,CLAUDE,DIFY llm
    class MEM_MGR,CONTEXT,AGENT_MEM,USER_MEM,CONV_MEM memory
    class AGENTS_DB,USERS_DB,CONV_DB,MEM_DB,PREF_DB database
    class WEB_SEARCH,CODE_EXEC,IMAGE_API,DOC_API external
```
