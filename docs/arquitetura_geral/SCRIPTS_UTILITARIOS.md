# 🛠️ Scripts Utilitários

## 🎯 Filosofia dos Scripts

### **1. Automatização**
Automatizar tarefas repetitivas e propensas a erro.

### **2. Diagnóstico**
Facilitar identificação e resolução de problemas.

### **3. Desenvolvimento**
Acelerar o processo de desenvolvimento e teste.

### **4. Documentação Viva**
Scripts que servem como documentação executável.

## 📁 Organização de Scripts

### **Estrutura Recomendada**
```
scripts/
├── setup/                    # Scripts de configuração
│   ├── install-deps.js
│   ├── setup-env.js
│   └── init-db.js
├── dev/                      # Scripts de desenvolvimento
│   ├── generate-types.js
│   ├── lint-fix.js
│   └── format-code.js
├── test/                     # Scripts de teste
│   ├── run-e2e.js
│   ├── test-coverage.js
│   └── test-integration.js
├── deploy/                   # Scripts de deploy
│   ├── build-prod.js
│   ├── deploy-staging.js
│   └── deploy-prod.js
├── providers/                # Scripts específicos de providers
│   ├── list-dify-agents.js
│   ├── test-dify-agent.js
│   └── diagnose-dify.js
└── utils/                    # Utilitários gerais
    ├── clean-cache.js
    ├── backup-db.js
    └── health-check.js
```

## 🔧 Padrões de Scripts

### **Script Base Template**
```javascript
#!/usr/bin/env node

// scripts/template.js
const path = require('path')
const fs = require('fs')

// Configuração do script
const SCRIPT_NAME = 'Template Script'
const SCRIPT_VERSION = '1.0.0'

// Funções utilitárias
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
  }
  
  console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${timestamp} - ${message}`)
}

function showHelp() {
  console.log(`
${SCRIPT_NAME} v${SCRIPT_VERSION}

Uso: node ${path.basename(__filename)} [opções]

Opções:
  --help, -h      Mostra esta ajuda
  --verbose, -v   Modo verboso
  --dry-run       Executa sem fazer mudanças

Exemplos:
  node ${path.basename(__filename)} --verbose
  node ${path.basename(__filename)} --dry-run
`)
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    help: false,
    verbose: false,
    dryRun: false,
  }
  
  for (const arg of args) {
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--dry-run':
        options.dryRun = true
        break
    }
  }
  
  return options
}

async function main() {
  const options = parseArgs()
  
  if (options.help) {
    showHelp()
    return
  }
  
  log(`Iniciando ${SCRIPT_NAME}...`)
  
  try {
    // Lógica principal do script aqui
    
    if (options.dryRun) {
      log('Modo dry-run - nenhuma mudança foi feita', 'warning')
    }
    
    log('Script executado com sucesso!', 'success')
  } catch (error) {
    log(`Erro durante execução: ${error.message}`, 'error')
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { main, log, parseArgs }
```

### **Script de Listagem (Dify Agents)**
```javascript
#!/usr/bin/env node

// scripts/list-dify-agents.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SCRIPT_NAME = 'List Dify Agents'

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
  }
  console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${message}`)
}

async function fetchDifyAgents() {
  const apiKey = process.env.DIFY_API_KEY
  const baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai'
  
  if (!apiKey) {
    throw new Error('DIFY_API_KEY não configurada')
  }
  
  const response = await fetch(`${baseUrl}/v1/apps`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data || []
}

function generateEnvConfig(agents) {
  console.log('\n📋 Configurações de ambiente sugeridas:')
  console.log('# Adicione estas linhas ao seu .env.local\n')
  
  agents.forEach((agent, index) => {
    const envName = `NEXT_PUBLIC_DIFY_AGENT_${agent.name.toUpperCase().replace(/\s+/g, '_')}`
    console.log(`${envName}=${agent.id}`)
  })
  
  if (agents.length > 0) {
    console.log(`NEXT_PUBLIC_DIFY_AGENT_DEFAULT=${agents[0].id}`)
  }
}

function displayAgents(agents) {
  console.log(`\n✅ Encontrados ${agents.length} agentes:\n`)
  
  agents.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.name}`)
    console.log(`   ID: ${agent.id}`)
    console.log(`   Descrição: ${agent.description || 'N/A'}`)
    console.log(`   Modo: ${agent.mode}`)
    console.log(`   Criado: ${new Date(agent.created_at).toLocaleDateString('pt-BR')}`)
    console.log('')
  })
}

