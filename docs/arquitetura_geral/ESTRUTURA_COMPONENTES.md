# 🧩 Estrutura de Componentes React

## 🎯 Princípios de Organização

### **1. Hierarquia Clara**
Componentes organizados em hierarquia lógica e intuitiva.

### **2. Reutilização**
Componentes reutilizáveis e compostos por partes menores.

### **3. Responsabilidade Única**
Cada componente tem uma responsabilidade específica.

### **4. Composição sobre Herança**
Usar composição para criar componentes complexos.

## 📁 Estrutura de Diretórios

### **Organização Recomendada**
```
components/
├── ui/                       # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── ...
├── layout/                   # Componentes de layout
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── chat/                     # Componentes de chat
│   ├── chat.tsx
│   ├── message.tsx
│   ├── messages.tsx
│   └── chat-header.tsx
├── auth/                     # Componentes de autenticação
│   ├── auth-form.tsx
│   └── sign-out-form.tsx
├── [provider]/               # Componentes específicos de provider
│   ├── dify-agent-selector.tsx
│   ├── dify-agent-demo.tsx
│   └── dify-status.tsx
└── shared/                   # Componentes compartilhados
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── confirmation-dialog.tsx
```

### **Convenções de Nomenclatura**
```typescript
// ✅ Componentes: PascalCase
export function DifyAgentSelector() {}

// ✅ Arquivos: kebab-case
dify-agent-selector.tsx
chat-header.tsx
auth-form.tsx

// ✅ Props interfaces: ComponentProps
interface DifyAgentSelectorProps {}
interface ChatHeaderProps {}
```

## 🏗️ Padrões de Componentes

### **Componente Base**
```typescript
// components/dify-agent-selector.tsx
import { useState, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DifyAgentSelectorProps {
  agents: DifyAgent[]
  selectedAgent?: string
  onAgentChange: (agentId: string) => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function DifyAgentSelector({
  agents,
  selectedAgent,
  onAgentChange,
  loading = false,
  disabled = false,
  className,
}: DifyAgentSelectorProps) {
  // Lógica do componente
  const handleAgentChange = useCallback((agentId: string) => {
    onAgentChange(agentId)
  }, [onAgentChange])
  
  // Agrupamento por categoria
  const groupedAgents = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const category = agent.category || 'Geral'
      if (!acc[category]) acc[category] = []
      acc[category].push(agent)
      return acc
    }, {} as Record<string, DifyAgent[]>)
  }, [agents])
  
  if (loading) {
    return <div className="animate-pulse">Carregando agentes...</div>
  }
  
  return (
    <Select
      value={selectedAgent}
      onValueChange={handleAgentChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[200px]", className)}>
        <SelectValue placeholder="Selecionar agente" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
          <div key={category}>
            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
              {category}
            </div>
            {categoryAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex flex-col">
                  <span>{agent.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {agent.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### **Componente Composto**
```typescript
// components/chat/chat-header.tsx
import { ModelSelector } from '@/components/model-selector'
import { DifyAgentSelector } from '@/components/dify-agent-selector'
import { VisibilitySelector } from '@/components/visibility-selector'

interface ChatHeaderProps {
  chatId: string
  selectedModel: string
  onModelChange: (model: string) => void
  selectedAgent?: string
  onAgentChange: (agent: string) => void
  visibility: 'private' | 'public'
  onVisibilityChange: (visibility: 'private' | 'public') => void
}

export function ChatHeader({
  chatId,
  selectedModel,
  onModelChange,
  selectedAgent,
  onAgentChange,
  visibility,
  onVisibilityChange,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Chat {chatId}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        
        <DifyAgentSelector
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
        />
        
        <VisibilitySelector
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
        />
      </div>
    </header>
  )
}
```

### **Componente com Context**
```typescript
// components/dify-provider.tsx
import { createContext, useContext, ReactNode } from 'react'
import { useDifyAgent } from '@/hooks/use-dify-agent'

interface DifyContextType {
  agents: DifyAgent[]
  selectedAgent: string
  setSelectedAgent: (id: string) => void
  executeAgent: (id: string, message: string) => Promise<any>
  loading: boolean
  error: string
}

