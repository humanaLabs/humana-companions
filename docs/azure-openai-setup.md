# 🌐 Azure OpenAI - Guia de Configuração

> **Guia completo** para configurar e usar Azure OpenAI no Humana Companions

## 🚀 Quick Start

### 1. **Configuração das Variáveis de Ambiente**

Adicione ao seu `.env.local`:

```bash
# Azure OpenAI Configuration
AZURE_API_KEY=your_azure_openai_api_key
AZURE_RESOURCE_NAME=your_azure_openai_resource_name
```

### 2. **Uso nos Componentes**

```typescript
import { myProvider } from '@/lib/ai/providers';

// O provider automaticamente detecta se Azure está configurado
const result = await generateText({
  model: myProvider.languageModel('azure-gpt-4-turbo'),
  prompt: 'Olá, como você está?',
});
```

---

## 📋 Modelos Disponíveis

### **🤖 Modelos de Linguagem**

| ID do Modelo | Nome | Descrição | Uso Recomendado |
|--------------|------|-----------|-----------------|
| `azure-gpt-4` | Azure GPT-4 | Modelo GPT-4 padrão | Tarefas complexas |
| `azure-gpt-4-turbo` | Azure GPT-4 Turbo | Versão otimizada do GPT-4 | Chat principal |
| `azure-gpt-35-turbo` | Azure GPT-3.5 Turbo | Modelo rápido e eficiente | Títulos, resumos |
| `azure-gpt-4o` | Azure GPT-4o | Modelo otimizado | Análises avançadas |
| `azure-gpt-4o-mini` | Azure GPT-4o Mini | Versão compacta | Tarefas simples |

### **🎨 Modelos de Imagem**

| ID do Modelo | Nome | Descrição |
|--------------|------|-----------|
| `azure-dalle-3` | Azure DALL-E 3 | Geração de imagens |

### **🔧 Modelos Especializados**

| ID do Modelo | Nome | Descrição |
|--------------|------|-----------|
| `azure-chat-model` | Azure Chat | Modelo padrão para chat |
| `azure-chat-model-reasoning` | Azure Reasoning | Chat com raciocínio |
| `azure-title-model` | Azure Title | Geração de títulos |
| `azure-artifact-model` | Azure Artifact | Criação de artifacts |

---

## ⚙️ Configuração Detalhada

### **🔑 Obtendo as Credenciais**

1. **Acesse o Azure Portal**: https://portal.azure.com
2. **Crie um recurso OpenAI**:
   - Vá para "Create a resource"
   - Procure por "Azure OpenAI"
   - Configure a região e pricing tier
3. **Obtenha as credenciais**:
   - **API Key**: Em "Keys and Endpoint"
   - **Resource Name**: Nome do seu recurso
   - **API Version**: Use `2024-02-01` (recomendado)

### **📝 Configuração Completa**

```bash
# .env.local
AZURE_API_KEY=1234567890abcdef1234567890abcdef
AZURE_RESOURCE_NAME=my-openai-resource
```

### **🎯 Deploy dos Modelos**

No Azure Portal, você precisa fazer deploy dos modelos:

1. **Vá para o seu recurso OpenAI**
2. **Clique em "Model deployments"**
3. **Deploy os modelos necessários**:
   - `gpt-4-turbo` → Nome: `gpt-4-turbo`
   - `gpt-35-turbo` → Nome: `gpt-35-turbo`
   - `gpt-4` → Nome: `gpt-4`
   - `dall-e-3` → Nome: `dall-e-3`

---

## 💻 Exemplos de Uso

### **💬 Chat Básico**

```typescript
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

async function chatWithAzure() {
  const result = await generateText({
    model: myProvider.languageModel('azure-gpt-4-turbo'),
    prompt: 'Explique o que é inteligência artificial',
    temperature: 0.7,
    maxTokens: 1000,
  });
  
  return result.text;
}
```

### **🧠 Chat com Raciocínio**

```typescript
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

async function reasoningChat() {
  const result = await generateText({
    model: myProvider.languageModel('azure-chat-model-reasoning'),
    prompt: 'Resolva este problema matemático: 2x + 5 = 15',
    temperature: 0.3,
  });
  
  // O modelo incluirá tags <think> com o raciocínio
  return result.text;
}
```