async function main() {
  log(`🔍 ${SCRIPT_NAME} - Iniciando...\n`)
  
  try {
    // Verificar configuração
    log('📋 1. Verificando configuração...')
    const apiKey = process.env.DIFY_API_KEY
    const baseUrl = process.env.DIFY_BASE_URL
    
    if (!apiKey) {
      throw new Error('DIFY_API_KEY não encontrada no .env.local')
    }
    
    log(`   API Key: ${apiKey.substring(0, 10)}...`)
    log(`   Base URL: ${baseUrl || 'https://api.dify.ai (padrão)'}`)
    log('✅ Configuração OK\n')
    
    // Buscar agentes
    log('🌐 2. Buscando agentes...')
    const agents = await fetchDifyAgents()
    
    // Exibir resultados
    displayAgents(agents)
    
    // Gerar configuração
    generateEnvConfig(agents)
    
    log('\n🎉 Listagem concluída com sucesso!', 'success')
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'error')
    
    if (error.message.includes('DIFY_API_KEY')) {
      console.log('\n💡 Dica: Certifique-se de que o arquivo .env.local existe e contém:')
      console.log('DIFY_API_KEY=sua-chave-aqui')
      console.log('DIFY_BASE_URL=https://api.dify.ai')
    }
    
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, fetchDifyAgents }
```

### **Script de Teste**
```javascript
#!/usr/bin/env node

// scripts/test-dify-agent.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
  }
  console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${message}`)
}

async function testDifyAgent(agentId, message) {
  const apiKey = process.env.DIFY_API_KEY
  const baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai'
  
  if (!apiKey) {
    throw new Error('DIFY_API_KEY não configurada')
  }
  
  log('📤 Enviando requisição...')
  
  const response = await fetch(`${baseUrl}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'test-user',
    }),
  })
  
  log(`📥 Resposta recebida (${response.status})`)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }
  
  const data = await response.json()
  return data
}

function displayResponse(response) {
  console.log('\n📋 Detalhes da resposta:')
  console.log(`   ID: ${response.id}`)
  console.log(`   Conversation ID: ${response.conversation_id}`)
  console.log(`   Criado: ${new Date(response.created_at * 1000).toLocaleString('pt-BR')}`)
  console.log(`   Tokens usados: ${response.metadata?.usage?.total_tokens || 'N/A'}`)
  
  console.log('\n💬 Resposta:')
  console.log(`"${response.answer}"`)
}

async function main() {
  const agentId = process.argv[2]
  const message = process.argv[3] || 'Olá! Este é um teste de integração.'
  
  if (!agentId) {
    console.log(`
🧪 Teste de Agente Dify

Uso: node ${path.basename(__filename)} <AGENT_ID> [MENSAGEM]

Exemplos:
  node ${path.basename(__filename)} app-123-456 "Olá, como você está?"
  node ${path.basename(__filename)} app-123-456

Se nenhuma mensagem for fornecida, uma mensagem padrão será usada.
`)
    process.exit(1)
  }
  
  log(`🧪 Testando Agente Dify - ID: ${agentId}\n`)
  
  try {
    log('📋 Configuração:')
    log(`   Agent ID: ${agentId}`)
    log(`   Mensagem: "${message}"`)
    log(`   API Key: ${process.env.DIFY_API_KEY?.substring(0, 10)}...`)
    console.log('')
    
    const response = await testDifyAgent(agentId, message)
    
    displayResponse(response)
    
    log('\n✅ Teste executado com sucesso!', 'success')
    
  } catch (error) {
    log(`❌ Erro durante o teste: ${error.message}`, 'error')
    
    if (error.message.includes('401')) {
      console.log('\n💡 Dica: Verifique se a DIFY_API_KEY está correta')
    } else if (error.message.includes('404')) {
      console.log('\n💡 Dica: Verifique se o Agent ID está correto')
    }
    
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, testDifyAgent }
```

### **Script de Diagnóstico**
```javascript
#!/usr/bin/env node

// scripts/diagnose-system.js
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
  }
  console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${message}`)
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath)
  log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'OK' : 'Não encontrado'}`)
  return exists
}

