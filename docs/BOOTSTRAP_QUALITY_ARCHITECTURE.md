# 🚀 Bootstrap de Arquitetura de Qualidade - Guia Completo

## 📋 Visão Geral

Este guia permite implementar uma arquitetura de qualidade completa em qualquer projeto novo, seguindo os padrões estabelecidos no Humana Companions. Use este documento como entrada para o Cursor gerar toda a estrutura necessária.

## 🎯 Objetivo

Criar um projeto com:
- ✅ **6 Pilares de Qualidade** implementados
- ✅ **Regras automatizadas** do Cursor
- ✅ **Documentação completa**
- ✅ **Estrutura de pastas padronizada**
- ✅ **Configurações de desenvolvimento**
- ✅ **Scripts e automações**

---

## 🏗️ FASE 1: Estrutura Base e Configurações

### 1.1 Estrutura de Pastas Obrigatória

```
projeto/
├── .cursor/
│   └── rules/                    # Regras do Cursor
├── docs/
│   ├── arquitetura/             # Documentação arquitetural
│   ├── guias/                   # Guias de desenvolvimento
│   └── templates/               # Templates de documentação
├── lib/
│   ├── config/                  # Configuração centralizada
│   ├── logger/                  # Sistema de logging
│   ├── errors/                  # Classes de erro customizadas
│   ├── validation/              # Schemas de validação
│   └── utils/                   # Utilitários gerais
├── components/
│   ├── ui/                      # Componentes base
│   └── features/                # Componentes de funcionalidade
├── hooks/                       # Hooks customizados
├── tests/
│   ├── unit/                    # Testes unitários
│   ├── integration/             # Testes de integração
│   ├── e2e/                     # Testes end-to-end
│   ├── fixtures/                # Dados de teste
│   └── helpers/                 # Utilitários de teste
├── scripts/                     # Scripts de automação
└── config/                      # Arquivos de configuração
```

### 1.2 Arquivos de Configuração Base

#### Package.json (Scripts Obrigatórios)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "docs:generate": "typedoc --out docs/api src/",
    "docs:serve": "serve docs/api",
    "validate:config": "node scripts/validate-config.js",
    "setup:dev": "node scripts/setup-development.js"
  }
}
```

#### Environment Template (.env.example)
```bash
# Aplicação
NODE_ENV=development
APP_NAME=nome-do-projeto
APP_VERSION=1.0.0

# URLs
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Autenticação
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# APIs Externas
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Logging
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true

