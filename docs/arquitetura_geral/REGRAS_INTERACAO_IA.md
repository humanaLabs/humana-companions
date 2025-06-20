# 🤖 Regras de Interação com IA - Modificações de Código

## 📋 Visão Geral

Este documento estabelece regras específicas para interação com IA (como Cursor, GitHub Copilot, etc.) ao fazer modificações de código, garantindo resultados mais precisos e evitando quebras.

## 🎯 Problema Central

**❌ Situação Comum**: "Adicione um botão de exportar no input de chat"
- IA não sabe onde colocar exatamente
- IA não conhece a estrutura atual
- IA pode quebrar funcionalidades existentes
- IA pode não seguir padrões do projeto

**✅ Solução**: Fornecer contexto específico e estruturado

## 📐 Regras de Comunicação com IA

### **🔧 1. Regra do Contexto Completo**

#### **❌ Prompt Vago**:
```
"Adicione um botão de exportar no chat"
```

#### **✅ Prompt Estruturado**:
```
TAREFA: Adicionar botão de exportar no input de chat

ARQUIVO ALVO: components/multimodal-input.tsx

ESTRUTURA ATUAL (mapeada):
- Form container principal
- Área de textarea
- Div de controles com botões existentes: [AttachmentButton, SendButton]

LOCALIZAÇÃO EXATA: 
- Adicionar ANTES do SendButton
- Dentro da div de controles existente

COMPONENTE BASE: 
- Usar Button do shadcn/ui
- Variant: "ghost"
- Size: "sm"
- Ícone: Download da lucide-react

HANDLER: 
- Nome: handleExport
- Função: exportar conversa atual como PDF

REQUISITOS:
- Manter todos os botões existentes
- Seguir padrão de acessibilidade (sr-only)
- Adicionar estado disabled quando isLoading
```

### **🔧 2. Regra do Mapeamento Prévio**

**SEMPRE** forneça o mapeamento da estrutura antes de pedir modificações:

```typescript
// EXEMPLO: Mapeamento do multimodal-input.tsx
ESTRUTURA IDENTIFICADA:
<form onSubmit={handleSubmit}>
  <div className="relative">
    <Textarea /> // Área principal de input
    <div className="absolute bottom-2 right-2 flex gap-2">
      <AttachmentButton /> // Botão de anexo
      <SendButton />       // Botão de enviar
      // ← ÁREA SEGURA PARA NOVOS BOTÕES
    </div>
  </div>
</form>

PROPS RECEBIDAS:
- input: string
- setInput: (value: string) => void
- isLoading: boolean
- onSubmit: () => void

HOOKS UTILIZADOS:
- useRef para textarea
- useCallback para handlers
- useEffect para auto-resize
```

### **🔧 3. Regra dos Templates Obrigatórios**

**SEMPRE** especifique qual template usar:

```
TEMPLATE OBRIGATÓRIO: "Adicionando Botão no Input de Chat"
(Consultar: docs/arquitetura_geral/GUIA_MODIFICACOES_UI.md)

CUSTOMIZAÇÕES:
- Ícone: Download
- Ação: handleExport
- Posição: Antes do SendButton
- Estado: Disabled quando isLoading
```

### **🔧 4. Regra da Verificação de Dependências**

**SEMPRE** liste as dependências que podem ser afetadas:

```
DEPENDÊNCIAS A VERIFICAR:
- chat.tsx (componente pai que passa props)
- messages.tsx (pode usar a função de export)
- Não alterar: event handlers existentes
- Não alterar: estrutura do form
- Manter: todos os imports atuais
```

## 🎨 Templates de Prompts por Tipo de Modificação

### **📝 Template: Modificação no Input de Chat**

