# 🤖 Integração com Agentes Dify

Esta implementação adiciona suporte completo para integração com agentes do Dify na aplicação de chat.

## ✨ Funcionalidades Implementadas

### 1. 🎯 Seletor de Agentes
- **Componente**: `DifyAgentSelector`
- **Localização**: Header do chat, ao lado do seletor de modelos
- **Recursos**:
  - Lista agentes organizados por categoria
  - Suporte a agentes estáticos e dinâmicos (via API)
  - Interface consistente com o design existente
  - Estado persistente no localStorage

### 2. 🔧 Gerenciamento de Estado
- **Hook**: `useDifyAgent`
- **Recursos**:
  - Seleção e persistência de agentes
  - Execução de agentes com streaming
  - Estados de loading e erro
  - Integração com localStorage

### 3. 🌐 API Integration
- **Endpoint**: `/api/dify`
- **Métodos**:
  - `GET`: Lista agentes disponíveis
  - `POST`: Executa agente com streaming
- **Recursos**:
  - Proxy para API do Dify
  - Tratamento de erros
  - Suporte a streaming de respostas

### 4. 📋 Agentes Pré-configurados
- **Assistente Geral**: Perguntas diversas
- **Assistente de Código**: Programação e desenvolvimento
- **Consultor Médico**: Questões de saúde
- **Consultor Jurídico**: Questões legais

## 🚀 Como Usar

### 1. Configuração Inicial
```bash
# Adicione ao seu .env.local
NEXT_PUBLIC_DIFY_API_KEY=your_dify_api_key_here
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai
DIFY_API_KEY=your_dify_api_key_here
DIFY_BASE_URL=https://api.dify.ai
```

### 2. Reiniciar a Aplicação
```bash
npm run dev
# ou
pnpm dev
```

### 3. Usar no Chat
1. Abra a aplicação
2. No header do chat, você verá um novo seletor "Selecionar Agente"
3. Escolha um agente da lista
4. Envie mensagens normalmente - elas serão processadas pelo agente selecionado

## 📁 Estrutura de Arquivos

```
lib/ai/
├── dify-agents.ts          # Definições e API dos agentes

components/
├── dify-agent-selector.tsx # Componente seletor
├── dify-agent-demo.tsx     # Componente de demonstração
└── chat-header.tsx         # Integração no header

hooks/
└── use-dify-agent.ts       # Hook de gerenciamento

app/(chat)/api/
└── dify/
    └── route.ts            # API routes para Dify
```

## 🎨 Componente de Demonstração

Para testar a integração, você pode usar o componente `DifyAgentDemo`:

```tsx
import { DifyAgentDemo } from '@/components/dify-agent-demo';

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <DifyAgentDemo />
    </div>
  );
}
```

## 🔧 Personalização

### Adicionar Novos Agentes
Edite `lib/ai/dify-agents.ts`:

```typescript
export const difyAgents: Array<DifyAgent> = [
  // ... agentes existentes
  {
    id: 'meu-agente-personalizado',
    name: 'Meu Agente',
    description: 'Descrição do meu agente',
    category: 'Personalizado',
  },
];
```

### Customizar Categorias
As categorias são definidas automaticamente com base no campo `category` dos agentes.

### Modificar Comportamento da API
Edite `app/(chat)/api/dify/route.ts` para customizar:
- Headers de requisição
- Formato de resposta
- Tratamento de erros
- Parâmetros enviados

## 🐛 Troubleshooting

### Problema: Seletor não aparece
- ✅ Verifique se as variáveis de ambiente estão configuradas
- ✅ Confirme que a aplicação foi reiniciada após adicionar as variáveis
- ✅ Verifique o console do navegador por erros

### Problema: Agentes não carregam
- ✅ Teste a conectividade com a API do Dify
- ✅ Verifique se a API Key está válida
- ✅ Confirme se a URL base está correta

### Problema: Erro de execução
- ✅ Verifique os logs do servidor
- ✅ Confirme se o agente selecionado existe no Dify
- ✅ Teste a API diretamente com ferramentas como Postman

## 🔄 Próximos Passos

- [ ] Integração com sistema de chat existente
- [ ] Suporte a conversas com contexto
- [ ] Cache de agentes para melhor performance
- [ ] Interface de configuração de agentes
- [ ] Métricas e analytics de uso
- [ ] Suporte a múltiplos workspaces do Dify

## 📝 Notas Técnicas

- A integração usa Next.js App Router
- Suporte a TypeScript completo
- Componentes seguem padrões do shadcn/ui
- Estado gerenciado com React hooks
- API routes para comunicação segura com Dify
- Tratamento de erros robusto
- Suporte a streaming de respostas

---

**Implementado com ❤️ para melhorar a experiência de chat com IA** 