# Configuração Azure OpenAI - Humana Companions

Este projeto está configurado para usar **apenas Azure OpenAI** como provider de IA.

## 📋 Pré-requisitos

1. Recurso Azure OpenAI criado
2. Deployment do modelo GPT-4o configurado
3. API Key do Azure

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
AZURE_API_KEY=sua_chave_da_api_aqui
```

### 2. Configuração do Recurso Azure

**Importante:** O projeto está configurado para o recurso específico:
- **Resource Name:** `1aifoundry`
- **Deployment Name:** `gpt-4o`

Se você tem um recurso diferente, edite o arquivo `lib/ai/azure-config.ts`:

```typescript
export const azureConfig = {
  resourceName: 'seu-resource-name', // Altere aqui
  deploymentName: 'seu-deployment-name', // Altere aqui
  apiKey: process.env.AZURE_API_KEY,
} as const;
```

### 3. URL Construída

Com a configuração atual, o sistema construirá URLs no formato:
```
https://1aifoundry.openai.azure.com/openai/deployments/gpt-4o/chat/completions
```

## 🚀 Como Usar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Copie o arquivo `.env.local.example` para `.env.local`
   - Adicione sua `AZURE_API_KEY`

3. **Executar o projeto:**
   ```bash
   npm run dev
   ```

## 🔍 Debug e Verificação

Quando o servidor iniciar, você verá logs indicando:
- ✅ Se o Azure está configurado corretamente
- 🔄 Quando um modelo está sendo criado
- ❌ Se há algum erro na configuração

### Logs Típicos:
```
✅ Azure configurado: {
  hasApiKey: true,
  resourceName: '1aifoundry',
  deploymentName: 'gpt-4o'
}

🔄 Criando modelo Azure com deployment: gpt-4o
✅ Modelo Azure criado: gpt-4o
```

## 🔧 Configuração de Fallback

Se o Azure não estiver configurado, o sistema automaticamente usará OpenAI como fallback com avisos no console.

## ❌ Solução de Problemas

### Erro: "Resource not found"
- Verifique se o `resourceName` está correto
- Confirme se o `deploymentName` existe no seu recurso Azure
- Verifique se a API Key está correta

### URL incorreta sendo construída
O AI SDK deve construir automaticamente:
```
https://{resourceName}.openai.azure.com/openai/deployments/{deploymentName}/chat/completions
```

Se a URL estiver diferente, verifique a configuração no `azure-config.ts`.

## 📚 Documentação de Referência

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [AI SDK Azure Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/azure)

## 🔄 Sistema de Providers

O projeto mantém a estrutura para múltiplos providers, mas usa apenas Azure:
- **Principal:** Azure OpenAI (GPT-4o)
- **Fallback:** OpenAI (se Azure não configurado)

Para adicionar outros providers no futuro, edite `lib/ai/providers.ts`. 