const DifyContext = createContext<DifyContextType | null>(null)

export function DifyProvider({ children }: { children: ReactNode }) {
  const difyState = useDifyAgent()
  
  return (
    <DifyContext.Provider value={difyState}>
      {children}
    </DifyContext.Provider>
  )
}

export function useDifyContext() {
  const context = useContext(DifyContext)
  if (!context) {
    throw new Error('useDifyContext must be used within DifyProvider')
  }
  return context
}

// Componente que usa o context
export function DifyAgentSelectorWithContext() {
  const { agents, selectedAgent, setSelectedAgent, loading } = useDifyContext()
  
  return (
    <DifyAgentSelector
      agents={agents}
      selectedAgent={selectedAgent}
      onAgentChange={setSelectedAgent}
      loading={loading}
    />
  )
}
```

## 🎨 Padrões de Design

### **Compound Components**
```typescript
// components/agent-card.tsx
interface AgentCardProps {
  children: ReactNode
  className?: string
}

interface AgentCardHeaderProps {
  children: ReactNode
}

interface AgentCardContentProps {
  children: ReactNode
}

interface AgentCardActionsProps {
  children: ReactNode
}

function AgentCard({ children, className }: AgentCardProps) {
  return (
    <div className={cn("border rounded-lg p-4", className)}>
      {children}
    </div>
  )
}

function AgentCardHeader({ children }: AgentCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      {children}
    </div>
  )
}

function AgentCardContent({ children }: AgentCardContentProps) {
  return (
    <div className="text-sm text-muted-foreground mb-3">
      {children}
    </div>
  )
}

function AgentCardActions({ children }: AgentCardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  )
}

// Exportar como compound component
AgentCard.Header = AgentCardHeader
AgentCard.Content = AgentCardContent
AgentCard.Actions = AgentCardActions

export { AgentCard }

// Uso
<AgentCard>
  <AgentCard.Header>
    <h3>{agent.name}</h3>
    <Badge>{agent.category}</Badge>
  </AgentCard.Header>
  <AgentCard.Content>
    {agent.description}
  </AgentCard.Content>
  <AgentCard.Actions>
    <Button onClick={() => selectAgent(agent.id)}>
      Selecionar
    </Button>
  </AgentCard.Actions>
</AgentCard>
```

### **Render Props Pattern**
```typescript
// components/agent-data.tsx
interface AgentDataProps {
  agentId: string
  children: (data: {
    agent: DifyAgent | null
    loading: boolean
    error: string
    refetch: () => void
  }) => ReactNode
}

export function AgentData({ agentId, children }: AgentDataProps) {
  const [agent, setAgent] = useState<DifyAgent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fetchAgent = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const agentData = await fetchDifyAgent(agentId)
      setAgent(agentData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [agentId])
  
  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])
  
  return children({ agent, loading, error, refetch: fetchAgent })
}

// Uso
<AgentData agentId="agent-123">
  {({ agent, loading, error, refetch }) => {
    if (loading) return <div>Carregando...</div>
    if (error) return <div>Erro: {error}</div>
    if (!agent) return <div>Agente não encontrado</div>
    
    return (
      <div>
        <h2>{agent.name}</h2>
        <p>{agent.description}</p>
        <button onClick={refetch}>Atualizar</button>
      </div>
    )
  }}
</AgentData>
```

### **Higher-Order Components (HOCs)**
```typescript
// components/with-loading.tsx
interface WithLoadingProps {
  loading: boolean
  error?: string
}

export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(
    props: P & WithLoadingProps
  ) {
    const { loading, error, ...componentProps } = props
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    if (error) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">{error}</p>
        </div>
      )
    }
    
    return <Component {...(componentProps as P)} />
  }
}

// Uso
const DifyAgentSelectorWithLoading = withLoading(DifyAgentSelector)

<DifyAgentSelectorWithLoading
  agents={agents}
  selectedAgent={selectedAgent}
  onAgentChange={setSelectedAgent}
  loading={loading}
  error={error}
