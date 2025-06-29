# 🔌 Padrão de Integração com APIs Externas

## 🎯 Visão Geral

Este documento define o padrão para integração com APIs externas, baseado na experiência bem-sucedida com a integração Dify.

## 📋 Estrutura Padrão de Integração

### **1. Organização de Arquivos**
```
lib/ai/[provider]/
├── types.ts              # Tipos e interfaces
├── config.ts             # Configurações
├── api.ts                # Cliente da API
├── agents.ts             # Lógica específica (se aplicável)
└── utils.ts              # Utilitários

components/
├── [provider]-selector.tsx    # Seletor de recursos
└── [provider]-component.tsx   # Componentes específicos

hooks/
└── use-[provider].ts     # Hook de gerenciamento

app/(chat)/api/[provider]/
└── route.ts              # API route Next.js

scripts/
├── list-[provider]-resources.js  # Script de listagem
└── test-[provider].js            # Script de teste
```

### **2. Exemplo Completo: Integração Dify**
```
lib/ai/dify/
├── types.ts              # DifyAgent, DifyResponse
├── config.ts             # Configurações Dify
├── api.ts                # Cliente Dify API
├── agents.ts             # Lógica de agentes
└── utils.ts              # Utilitários Dify

components/
├── dify-agent-selector.tsx
└── dify-status.tsx

hooks/
└── use-dify-agent.ts

app/(chat)/api/dify/
└── route.ts

scripts/
├── list-dify-agents.js
└── test-dify-agent.js
```

## 🏗️ Implementação Passo a Passo

### **Passo 1: Definir Tipos e Interfaces**
```typescript
// lib/ai/[provider]/types.ts
export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  enabled: boolean
}

export interface ProviderResource {
  id: string
  name: string
  description: string
  category?: string
}

export interface ProviderResponse {
  success: boolean
  data?: any
  error?: string
}

export interface ProviderClient {
  listResources(): Promise<ProviderResource[]>
  executeAction(id: string, params: any): Promise<ProviderResponse>
}
```

### **Passo 2: Configuração**
```typescript
// lib/ai/[provider]/config.ts
export const providerConfig: ProviderConfig = {
  apiKey: process.env.PROVIDER_API_KEY || '',
  baseUrl: process.env.PROVIDER_BASE_URL || 'https://api.provider.com',
  enabled: process.env.PROVIDER_ENABLED === 'true',
}

export const validateConfig = (): boolean => {
  return !!(providerConfig.apiKey && providerConfig.baseUrl)
}
```

### **Passo 3: Cliente da API**
```typescript
// lib/ai/[provider]/api.ts
export class ProviderAPIClient implements ProviderClient {
  private config: ProviderConfig
  
  constructor(config: ProviderConfig) {
    this.config = config
  }
  
  async listResources(): Promise<ProviderResource[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/resources`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.resources || []
    } catch (error) {
      console.error('Error listing resources:', error)
      throw error
    }
  }
  
  async executeAction(id: string, params: any): Promise<ProviderResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/execute/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Handle streaming response if applicable
      if (response.headers.get('content-type')?.includes('text/stream')) {
        return this.handleStreamingResponse(response)
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error executing action:', error)
      return { success: false, error: error.message }
    }
  }
  
  private async handleStreamingResponse(response: Response): Promise<ProviderResponse> {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result = ''
    
    if (!reader) {
      throw new Error('No response body reader available')
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        result += chunk
        
        this.processStreamChunk(chunk)
      }
      
      return { success: true, data: result }
    } finally {
      reader.releaseLock()
    }
  }
  
  private processStreamChunk(chunk: string): void {
    console.log('Processing chunk:', chunk)
  }
}
```

### **Passo 4: Hook de Gerenciamento**
```typescript
// hooks/use-[provider].ts
import { useState, useEffect, useCallback } from 'react'
import { ProviderAPIClient } from '@/lib/ai/[provider]/api'
import { providerConfig } from '@/lib/ai/[provider]/config'

export function useProvider() {
  const [client] = useState(() => new ProviderAPIClient(providerConfig))
  const [resources, setResources] = useState<ProviderResource[]>([])
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const loadResources = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const resourceList = await client.listResources()
      setResources(resourceList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [client])
  
  const executeResource = useCallback(async (id: string, params: any) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await client.executeAction(id, params)
      if (!result.success) {
        throw new Error(result.error || 'Execution failed')
      }
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [client])
  
  useEffect(() => {
    loadResources()
  }, [loadResources])
  
  return {
    resources,
    selectedResource,
    setSelectedResource,
    executeResource,
    loading,
    error,
    refetch: loadResources,
  }
}
```

### **Passo 5: Componente Seletor**
```typescript
// components/[provider]-selector.tsx
import { useProvider } from '@/hooks/use-[provider]'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProviderSelectorProps {
  onResourceChange?: (resourceId: string) => void
}

