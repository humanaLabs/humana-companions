# 🎨 Guia de Modificações de UI - Humana Companions

## 📋 Visão Geral

Este documento estabelece regras e padrões específicos para modificações de interface, componentes e controles, visando evitar que alterações quebrem o código existente ou introduzam inconsistências.

## 🎯 Problemas Comuns e Soluções

### ❌ **Problema: IA "se perde" em modificações complexas**
- **Causa**: Falta de contexto específico sobre a estrutura dos componentes
- **Solução**: Sempre fornecer o mapeamento completo da estrutura antes da modificação

### ❌ **Problema: Código quebrado após alterações**
- **Causa**: Modificação de dependências sem atualizar importações
- **Solução**: Checklist de verificação pós-modificação obrigatório

### ❌ **Problema: Inconsistências visuais**
- **Causa**: Não seguir os padrões estabelecidos do design system
- **Solução**: Templates e padrões documentados para cada tipo de componente

## 🏗️ Estrutura de Componentes - Mapa de Referência

### **📱 Componentes de Layout Principal**
```
app/
├── layout.tsx                 # Layout raiz da aplicação
├── (chat)/
│   ├── layout.tsx            # Layout específico do chat
│   └── page.tsx              # Página principal do chat
└── (auth)/
    ├── login/page.tsx        # Página de login
    └── register/page.tsx     # Página de registro

components/
├── app-sidebar.tsx           # Sidebar principal com navegação
├── chat-header.tsx           # Header do chat com controles
├── chat.tsx                  # Componente principal do chat
├── multimodal-input.tsx      # Input principal do chat
├── messages.tsx              # Container de mensagens
├── message.tsx               # Componente individual de mensagem
└── ui/                       # Componentes base do shadcn/ui
    ├── button.tsx
    ├── input.tsx
    ├── dropdown-menu.tsx
    └── ...
```

### **🎨 Componentes de Artifacts**
```
components/
├── artifact.tsx              # Container principal dos artifacts
├── artifact-actions.tsx      # Ações dos artifacts (copy, download, etc.)
├── artifact-close-button.tsx # Botão de fechar artifact
└── artifact-messages.tsx     # Mensagens relacionadas aos artifacts

artifacts/
├── text/client.tsx           # Editor de texto
├── code/client.tsx           # Editor de código
├── image/client.tsx          # Visualizador de imagem
└── sheet/client.tsx          # Editor de planilha
```

## 📐 Regras de Modificação por Tipo

### **🔧 1. Modificações no Input de Chat**

#### **Localização**: `components/multimodal-input.tsx`

#### **⚠️ ATENÇÃO CRÍTICA**:
- **NUNCA** altere a estrutura base do formulário sem verificar as dependências
- **SEMPRE** mantenha os event handlers existentes
- **SEMPRE** preserve as props necessárias para o funcionamento

#### **✅ Padrão para Adicionar Controles**:
```typescript
// ANTES de modificar, identifique a estrutura:
// 1. Container principal (form)
// 2. Área de input (textarea + botões)
// 3. Área de controles (botões de ação)
// 4. Área de anexos (file uploads)

// EXEMPLO: Adicionando um novo botão
const ExistingStructure = () => (
  <form>
    <div className="input-area">
      <Textarea />
      <div className="controls-area">
        {/* ADICIONE NOVOS CONTROLES AQUI */}
        <NewButton onClick={handleNewAction} />
        {/* NÃO REMOVA OS CONTROLES EXISTENTES */}
        <ExistingButton />
      </div>
    </div>
  </form>
);
```

#### **🔍 Checklist Pré-Modificação**:
- [ ] Identifiquei todos os event handlers existentes?
- [ ] Verifiquei quais props são passadas pelo componente pai?
- [ ] Mapeei todos os estados (loading, disabled, etc.)?
- [ ] Identifiquei as dependências de outros componentes?

### **🔧 2. Modificações na Sidebar**

#### **Localização**: `components/app-sidebar.tsx`

