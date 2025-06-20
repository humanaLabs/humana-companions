# 🎯 Como Usar Agentes Dify no Chat

## 📍 Onde Selecionar o Agente

O agente Dify é selecionado no **header do chat**, ao lado do seletor de modelos:

```
[Sidebar] [New Chat] [Model Selector] [🤖 Dify Agent] [Visibility]
```

### Localização Visual:
1. Abra qualquer conversa de chat
2. No topo da tela, você verá os controles do header
3. O seletor de agentes Dify aparece como um dropdown com o texto "Selecionar Agente"

## 🔄 Como Funciona o Fluxo

### 1. **Seleção do Agente**
```
Usuário clica no seletor → Lista de agentes aparece → Usuário escolhe um agente
```

### 2. **Envio da Mensagem**
```
Usuário digita mensagem → Clica enviar → Sistema verifica se há agente selecionado
```

### 3. **Processamento**
```
Se agente Dify selecionado:
  ├── Envia para API do Dify
  ├── Recebe resposta em streaming
  └── Exibe no chat

Se nenhum agente:
  ├── Usa modelo padrão (GPT-4, etc.)
  └── Fluxo normal do chat
```

## 🎛️ Estados do Seletor

### Sem Configuração:
- Mostra agentes padrão (Assistente Geral, Código, Médico, Jurídico)
- Funciona como demonstração

### Com Configuração:
- Carrega agentes reais da sua conta Dify
- Permite execução real dos agentes

## ⚙️ Configuração para Uso Real

### 1. **Variáveis de Ambiente**
Adicione ao seu `.env.local`:

```env
# Configurações básicas do Dify
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai

# IDs específicos dos seus agentes (OBRIGATÓRIO)
NEXT_PUBLIC_DIFY_AGENT_GENERAL=app-12345678-1234-1234-1234-123456789abc
NEXT_PUBLIC_DIFY_AGENT_CODE=app-87654321-4321-4321-4321-cba987654321
NEXT_PUBLIC_DIFY_AGENT_MEDICAL=app-11111111-2222-3333-4444-555555555555
NEXT_PUBLIC_DIFY_AGENT_LEGAL=app-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
NEXT_PUBLIC_DIFY_AGENT_DEFAULT=app-12345678-1234-1234-1234-123456789abc
```

### 2. **Como Obter as Credenciais e IDs**

#### **API Key:**
1. Acesse [dify.ai](https://dify.ai)
2. Faça login na sua conta
3. Vá para "Apps" → Selecione sua aplicação
4. Em "API Access" → Copie a "API Key"
5. A Base URL geralmente é `https://api.dify.ai`

#### **IDs dos Agentes (IMPORTANTE):**
Para obter o ID específico de cada agente:

1. **Via Interface Web:**
   - Acesse sua aplicação no Dify
   - Na URL, você verá algo como: `https://dify.ai/app/app-12345678-1234-1234-1234-123456789abc`
   - O ID é a parte após `/app/`: `app-12345678-1234-1234-1234-123456789abc`

2. **Via API (Recomendado):**
   ```bash
   curl -X GET 'https://api.dify.ai/v1/apps' \
     -H 'Authorization: Bearer app-xxxxxxxxxxxxxxxx'
   ```
   
   Resposta:
   ```json
   {
     "data": [
       {
         "id": "app-12345678-1234-1234-1234-123456789abc",
         "name": "Meu Assistente Geral",
         "mode": "chat"
       }
     ]
   }
   ```

3. **Via Console do Navegador:**
   - Abra as ferramentas de desenvolvedor (F12)
   - Vá para Network → XHR
   - Navegue pela interface do Dify
   - Procure por requisições que contenham os IDs dos apps

### 3. **Reiniciar a Aplicação**
```bash
pnpm dev
```

## 🎯 Como Usar no Chat

### Passo a Passo:

1. **Abrir Chat**
   - Vá para qualquer conversa ou crie uma nova

2. **Selecionar Agente**
   - Clique no dropdown "Selecionar Agente" no header
   - Escolha um agente da lista (ex: "Assistente de Código")

3. **Enviar Mensagem**
   - Digite sua mensagem normalmente
   - Clique enviar ou pressione Enter

4. **Ver Resposta**
   - A resposta virá do agente Dify selecionado
   - Aparece em streaming como uma conversa normal

### Exemplo Prático:

```
1. Seleciono "Assistente de Código"
2. Digito: "Como criar uma função em Python?"
3. O agente especializado em código responde
4. Continuo a conversa com o mesmo agente
```

## 🔄 Alternando Entre Agentes

Você pode trocar de agente a qualquer momento:

1. Clique novamente no seletor
2. Escolha outro agente
3. A próxima mensagem usará o novo agente

**Nota**: Cada mensagem usa o agente que estava selecionado no momento do envio.

## 🎨 Agentes Disponíveis

### Padrão (Demonstração):
- **Assistente Geral**: Perguntas diversas
- **Assistente de Código**: Programação
- **Consultor Médico**: Questões de saúde  
- **Consultor Jurídico**: Questões legais

### Com API Configurada:
- Carrega todos os agentes da sua conta Dify
- Organiza por categoria automaticamente
- Nomes e descrições vindos do Dify

## 🐛 Resolução de Problemas

### Seletor Não Aparece:
- ✅ Verifique se você está em uma página de chat
- ✅ Confirme que não está em modo readonly

### Agentes Não Carregam:
- ✅ Verifique as variáveis de ambiente
- ✅ Confirme se a API Key está correta
- ✅ Teste conectividade com Dify

### Erro na Execução:
- ✅ Verifique logs do servidor (console)
- ✅ Confirme se o agente existe no Dify
- ✅ Teste se a API Key tem permissões

### Resposta Vazia:
- ✅ Verifique se o agente está configurado no Dify
- ✅ Confirme se há créditos na conta Dify
- ✅ Teste o agente diretamente no Dify

## 💡 Dicas de Uso

### Para Melhor Experiência:
1. **Configure agentes específicos** no Dify para diferentes tarefas
2. **Use nomes descritivos** para seus agentes
3. **Organize por categorias** para facilitar seleção
4. **Teste agentes** no Dify antes de usar no chat

### Casos de Uso:
- **Desenvolvimento**: Agente especializado em sua stack tecnológica
- **Suporte**: Agente treinado na documentação da empresa
- **Vendas**: Agente com conhecimento dos produtos
- **Educação**: Agentes especializados por matéria

---

**🎉 Agora você pode usar agentes Dify especializados diretamente no seu chat!** 