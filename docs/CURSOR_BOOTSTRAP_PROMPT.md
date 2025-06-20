# 🎯 Prompt de Bootstrap para Cursor - Execução Imediata

## 📋 INSTRUÇÕES DIRETAS PARA O CURSOR

**Use este prompt exato para implementar arquitetura de qualidade completa em um projeto novo:**

---

## 🚀 COMANDO DE EXECUÇÃO

```
Implemente uma arquitetura de qualidade enterprise completa seguindo estes passos EXATOS:

## PASSO 1: ESTRUTURA DE PASTAS
Crie a estrutura completa:
```
projeto/
├── .cursor/rules/
├── docs/
│   ├── arquitetura/
│   ├── guias/
│   └── templates/
├── lib/
│   ├── config/
│   ├── logger/
│   ├── errors/
│   ├── validation/
│   └── utils/
├── components/
│   ├── ui/
│   └── features/
├── hooks/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── helpers/
├── scripts/
└── config/
```

## PASSO 2: CONFIGURAÇÃO EXTERNA (OBRIGATÓRIO)
Crie lib/config/index.ts com sistema centralizado que:
- Carregue TODAS as env vars com Zod
- Tenha valores padrão sensatos
- Valide na inicialização
- NUNCA permita hardcode

## PASSO 3: TRATAMENTO DE ERROS (OBRIGATÓRIO)
Crie lib/errors/ com:
- Classes de erro customizadas (ValidationError, APIError, etc.)
- Error Boundary React
- Handler global de erros
- Logging estruturado de erros

## PASSO 4: VALIDAÇÃO RUNTIME (OBRIGATÓRIO)
Crie lib/validation/ com:
- Schemas Zod para TODOS os dados externos
- Type guards
- Middleware de validação
- Validação de props React críticas

## PASSO 5: LOGGING ESTRUTURADO (OBRIGATÓRIO)
Crie lib/logger/ com:
- Logger centralizado com contexto
- Diferentes níveis por ambiente
- Performance monitoring
- Hook useLogger para React

## PASSO 6: TESTES (OBRIGATÓRIO)
Configure:
- Vitest para unit tests
- Playwright para E2E
- Coverage > 80%
- Mocks e fixtures
- Test utils

## PASSO 7: DOCUMENTAÇÃO (OBRIGATÓRIO)
Configure:
- TypeDoc automático
- JSDoc obrigatório
- Templates de documentação
- README completo

## PASSO 8: REGRAS DO CURSOR
Crie .cursor/rules/ com regras que FORCEM:
1. configuracao-externa.mdc - NUNCA hardcode
2. tratamento-erros.mdc - SEMPRE trate erros
3. documentacao.mdc - JSDoc obrigatório
4. type-safety.mdc - Validação runtime
5. testes.mdc - Testes para código crítico
6. logging.mdc - Logs estruturados

## PASSO 9: SCRIPTS DE AUTOMAÇÃO
Crie scripts/:
- setup-development.js
- validate-config.js
- generate-docs.js

## PASSO 10: CONFIGURAÇÕES
Configure:
- tsconfig.json com paths
- vitest.config.ts
- playwright.config.ts
- .env.example completo
- package.json com scripts

IMPORTANTE: Implemente TUDO seguindo os padrões de qualidade desde o primeiro arquivo. Cada função deve ter JSDoc, tratamento de erro, validação e logging apropriados.
```

---

## 🎯 RESULTADO ESPERADO

Após executar este prompt, o projeto terá:

### ✅ ESTRUTURA COMPLETA
- Todas as pastas criadas
- Arquivos base implementados
- Configurações funcionando

### ✅ 6 PILARES IMPLEMENTADOS
1. **Configuração Externa** - Sistema centralizado com Zod
2. **Tratamento de Erros** - Classes customizadas + Error Boundaries
3. **Documentação** - JSDoc + TypeDoc automático
4. **Type Safety** - Validação runtime obrigatória
5. **Testes** - Vitest + Playwright configurados
6. **Logging** - Sistema estruturado completo

### ✅ AUTOMAÇÃO ATIVA
- Regras do Cursor funcionando
- Scripts de setup prontos
- Validação automática
- Documentação auto-gerada

### ✅ QUALIDADE GARANTIDA
- Sem hardcode possível
- Erros sempre tratados
- Código autodocumentado
- Dados sempre validados
- Operações sempre logadas

---

## 🚀 COMO USAR

### Para Projeto Novo:
1. Crie pasta do projeto
2. Abra no Cursor
3. Cole o COMANDO DE EXECUÇÃO acima
4. Execute
5. Pronto! Arquitetura enterprise implementada

### Para Projeto Existente:
1. Faça backup
2. Cole o comando
3. Cursor adaptará estrutura existente
4. Migre código gradualmente

---

## 🎯 EXEMPLOS DE CÓDIGO QUE SERÁ GERADO

### Configuração (lib/config/index.ts)
```typescript
import { z } from 'zod'

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  API_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('5000'),
  // ... todas as configs
})

export const config = ConfigSchema.parse(process.env)
```

### Logger (lib/logger/index.ts)
```typescript
interface LogContext {
  userId?: string
  requestId?: string
  operation?: string
  [key: string]: any
}

class Logger {
  info(message: string, context?: LogContext) {
    // implementação estruturada
  }
  // ... outros métodos
}

export const logger = new Logger()
```

### Validação (lib/validation/schemas.ts)
```typescript
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1)
})

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.string().optional()
})
```

### Error Boundary (lib/errors/boundary.tsx)
```typescript
export class ErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    logger.error('React Error Boundary caught error', {}, error)
    return { hasError: true }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

---

## 🎉 BENEFÍCIOS IMEDIATOS

### Para Desenvolvedores:
- ✅ **Padrões claros** desde o primeiro dia
- ✅ **Erros prevenidos** automaticamente
- ✅ **Código autodocumentado**
- ✅ **Testes já configurados**
- ✅ **Debugging facilitado** com logs

### Para o Projeto:
- ✅ **Qualidade enterprise** desde o início
- ✅ **Manutenibilidade** garantida
- ✅ **Escalabilidade** preparada
- ✅ **Observabilidade** completa
- ✅ **Onboarding** acelerado

### Para a Equipe:
- ✅ **Consistência** em todo código
- ✅ **Produtividade** aumentada
- ✅ **Bugs** reduzidos drasticamente
- ✅ **Refatoração** segura
- ✅ **Deploy** confiável

---

## 🔥 DIFERENCIAL COMPETITIVO

Com este bootstrap, você tem:

### 🏆 **Arquitetura Enterprise**
- Padrões de grandes empresas
- Práticas de mercado consolidadas
- Estrutura escalável desde o início

### 🤖 **Automação Total**
- Cursor aplica regras automaticamente
- Qualidade garantida por IA
- Desenvolvimento acelerado

### 📊 **Observabilidade Completa**
- Logs estruturados desde o dia 1
- Debugging facilitado
- Monitoramento pronto

### 🛡️ **Confiabilidade Máxima**
- Erros tratados adequadamente
- Validação em todas as camadas
- Testes automatizados

---

## 💡 DICA FINAL

**Este não é apenas um template - é um sistema completo de desenvolvimento de qualidade enterprise que será aplicado automaticamente pelo Cursor em cada linha de código que você escrever!**

**Resultado: Código profissional, confiável e escalável desde o primeiro commit.** 🚀 