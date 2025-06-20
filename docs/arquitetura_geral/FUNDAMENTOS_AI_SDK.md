# 🤖 Fundamentos do AI SDK - Guia de Implementação

## 📋 Visão Geral

Este documento extrai os conceitos fundamentais do AI SDK baseado na documentação oficial em `.cursor/docs/ai-sdk-docs`, focando na implementação prática dentro da nossa aplicação.

> **📍 Fonte:** Baseado em `.cursor/docs/ai-sdk-docs/02-foundations/` e `.cursor/docs/ai-sdk-docs/02-guides/`

## 🎯 Conceitos Fundamentais

### **🧠 1. Large Language Models (LLMs)**

Um **LLM** é um modelo focado em **texto** que:
- Recebe uma sequência de palavras como entrada
- Prediz a sequência mais provável como continuação
- Atribui probabilidades a possíveis próximas sequências
- Continua gerando até atingir um critério de parada

#### **⚠️ Limitações Importantes:**
- **Hallucination** - pode inventar informações não presentes no treinamento
- **Knowledge Cutoff** - limitado aos dados de treinamento
- **Context Window** - limitação de tokens por requisição

### **🔗 2. Embedding Models**

Modelos que convertem dados complexos em **vetores densos**:
- **Não geram** novo conteúdo
- **Representam** relações semânticas e sintáticas
- **Usados para** busca semântica, RAG, clustering

### **🔄 3. Streaming**

Resposta em tempo real ao invés de esperar resposta completa:
```typescript
// Exemplo de streaming na nossa aplicação
const result = await streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explique conceitos de IA',
  onChunk: (chunk) => {
    // Atualiza UI em tempo real
    updateChatUI(chunk.text);
  },
});
```

### **🛠️ 4. Tools (Function Calling)**

Permite que LLMs executem funções específicas:
```typescript
// Exemplo das nossas tools
const tools = {
  createDocument: {
    description: 'Cria um novo documento/artifact',
    parameters: z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['text', 'code', 'image', 'sheet']),
    }),
    execute: async ({ title, content, type }) => {
      return await createDocument({ title, content, type });
    },
  },
  updateDocument: {
    description: 'Atualiza documento existente',
    parameters: z.object({
      id: z.string(),
      content: z.string(),
    }),
    execute: async ({ id, content }) => {
      return await updateDocument(id, content);
    },
  },
};
```

## 🏗️ Implementação na Nossa Aplicação

### **📁 Estrutura do AI SDK na Aplicação:**

```
📁 lib/ai/
├── models.ts              # Configuração de modelos
├── providers.ts           # Providers (OpenAI, Anthropic)
├── prompts.ts             # Templates de prompts
├── tools/                 # Function calling
│   ├── create-document.ts
│   ├── update-document.ts
│   ├── get-weather.ts
│   └── request-suggestions.ts
└── dify-agents.ts         # Integração Dify
```

### **🔧 1. Configuração de Providers**

```typescript
// lib/ai/providers.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export const providers = {
  openai: {
    'gpt-4-turbo': openai('gpt-4-turbo'),
    'gpt-4o': openai('gpt-4o'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
  },
  anthropic: {
    'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
    'claude-3-5-haiku': anthropic('claude-3-5-haiku-20241022'),
  },
};
```

### **🔧 2. Configuração de Modelos**

```typescript
// lib/ai/models.ts
export interface ModelConfig {
  id: string;
  provider: 'openai' | 'anthropic';
  name: string;
  description: string;
  maxTokens: number;
  supportsTools: boolean;
  supportsVision: boolean;
}

export const models: ModelConfig[] = [
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    description: 'Modelo mais avançado para tarefas complexas',
    maxTokens: 128000,
    supportsTools: true,
    supportsVision: true,
  },
  // ... outros modelos
];
```

### **🔧 3. Implementação de Streaming**

```typescript
// app/(chat)/api/chat/route.ts
import { streamText } from 'ai';
import { providers } from '@/lib/ai/providers';

export async function POST(request: Request) {
  const { messages, model } = await request.json();
  
  const result = await streamText({
    model: providers.openai[model],
    messages,
    tools: {
      createDocument,
      updateDocument,
      getWeather,
      requestSuggestions,
    },
    onFinish: async ({ text, usage }) => {
      // Salva no banco de dados
      await saveChatMessage({
        content: text,
        tokens: usage.totalTokens,
      });
    },
  });

  return result.toDataStreamResponse();
}
```

### **🔧 4. Tools Implementation**

```typescript
// lib/ai/tools/create-document.ts
import { z } from 'zod';
import { tool } from 'ai';

export const createDocument = tool({
  description: 'Cria um novo documento ou artifact',
  parameters: z.object({
    title: z.string().describe('Título do documento'),
    content: z.string().describe('Conteúdo do documento'),
    type: z.enum(['text', 'code', 'image', 'sheet']).describe('Tipo do documento'),
  }),
  execute: async ({ title, content, type }) => {
    const document = await db.insert(documents).values({
      title,
      content,
      kind: type,
      userId: getCurrentUserId(),
    }).returning();

    return {
      success: true,
      documentId: document[0].id,
      message: `Documento "${title}" criado com sucesso`,
    };
  },
});
```

