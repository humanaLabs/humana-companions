# 🗂️ Organização de Tipos e Objetos JSON

## 📋 Visão Geral

Este documento estabelece onde e como criar novos objetos JSON, interfaces TypeScript e tipos na aplicação Humana Companions, seguindo os padrões arquiteturais estabelecidos.

## 🎯 Princípio de Organização

### **🏗️ Separação por Responsabilidade**
Cada tipo de dados tem seu local específico baseado em sua **responsabilidade** e **contexto de uso**.

### **📐 Regra de Localização**
```
PERGUNTA: "Este objeto é usado para quê?"
RESPOSTA: Determina onde colocar
```

## 🗺️ Mapa de Localização por Contexto

### **🗄️ 1. Banco de Dados**
```
📁 lib/db/schema.ts
🎯 Para: Tabelas SQL e tipos derivados
```

**✅ Use quando:**
- Precisa persistir dados no PostgreSQL
- É uma entidade principal do domínio
- Precisa de relacionamentos com outras tabelas

**📝 Exemplo:**
```typescript
// lib/db/schema.ts
export const notification = pgTable('Notification', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { enum: ['info', 'warning', 'error'] }).notNull(),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt').notNull(),
});

export type Notification = InferSelectModel<typeof notification>;
```

### **🤖 2. Inteligência Artificial**
```
📁 lib/ai/
├── models.ts              # Modelos de IA
├── providers.ts           # Provedores de IA
├── dify-agents.ts         # Agentes Dify
├── prompts.ts             # Templates de prompts
└── [nova-integracao].ts   # Nova integração de IA
```

**✅ Use quando:**
- Integração com APIs de IA
- Configuração de modelos ou agentes
- Estruturas específicas de providers

**📝 Exemplo:**
```typescript
// lib/ai/claude-agents.ts
export interface ClaudeAgent {
  id: string;
  name: string;
  description: string;
  model: 'claude-3-sonnet' | 'claude-3-haiku';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export const claudeAgents: Array<ClaudeAgent> = [
  {
    id: 'claude-general',
    name: 'Claude Assistente Geral',
    description: 'Assistente geral para tarefas diversas',
    model: 'claude-3-sonnet',
    temperature: 0.7,
  },
];
```

### **🎨 3. Artifacts e Documentos**
```
📁 lib/artifacts/
├── server.ts              # Tipos do servidor
├── client.ts              # Tipos do cliente
└── [novo-tipo].ts         # Novo tipo de artifact
```

**✅ Use quando:**
- Novo tipo de artifact (além de text, code, image, sheet)
- Configurações específicas de artifacts
- Handlers de processamento

**📝 Exemplo:**
```typescript
// lib/artifacts/video.ts
export interface VideoArtifactConfig {
  kind: 'video';
  maxDuration: number;
  allowedFormats: Array<'mp4' | 'webm' | 'avi'>;
  quality: 'low' | 'medium' | 'high';
}

export interface VideoMetadata {
  duration: number;
  resolution: { width: number; height: number };
  format: string;
  size: number;
}
```

### **🌐 4. APIs Externas**
```
📁 lib/integrations/
├── [nome-api]/
│   ├── types.ts           # Tipos da API
│   ├── client.ts          # Cliente da API
│   └── utils.ts           # Utilitários
└── shared/
    └── http.ts            # Tipos HTTP compartilhados
```

**✅ Use quando:**
- Integração com API externa (Stripe, SendGrid, etc.)
- Tipos específicos de terceiros
- Configurações de integração

**📝 Exemplo:**
```typescript
// lib/integrations/stripe/types.ts
export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'test' | 'live';
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  priceId: string;
  customerId: string;
}
```

### **🎭 5. Componentes UI**
```
📁 components/
├── [componente].tsx       # Tipos específicos do componente
└── ui/                    # Tipos dos componentes base
```

**✅ Use quando:**
- Props específicas de componentes
- Estados complexos de UI
- Configurações visuais

**📝 Exemplo:**
```typescript
// components/notification-center.tsx
export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

### **🔧 6. Utilitários e Helpers**
```
📁 lib/
├── types.ts               # Tipos gerais da aplicação
├── utils.ts               # Utilitários com tipos
├── constants.ts           # Constantes tipadas
└── validators.ts          # Schemas de validação
```

**✅ Use quando:**
- Tipos compartilhados entre múltiplos módulos
- Utilitários genéricos
- Constantes da aplicação

**📝 Exemplo:**
```typescript
// lib/types.ts
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'pt' | 'en' | 'es';

export interface AppConfig {
  theme: Theme;
  language: Language;
  features: {
    notifications: boolean;
    analytics: boolean;
  };
}
```

## 🎯 Fluxo de Decisão Rápido

### **🤔 Onde Colocar Meu Novo Objeto?**

1. **🗄️ É uma tabela do banco?** → `lib/db/schema.ts`
2. **🤖 É relacionado à IA?** → `lib/ai/[provider].ts`
3. **🎨 É um novo artifact?** → `lib/artifacts/[tipo].ts`
4. **🌐 É integração externa?** → `lib/integrations/[api]/types.ts`
5. **🎭 É específico de componente?** → `components/[nome].tsx`
6. **🔧 É uso geral?** → `lib/types.ts`

## 📋 Checklist Rápido

### **✅ Antes de Criar**
- [ ] Defini a responsabilidade principal?
- [ ] Escolhi a localização correta?
- [ ] Verifiquei se já existe algo similar?

### **✅ Durante a Criação**
- [ ] Nome descritivo e específico?
- [ ] Tipos corretos (string, number, boolean)?
- [ ] Campos opcionais marcados com `?`?

### **✅ Após Criar**
- [ ] Testei a integração?
- [ ] Não há erros TypeScript?
- [ ] Imports/exports corretos?

## 🎯 Exemplos Práticos

### **🔔 Sistema de Notificações**
```typescript
// 1. Banco (lib/db/schema.ts)
export const notification = pgTable('Notification', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { enum: ['info', 'warning', 'error'] }).notNull(),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt').notNull(),
});

// 2. Componente (components/notification-center.tsx)
export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  position?: 'top-right' | 'bottom-right';
}
```

### **🤖 Nova IA (Gemini)**
```typescript
// lib/ai/gemini.ts
export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-pro' | 'gemini-pro-vision';
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}
```

### **💳 Integração de Pagamentos**
```typescript
// lib/integrations/stripe/types.ts
export interface StripeProduct {
  id: string;
  name: string;
  price: number;
  currency: 'BRL' | 'USD';
  features: string[];
}
```

## 🚨 Erros Comuns

### **❌ Não Faça:**
- Tipos de API no schema do banco
- Lógica de UI em tipos de dados
- Nomes genéricos demais (`Data`, `Config`)

### **✅ Faça:**
- Tipos no local correto por responsabilidade
- Separar dados de lógica de UI
- Nomes específicos e descritivos

---

## 🎯 Resumo das Regras

1. **🎯 SEMPRE** determine a responsabilidade primeiro
2. **📍 SEMPRE** siga o fluxo de decisão
3. **📝 SEMPRE** use nomes específicos
4. **🧪 SEMPRE** teste após criar
5. **❌ NUNCA** misture responsabilidades

**💡 Organização correta = Código mais fácil de manter!** 🚀✨ 