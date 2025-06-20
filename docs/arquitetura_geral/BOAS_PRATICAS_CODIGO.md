# 🛠️ Boas Práticas de Código

## 🎯 Princípios Fundamentais

### **1. Código Limpo e Legível**
O código deve ser fácil de ler e entender por outros desenvolvedores.

### **2. Consistência**
Seguir padrões consistentes em todo o projeto.

### **3. Configuração Externa**
**NUNCA hardcode valores que podem mudar.** Sempre use arquivos de configuração.

### **4. Testabilidade**
Escrever código que seja fácil de testar.

### **5. Manutenibilidade**
Facilitar futuras modificações e extensões.

## 📁 Estrutura de Arquivos

### **Organização por Funcionalidade**
```typescript
// ✅ Bom: Agrupado por funcionalidade
lib/ai/dify/
├── types.ts
├── api.ts
├── agents.ts
└── utils.ts

// ❌ Evitar: Agrupado por tipo de arquivo
lib/
├── types/
│   └── dify.ts
├── apis/
│   └── dify.ts
└── utils/
    └── dify.ts
```

### **Convenções de Nomenclatura**
```typescript
// ✅ Arquivos: kebab-case
dify-agent-selector.tsx
use-dify-agent.ts

// ✅ Componentes: PascalCase
export function DifyAgentSelector() {}

// ✅ Funções: camelCase
export function fetchDifyAgents() {}

// ✅ Constantes: UPPER_SNAKE_CASE
export const DIFY_API_TIMEOUT = 30000

// ✅ Tipos/Interfaces: PascalCase
export interface DifyAgent {}
export type DifyResponse = {}
```

## 🔧 Padrões de Código

### **Configuração Externa vs Hardcode**
```typescript
// ❌ RUIM - Valores hardcoded
const API_TIMEOUT = 5000
const DIFY_BASE_URL = 'https://api.dify.ai'
const MAX_RETRIES = 3

function fetchAgent() {
  return fetch('https://api.dify.ai/agents', {
    timeout: 5000
  })
}

// ✅ BOM - Configuração externa
import { appConfig } from '@/lib/config'

const API_TIMEOUT = appConfig.get<number>('api.timeout')
const DIFY_BASE_URL = appConfig.get<string>('dify.baseUrl')
const MAX_RETRIES = appConfig.get<number>('api.maxRetries')

function fetchAgent() {
  return fetch(appConfig.get('dify.baseUrl') + '/agents', {
    timeout: appConfig.get('api.timeout')
  })
}

// ✅ MELHOR - Com valores padrão
const config = {
  api: {
    timeout: Number(process.env.API_TIMEOUT) || 5000,
    maxRetries: Number(process.env.MAX_RETRIES) || 3
  },
  dify: {
    baseUrl: process.env.DIFY_BASE_URL || 'https://api.dify.ai',
    apiKey: process.env.DIFY_API_KEY || ''
  }
}
```