## 🎯 Padrões de Implementação

### **📝 1. Prompt Engineering**

```typescript
// lib/ai/prompts.ts
export const systemPrompts = {
  assistant: `Você é um assistente IA especializado em criar e editar documentos.

Diretrizes:
- SEMPRE use as tools disponíveis quando apropriado
- Para código, especifique a linguagem corretamente
- Para documentos longos, divida em seções
- Mantenha formatação consistente

Tools disponíveis:
- createDocument: Para criar novos artifacts  
- updateDocument: Para editar artifacts existentes
- getWeather: Para informações meteorológicas
- requestSuggestions: Para sugestões de melhoria`,

  codeReview: `Você é um especialista em revisão de código.

Analise o código fornecido e:
1. Identifique problemas de segurança
2. Sugira melhorias de performance
3. Verifique boas práticas
4. Forneça exemplos de correção

Use a tool updateDocument para aplicar correções.`,
};
```

### **📝 2. Error Handling**

```typescript
// lib/ai/error-handling.ts
export async function handleAIError(error: unknown) {
  if (error instanceof Error) {
    switch (error.name) {
      case 'AI_APICallError':
        return {
          type: 'api_error',
          message: 'Erro na API do provedor de IA',
          retry: true,
        };
      case 'AI_InvalidPromptError':
        return {
          type: 'prompt_error', 
          message: 'Prompt inválido ou muito longo',
          retry: false,
        };
      case 'AI_RateLimitError':
        return {
          type: 'rate_limit',
          message: 'Limite de requisições atingido',
          retry: true,
          retryAfter: 60,
        };
      default:
        return {
          type: 'unknown_error',
          message: 'Erro desconhecido na IA',
          retry: false,
        };
    }
  }
}
```

### **📝 3. Usage Tracking**

```typescript
// lib/ai/usage-tracking.ts
export async function trackUsage(params: {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost?: number;
}) {
  await db.insert(aiUsage).values({
    userId: params.userId,
    model: params.model,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    totalTokens: params.promptTokens + params.completionTokens,
    cost: params.cost,
    timestamp: new Date(),
  });
}
```

## 🔄 RAG (Retrieval Augmented Generation)

### **🎯 Conceito:**
RAG = **Recuperação** + **Geração Aumentada**
- Busca informações relevantes no knowledge base
- Fornece contexto específico para o LLM
- Reduz hallucinations e melhora precisão

### **🏗️ Implementação RAG:**

```typescript
// lib/ai/rag.ts
export async function performRAG(query: string) {
  // 1. Gerar embedding da query
  const queryEmbedding = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // 2. Buscar documentos similares
  const similarDocuments = await db
    .select()
    .from(embeddings)
    .where(
      sql`${embeddings.embedding} <-> ${queryEmbedding.embedding} < 0.5`
    )
    .orderBy(
      sql`${embeddings.embedding} <-> ${queryEmbedding.embedding}`
    )
    .limit(5);

  // 3. Construir contexto
  const context = similarDocuments
    .map(doc => doc.content)
    .join('\n\n');

  // 4. Gerar resposta com contexto
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: `Contexto: ${context}\n\nPergunta: ${query}`,
  });

  return result.text;
}
```

## 🎯 Melhores Práticas

### **✅ Do's:**
1. **Use streaming** para melhor UX
2. **Implemente tools** para funcionalidades específicas  
3. **Track usage** para monitoramento
4. **Handle errors** graciosamente
5. **Validate inputs** antes de enviar para IA
6. **Cache responses** quando apropriado

### **❌ Don'ts:**
1. **Não confie cegamente** nas respostas da IA
2. **Não ignore rate limits** dos providers
3. **Não exponha API keys** no frontend
4. **Não processe dados sensíveis** sem criptografia
5. **Não faça prompts muito longos** sem necessidade

## 🔗 Integração com Dify

Nossa aplicação também integra com **Dify** para agentes especializados:

```typescript
// lib/ai/dify-agents.ts
export async function callDifyAgent(agentId: string, message: string) {
  const response = await fetch(`${DIFY_API_BASE}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: '',
      user: getCurrentUserId(),
    }),
  });

  return response.body;
}
```

---

## 🎯 Resumo dos Fundamentos

1. **LLMs** - Modelos de texto com limitações conhecidas
2. **Embeddings** - Representação vetorial para busca semântica  
3. **Streaming** - Resposta em tempo real
4. **Tools** - Function calling para ações específicas
5. **RAG** - Conhecimento externo para reduzir hallucinations
6. **Error Handling** - Tratamento robusto de erros
7. **Usage Tracking** - Monitoramento de uso e custos

**💡 O AI SDK abstrai a complexidade de diferentes providers, permitindo foco na lógica de negócio!** 🚀✨ 