# 🏛️ Arquitetura Modular

## 🎯 Princípios Fundamentais

### **1. Separação de Responsabilidades**
Cada módulo deve ter uma responsabilidade específica e bem definida.

#### **Exemplo: Integração Dify**
```
lib/ai/dify-agents.ts          # Definições e lógica de negócio
components/dify-agent-selector.tsx # Interface do usuário
hooks/use-dify-agent.ts        # Estado e lógica de UI
app/(chat)/api/dify/route.ts   # API e comunicação externa
```

### **2. Baixo Acoplamento**
Módulos devem ser independentes e comunicar-se através de interfaces bem definidas.

#### **Estrutura Recomendada:**
```typescript
// ❌ Alto acoplamento
import { difyApiCall } from '../../../api/dify/route'

// ✅ Baixo acoplamento
interface AgentProvider {
  listAgents(): Promise<Agent[]>
  executeAgent(id: string, message: string): Promise<Response>
}
```

### **3. Alta Coesão**
Elementos relacionados devem estar agrupados no mesmo módulo.

#### **Organização por Funcionalidade:**
```
lib/ai/dify/
├── agents.ts              # Definições de agentes
├── api.ts                 # Comunicação com API
├── types.ts               # Tipos TypeScript
└── utils.ts               # Utilitários específicos
```

## 🗂️ Estrutura de Diretórios

### **Padrão Recomendado:**
```
src/
├── lib/                   # Lógica de negócio
│   ├── ai/               # Integrações de IA
│   │   ├── dify/         # Módulo Dify
│   │   ├── openai/       # Módulo OpenAI
│   │   └── providers.ts  # Interface comum
│   ├── db/               # Banco de dados
│   └── utils/            # Utilitários gerais
├── components/           # Componentes UI
│   ├── ui/               # Componentes base
│   ├── chat/             # Componentes de chat
│   └── dify/             # Componentes específicos Dify
├── hooks/                # React hooks
├── app/                  # Next.js App Router
│   ├── (chat)/           # Grupo de rotas
│   │   ├── api/          # API routes
│   │   └── chat/         # Páginas de chat
└── docs/                 # Documentação
    ├── dify/             # Doc específica
    └── arquitetura_geral/ # Doc geral
```

## 🔌 Interfaces e Contratos

### **Definição de Interfaces:**
```typescript
// lib/ai/types.ts
export interface AIProvider {
  id: string
  name: string
  listModels(): Promise<Model[]>
  executeChat(params: ChatParams): Promise<ChatResponse>
}

export interface Agent {
  id: string
  name: string
  description: string
  category: string
}
```

### **Implementação Específica:**
```typescript
// lib/ai/dify/provider.ts
export class DifyProvider implements AIProvider {
  id = 'dify'
  name = 'Dify'
  
  async listModels(): Promise<Model[]> {
    // Implementação específica do Dify
  }
  
  async executeChat(params: ChatParams): Promise<ChatResponse> {
    // Implementação específica do Dify
  }
}
```

## 🎛️ Configuração Modular

### **Configuração Centralizada:**
```typescript
// lib/config/providers.ts
export const providers = {
  dify: {
    enabled: process.env.DIFY_ENABLED === 'true',
    apiKey: process.env.DIFY_API_KEY,
    baseUrl: process.env.DIFY_BASE_URL,
  },
  openai: {
    enabled: process.env.OPENAI_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY,
  }
}
```

### **Factory Pattern:**
```typescript
// lib/ai/factory.ts
export function createProvider(type: string): AIProvider {
  switch (type) {
    case 'dify':
      return new DifyProvider(providers.dify)
    case 'openai':
      return new OpenAIProvider(providers.openai)
    default:
      throw new Error(`Provider ${type} not supported`)
  }
}
```

## 🧩 Componentes Modulares

### **Composição de Componentes:**
```typescript
// components/ai-provider-selector.tsx
interface AIProviderSelectorProps {
  providers: AIProvider[]
  selectedProvider: string
  onProviderChange: (provider: string) => void
}

// Uso específico
<AIProviderSelector
  providers={[difyProvider, openaiProvider]}
  selectedProvider={selectedProvider}
  onProviderChange={setSelectedProvider}
/>
```

### **Hooks Reutilizáveis:**
```typescript
// hooks/use-ai-provider.ts
export function useAIProvider(providerId: string) {
  const [provider, setProvider] = useState<AIProvider>()
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    setProvider(createProvider(providerId))
  }, [providerId])
  
  return { provider, loading }
}
```

## 📦 Gerenciamento de Estado

### **Estado Local vs Global:**
```typescript
// ✅ Estado local para componente específico
const { selectedAgent } = useDifyAgent()

// ✅ Estado global para dados compartilhados
const { user, session } = useAuth()

// ❌ Estado global desnecessário
const { difyButtonColor } = useGlobalState() // Muito específico
```

### **Context Providers:**
```typescript
// contexts/AIContext.tsx
interface AIContextType {
  providers: AIProvider[]
  selectedProvider: string
  setSelectedProvider: (id: string) => void
}

export const AIContext = createContext<AIContextType>()

export function AIProvider({ children }: { children: ReactNode }) {
  // Implementação do contexto
  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}
```

## 🔄 Padrões de Comunicação

### **Event-Driven Architecture:**
```typescript
// lib/events/types.ts
export interface AgentSelectedEvent {
  type: 'agent:selected'
  payload: { agentId: string, providerId: string }
}

// lib/events/emitter.ts
export const eventEmitter = new EventEmitter()

// Uso
eventEmitter.emit('agent:selected', { agentId, providerId })
eventEmitter.on('agent:selected', handleAgentSelection)
```

### **Pub/Sub Pattern:**
```typescript
// hooks/use-agent-events.ts
export function useAgentEvents() {
  useEffect(() => {
    const unsubscribe = eventEmitter.subscribe('agent:*', handleEvent)
    return unsubscribe
  }, [])
}
```

## 🧪 Testabilidade

### **Injeção de Dependências:**
```typescript
// ✅ Testável
function createChatService(provider: AIProvider) {
  return {
    sendMessage: (message: string) => provider.executeChat({ message })
  }
}

// ❌ Difícil de testar
function sendMessage(message: string) {
  const provider = new DifyProvider() // Hard-coded
  return provider.executeChat({ message })
}
```

### **Mocks e Stubs:**
```typescript
// tests/mocks/dify-provider.ts
export const mockDifyProvider: AIProvider = {
  id: 'dify-mock',
  name: 'Dify Mock',
  listModels: jest.fn().mockResolvedValue([]),
  executeChat: jest.fn().mockResolvedValue({ message: 'Mock response' })
}
```

## 📈 Benefícios da Arquitetura Modular

### **Manutenibilidade:**
- Mudanças isoladas em módulos específicos
- Fácil localização de bugs
- Refatoração segura

### **Escalabilidade:**
- Adição de novos providers sem afetar existentes
- Crescimento incremental da funcionalidade
- Performance otimizada por módulo

### **Testabilidade:**
- Testes unitários isolados
- Mocks simples e focados
- Coverage por módulo

### **Reutilização:**
- Componentes reutilizáveis entre projetos
- Padrões consistentes
- Menos duplicação de código

---

**🎯 A arquitetura modular é a base para um código sustentável e escalável!** 