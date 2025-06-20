# Configuração da Integração com Dify

Este documento explica como configurar a integração com agentes do Dify na aplicação.

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Configurações do Dify (públicas - usadas no frontend)
NEXT_PUBLIC_DIFY_API_KEY=your_dify_api_key_here
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai

# Configurações do Dify (privadas - usadas no backend)
DIFY_API_KEY=your_dify_api_key_here
DIFY_BASE_URL=https://api.dify.ai
```

## Como Obter as Credenciais

1. Acesse sua conta no [Dify](https://dify.ai)
2. Vá para as configurações da sua aplicação
3. Copie a API Key
4. Configure a URL base (geralmente `https://api.dify.ai` para a versão cloud)

## Funcionalidades Implementadas

### 1. Seletor de Agentes
- Componente `DifyAgentSelector` no header do chat
- Lista agentes por categoria
- Suporte a agentes padrão e dinâmicos via API

### 2. Execução de Agentes
- Hook `useDifyAgent` para gerenciar estado
- API route `/api/dify` para comunicação com o Dify
- Suporte a streaming de respostas

### 3. Agentes Padrão
Os seguintes agentes estão pré-configurados:
- **Assistente Geral**: Para perguntas diversas
- **Assistente de Código**: Especializado em programação
- **Consultor Médico**: Para questões de saúde
- **Consultor Jurídico**: Para questões legais

## Como Usar

1. Configure as variáveis de ambiente
2. Reinicie a aplicação
3. No chat, você verá um novo seletor ao lado do seletor de modelos
4. Selecione um agente do Dify
5. Envie mensagens que serão processadas pelo agente selecionado

## Estrutura dos Arquivos

- `lib/ai/dify-agents.ts` - Definições dos agentes e funções de API
- `components/dify-agent-selector.tsx` - Componente seletor
- `hooks/use-dify-agent.ts` - Hook para gerenciar estado
- `app/(chat)/api/dify/route.ts` - API route para comunicação
- `components/chat-header.tsx` - Integração no header

## Troubleshooting

### Erro: "Configuração do agente incompleta"
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se a API Key está correta

### Erro: "Erro do Dify: Unauthorized"
- Verifique se a API Key está válida
- Confirme se você tem permissões para acessar os agentes

### Agentes não carregam
- Verifique a conectividade com a API do Dify
- Confirme se a URL base está correta 