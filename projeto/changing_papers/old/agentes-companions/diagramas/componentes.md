# Componentes - Sistema de Agentes Companions

## 🏗️ Arquitetura de Componentes

```mermaid
graph TB
    subgraph "Frontend Components"
        subgraph "Chat Interface"
            CHAT[MultiAgentChat]
            SELECTOR[AgentSelector]
            AVATAR[AgentAvatar]
            CONTEXT[ContextPanel]
            MSG[MessageList]
            INPUT[AgentInput]
        end
        
        subgraph "Agent Management"
            AGENT_CARD[AgentCard]
            AGENT_CONFIG[AgentConfig]
            AGENT_METRICS[AgentMetrics]
            COLLAB_VIEW[CollaborationView]
        end
        
        subgraph "UI Components"
            BUTTON[Button]
            FORM[Form]
            MODAL[Modal]
            TOOLTIP[Tooltip]
            SPINNER[LoadingSpinner]
        end
    end
    
    subgraph "Backend Components"
        subgraph "Agent System"
            ORCH[AgentOrchestrator]
            REG[AgentRegistry]
            ROUTER[AgentRouter]
            COLLAB[CollaborationEngine]
        end
        
        subgraph "LLM Integration"
            LLM_ROUTER[LLMRouter]
            PROVIDER_MGR[ProviderManager]
            FALLBACK[FallbackHandler]
            RATE_LIMIT[RateLimiter]
        end
        
        subgraph "Memory System"
            MEM_MGR[MemoryManager]
            CONTEXT_MGR[ContextManager]
            CACHE_MGR[CacheManager]
            SEARCH_IDX[SearchIndex]
        end
        
        subgraph "API Layer"
            AUTH_MW[AuthMiddleware]
            VALID_MW[ValidationMiddleware]
            RATE_MW[RateLimitMiddleware]
            LOG_MW[LoggingMiddleware]
        end
    end
    
    subgraph "Database Components"
        AGENT_REPO[AgentRepository]
        USER_REPO[UserRepository]
        CONV_REPO[ConversationRepository]
        MEM_REPO[MemoryRepository]
        METRICS_REPO[MetricsRepository]
    end
    
    subgraph "External Services"
        OPENAI_CLIENT[OpenAIClient]
        GEMINI_CLIENT[GeminiClient]
        CLAUDE_CLIENT[ClaudeClient]
        DIFY_CLIENT[DifyClient]
        SEARCH_CLIENT[SearchClient]
    end
    
    %% Frontend Connections
    CHAT --> SELECTOR
    CHAT --> AVATAR
    CHAT --> CONTEXT
    CHAT --> MSG
    CHAT --> INPUT
    
    SELECTOR --> AGENT_CARD
    AGENT_CARD --> AGENT_CONFIG
    AGENT_CARD --> AGENT_METRICS
    
    CHAT --> COLLAB_VIEW
    
    %% UI Component Usage
    SELECTOR --> BUTTON
    AGENT_CONFIG --> FORM
    AGENT_METRICS --> MODAL
    AVATAR --> TOOLTIP
    CHAT --> SPINNER
    
    %% Backend Connections
    ORCH --> REG
    ORCH --> ROUTER
    ORCH --> COLLAB
    
    ROUTER --> LLM_ROUTER
    LLM_ROUTER --> PROVIDER_MGR
    PROVIDER_MGR --> FALLBACK
    PROVIDER_MGR --> RATE_LIMIT
    
    ORCH --> MEM_MGR
    MEM_MGR --> CONTEXT_MGR
    MEM_MGR --> CACHE_MGR
    MEM_MGR --> SEARCH_IDX
    
    %% API Middleware Chain
    AUTH_MW --> VALID_MW
    VALID_MW --> RATE_MW
    RATE_MW --> LOG_MW
    LOG_MW --> ORCH
    
    %% Repository Connections
    REG --> AGENT_REPO
    ORCH --> USER_REPO
    ORCH --> CONV_REPO
    MEM_MGR --> MEM_REPO
    ORCH --> METRICS_REPO
    
    %% External Service Connections
    PROVIDER_MGR --> OPENAI_CLIENT
    PROVIDER_MGR --> GEMINI_CLIENT
    PROVIDER_MGR --> CLAUDE_CLIENT
    PROVIDER_MGR --> DIFY_CLIENT
    SEARCH_IDX --> SEARCH_CLIENT
    
    classDef frontend fill:#e3f2fd,stroke:#1976d2
    classDef backend fill:#e8f5e8,stroke:#2e7d32
    classDef database fill:#f3e5f5,stroke:#7b1fa2
    classDef external fill:#fff3e0,stroke:#f57c00
    classDef ui fill:#fce4ec,stroke:#c2185b
    
    class CHAT,SELECTOR,AVATAR,CONTEXT,MSG,INPUT,AGENT_CARD,AGENT_CONFIG,AGENT_METRICS,COLLAB_VIEW frontend
    class ORCH,REG,ROUTER,COLLAB,LLM_ROUTER,PROVIDER_MGR,FALLBACK,RATE_LIMIT,MEM_MGR,CONTEXT_MGR,CACHE_MGR,SEARCH_IDX,AUTH_MW,VALID_MW,RATE_MW,LOG_MW backend
    class AGENT_REPO,USER_REPO,CONV_REPO,MEM_REPO,METRICS_REPO database
    class OPENAI_CLIENT,GEMINI_CLIENT,CLAUDE_CLIENT,DIFY_CLIENT,SEARCH_CLIENT external
    class BUTTON,FORM,MODAL,TOOLTIP,SPINNER ui
```