#### **✅ Estrutura Padrão**:
```typescript
// ESTRUTURA FIXA - NÃO ALTERAR:
<Sidebar>
  <SidebarHeader>
    {/* Logo e controles principais */}
  </SidebarHeader>
  
  <SidebarContent>
    {/* ÁREA SEGURA PARA MODIFICAÇÕES */}
    <SidebarGroup>
      <SidebarGroupLabel>Navegação</SidebarGroupLabel>
      <SidebarGroupContent>
        {/* ADICIONE NOVOS ITENS AQUI */}
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  
  <SidebarFooter>
    {/* User nav - CUIDADO AO MODIFICAR */}
  </SidebarFooter>
</Sidebar>
```

### **🔧 3. Modificações no Header do Chat**

#### **Localização**: `components/chat-header.tsx`

#### **✅ Áreas de Modificação Segura**:
```typescript
// ESTRUTURA IDENTIFICADA:
<header className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    {/* ÁREA 1: Controles à esquerda */}
    <SidebarToggle />
    {/* ADICIONE NOVOS CONTROLES AQUI */}
  </div>
  
  <div className="flex items-center gap-2">
    {/* ÁREA 2: Controles centrais */}
    <ModelSelector />
    <VisibilitySelector />
    {/* ADICIONE NOVOS SELETORES AQUI */}
  </div>
  
  <div className="flex items-center gap-2">
    {/* ÁREA 3: Controles à direita */}
    {/* ADICIONE AÇÕES AQUI */}
  </div>
</header>
```

## 🎨 Padrões de Design System

### **🎯 Componentes Base (shadcn/ui)**

#### **✅ SEMPRE Use os Componentes Base**:
```typescript
// ✅ CORRETO - Usando componentes do design system
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu } from "@/components/ui/dropdown-menu"

// ❌ ERRADO - Criando elementos HTML diretamente
<button className="custom-button">Click me</button>
```

#### **🎨 Padrões de Cores e Estilos**:
```typescript
// ✅ CLASSES APROVADAS para novos componentes:
const approvedClasses = {
  // Botões
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  
  // Inputs
  input: "border border-input bg-background ring-offset-background",
  
  // Containers
  card: "border bg-card text-card-foreground shadow-sm",
  
  // Estados
  disabled: "disabled:pointer-events-none disabled:opacity-50",
  loading: "animate-pulse"
};
```

### **📏 Padrões de Spacing e Layout**:
```typescript
// ✅ SPACING PADRÃO - Use apenas estes valores:
const spacing = {
  xs: "gap-1",      // 4px
  sm: "gap-2",      // 8px
  md: "gap-4",      // 16px
  lg: "gap-6",      // 24px
  xl: "gap-8"       // 32px
};

// ✅ PADDING/MARGIN PADRÃO:
const padding = {
  xs: "p-1",
  sm: "p-2", 
  md: "p-4",
  lg: "p-6",
  xl: "p-8"
};
```

## 🔧 Processo de Modificação Segura

### **📋 Checklist OBRIGATÓRIO Antes de Qualquer Modificação**

#### **1️⃣ Análise Pré-Modificação**
- [ ] **Mapeei a estrutura atual** do componente que vou modificar?
- [ ] **Identifiquei todas as props** que o componente recebe?
- [ ] **Verifiquei os event handlers** existentes?
- [ ] **Listei as dependências** (hooks, contexts, stores)?
- [ ] **Identifiquei os componentes filhos** que podem ser afetados?

#### **2️⃣ Planejamento da Modificação**
- [ ] **Defini exatamente onde** vou adicionar o novo código?
- [ ] **Escolhi os componentes base** apropriados do design system?
- [ ] **Verifiquei se preciso** de novos imports?
- [ ] **Planejei como testar** a modificação?

#### **3️⃣ Execução Controlada**
- [ ] **Fiz backup** do código original (comentário ou arquivo)?
- [ ] **Adicionei apenas** o código necessário?
- [ ] **Mantive toda** a estrutura existente intacta?
- [ ] **Usei nomes descritivos** para novas variáveis/funções?

#### **4️⃣ Verificação Pós-Modificação**
- [ ] **Testei todas** as funcionalidades existentes?
- [ ] **Verifiquei se não há** erros de TypeScript?
- [ ] **Confirmei que** o layout não quebrou?
- [ ] **Testei em diferentes** tamanhos de tela?

## 🚨 Sinais de Alerta - Quando PARAR

