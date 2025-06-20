# 🆔 Guia Completo: IDs dos Agentes Dify

## 🎯 Resumo Rápido

**Onde informar o ID do agente Dify:**
- **Arquivo**: `lib/ai/dify-agents.ts` (configuração manual)
- **Variáveis de ambiente**: `.env.local` (configuração flexível)

## 📍 Onde os IDs São Usados

### 1. **Seleção no Frontend**
```typescript
// O usuário seleciona no header do chat
selectedAgentId = "app-12345678-1234-1234-1234-123456789abc"
```

### 2. **Envio para API**
```typescript
// ID é enviado junto com a mensagem
experimental_prepareRequestBody: (body) => ({
  selectedDifyAgent: selectedAgentId, // ← ID real do agente
})
```

### 3. **Execução no Backend**
```typescript
// API usa o ID para fazer requisição ao Dify
const difyResponse = await fetch(`${difyBaseUrl}/v1/chat-messages`, {
  // ... usando o selectedDifyAgent como ID do app
});
```

## 🔧 Como Obter os IDs Reais

### **Método 1: Script Automático (Recomendado)**

1. **Configure suas credenciais no `.env.local`:**
```env
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai
```

2. **Execute o script:**
```bash
pnpm run dify:list
```

3. **Resultado esperado:**
```
🔍 Buscando agentes do Dify...
📡 Base URL: https://api.dify.ai
🔑 API Key: app-abc123...

✅ Encontrados 3 agente(s):

📋 Agente 1:
   Nome: Assistente Geral
   ID: app-12345678-1234-1234-1234-123456789abc
   Modo: chat
   Descrição: Meu assistente para perguntas gerais

📋 Agente 2:
   Nome: Code Helper
   ID: app-87654321-4321-4321-4321-cba987654321
   Modo: chat
   Descrição: Especialista em programação

🔧 Para usar estes agentes, adicione ao seu .env.local:

NEXT_PUBLIC_DIFY_AGENT_ASSISTENTE_GERAL=app-12345678-1234-1234-1234-123456789abc
NEXT_PUBLIC_DIFY_AGENT_CODE_HELPER=app-87654321-4321-4321-4321-cba987654321
```

### **Método 2: Via Interface Web**

1. Acesse [dify.ai](https://dify.ai)
2. Faça login e vá para "Apps"
3. Clique em qualquer aplicação
4. Na URL, você verá: `https://dify.ai/app/app-12345678-1234-1234-1234-123456789abc`
5. O ID é: `app-12345678-1234-1234-1234-123456789abc`

### **Método 3: Via API Manual**

```bash
curl -X GET 'https://api.dify.ai/v1/apps' \
  -H 'Authorization: Bearer app-xxxxxxxxxxxxxxxx'
```

## ⚙️ Como Configurar os IDs

### **Opção A: Variáveis de Ambiente (Flexível)**

Adicione ao `.env.local`:
```env
# Configurações básicas
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai

# IDs específicos dos agentes (SUBSTITUA pelos seus IDs reais)
NEXT_PUBLIC_DIFY_AGENT_GENERAL=app-12345678-1234-1234-1234-123456789abc
NEXT_PUBLIC_DIFY_AGENT_CODE=app-87654321-4321-4321-4321-cba987654321
NEXT_PUBLIC_DIFY_AGENT_MEDICAL=app-11111111-2222-3333-4444-555555555555
NEXT_PUBLIC_DIFY_AGENT_LEGAL=app-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
NEXT_PUBLIC_DIFY_AGENT_DEFAULT=app-12345678-1234-1234-1234-123456789abc
```

### **Opção B: Configuração Direta no Código**

Edite `lib/ai/dify-agents.ts`:
```typescript
export const difyAgents: Array<DifyAgent> = [
  {
    id: 'app-12345678-1234-1234-1234-123456789abc', // ← SEU ID REAL
    name: 'Assistente Geral',
    description: 'Agente para assistência geral e perguntas diversas',
    category: 'Assistência',
  },
  // ... outros agentes
];
```

## 🔄 Fluxo Completo

### 1. **Configuração Inicial**
```bash
# 1. Obter IDs dos agentes
pnpm run dify:list

# 2. Configurar .env.local com os IDs reais
# 3. Reiniciar aplicação
pnpm dev
```

### 2. **Uso no Chat**
```
Usuario → Seleciona agente no header → ID é salvo → Envia mensagem → API usa ID para chamar Dify
```

### 3. **Debugging**
```bash
# Verificar se agentes foram carregados
console.log(difyAgents);

# Verificar ID selecionado
console.log(selectedAgentId);

# Verificar requisição para Dify
# (logs aparecem no console do servidor)
```

## 🐛 Problemas Comuns

### **Problema: "Agente não encontrado"**
```
❌ Erro: selectedDifyAgent 'app-wrong-id' não existe
```
**Solução:**
- Verifique se o ID está correto no `.env.local`
- Execute `pnpm run dify:list` para ver IDs válidos

### **Problema: "Unauthorized"**
```
❌ Erro do Dify: 401 Unauthorized
```
**Solução:**
- Verifique se `DIFY_API_KEY` está correta
- Confirme se a API key tem permissões para o agente

### **Problema: "App not found"**
```
❌ Erro do Dify: 404 App not found
```
**Solução:**
- O ID do agente pode estar incorreto
- O agente pode ter sido deletado no Dify
- Verifique se você tem acesso ao agente

## 💡 Dicas Importantes

### **Formato dos IDs:**
- ✅ Correto: `app-12345678-1234-1234-1234-123456789abc`
- ❌ Incorreto: `12345678-1234-1234-1234-123456789abc` (sem prefixo `app-`)
- ❌ Incorreto: `dify-assistant` (ID genérico)

### **Diferentes Tipos de Apps:**
- **Chat Apps**: `app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Workflow Apps**: Mesmo formato, mas modo diferente
- **Agent Apps**: Mesmo formato

### **Segurança:**
- IDs dos agentes podem ser públicos (vão para o frontend)
- API Keys devem ser privadas (apenas no backend)
- Use `NEXT_PUBLIC_` apenas para IDs, não para API keys

## 🎯 Checklist Final

- [ ] Obter IDs reais dos agentes via `pnpm run dify:list`
- [ ] Configurar variáveis de ambiente no `.env.local`
- [ ] Reiniciar aplicação com `pnpm dev`
- [ ] Testar seleção de agente no header do chat
- [ ] Enviar mensagem e verificar se vai para o agente correto
- [ ] Verificar logs do servidor para debug se necessário

---

**🎉 Agora você sabe exatamente onde e como configurar os IDs dos agentes Dify!** 