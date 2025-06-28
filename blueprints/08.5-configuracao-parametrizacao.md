# 🔧 Configuração Externa - Guia Completo

> **Princípio Fundamental**: Nunca hardcode valores que podem mudar. Sempre use arquivos de configuração.

---

## 🎯 **Por Que Configuração Externa?**

### **❌ Problemas do Hardcode:**
```typescript
// ❌ RUIM - Hardcoded
const API_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const AGENT_NAMES = ['Alex', 'Luna', 'Morgan'];
```

**Problemas:**
- 🔒 Precisa recompilar para mudar
- 🚫 Não pode ser alterado em produção
- 🔄 Dificulta testes com valores diferentes
- 👥 Não permite personalização por usuário/ambiente

### **✅ Benefícios da Configuração Externa:**
```typescript
// ✅ BOM - Configuração externa
const config = {
  api: {
    timeout: process.env.API_TIMEOUT || 5000,
    maxRetries: process.env.MAX_RETRIES || 3
  },
  agents: JSON.parse(process.env.AGENT_CONFIG || '[]')
};
```

**Benefícios:**
- ⚡ Mudanças sem recompilação
- 🎛️ Configuração por ambiente
- 🧪 Facilita testes
- 🔧 Ajustes em produção
- 👥 Personalização por usuário

---

## 📁 **Estrutura de Configuração**

### **1. Variáveis de Ambiente (.env)**
```bash
# .env.local
API_TIMEOUT=5000
MAX_RETRIES=3
DIFY_BASE_URL=https://api.dify.ai
AGENT_CONFIG='[{"name":"Alex","model":"gpt-4"}]'
```

### **2. Arquivos de Configuração JSON**
```json
// config/agents.json
{
  "companions": [
    {
      "id": "alex",
      "name": "Alex",
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 2000
    }
  ]
}
```

### **3. Configuração TypeScript**
```typescript
// lib/config/index.ts
interface AppConfig {
  api: {
    timeout: number;
    maxRetries: number;
  };
  agents: AgentConfig[];
  ui: {
    theme: string;
    language: string;
  };
}

export const config: AppConfig = {
  api: {
    timeout: Number(process.env.API_TIMEOUT) || 5000,
    maxRetries: Number(process.env.MAX_RETRIES) || 3,
  },
  agents: loadAgentConfig(),
  ui: {
    theme: process.env.UI_THEME || 'light',
    language: process.env.UI_LANGUAGE || 'pt-BR',
  }
};
```

---

## 🏗️ **Padrões de Implementação**

### **1. Configuração Centralizada**
```typescript
// lib/config/app-config.ts
class AppConfig {
  private static instance: AppConfig;
  private config: any;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  private loadConfig() {
    this.config = {
      // Configurações da API
      api: {
        timeout: this.getEnvNumber('API_TIMEOUT', 5000),
        maxRetries: this.getEnvNumber('MAX_RETRIES', 3),
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
      },
      
      // Configurações dos Agentes
      agents: {
        defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-4',
        temperature: this.getEnvNumber('LLM_TEMPERATURE', 0.7),
        maxTokens: this.getEnvNumber('LLM_MAX_TOKENS', 2000)
      },
      
      // Configurações da UI
      ui: {
        theme: process.env.UI_THEME || 'light',
        language: process.env.UI_LANGUAGE || 'pt-BR',
        itemsPerPage: this.getEnvNumber('UI_ITEMS_PER_PAGE', 10)
      },
      
      // Configurações de Features
      features: {
        enableArtifacts: this.getEnvBoolean('ENABLE_ARTIFACTS', true),
        enableDify: this.getEnvBoolean('ENABLE_DIFY', true),
        enableAnalytics: this.getEnvBoolean('ENABLE_ANALYTICS', false)
      }
    };
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    return value ? Number(value) : defaultValue;
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  get<T>(path: string): T {
    return this.getNestedValue(this.config, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export const appConfig = AppConfig.getInstance();
```