### **🎨 Geração de Imagens**

```typescript
import { generateImage } from 'ai';
import { myProvider } from '@/lib/ai/providers';

async function generateImageWithAzure() {
  const result = await generateImage({
    model: myProvider.imageModel('azure-dalle-3'),
    prompt: 'Um gato usando óculos de sol em uma praia tropical',
    size: '1024x1024',
    quality: 'hd',
  });
  
  return result.image;
}
```

### **📝 Usando Configurações Predefinidas**

```typescript
import { azureModelConfigs, createAzureModel } from '@/lib/ai/azure-config';

// Usar configuração para chat
const chatModel = createAzureModel(azureModelConfigs.chat.model);

// Usar configuração para reasoning
const reasoningModel = createAzureModel(azureModelConfigs.reasoning.model);
```

---

## 🔄 Fallback para OpenAI

O sistema automaticamente faz fallback para OpenAI se Azure não estiver configurado:

```typescript
// Se AZURE_OPENAI_API_KEY não estiver definida,
// o sistema usa OpenAI automaticamente
const result = await generateText({
  model: myProvider.languageModel('chat-model'), // Usa OpenAI
  prompt: 'Hello world',
});
```

---

## 🛠️ Troubleshooting

### **❌ Erro: "Azure OpenAI não está configurado"**

**Solução:**
1. Verifique se as variáveis estão no `.env.local`
2. Reinicie o servidor de desenvolvimento
3. Confirme que o resource name está correto

### **❌ Erro: "Model not found"**

**Solução:**
1. Verifique se o modelo foi deployado no Azure Portal
2. Confirme que o nome do deployment está correto
3. Use exatamente os nomes: `gpt-4-turbo`, `gpt-35-turbo`, etc.

### **❌ Erro: "Invalid API version"**

**Solução:**
1. Use `2024-02-01` como versão da API
2. Verifique a documentação Azure para versões suportadas

### **🔍 Debug**

```typescript
import { isAzureConfigured } from '@/lib/ai/azure-config';

console.log('Azure configurado:', isAzureConfigured);
```

---

## 💰 Considerações de Custo

### **💵 Pricing Azure vs OpenAI**

| Modelo | Azure OpenAI | OpenAI Direct |
|--------|---------------|---------------|
| GPT-4 Turbo | Varia por região | $10/1M tokens |
| GPT-3.5 Turbo | Varia por região | $1/1M tokens |
| DALL-E 3 | Varia por região | $0.04/imagem |

### **🎯 Otimização**

1. **Use GPT-3.5 Turbo** para tarefas simples
2. **Configure timeouts** adequados
3. **Monitore usage** no Azure Portal
4. **Use cache** quando possível

---

## 🔐 Segurança

### **🛡️ Boas Práticas**

1. **Nunca commite** as API keys
2. **Use Azure Key Vault** em produção
3. **Configure IP restrictions** no Azure
4. **Monitore usage** regularmente
5. **Rotacione keys** periodicamente

### **🔒 Configuração Segura**

```bash
# Produção - Use Azure Key Vault
AZURE_OPENAI_API_KEY=${KEY_VAULT_SECRET}

# Desenvolvimento - Use .env.local
AZURE_OPENAI_API_KEY=your_dev_key
```

---

## 📊 Monitoramento

### **📈 Métricas Importantes**

1. **Token Usage** - Consumo por modelo
2. **Request Rate** - Requests por minuto
3. **Error Rate** - Taxa de erro
4. **Latency** - Tempo de resposta

### **🔍 Azure Portal**

1. Vá para seu recurso OpenAI
2. Clique em "Metrics"
3. Configure alertas para:
   - Token usage alto
   - Error rate alto
   - Request rate limite

---

## 🚀 Próximos Passos

1. **Configure Azure OpenAI** seguindo este guia
2. **Teste os modelos** com exemplos simples
3. **Monitore usage** no Azure Portal
4. **Otimize custos** usando modelos apropriados
5. **Configure alertas** para monitoramento

---

**🎉 Agora você tem Azure OpenAI completamente integrado ao Humana Companions!**

**💡 Dúvidas? Consulte a [documentação oficial do Azure OpenAI](https://docs.microsoft.com/azure/cognitive-services/openai/)** 