### **Interfaces e Tipos**
```typescript
// ✅ Interfaces bem definidas
export interface DifyAgent {
  id: string
  name: string
  description: string
  category: string
  endpoint?: string
  apiKey?: string
}

// ✅ Tipos union para estados
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// ✅ Tipos genéricos quando apropriado
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### **Tratamento de Erros**
```typescript
// ✅ Tratamento robusto de erros
export async function fetchDifyAgents(): Promise<DifyAgent[]> {
  try {
    const response = await fetch('/api/dify')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.agents || []
  } catch (error) {
    console.error('Error fetching Dify agents:', error)
    
    // Re-throw com contexto adicional
    throw new Error(
      `Failed to fetch Dify agents: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ✅ Validação de entrada
export function validateDifyConfig(config: Partial<DifyConfig>): DifyConfig {
  if (!config.apiKey) {
    throw new Error('Dify API key is required')
  }
  
  if (!config.baseUrl) {
    throw new Error('Dify base URL is required')
  }
  
  return config as DifyConfig
}
```

### **Funções Puras e Utilitárias**
```typescript
// ✅ Funções puras (sem efeitos colaterais)
export function formatAgentName(agent: DifyAgent): string {
  return `${agent.name} (${agent.category})`
}

// ✅ Funções utilitárias reutilizáveis
export function isValidDifyId(id: string): boolean {
  return /^app-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
}

// ✅ Funções com parâmetros opcionais bem definidos
export function createDifyClient(config: {
  apiKey: string
  baseUrl?: string
  timeout?: number
}): DifyClient {
  return new DifyClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || 'https://api.dify.ai',
    timeout: config.timeout || 30000,
  })
}
```

## ⚛️ Padrões React

### **Componentes Funcionais**
```typescript
// ✅ Componente bem estruturado
interface DifyAgentSelectorProps {
  agents: DifyAgent[]
  selectedAgent?: string
  onAgentChange: (agentId: string) => void
  loading?: boolean
  disabled?: boolean
}

export function DifyAgentSelector({
  agents,
  selectedAgent,
  onAgentChange,
  loading = false,
  disabled = false,
}: DifyAgentSelectorProps) {
  // Lógica do componente
  const groupedAgents = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const category = agent.category || 'Geral'
      if (!acc[category]) acc[category] = []
      acc[category].push(agent)
      return acc
    }, {} as Record<string, DifyAgent[]>)
  }, [agents])
  
  return (
    <Select
      value={selectedAgent}
      onValueChange={onAgentChange}
      disabled={disabled || loading}
    >
      {/* JSX */}
    </Select>
  )
}
```

### **Hooks Customizados**
```typescript
// ✅ Hook bem estruturado
export function useDifyAgent() {
  const [agents, setAgents] = useState<DifyAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Função para carregar agentes
  const loadAgents = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const agentList = await fetchDifyAgents()
      setAgents(agentList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Função para executar agente
  const executeAgent = useCallback(async (agentId: string, message: string) => {
    if (!agentId) {
      throw new Error('Agent ID is required')
    }
    
    setLoading(true)
    try {
      return await executeDifyAgent(agentId, message)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Carregar agentes na inicialização
  useEffect(() => {
    loadAgents()
  }, [loadAgents])
  
  return {
    agents,
    selectedAgent,
    setSelectedAgent,
    executeAgent,
    loading,
    error,
    refetch: loadAgents,
  }
}
```

### **Gerenciamento de Estado**
```typescript
// ✅ Estado local para componentes específicos
function DifyAgentDemo() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  
  // Estado local é apropriado aqui
}

// ✅ Context para estado compartilhado
interface DifyContextType {
  agents: DifyAgent[]
  selectedAgent: string
  setSelectedAgent: (id: string) => void
}

export const DifyContext = createContext<DifyContextType | null>(null)

export function DifyProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<DifyAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  
  const value = useMemo(() => ({
    agents,
    selectedAgent,
    setSelectedAgent,
  }), [agents, selectedAgent])
  
  return (
    <DifyContext.Provider value={value}>
      {children}
    </DifyContext.Provider>
  )
}
```

## 🔍 Logging e Debug

### **Logging Estruturado**
```typescript
// ✅ Logs informativos e estruturados
export async function executeDifyAgent(agentId: string, message: string) {
  console.log('Executing Dify agent:', { agentId, messageLength: message.length })
  
  try {
    const response = await fetch('/api/dify', {
      method: 'POST',
      body: JSON.stringify({ agentId, message }),
    })
    
    console.log('Dify response:', { status: response.status, ok: response.ok })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Dify execution completed successfully')
    
    return data
  } catch (error) {
    console.error('Dify execution failed:', {
      agentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

// ✅ Debug condicional
const DEBUG = process.env.NODE_ENV === 'development'

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data)
  }
}
```

### **Tratamento de Streaming**
```typescript
// ✅ Streaming bem implementado
export async function handleDifyStream(response: Response) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  if (!reader) {
    throw new Error('No response body reader available')
  }
  
  try {
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        // Processar buffer final se necessário
        if (buffer.trim()) {
          processStreamChunk(buffer)
        }
        break
      }
      
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // Processar linhas completas
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Manter linha incompleta no buffer
      
      for (const line of lines) {
        if (line.trim()) {
          processStreamChunk(line)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function processStreamChunk(chunk: string) {
  try {
    if (chunk.startsWith('data: ')) {
      const data = JSON.parse(chunk.slice(6))
      handleStreamData(data)
    }
  } catch (error) {
    console.warn('Failed to parse stream chunk:', chunk)
  }
}
```

## 🧪 Testabilidade

### **Funções Testáveis**
```typescript
// ✅ Função pura - fácil de testar
export function formatDifyResponse(response: DifyResponse): string {
  if (!response.success) {
    return `Error: ${response.error}`
  }
  
  return response.data?.message || 'No message'
}

// ✅ Injeção de dependências
export function createDifyService(client: DifyClient) {
  return {
    async getAgents() {
      return client.listAgents()
    },
    
    async executeAgent(id: string, message: string) {
      return client.executeAgent(id, message)
    }
  }
}

// ✅ Testável com mocks
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      
      if (i === maxRetries - 1) throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  throw new Error('Max retries reached')
}
```

## 📊 Performance

### **Otimizações React**
```typescript
// ✅ Memoização apropriada
const DifyAgentSelector = memo(function DifyAgentSelector({
  agents,
  selectedAgent,
  onAgentChange,
}: DifyAgentSelectorProps) {
  const groupedAgents = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const category = agent.category || 'Geral'
      if (!acc[category]) acc[category] = []
      acc[category].push(agent)
      return acc
    }, {} as Record<string, DifyAgent[]>)
  }, [agents])
  
  const handleChange = useCallback((agentId: string) => {
    onAgentChange(agentId)
  }, [onAgentChange])
  
  return (
    // JSX
  )
})

// ✅ Lazy loading
const DifyAgentDemo = lazy(() => import('./dify-agent-demo'))

// ✅ Debounce para inputs
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}
```

## 📋 Checklist de Qualidade

### **✅ Estrutura**
- [ ] Arquivos organizados por funcionalidade
- [ ] Nomenclatura consistente
- [ ] Imports organizados
- [ ] Exports explícitos

### **✅ Código**
- [ ] Funções pequenas e focadas
- [ ] Tratamento de erros robusto
- [ ] Tipos TypeScript bem definidos
- [ ] Comentários quando necessário

### **✅ Documentação Visual**
- [ ] Diagrama de arquitetura atualizado
- [ ] Fluxos de integração documentados
- [ ] Estrutura de componentes visualizada
- [ ] Diagramas sincronizados com código

### **✅ React**
- [ ] Componentes funcionais
- [ ] Props bem tipadas
- [ ] Hooks apropriados
- [ ] Memoização quando necessário

### **✅ Performance**
- [ ] Lazy loading implementado
- [ ] Debounce em inputs
- [ ] Memoização de cálculos pesados
- [ ] Otimização de re-renders

### **✅ Testabilidade**
- [ ] Funções puras quando possível
- [ ] Injeção de dependências
- [ ] Mocks facilitados
- [ ] Cobertura de testes adequada

---

**🎯 Código de qualidade é a base para um projeto sustentável!** 