function checkEnvVar(varName, description) {
  const value = process.env[varName]
  const exists = !!value
  log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Configurado' : 'Não configurado'}`)
  if (exists && varName.includes('KEY')) {
    log(`   Valor: ${value.substring(0, 10)}...`)
  } else if (exists) {
    log(`   Valor: ${value}`)
  }
  return exists
}

function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    log(`✅ ${description}: OK`)
    return { success: true, output: output.trim() }
  } catch (error) {
    log(`❌ ${description}: Erro`, 'error')
    log(`   ${error.message}`, 'error')
    return { success: false, error: error.message }
  }
}

async function checkNetworkConnectivity() {
  log('\n🌐 Verificando conectividade de rede...')
  
  const urls = [
    'https://api.dify.ai',
    'https://api.openai.com',
    'https://google.com',
  ]
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 })
      log(`✅ ${url}: ${response.status}`)
    } catch (error) {
      log(`❌ ${url}: ${error.message}`, 'error')
    }
  }
}

function generateReport(checks) {
  const passed = checks.filter(check => check.passed).length
  const total = checks.length
  const percentage = Math.round((passed / total) * 100)
  
  console.log('\n📊 Relatório do Diagnóstico:')
  console.log(`   Verificações passadas: ${passed}/${total} (${percentage}%)`)
  
  if (percentage === 100) {
    log('🎉 Sistema totalmente funcional!', 'success')
  } else if (percentage >= 80) {
    log('⚠️ Sistema funcional com algumas questões menores', 'warning')
  } else {
    log('🚨 Sistema com problemas significativos', 'error')
  }
  
  const failed = checks.filter(check => !check.passed)
  if (failed.length > 0) {
    console.log('\n❌ Verificações que falharam:')
    failed.forEach(check => {
      console.log(`   - ${check.description}`)
    })
  }
}

async function main() {
  log('🔍 Diagnóstico do Sistema - Iniciando...\n')
  
  const checks = []
  
  // Verificar arquivos essenciais
  log('📁 Verificando arquivos essenciais...')
  checks.push({
    description: 'package.json',
    passed: checkFile('package.json', 'package.json')
  })
  checks.push({
    description: '.env.local',
    passed: checkFile('.env.local', '.env.local')
  })
  checks.push({
    description: 'next.config.ts',
    passed: checkFile('next.config.ts', 'next.config.ts')
  })
  
  // Verificar variáveis de ambiente
  log('\n⚙️ Verificando variáveis de ambiente...')
  require('dotenv').config({ path: '.env.local' })
  
  checks.push({
    description: 'DIFY_API_KEY',
    passed: checkEnvVar('DIFY_API_KEY', 'Dify API Key')
  })
  checks.push({
    description: 'DIFY_BASE_URL',
    passed: checkEnvVar('DIFY_BASE_URL', 'Dify Base URL')
  })
  checks.push({
    description: 'OPENAI_API_KEY',
    passed: checkEnvVar('OPENAI_API_KEY', 'OpenAI API Key')
  })
  
  // Verificar dependências
  log('\n📦 Verificando dependências...')
  const nodeResult = runCommand('node --version', 'Node.js')
  checks.push({
    description: 'Node.js',
    passed: nodeResult.success
  })
  
  const pnpmResult = runCommand('pnpm --version', 'pnpm')
  checks.push({
    description: 'pnpm',
    passed: pnpmResult.success
  })
  
  // Verificar conectividade
  await checkNetworkConnectivity()
  
  // Gerar relatório
  generateReport(checks)
  
  log('\n🎯 Diagnóstico concluído!')
}

