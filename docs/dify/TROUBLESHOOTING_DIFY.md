# 🔧 Troubleshooting: Problemas com Agentes Dify

## 🚨 Erro Atual: "Erro ao executar agente Dify"

### **Sintomas:**
```
Erro ao executar agente Dify: Error: Erro do Dify:
at execute (file:///C%3A/Users/eduib/Desktop/GIT/humana-companions/app/%28chat%29/api/chat/route.ts:178:20)
```

### **Possíveis Causas:**

## 🔍 Diagnóstico Passo a Passo

### **1. Verificar Configuração Básica**

```bash
# Listar agentes disponíveis
pnpm run dify:list
```

**Se der erro aqui**, o problema é na configuração básica:
- ✅ Verifique `DIFY_API_KEY` no `.env.local`
- ✅ Verifique `DIFY_BASE_URL` no `.env.local`
- ✅ Teste conectividade com a internet

### **2. Testar Agente Específico**

```bash
# Testar um agente específico
pnpm run dify:test app-SEU-ID-AQUI "Olá, teste"
```

**Resultados possíveis:**

#### ✅ **Sucesso:**
```
✅ Conexão estabelecida! Processando stream...
📨 Evento 1: message
Olá! Como posso ajudar você hoje?
✅ Mensagem concluída
```

#### ❌ **Erro 401 - Unauthorized:**
```
❌ Erro na requisição:
Status: 401
Response: {"code": "unauthorized", "message": "Invalid API key"}
```
**Solução:** API Key incorreta ou expirada

#### ❌ **Erro 404 - App Not Found:**
```
❌ Erro na requisição:
Status: 404
Response: {"code": "app_not_found", "message": "App not found"}
```
**Solução:** ID do agente incorreto

#### ❌ **Erro 403 - Forbidden:**
```
❌ Erro na requisição:
Status: 403
Response: {"code": "forbidden", "message": "Access denied"}
```
**Solução:** Sem permissão para acessar o agente

### **3. Verificar IDs dos Agentes**

O problema mais comum é usar IDs incorretos. Verifique:

```typescript
// ❌ INCORRETO - IDs genéricos
selectedDifyAgent = "dify-assistant"

// ✅ CORRETO - IDs reais do Dify
selectedDifyAgent = "app-12345678-1234-1234-1234-123456789abc"
```

### **4. Verificar Variáveis de Ambiente**

Seu `.env.local` deve ter:

```env
# Básico (OBRIGATÓRIO)
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai

# Para frontend (OBRIGATÓRIO)
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai

# IDs específicos (OBRIGATÓRIO para funcionar)
NEXT_PUBLIC_DIFY_AGENT_GENERAL=app-12345678-1234-1234-1234-123456789abc
NEXT_PUBLIC_DIFY_AGENT_CODE=app-87654321-4321-4321-4321-cba987654321
NEXT_PUBLIC_DIFY_AGENT_DEFAULT=app-12345678-1234-1234-1234-123456789abc
```

## 🛠️ Soluções por Tipo de Erro

### **Erro: "selectedDifyAgent is undefined"**
```typescript
// Problema: Hook não está sendo usado corretamente
const { selectedAgentId } = useDifyAgent(); // ✅ Correto
```

### **Erro: "API Key not found"**
```bash
# Verificar se variáveis estão carregadas
echo $DIFY_API_KEY
echo $NEXT_PUBLIC_DIFY_API_KEY
```

### **Erro: "Invalid response format"**
O Dify pode retornar formatos diferentes. O código foi atualizado para lidar com:
- `data.answer` (formato padrão)
- `data.content` (formato alternativo)
- `data.event` diferentes (`message`, `agent_message`, `message_end`)

### **Erro: "Stream reading failed"**
```typescript
// Novo código com melhor tratamento de stream
const decoder = new TextDecoder();
const chunk = decoder.decode(value, { stream: true });
```

## 🧪 Scripts de Debug

### **1. Listar Agentes:**
```bash
pnpm run dify:list
```

### **2. Testar Agente Específico:**
```bash
pnpm run dify:test app-SEU-ID "Mensagem de teste"
```

### **3. Debug no Console do Navegador:**
```javascript
// Verificar agente selecionado
console.log('Selected agent:', localStorage.getItem('dify-selected-agent'));

// Verificar configuração
console.log('Dify config:', {
  apiKey: process.env.NEXT_PUBLIC_DIFY_API_KEY?.substring(0, 10) + '...',
  baseUrl: process.env.NEXT_PUBLIC_DIFY_BASE_URL
});
```

## 🔄 Checklist de Resolução

### **Nível 1: Configuração Básica**
- [ ] `.env.local` existe e está configurado
- [ ] `DIFY_API_KEY` está correto
- [ ] `DIFY_BASE_URL` está correto
- [ ] Aplicação foi reiniciada após configurar

### **Nível 2: IDs dos Agentes**
- [ ] Executou `pnpm run dify:list` com sucesso
- [ ] IDs dos agentes estão no formato `app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- [ ] IDs estão configurados nas variáveis de ambiente
- [ ] `NEXT_PUBLIC_DIFY_AGENT_DEFAULT` está definido

### **Nível 3: Teste Individual**
- [ ] `pnpm run dify:test ID_DO_AGENTE` funciona
- [ ] Agente responde corretamente
- [ ] Stream é processado sem erros

### **Nível 4: Integração no Chat**
- [ ] Seletor de agentes aparece no header
- [ ] Consegue selecionar um agente
- [ ] Mensagem é enviada para o agente correto
- [ ] Resposta aparece no chat

## 🚨 Casos Específicos

### **Erro na Linha 178:**
Este erro específico foi corrigido com:
- Melhor tratamento de erros HTTP
- Logging detalhado de respostas
- Tratamento de diferentes formatos de evento
- Fallback para modelo padrão em caso de erro

### **Stream Vazio:**
```typescript
// Novo código detecta diferentes tipos de conteúdo
const content = data.answer || data.content || '';
```

### **Parsing Errors:**
```typescript
// Novo código continua processamento mesmo com erro de parse
catch (parseError) {
  console.error('Erro ao parsear:', parseError, 'Line:', line);
  // Continuar processamento
}
```

## 📞 Próximos Passos

Se ainda estiver com problemas:

1. **Execute o diagnóstico completo:**
   ```bash
   pnpm run dify:list
   pnpm run dify:test SEU_AGENT_ID "teste"
   ```

2. **Verifique os logs do servidor** (console onde roda `pnpm dev`)

3. **Verifique os logs do navegador** (F12 → Console)

4. **Teste diretamente no Dify** para confirmar que o agente funciona

---

**💡 Dica:** O erro foi corrigido com melhor tratamento de stream e fallback. Teste novamente após as correções! 