export function ProviderSelector({ onResourceChange }: ProviderSelectorProps) {
  const { resources, selectedResource, setSelectedResource, loading } = useProvider()
  
  const handleResourceChange = (resourceId: string) => {
    setSelectedResource(resourceId)
    onResourceChange?.(resourceId)
  }
  
  const groupedResources = resources.reduce((acc, resource) => {
    const category = resource.category || 'Geral'
    if (!acc[category]) acc[category] = []
    acc[category].push(resource)
    return acc
  }, {} as Record<string, ProviderResource[]>)
  
  return (
    <Select value={selectedResource} onValueChange={handleResourceChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={loading ? "Carregando..." : "Selecionar recurso"} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedResources).map(([category, categoryResources]) => (
          <div key={category}>
            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
              {category}
            </div>
            {categoryResources.map((resource) => (
              <SelectItem key={resource.id} value={resource.id}>
                <div className="flex flex-col">
                  <span>{resource.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {resource.description}
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

### **Passo 6: API Route**
```typescript
// app/(chat)/api/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ProviderAPIClient } from '@/lib/ai/[provider]/api'
import { providerConfig, validateConfig } from '@/lib/ai/[provider]/config'

export async function GET() {
  if (!validateConfig()) {
    return NextResponse.json(
      { error: 'Provider not configured' },
      { status: 500 }
    )
  }
  
  try {
    const client = new ProviderAPIClient(providerConfig)
    const resources = await client.listResources()
    
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!validateConfig()) {
    return NextResponse.json(
      { error: 'Provider not configured' },
      { status: 500 }
    )
  }
  
  try {
    const { resourceId, params } = await request.json()
    
    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }
    
    const client = new ProviderAPIClient(providerConfig)
    const result = await client.executeAction(resourceId, params)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: result.data })
  } catch (error) {
    console.error('Error executing resource:', error)
    return NextResponse.json(
      { error: 'Failed to execute resource' },
      { status: 500 }
    )
  }
}
```

## 🛠️ Scripts Utilitários

### **Script de Listagem**
```javascript
// scripts/list-[provider]-resources.js
const { ProviderAPIClient } = require('../lib/ai/[provider]/api')
const { providerConfig } = require('../lib/ai/[provider]/config')

async function listResources() {
  console.log('🔍 Listando recursos do Provider...\n')
  
  const client = new ProviderAPIClient(providerConfig)
  
  try {
    const resources = await client.listResources()
    
    console.log(`✅ Encontrados ${resources.length} recursos:\n`)
    
    resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name}`)
      console.log(`   ID: ${resource.id}`)
      console.log(`   Descrição: ${resource.description}`)
      console.log(`   Categoria: ${resource.category || 'N/A'}`)
      console.log('')
    })
    
    console.log('📋 Configurações de ambiente sugeridas:')
    resources.forEach((resource, index) => {
      const envName = `NEXT_PUBLIC_PROVIDER_RESOURCE_${index + 1}`
      console.log(`${envName}=${resource.id}`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao listar recursos:', error.message)
    process.exit(1)
  }
}

listResources()
```

### **Script de Teste**
```javascript
// scripts/test-[provider].js
const { ProviderAPIClient } = require('../lib/ai/[provider]/api')
const { providerConfig } = require('../lib/ai/[provider]/config')

async function testProvider(resourceId, testParams) {
  console.log(`🧪 Testando Provider - Recurso: ${resourceId}\n`)
  
  const client = new ProviderAPIClient(providerConfig)
  
  try {
    console.log('📤 Enviando requisição...')
    const result = await client.executeAction(resourceId, testParams)
    
    if (result.success) {
      console.log('✅ Teste bem-sucedido!')
      console.log('📥 Resposta:', result.data)
    } else {
      console.log('❌ Teste falhou:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message)
    process.exit(1)
  }
}

const resourceId = process.argv[2]
const testMessage = process.argv[3] || 'Teste de integração'

if (!resourceId) {
  console.log('Uso: node test-[provider].js <RESOURCE_ID> [TEST_MESSAGE]')
  process.exit(1)
}

testProvider(resourceId, { message: testMessage })
```

## 📋 Checklist de Integração

### **✅ Estrutura de Arquivos**
- [ ] Diretório `lib/ai/[provider]/` criado
- [ ] Arquivo `types.ts` com interfaces
- [ ] Arquivo `config.ts` com configurações
- [ ] Arquivo `api.ts` com cliente
- [ ] Hook `use-[provider].ts` criado
- [ ] Componente seletor criado
- [ ] API route criada

### **✅ Funcionalidades**
- [ ] Listagem de recursos
- [ ] Execução de ações
- [ ] Tratamento de erros
- [ ] Suporte a streaming (se aplicável)
- [ ] Validação de configuração
- [ ] Loading states

### **✅ Scripts e Ferramentas**
- [ ] Script de listagem
- [ ] Script de teste
- [ ] Comandos npm/pnpm adicionados
- [ ] Logs estruturados

### **✅ Documentação**
- [ ] README específico da integração
- [ ] Guia de configuração
- [ ] Exemplos de uso
- [ ] Troubleshooting

### **✅ Configuração**
- [ ] Variáveis de ambiente definidas
- [ ] Validação de configuração
- [ ] Fallbacks apropriados
- [ ] Configuração de desenvolvimento/produção

## 🔄 Padrões de Fallback

### **Fallback Inteligente**
```typescript
// Exemplo de fallback para modelo padrão
if (selectedProviderResource && providerConfig.enabled) {
  try {
    return await executeProviderAction(resourceId, params)
  } catch (error) {
    console.warn('Provider failed, falling back to default:', error)
    return await executeDefaultModel(params)
  }
} else {
  return await executeDefaultModel(params)
}
```

### **Graceful Degradation**
```typescript
// Degradação gradual de funcionalidades
const features = {
  streaming: providerConfig.supportsStreaming,
  multimodal: providerConfig.supportsMultimodal,
  customModels: providerConfig.supportsCustomModels,
}

// Adaptar UI baseado nas capacidades
if (!features.streaming) {
  // Usar loading spinner em vez de streaming
}
```

---

**🎯 Este padrão garante integrações consistentes, robustas e fáceis de manter!** 