if (require.main === module) {
  main()
}

module.exports = { main }
```

## 📦 Configuração no package.json

### **Scripts NPM**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    "// Scripts de desenvolvimento": "",
    "dev:clean": "node scripts/clean-cache.js && npm run dev",
    "dev:reset": "node scripts/reset-dev.js",
    "format": "node scripts/format-code.js",
    
    "// Scripts de diagnóstico": "",
    "diagnose": "node scripts/diagnose-system.js",
    "health": "node scripts/health-check.js",
    
    "// Scripts específicos de providers": "",
    "dify:list": "node scripts/list-dify-agents.js",
    "dify:test": "node scripts/test-dify-agent.js",
    "dify:diagnose": "node scripts/diagnose-dify.js",
    
    "// Scripts de teste": "",
    "test:unit": "jest",
    "test:e2e": "playwright test",
    "test:integration": "node scripts/test-integration.js",
    
    "// Scripts de deploy": "",
    "deploy:staging": "node scripts/deploy-staging.js",
    "deploy:prod": "node scripts/deploy-prod.js"
  }
}
```

## 🔧 Utilitários Comuns

### **Logger Reutilizável**
```javascript
// scripts/utils/logger.js
class Logger {
  constructor(name) {
    this.name = name
    this.colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[35m',
    }
  }
  
  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const color = this.colors[type] || this.colors.info
    console.log(`${color}[${type.toUpperCase()}]\x1b[0m ${timestamp} - ${this.name}: ${message}`)
  }
  
  info(message) { this.log(message, 'info') }
  success(message) { this.log(message, 'success') }
  warning(message) { this.log(message, 'warning') }
  error(message) { this.log(message, 'error') }
  debug(message) { this.log(message, 'debug') }
}

module.exports = Logger
```

### **Validador de Configuração**
```javascript
// scripts/utils/config-validator.js
const fs = require('fs')
const path = require('path')

class ConfigValidator {
  constructor() {
    this.errors = []
    this.warnings = []
  }
  
  checkFile(filePath, required = true) {
    const exists = fs.existsSync(filePath)
    if (!exists && required) {
      this.errors.push(`Arquivo obrigatório não encontrado: ${filePath}`)
    } else if (!exists) {
      this.warnings.push(`Arquivo opcional não encontrado: ${filePath}`)
    }
    return exists
  }
  
  checkEnvVar(varName, required = true) {
    const value = process.env[varName]
    if (!value && required) {
      this.errors.push(`Variável de ambiente obrigatória não definida: ${varName}`)
    } else if (!value) {
      this.warnings.push(`Variável de ambiente opcional não definida: ${varName}`)
    }
    return !!value
  }
  
  validate() {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }
  
  report() {
    const result = this.validate()
    
    if (result.errors.length > 0) {
      console.log('\n❌ Erros encontrados:')
      result.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Avisos:')
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    if (result.valid) {
      console.log('\n✅ Configuração válida!')
    }
    
    return result
  }
}

module.exports = ConfigValidator
```

## 📋 Checklist de Scripts

### **✅ Funcionalidade**
- [ ] Propósito claro e específico
- [ ] Tratamento de erros robusto
- [ ] Logs informativos
- [ ] Help/usage documentation

### **✅ Usabilidade**
- [ ] Argumentos de linha de comando
- [ ] Modo dry-run quando aplicável
- [ ] Modo verbose para debug
- [ ] Output formatado e claro

### **✅ Manutenibilidade**
- [ ] Código limpo e comentado
- [ ] Funções reutilizáveis
- [ ] Configuração externalizável
- [ ] Testes quando necessário

### **✅ Integração**
- [ ] Adicionado ao package.json
- [ ] Documentado no README
- [ ] Compatível com CI/CD
- [ ] Dependências mínimas

---

**🎯 Scripts bem feitos aceleram o desenvolvimento e reduzem erros!** 