# Features
ENABLE_ANALYTICS=false
ENABLE_DEBUG_MODE=true
```

---

## 🏗️ FASE 2: Implementação dos 6 Pilares

### 2.1 Pilar 1: Configuração Externa

**Instrução para o Cursor:**
> Crie um sistema de configuração centralizada em `lib/config/` que:
> - Carregue todas as variáveis de ambiente
> - Valide configurações com Zod
> - Forneça tipagem TypeScript
> - Tenha configuração por ambiente (dev/prod/test)
> - Nunca permita hardcode de valores

**Arquivos a criar:**
- `lib/config/index.ts` - Configuração principal
- `lib/config/validation.ts` - Schemas Zod
- `lib/config/environment.ts` - Configuração por ambiente
- `lib/config/types.ts` - Tipos TypeScript

### 2.2 Pilar 2: Tratamento de Erros

**Instrução para o Cursor:**
> Implemente um sistema robusto de tratamento de erros que:
> - Tenha classes de erro customizadas
> - Capture todos os erros não tratados
> - Forneça Error Boundaries para React
> - Registre erros estruturadamente
> - Tenha fallbacks apropriados

**Arquivos a criar:**
- `lib/errors/index.ts` - Classes de erro
- `lib/errors/boundary.tsx` - Error Boundary React
- `lib/errors/handler.ts` - Handler global
- `components/error-fallback.tsx` - Componente de erro

### 2.3 Pilar 3: Documentação

**Instrução para o Cursor:**
> Configure documentação automática que:
> - Force JSDoc em todas as funções públicas
> - Gere documentação com TypeDoc
> - Tenha templates para diferentes tipos de arquivo
> - Inclua exemplos de uso
> - Mantenha README atualizado

**Arquivos a criar:**
- `typedoc.json` - Configuração TypeDoc
- `docs/templates/` - Templates de documentação
- `scripts/generate-docs.js` - Script de geração
- `docs/README.md` - Documentação principal

### 2.4 Pilar 4: Type Safety

**Instrução para o Cursor:**
> Implemente validação runtime que:
> - Use Zod para todos os schemas
> - Valide dados externos obrigatoriamente
> - Tenha type guards para verificações
> - Valide props de componentes críticos
> - Falhe rápido com mensagens claras

**Arquivos a criar:**
- `lib/validation/schemas.ts` - Schemas Zod
- `lib/validation/guards.ts` - Type guards
- `lib/validation/utils.ts` - Utilitários de validação
- `lib/validation/middleware.ts` - Middleware de validação

### 2.5 Pilar 5: Testes

**Instrução para o Cursor:**
> Configure suite de testes completa que:
> - Use Vitest para testes unitários
> - Use Playwright para testes E2E
> - Tenha coverage > 80% para código crítico
> - Inclua mocks e fixtures
> - Rode em CI/CD

**Arquivos a criar:**
- `vitest.config.ts` - Configuração Vitest
- `playwright.config.ts` - Configuração Playwright
- `tests/setup.ts` - Setup de testes
- `tests/helpers/` - Utilitários de teste

### 2.6 Pilar 6: Logging

**Instrução para o Cursor:**
> Crie sistema de logging estruturado que:
> - Registre todas as operações críticas
> - Tenha contexto rico (userId, requestId, etc.)
> - Diferencie logs por ambiente
> - Integre com serviços de monitoramento
> - Tenha alertas para erros críticos

**Arquivos a criar:**
- `lib/logger/index.ts` - Logger principal
- `lib/logger/middleware.ts` - Middleware de logging
- `lib/logger/performance.ts` - Logging de performance
- `hooks/use-logger.ts` - Hook para componentes

---

## 🏗️ FASE 3: Regras do Cursor

### 3.1 Regras Obrigatórias a Criar

**Instrução para o Cursor:**
> Crie as seguintes regras em `.cursor/rules/`:

1. **configuracao-externa.mdc** - Nunca hardcode valores
2. **tratamento-erros.mdc** - Todo código deve tratar erros
3. **documentacao.mdc** - JSDoc obrigatório
4. **type-safety.mdc** - Validação runtime obrigatória
5. **testes.mdc** - Código crítico deve ter testes
6. **logging.mdc** - Logging estruturado obrigatório

### 3.2 Regra Principal (.cursor/rules/projeto-quality.mdc)

```markdown
# Regras de Qualidade do Projeto

## Princípios Fundamentais
1. NUNCA hardcode - sempre use configuração externa
2. SEMPRE trate erros - nunca falhe silenciosamente
3. DOCUMENTE tudo - JSDoc é obrigatório
4. VALIDE runtime - TypeScript não é suficiente
5. TESTE código crítico - testes são investimento
6. REGISTRE operações - observabilidade é essencial

## Checklist Obrigatório
Antes de cada commit:
- [ ] Sem valores hardcoded
- [ ] Erros tratados adequadamente
- [ ] Funções públicas documentadas
- [ ] Dados externos validados
- [ ] Código crítico testado
- [ ] Operações importantes logadas

## Estrutura de Código
- Configuração: lib/config/
- Erros: lib/errors/
- Validação: lib/validation/
- Logger: lib/logger/
- Testes: tests/
- Documentação: docs/
```

---

## 🏗️ FASE 4: Scripts de Automação

### 4.1 Script de Setup de Desenvolvimento

**Arquivo:** `scripts/setup-development.js`

```javascript
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando ambiente de desenvolvimento...')

// 1. Verificar .env
if (!fs.existsSync('.env.local')) {
  fs.copyFileSync('.env.example', '.env.local')
  console.log('✅ .env.local criado a partir do template')
}

// 2. Instalar dependências
console.log('📦 Instalando dependências...')
require('child_process').execSync('npm install', { stdio: 'inherit' })

// 3. Validar configuração
console.log('🔍 Validando configuração...')
require('./validate-config.js')

// 4. Executar testes
console.log('🧪 Executando testes...')
require('child_process').execSync('npm test -- --run', { stdio: 'inherit' })

console.log('✅ Ambiente configurado com sucesso!')
```

### 4.2 Script de Validação de Configuração

**Arquivo:** `scripts/validate-config.js`

```javascript
#!/usr/bin/env node

const { z } = require('zod')
require('dotenv').config({ path: '.env.local' })

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  APP_NAME: z.string().min(1),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  // Adicionar outras validações necessárias
})

