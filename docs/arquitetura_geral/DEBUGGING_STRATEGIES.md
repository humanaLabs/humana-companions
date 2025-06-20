# 🔍 Estratégias de Debug e Troubleshooting

## 🎯 Filosofia de Debug

### **1. Debug Proativo**
Implementar ferramentas de debug antes que problemas apareçam.

### **2. Logging Estruturado**
Logs organizados e informativos para facilitar diagnóstico.

### **3. Scripts Utilitários**
Ferramentas automatizadas para diagnóstico rápido.

### **4. Documentação de Problemas**
Catalogar problemas comuns e suas soluções.

## 🛠️ Ferramentas de Debug

### **Scripts de Diagnóstico**
```javascript
// scripts/diagnose-dify.js
const { DifyClient } = require('../lib/ai/dify/api')

async function diagnose() {
  console.log('🔍 Diagnóstico Dify - Iniciando...\n')
  
  // 1. Verificar configuração
  console.log('📋 1. Verificando configuração...')
  const config = {
    apiKey: process.env.DIFY_API_KEY,
    baseUrl: process.env.DIFY_BASE_URL,
  }
  
  if (!config.apiKey) {
    console.log('❌ DIFY_API_KEY não configurada')
    return
  }
  
  if (!config.baseUrl) {
    console.log('❌ DIFY_BASE_URL não configurada')
    return
  }
  
  console.log('✅ Configuração OK')
  
  // 2. Testar conectividade
  console.log('\n🌐 2. Testando conectividade...')
  try {
    const client = new DifyClient(config)
    const agents = await client.listAgents()
    console.log(`✅ Conectividade OK - ${agents.length} agentes encontrados`)
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message)
    return
  }
  
  // 3. Testar agente específico
  console.log('\n🤖 3. Testando agente padrão...')
  const defaultAgentId = process.env.NEXT_PUBLIC_DIFY_AGENT_DEFAULT
  
  if (defaultAgentId) {
    try {
      const response = await client.executeAgent(defaultAgentId, 'Teste de diagnóstico')
      console.log('✅ Agente padrão funcionando')
    } catch (error) {
      console.log('❌ Erro no agente padrão:', error.message)
    }
  } else {
    console.log('⚠️ Agente padrão não configurado')
  }
  
  console.log('\n🎉 Diagnóstico concluído!')
}

diagnose().catch(console.error)
```

### **Logger Estruturado**
```typescript
// lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }
    
    // Em desenvolvimento, log colorido no console
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${timestamp} - ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      )
    } else {
      // Em produção, log estruturado
      console.log(JSON.stringify(logEntry))
    }
  }
  
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }
  
  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()

// Uso específico para Dify
export const difyLogger = {
  agentSelected: (agentId: string) => 
    logger.info('Dify agent selected', { component: 'dify', action: 'select', agentId }),
    
  agentExecuting: (agentId: string, messageLength: number) =>
    logger.info('Dify agent executing', { 
      component: 'dify', 
      action: 'execute', 
      agentId, 
      messageLength 
    }),
    
  agentSuccess: (agentId: string, responseLength: number) =>
    logger.info('Dify agent success', { 
      component: 'dify', 
      action: 'success', 
      agentId, 
      responseLength 
    }),
    
  agentError: (agentId: string, error: string) =>
    logger.error('Dify agent error', { 
      component: 'dify', 
      action: 'error', 
      agentId, 
      error 
    }),
}
```

### **Debug Hooks**
```typescript
// hooks/use-debug.ts
import { useEffect, useRef } from 'react'
import { logger } from '@/lib/utils/logger'

export function useDebugValue<T>(value: T, name: string) {
  const prevValue = useRef<T>()
  
  useEffect(() => {
    if (prevValue.current !== value) {
      logger.debug(`${name} changed`, { 
        from: prevValue.current, 
        to: value 
      })
      prevValue.current = value
    }
  }, [value, name])
}

export function useDebugRender(componentName: string) {
  const renderCount = useRef(0)
  
  useEffect(() => {
    renderCount.current += 1
    logger.debug(`${componentName} rendered`, { 
      count: renderCount.current 
    })
  })
}

export function useDebugEffect(effect: () => void, deps: any[], name: string) {
  useEffect(() => {
    logger.debug(`Effect ${name} triggered`, { deps })
    return effect()
  }, deps)
}

// Uso
function DifyAgentSelector({ agents, selectedAgent }: Props) {
  useDebugRender('DifyAgentSelector')
  useDebugValue(selectedAgent, 'selectedAgent')
  useDebugValue(agents.length, 'agentsCount')
  
  // resto do componente
}
```

## 🚨 Tratamento de Erros

### **Error Boundaries**
```typescript
// components/error-boundary.tsx
import { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
    
    this.props.onError?.(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium">Algo deu errado</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Uso
<ErrorBoundary>
  <DifyAgentSelector />
</ErrorBoundary>
```