```markdown
## MODIFICAÇÃO NO INPUT DE CHAT

**ARQUIVO**: `components/multimodal-input.tsx`

**ESTRUTURA ATUAL MAPEADA**:
[Cole aqui o resultado de ler o arquivo primeiro]

**MODIFICAÇÃO SOLICITADA**:
- Adicionar: [descreva o que quer adicionar]
- Localização: [especifique onde exatamente]
- Comportamento: [descreva como deve funcionar]

**TEMPLATE BASE**: "Adicionando Botão no Input de Chat"

**COMPONENTES A USAR**:
- Button (shadcn/ui)
- Ícone: [especifique qual]
- Variant: [ghost/outline/default]

**VERIFICAÇÕES OBRIGATÓRIAS**:
- [ ] Manter todos os event handlers existentes
- [ ] Preservar estrutura do form
- [ ] Adicionar handler correspondente
- [ ] Seguir padrão de acessibilidade
- [ ] Testar estados loading/disabled
```

### **📝 Template: Modificação na Sidebar**

```markdown
## MODIFICAÇÃO NA SIDEBAR

**ARQUIVO**: `components/app-sidebar.tsx`

**ESTRUTURA ATUAL MAPEADA**:
[Cole aqui a estrutura do SidebarContent]

**MODIFICAÇÃO SOLICITADA**:
- Seção: [nova seção ou existente]
- Item: [descreva o novo item]
- Ação: [para onde navega ou que função executa]

**TEMPLATE BASE**: "Adicionando Item na Sidebar"

**COMPONENTES A USAR**:
- SidebarGroup/SidebarMenuItem
- Ícone: [especifique qual]
- Link ou Button: [especifique]

**VERIFICAÇÕES OBRIGATÓRIAS**:
- [ ] Não alterar SidebarHeader/Footer
- [ ] Usar componentes Sidebar* corretos
- [ ] Adicionar ícone apropriado
- [ ] Testar navegação
```

### **📝 Template: Modificação no Header do Chat**

```markdown
## MODIFICAÇÃO NO HEADER DO CHAT

**ARQUIVO**: `components/chat-header.tsx`

**ESTRUTURA ATUAL MAPEADA**:
[Cole aqui as 3 áreas: esquerda, centro, direita]

**MODIFICAÇÃO SOLICITADA**:
- Área: [esquerda/centro/direita]
- Componente: [dropdown/botão/seletor]
- Função: [descreva o que faz]

**TEMPLATE BASE**: "Adicionando Dropdown no Header"

**COMPONENTES A USAR**:
- DropdownMenu ou Button
- Ícone: [especifique qual]
- Posicionamento: [align="start/center/end"]

**VERIFICAÇÕES OBRIGATÓRIAS**:
- [ ] Não alterar estrutura principal
- [ ] Manter responsividade
- [ ] Adicionar handlers necessários
- [ ] Testar em mobile
```

## 🔍 Checklist de Prompt Perfeito

### **✅ Antes de Enviar o Prompt, Verifique**:

1. **📋 Contexto Completo**
   - [ ] Especifiquei o arquivo exato
   - [ ] Mapeei a estrutura atual
   - [ ] Identifiquei a localização precisa

2. **🎯 Especificação Clara**
   - [ ] Descrevi exatamente o que quero
   - [ ] Especifiquei componentes a usar
   - [ ] Defini o comportamento esperado

3. **📝 Template Referenciado**
   - [ ] Citei qual template usar
   - [ ] Listei as customizações necessárias
   - [ ] Incluí verificações obrigatórias

4. **⚠️ Restrições Definidas**
   - [ ] Listei o que NÃO deve ser alterado
   - [ ] Identifiquei dependências críticas
   - [ ] Defini limites da modificação

## 🚨 Red Flags - Quando Reformular o Prompt

### **🛑 Pare e Reformule Se o Prompt**:
- É muito vago ("adicione um botão")
- Não especifica localização exata
- Não menciona componentes base a usar
- Não inclui verificações de segurança
- Pede para alterar muitos arquivos
- Não referencia templates existentes

### **⚠️ Sinais de Prompt Problemático**:
- "Melhore a interface" (muito vago)
- "Adicione funcionalidade X" (sem contexto)
- "Faça parecer melhor" (sem especificação)
- "Corrija os problemas" (sem identificar quais)

## 🎯 Exemplos de Prompts Bem Estruturados

### **✅ Exemplo 1: Botão de Tema no Header**