### **2. Configuração por Ambiente**
```typescript
// lib/config/environment.ts
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      api: {
        timeout: 10000, // Mais tempo para debug
        maxRetries: 1,
        baseUrl: 'http://localhost:3000'
      },
      logging: {
        level: 'debug',
        enableConsole: true
      }
    },
    
    production: {
      api: {
        timeout: 5000,
        maxRetries: 3,
        baseUrl: process.env.PRODUCTION_API_URL
      },
      logging: {
        level: 'error',
        enableConsole: false
      }
    },
    
    test: {
      api: {
        timeout: 1000,
        maxRetries: 0,
        baseUrl: 'http://localhost:3001'
      },
      logging: {
        level: 'silent',
        enableConsole: false
      }
    }
  };
  
  return configs[env as keyof typeof configs] || configs.development;
};
```

### **3. Validação de Configuração**
```typescript
// lib/config/validation.ts
import { z } from 'zod';

const configSchema = z.object({
  api: z.object({
    timeout: z.number().positive(),
    maxRetries: z.number().min(0).max(10),
    baseUrl: z.string().url()
  }),
  agents: z.object({
    defaultModel: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro']),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().positive()
  })
});

export const validateConfig = (config: unknown) => {
  try {
    return configSchema.parse(config);
  } catch (error) {
    console.error('❌ Configuração inválida:', error);
    throw new Error('Configuração inválida');
  }
};
```

---

## 📋 **Checklist de Configuração**

### **✅ Antes de Implementar:**
- [ ] Identifique todos os valores que podem mudar
- [ ] Defina valores padrão sensatos
- [ ] Documente cada configuração
- [ ] Valide tipos e ranges
- [ ] Teste em diferentes ambientes

### **✅ Valores que DEVEM ser Configuráveis:**
- [ ] **URLs de APIs** - Diferentes ambientes
- [ ] **Timeouts e Retries** - Ajuste de performance
- [ ] **Modelos de LLM** - Flexibilidade de provider
- [ ] **Parâmetros de IA** - Temperature, max tokens
- [ ] **Configurações de UI** - Tema, idioma, paginação
- [ ] **Feature Flags** - Habilitar/desabilitar funcionalidades
- [ ] **Limites e Quotas** - Rate limiting, usage limits
- [ ] **Configurações de Agentes** - Nomes, especialidades, prompts

### **✅ Estrutura de Arquivos:**
```
lib/config/
├── index.ts              # Exportações principais
├── app-config.ts         # Configuração centralizada
├── environment.ts        # Configuração por ambiente
├── validation.ts         # Validação de configuração
└── types.ts             # Tipos TypeScript

config/
├── agents.json          # Configuração dos agentes
├── features.json        # Feature flags
└── ui-themes.json       # Temas da interface
```

---

## 🎯 **Casos de Uso Específicos**

### **1. Configuração de Agentes Dify**
```typescript
// lib/config/dify-agents.ts
interface DifyAgentConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
}

export const difyAgentsConfig: DifyAgentConfig[] = [
  {
    id: 'alex',
    name: process.env.ALEX_AGENT_NAME || 'Alex',
    apiKey: process.env.ALEX_API_KEY || '',
    baseUrl: process.env.DIFY_BASE_URL || 'https://api.dify.ai',
    model: process.env.ALEX_MODEL || 'gpt-4',
    temperature: Number(process.env.ALEX_TEMPERATURE) || 0.7
  }
];
```

### **2. Configuração de UI Dinâmica**
```typescript
// lib/config/ui-config.ts
export const uiConfig = {
  chat: {
    maxMessages: Number(process.env.CHAT_MAX_MESSAGES) || 100,
    autoScroll: process.env.CHAT_AUTO_SCROLL !== 'false',
    showTimestamps: process.env.CHAT_SHOW_TIMESTAMPS === 'true'
  },
  
  artifacts: {
    enabled: process.env.ARTIFACTS_ENABLED !== 'false',
    maxSize: Number(process.env.ARTIFACTS_MAX_SIZE) || 1024000,
    allowedTypes: process.env.ARTIFACTS_ALLOWED_TYPES?.split(',') || ['code', 'text', 'image']
  }
};
```