try {
  ConfigSchema.parse(process.env)
  console.log('✅ Configuração válida')
} catch (error) {
  console.error('❌ Configuração inválida:', error.errors)
  process.exit(1)
}
```

---

## 🏗️ FASE 5: Documentação Inicial

### 5.1 README.md Principal

```markdown
# Nome do Projeto

Descrição breve do projeto.

## 🚀 Quick Start

```bash
# 1. Clonar repositório
git clone <repo-url>
cd <projeto>

# 2. Configurar ambiente
npm run setup:dev

# 3. Iniciar desenvolvimento
npm run dev
```

## 📋 Comandos Disponíveis

- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executar testes
- `npm run lint` - Verificar código
- `npm run docs:generate` - Gerar documentação

## 🏗️ Arquitetura

Este projeto segue os **6 Pilares de Qualidade**:

1. **Configuração Externa** - Sem hardcode
2. **Tratamento de Erros** - Falhas tratadas
3. **Documentação** - Código autodocumentado
4. **Type Safety** - Validação runtime
5. **Testes** - Cobertura adequada
6. **Logging** - Observabilidade completa

## 📚 Documentação

- [Arquitetura](docs/arquitetura/)
- [Guias de Desenvolvimento](docs/guias/)
- [API Reference](docs/api/)
```

### 5.2 Guia de Contribuição

**Arquivo:** `docs/CONTRIBUTING.md`

```markdown
# Guia de Contribuição

## Antes de Começar

1. Leia a documentação de arquitetura
2. Configure o ambiente com `npm run setup:dev`
3. Familiarize-se com os 6 Pilares de Qualidade

## Fluxo de Desenvolvimento

1. Crie branch feature/nome-da-feature
2. Implemente seguindo as regras do Cursor
3. Escreva testes para código crítico
4. Documente funções públicas
5. Execute `npm run lint` e `npm test`
6. Crie PR com descrição detalhada

## Checklist de PR

- [ ] Sem valores hardcoded
- [ ] Erros tratados adequadamente
- [ ] Funções documentadas com JSDoc
- [ ] Dados externos validados
- [ ] Testes implementados
- [ ] Logs estruturados adicionados
```

---

## 🏗️ FASE 6: Configurações de Ferramentas

### 6.1 TypeScript Config

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 6.2 ESLint Config

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

## 🎯 INSTRUÇÕES PARA O CURSOR

### Comando de Execução

**Para implementar tudo automaticamente, use este prompt:**

```
Implemente uma arquitetura de qualidade completa seguindo o guia BOOTSTRAP_QUALITY_ARCHITECTURE.md:

1. CRIE a estrutura de pastas completa
2. IMPLEMENTE os 6 pilares de qualidade:
   - Configuração externa centralizada
   - Sistema robusto de tratamento de erros
   - Documentação automática com JSDoc
   - Validação runtime com Zod
   - Suite de testes com Vitest/Playwright
   - Logging estruturado completo

3. CONFIGURE as regras do Cursor em .cursor/rules/
4. CRIE os scripts de automação
5. CONFIGURE todas as ferramentas (TypeScript, ESLint, etc.)
6. GERE a documentação inicial completa

IMPORTANTE: Siga EXATAMENTE os padrões especificados no guia. Cada arquivo deve implementar as práticas de qualidade desde o início.
```

### Resultado Esperado

Após executar, o projeto terá:
- ✅ **Estrutura completa** implementada
- ✅ **6 Pilares de Qualidade** funcionando
- ✅ **Regras automatizadas** ativas
- ✅ **Documentação** gerada
- ✅ **Testes** configurados
- ✅ **Scripts** de automação
- ✅ **Ambiente** pronto para desenvolvimento

---

## 📈 Benefícios Imediatos

1. **Desenvolvimento Acelerado** - Padrões claros desde o início
2. **Qualidade Garantida** - Regras automatizadas impedem erros
3. **Onboarding Rápido** - Documentação completa e atualizada
4. **Manutenção Facilitada** - Código estruturado e testado
5. **Observabilidade Total** - Logs e monitoramento desde o dia 1
6. **Escalabilidade** - Arquitetura preparada para crescimento

## 🔄 Evolução Contínua

Este bootstrap é um ponto de partida. À medida que o projeto evolui:
- Atualize as regras do Cursor conforme necessário
- Expanda a documentação com novos padrões
- Adicione novos scripts de automação
- Refine os testes e validações
- Melhore o sistema de logging

**Com este guia, qualquer projeto novo já nasce com arquitetura de qualidade enterprise!** 🚀 