```markdown
TAREFA: Adicionar toggle de tema no header do chat

ARQUIVO ALVO: components/chat-header.tsx

ESTRUTURA ATUAL MAPEADA:
<header className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <SidebarToggle />
  </div>
  <div className="flex items-center gap-2">
    <ModelSelector />
    <VisibilitySelector />
  </div>
  <div className="flex items-center gap-2">
    <!-- ÁREA VAZIA - ADICIONAR AQUI -->
  </div>
</header>

LOCALIZAÇÃO EXATA: 
- Terceira div (controles à direita)
- Usar Button com DropdownMenu

TEMPLATE BASE: "Adicionando Dropdown no Header"

COMPONENTES:
- DropdownMenu do shadcn/ui
- DropdownMenuTrigger com Button variant="ghost"
- DropdownMenuContent com opções: Light, Dark, System
- Ícones: Sun, Moon, Monitor (lucide-react)

FUNCIONALIDADE:
- Hook: useTheme() do next-themes
- Ações: setTheme('light'), setTheme('dark'), setTheme('system')
- Estado atual: mostrar ícone do tema ativo

VERIFICAÇÕES:
- [ ] Não alterar estrutura das outras divs
- [ ] Manter responsividade
- [ ] Testar troca de tema
- [ ] Verificar ícones em ambos os temas
```

### **✅ Exemplo 2: Botão de Voz no Input**

```markdown
TAREFA: Adicionar botão de gravação de voz no input de chat

ARQUIVO ALVO: components/multimodal-input.tsx

ESTRUTURA ATUAL MAPEADA:
<form className="relative">
  <Textarea />
  <div className="absolute bottom-2 right-2 flex items-center gap-1">
    <AttachmentButton />
    <SendButton />
  </div>
</form>

LOCALIZAÇÃO EXATA:
- Dentro da div de controles
- ANTES do SendButton
- DEPOIS do AttachmentButton

TEMPLATE BASE: "Adicionando Botão no Input de Chat"

COMPONENTES:
- Button do shadcn/ui, variant="ghost", size="sm"
- Ícone: Mic (quando parado), Square (quando gravando)
- Estado: disabled quando isLoading

FUNCIONALIDADE:
- Estado: isRecording (boolean)
- Handler: handleVoiceToggle
- Visual: ícone muda cor quando gravando (text-red-500)
- Tooltip: "Gravar mensagem de voz"

DEPENDÊNCIAS:
- Não alterar: handleSubmit, handleAttachment
- Manter: todas as props existentes
- Adicionar: lógica de gravação (placeholder por enquanto)

VERIFICAÇÕES:
- [ ] Botões existentes continuam funcionando
- [ ] Layout não quebrou
- [ ] Estados visuais corretos
- [ ] Acessibilidade (sr-only)
```

## 📚 Recursos de Apoio

### **🔗 Links para Consulta Rápida**
- [Guia de Modificações UI](./GUIA_MODIFICACOES_UI.md) - Templates e padrões
- [Estrutura de Componentes](./ESTRUTURA_COMPONENTES.md) - Organização geral
- [Boas Práticas](./BOAS_PRATICAS_CODIGO.md) - Padrões de código

### **📖 Arquivos de Referência**
- `components/ui/` - Componentes base disponíveis
- `lib/utils.ts` - Funções utilitárias
- `components.json` - Configuração shadcn/ui

---

## 🎯 Resumo das Regras de Ouro para IA

1. **🔍 SEMPRE** mapeie a estrutura antes de pedir modificações
2. **📝 SEMPRE** use templates específicos para cada tipo de modificação
3. **⚠️ SEMPRE** especifique exatamente onde adicionar o código
4. **✅ SEMPRE** liste os componentes base a usar (shadcn/ui)
5. **🚨 SEMPRE** defina o que NÃO deve ser alterado
6. **🧪 SEMPRE** inclua verificações obrigatórias
7. **📋 NUNCA** use prompts vagos ou genéricos
8. **🛑 PARE** se o prompt não atende aos critérios mínimos

**💡 Lembre-se: Um prompt bem estruturado economiza horas de correções e retrabalho!** 🎯✨ 