### **🛑 RED FLAGS - Pare Imediatamente Se:**
- Você está modificando mais de 50% do código existente
- Precisa alterar múltiplos arquivos para uma simples adição
- Está removendo código sem entender sua função
- Os tipos TypeScript estão dando muitos erros
- A modificação afeta componentes não relacionados

### **⚠️ YELLOW FLAGS - Proceda com Cautela Se:**
- Está adicionando muitas dependências novas
- O componente já está muito complexo (>200 linhas)
- Precisa alterar event handlers existentes
- Está modificando props que vêm do componente pai

## 🎯 Templates para Modificações Comuns

### **📝 Template: Adicionando Botão no Input de Chat**

```typescript
// 1. LOCALIZE a área de controles no multimodal-input.tsx
// 2. IDENTIFIQUE a estrutura existente:

const existingStructure = (
  <div className="flex items-center gap-2">
    {/* BOTÕES EXISTENTES - NÃO ALTERAR */}
    <ExistingButton />
    
    {/* ✅ ADICIONE SEU NOVO BOTÃO AQUI */}
    <Button
      variant="ghost"
      size="sm"
      onClick={handleNewAction}
      disabled={isLoading}
      className="shrink-0"
    >
      <NewIcon className="w-4 h-4" />
      <span className="sr-only">Nova Ação</span>
    </Button>
    {/* ✅ FIM DA ADIÇÃO */}
  </div>
);

// 3. ADICIONE o handler correspondente:
const handleNewAction = useCallback(() => {
  // Sua lógica aqui
}, [/* dependências */]);
```

### **📝 Template: Adicionando Item na Sidebar**

```typescript
// 1. LOCALIZE o SidebarContent em app-sidebar.tsx
// 2. ADICIONE dentro de um SidebarGroup existente ou crie novo:

<SidebarGroup>
  <SidebarGroupLabel>Sua Nova Seção</SidebarGroupLabel>
  <SidebarGroupContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/nova-rota">
            <NewIcon className="w-4 h-4" />
            <span>Nova Funcionalidade</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
```

### **📝 Template: Adicionando Dropdown no Header**

```typescript
// 1. LOCALIZE a área apropriada no chat-header.tsx
// 2. USE o padrão DropdownMenu:

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <NewIcon className="w-4 h-4" />
      <span className="sr-only">Abrir menu</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleAction1}>
      <Icon1 className="w-4 h-4 mr-2" />
      Ação 1
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleAction2}>
      <Icon2 className="w-4 h-4 mr-2" />
      Ação 2
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 🧪 Estratégias de Teste Rápido

### **⚡ Teste Imediato Após Modificação**
```bash
# 1. Verificar se compila
npm run build

# 2. Verificar tipos
npm run type-check

# 3. Executar em desenvolvimento
npm run dev
```

### **🔍 Checklist de Teste Visual**
- [ ] Layout não quebrou em desktop
- [ ] Layout não quebrou em mobile
- [ ] Todos os botões estão clicáveis
- [ ] Tooltips/labels estão funcionando
- [ ] Estados de loading/disabled funcionam
- [ ] Navegação entre telas ainda funciona

## 📚 Recursos de Referência Rápida

### **🔗 Links Importantes**
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Componentes base
- [Tailwind CSS Classes](https://tailwindcss.com/docs) - Classes de estilo
- [Lucide Icons](https://lucide.dev/icons/) - Ícones padrão do projeto

### **📖 Arquivos de Referência Obrigatória**
- `components/ui/` - Todos os componentes base
- `lib/utils.ts` - Funções utilitárias
- `tailwind.config.ts` - Configuração de estilos
- `components.json` - Configuração do shadcn/ui

---

## 🎯 Resumo das Regras de Ouro

1. **🔍 SEMPRE** mapeie a estrutura antes de modificar
2. **✅ SEMPRE** use componentes do design system
3. **⚠️ NUNCA** altere mais de 50% do código existente
4. **📋 SEMPRE** siga o checklist de verificação
5. **🧪 SEMPRE** teste imediatamente após modificar
6. **📝 SEMPRE** use os templates fornecidos
7. **🛑 PARE** se encontrar red flags
8. **📚 SEMPRE** consulte a documentação de referência

**💡 Lembre-se: É melhor fazer múltiplas modificações pequenas e seguras do que uma grande modificação que quebra tudo!** 🎯✨ 