### **3. Feature Flags**
```typescript
// lib/config/feature-flags.ts
export const featureFlags = {
  // Funcionalidades experimentais
  enableReactUI: process.env.ENABLE_REACT_UI === 'true',
  enableMCPIntegration: process.env.ENABLE_MCP === 'true',
  enableRAGDataRoom: process.env.ENABLE_RAG === 'true',
  
  // Funcionalidades por usuário
  enablePremiumFeatures: (userId: string) => {
    const premiumUsers = process.env.PREMIUM_USERS?.split(',') || [];
    return premiumUsers.includes(userId);
  }
};
```

---

## 🔧 **Ferramentas e Utilitários**

### **1. Gerador de Configuração**
```typescript
// scripts/generate-config.ts
import fs from 'fs';

const generateConfig = () => {
  const config = {
    api: {
      timeout: 5000,
      maxRetries: 3
    },
    agents: [
      { name: 'Alex', model: 'gpt-4' },
      { name: 'Luna', model: 'gemini-pro' }
    ]
  };
  
  fs.writeFileSync('config/default.json', JSON.stringify(config, null, 2));
  console.log('✅ Configuração gerada!');
};
```

### **2. Validador de Configuração**
```typescript
// scripts/validate-config.ts
import { validateConfig } from '../lib/config/validation';
import { appConfig } from '../lib/config';

const validate = () => {
  try {
    validateConfig(appConfig.get(''));
    console.log('✅ Configuração válida!');
  } catch (error) {
    console.error('❌ Configuração inválida:', error);
    process.exit(1);
  }
};
```

---

## 📚 **Exemplos Práticos**

### **❌ Antes (Hardcoded):**
```typescript
// components/chat.tsx
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const maxMessages = 50; // ❌ Hardcoded
  
  const sendMessage = async (text: string) => {
    const response = await fetch('https://api.dify.ai/chat', { // ❌ Hardcoded
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-1234567890', // ❌ Hardcoded
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        temperature: 0.7, // ❌ Hardcoded
        max_tokens: 2000 // ❌ Hardcoded
      })
    });
  };
};
```

### **✅ Depois (Configurável):**
```typescript
// components/chat.tsx
import { appConfig } from '@/lib/config';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const maxMessages = appConfig.get<number>('ui.chat.maxMessages');
  
  const sendMessage = async (text: string) => {
    const apiConfig = appConfig.get('api');
    const agentConfig = appConfig.get('agents.default');
    
    const response = await fetch(apiConfig.baseUrl + '/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.maxTokens
      })
    });
  };
};
```

---

## 🎯 **Próximos Passos**

### **1. Implementação Imediata:**
1. Criar `lib/config/` com estrutura completa
2. Migrar valores hardcoded existentes
3. Adicionar validação de configuração
4. Criar documentação de configuração

### **2. Melhorias Futuras:**
1. Interface web para configuração
2. Configuração por usuário
3. Sincronização com banco de dados
4. Backup e restore de configurações

---

## 🎯 **Regras de Ouro**

### **🚫 NUNCA Faça:**
- Hardcode URLs, tokens, senhas
- Valores que podem mudar entre ambientes
- Configurações específicas de usuário no código
- Parâmetros de IA fixos

### **✅ SEMPRE Faça:**
- Use variáveis de ambiente
- Defina valores padrão
- Valide configurações
- Documente cada parâmetro
- Teste em diferentes ambientes

---

**🎯 Lembre-se: Configuração externa é flexibilidade, manutenibilidade e profissionalismo!** 