### **Tratamento Global de Erros**
```typescript
// lib/utils/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    logger.error('Unhandled error', { 
      message: error.message, 
      stack: error.stack 
    })
    
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      { originalError: error.message }
    )
  }
  
  return new AppError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500
  )
}

// Hook para tratamento de erros
export function useErrorHandler() {
  return useCallback((error: unknown) => {
    const appError = handleApiError(error)
    
    // Mostrar toast ou notificação
    toast.error(appError.message)
    
    // Log do erro
    logger.error('Error handled by hook', {
      code: appError.code,
      statusCode: appError.statusCode,
      context: appError.context,
    })
    
    return appError
  }, [])
}
```

## 🧪 Ferramentas de Teste

### **Testes de Integração**
```typescript
// tests/integration/dify.test.ts
import { DifyClient } from '@/lib/ai/dify/api'

describe('Dify Integration', () => {
  let client: DifyClient
  
  beforeAll(() => {
    client = new DifyClient({
      apiKey: process.env.TEST_DIFY_API_KEY!,
      baseUrl: process.env.TEST_DIFY_BASE_URL!,
    })
  })
  
  it('should list agents', async () => {
    const agents = await client.listAgents()
    expect(agents).toBeInstanceOf(Array)
    expect(agents.length).toBeGreaterThan(0)
  })
  
  it('should execute agent', async () => {
    const agents = await client.listAgents()
    const firstAgent = agents[0]
    
    const response = await client.executeAgent(
      firstAgent.id, 
      'Test message'
    )
    
    expect(response.success).toBe(true)
    expect(response.data).toBeDefined()
  })
  
  it('should handle invalid agent ID', async () => {
    await expect(
      client.executeAgent('invalid-id', 'Test message')
    ).rejects.toThrow()
  })
})
```

### **Mocks para Desenvolvimento**
```typescript
// lib/mocks/dify.ts
export const mockDifyAgents = [
  {
    id: 'app-mock-1',
    name: 'Assistente Mock',
    description: 'Agente de teste para desenvolvimento',
    category: 'Desenvolvimento',
  },
  {
    id: 'app-mock-2',
    name: 'Debug Helper',
    description: 'Ajuda com debugging',
    category: 'Desenvolvimento',
  },
]

export class MockDifyClient {
  async listAgents() {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockDifyAgents
  }
  
  async executeAgent(id: string, message: string) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (id === 'app-mock-error') {
      throw new Error('Mock error for testing')
    }
    
    return {
      success: true,
      data: {
        message: `Mock response for: ${message}`,
        agentId: id,
      }
    }
  }
}

// Uso condicional
export function createDifyClient() {
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DIFY) {
    return new MockDifyClient()
  }
  
  return new DifyClient({
    apiKey: process.env.DIFY_API_KEY!,
    baseUrl: process.env.DIFY_BASE_URL!,
  })
}
```

## 📊 Monitoramento em Tempo Real

### **Performance Monitoring**
```typescript
// lib/utils/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      logger.info('Performance measurement', {
        operation: name,
        duration: Math.round(duration),
        unit: 'ms',
      })
      
      resolve(result)
    } catch (error) {
      const duration = performance.now() - start
      
      logger.error('Performance measurement failed', {
        operation: name,
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      
      reject(error)
    }
  })
}

// Hook para medir performance de componentes
export function usePerformanceTracker(componentName: string) {
  const renderStart = useRef<number>()
  
  useLayoutEffect(() => {
    renderStart.current = performance.now()
  })
  
  useEffect(() => {
    if (renderStart.current) {
      const duration = performance.now() - renderStart.current
      logger.debug('Component render time', {
        component: componentName,
        duration: Math.round(duration),
      })
    }
  })
}
```

### **Health Checks**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { DifyClient } from '@/lib/ai/dify/api'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {} as Record<string, any>,
  }
  
  // Check Dify service
  try {
    const difyClient = new DifyClient({
      apiKey: process.env.DIFY_API_KEY!,
      baseUrl: process.env.DIFY_BASE_URL!,
    })
    
    const agents = await difyClient.listAgents()
    health.services.dify = {
      status: 'ok',
      agentCount: agents.length,
    }
  } catch (error) {
    health.status = 'degraded'
    health.services.dify = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
  
  // Check database (if applicable)
  try {
    // Database health check logic
    health.services.database = { status: 'ok' }
  } catch (error) {
    health.status = 'degraded'
    health.services.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
```

## 📋 Checklist de Debug

### **✅ Preparação**
- [ ] Logger estruturado implementado
- [ ] Scripts de diagnóstico criados
- [ ] Error boundaries configurados
- [ ] Health checks implementados

### **✅ Durante o Debug**
- [ ] Logs relevantes ativados
- [ ] Scripts de diagnóstico executados
- [ ] Network tab verificado
- [ ] Console errors analisados

### **✅ Resolução**
- [ ] Causa raiz identificada
- [ ] Solução implementada
- [ ] Testes de regressão executados
- [ ] Documentação atualizada

### **✅ Prevenção**
- [ ] Problema documentado
- [ ] Script de diagnóstico atualizado
- [ ] Testes automatizados adicionados
- [ ] Monitoramento melhorado

---

**🎯 Debug eficiente economiza tempo e reduz stress!** 