/>
```

## 🔄 Padrões de Estado

### **Estado Local**
```typescript
// Componente simples com estado local
function AgentDemo() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const result = await executeAgent(selectedAgent, message)
      setResponse(result.message)
    } catch (error) {
      setResponse('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua mensagem..."
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
      {response && <div>{response}</div>}
    </div>
  )
}
```

### **Estado Compartilhado com Context**
```typescript
// hooks/use-chat-state.ts
interface ChatState {
  messages: Message[]
  selectedModel: string
  selectedAgent: string
  loading: boolean
}

interface ChatActions {
  addMessage: (message: Message) => void
  setSelectedModel: (model: string) => void
  setSelectedAgent: (agent: string) => void
  setLoading: (loading: boolean) => void
}

export function useChatState(): ChatState & ChatActions {
  const [state, setState] = useState<ChatState>({
    messages: [],
    selectedModel: '',
    selectedAgent: '',
    loading: false,
  })
  
  const actions = useMemo(() => ({
    addMessage: (message: Message) =>
      setState(prev => ({ ...prev, messages: [...prev.messages, message] })),
    
    setSelectedModel: (model: string) =>
      setState(prev => ({ ...prev, selectedModel: model })),
    
    setSelectedAgent: (agent: string) =>
      setState(prev => ({ ...prev, selectedAgent: agent })),
    
    setLoading: (loading: boolean) =>
      setState(prev => ({ ...prev, loading })),
  }), [])
  
  return { ...state, ...actions }
}
```

## 🧪 Testabilidade

### **Componente Testável**
```typescript
// components/agent-selector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DifyAgentSelector } from './dify-agent-selector'

const mockAgents = [
  { id: '1', name: 'Agent 1', description: 'Test agent 1', category: 'Test' },
  { id: '2', name: 'Agent 2', description: 'Test agent 2', category: 'Test' },
]

describe('DifyAgentSelector', () => {
  it('renders agents correctly', () => {
    const onAgentChange = jest.fn()
    
    render(
      <DifyAgentSelector
        agents={mockAgents}
        onAgentChange={onAgentChange}
      />
    )
    
    expect(screen.getByText('Selecionar agente')).toBeInTheDocument()
  })
  
  it('calls onAgentChange when agent is selected', () => {
    const onAgentChange = jest.fn()
    
    render(
      <DifyAgentSelector
        agents={mockAgents}
        onAgentChange={onAgentChange}
      />
    )
    
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Agent 1'))
    
    expect(onAgentChange).toHaveBeenCalledWith('1')
  })
  
  it('shows loading state', () => {
    render(
      <DifyAgentSelector
        agents={[]}
        onAgentChange={jest.fn()}
        loading={true}
      />
    )
    
    expect(screen.getByText('Carregando agentes...')).toBeInTheDocument()
  })
})
```

### **Mocking de Hooks**
```typescript
// __mocks__/use-dify-agent.ts
export const mockUseDifyAgent = {
  agents: [
    { id: 'mock-1', name: 'Mock Agent', description: 'Test', category: 'Test' }
  ],
  selectedAgent: '',
  setSelectedAgent: jest.fn(),
  executeAgent: jest.fn(),
  loading: false,
  error: '',
}

// Em testes
jest.mock('@/hooks/use-dify-agent', () => ({
  useDifyAgent: () => mockUseDifyAgent
}))
```

## 📋 Checklist de Componentes

### **✅ Estrutura**
- [ ] Diretório apropriado
- [ ] Nomenclatura consistente
- [ ] Props interface definida
- [ ] Imports organizados

### **✅ Funcionalidade**
- [ ] Responsabilidade única
- [ ] Props bem tipadas
- [ ] Eventos tratados
- [ ] Estados gerenciados

### **✅ UX/UI**
- [ ] Loading states
- [ ] Error states
- [ ] Acessibilidade
- [ ] Responsividade

### **✅ Performance**
- [ ] Memoização apropriada
- [ ] Callbacks otimizados
- [ ] Re-renders minimizados
- [ ] Lazy loading se necessário

### **✅ Testabilidade**
- [ ] Testes unitários
- [ ] Mocks apropriados
- [ ] Cobertura adequada
- [ ] Casos de erro testados

---

**🎯 Componentes bem estruturados são a base de uma UI consistente e manutenível!** 