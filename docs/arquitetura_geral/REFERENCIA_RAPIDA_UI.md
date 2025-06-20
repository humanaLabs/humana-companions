# ⚡ Referência Rápida - Modificações de UI

## 🎯 Guia de Emergência para Modificações Seguras

### **🚨 ANTES DE QUALQUER MODIFICAÇÃO**

1. **📋 Mapeie a estrutura atual** do componente
2. **📝 Use um template específico** da documentação
3. **⚠️ Defina exatamente onde** adicionar o código
4. **✅ Liste componentes base** a usar (shadcn/ui)
5. **🔍 Identifique dependências** críticas

---

## 🗂️ Arquivos Principais por Funcionalidade

### **💬 Chat Input**
```
📁 components/multimodal-input.tsx
🎯 Para: Botões, controles, anexos
⚠️  Cuidado: event handlers, estrutura do form
```

### **📋 Sidebar**
```
📁 components/app-sidebar.tsx
🎯 Para: Navegação, menus, seções
⚠️  Cuidado: SidebarHeader/Footer
```

### **🔝 Header do Chat**
```
📁 components/chat-header.tsx
🎯 Para: Controles superiores, seletores
⚠️  Cuidado: 3 áreas (esquerda/centro/direita)
```

### **🎨 Artifacts**
```
📁 components/artifact.tsx
📁 artifacts/[tipo]/client.tsx
🎯 Para: Editores, visualizadores
⚠️  Cuidado: versionamento, estados
```

---

## 🧩 Componentes Base (shadcn/ui)

### **🔘 Botões**
```typescript
import { Button } from "@/components/ui/button"

// Variações
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### **📋 Dropdowns**
```typescript
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### **📝 Inputs**
```typescript
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

<Input placeholder="Digite aqui..." />
<Textarea placeholder="Texto longo..." />
```

### **🎴 Cards**
```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card"

<Card>
  <CardHeader>Título</CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

---

## 🎨 Classes CSS Aprovadas

### **🎯 Spacing**
```css
/* Gaps */
gap-1    /* 4px */
gap-2    /* 8px */
gap-4    /* 16px */
gap-6    /* 24px */

/* Padding */
p-1, p-2, p-4, p-6, p-8
px-2, py-1, etc.

/* Margin */
m-1, m-2, m-4, m-6, m-8
mx-2, my-1, etc.
```

### **🎨 Cores (Tema Automático)**
```css
/* Backgrounds */
bg-background
bg-card
bg-primary
bg-secondary
bg-accent

/* Text */
text-foreground
text-muted-foreground
text-primary
text-secondary

/* Borders */
border-border
border-input
```

### **📐 Layout**
```css
/* Flex */
flex items-center justify-between
flex items-center gap-2
flex-1, flex-shrink-0

/* Grid */
grid grid-cols-2 gap-4

/* Positioning */
relative, absolute
top-2, right-2, bottom-2, left-2
```

---

## 🎯 Templates Rápidos

### **➕ Botão no Input**
```typescript
// Localização: components/multimodal-input.tsx
// Área: div de controles (antes do SendButton)

<Button
  variant="ghost"
  size="sm"
  onClick={handleNewAction}
  disabled={isLoading}
  className="shrink-0"
>
  <IconName className="w-4 h-4" />
  <span className="sr-only">Descrição</span>
</Button>
```

### **📋 Item na Sidebar**
```typescript
// Localização: components/app-sidebar.tsx
// Área: dentro de SidebarGroup

<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <Link href="/rota">
      <IconName className="w-4 h-4" />
      <span>Nome do Item</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### **🔽 Dropdown no Header**
```typescript
// Localização: components/chat-header.tsx
// Área: uma das 3 divs (esquerda/centro/direita)

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <IconName className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleAction}>
      <Icon className="w-4 h-4 mr-2" />
      Ação
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 🎭 Ícones (Lucide React)

### **🔗 Import**
```typescript
import { 
  Download, Upload, Settings, User, 
  Menu, X, Plus, Minus, Edit, 
  Save, Copy, Share, Trash,
  Sun, Moon, Monitor
} from "lucide-react"
```

### **📏 Tamanhos Padrão**
```typescript
<IconName className="w-4 h-4" />   // 16px - botões pequenos
<IconName className="w-5 h-5" />   // 20px - botões médios
<IconName className="w-6 h-6" />   // 24px - botões grandes
```

---

## 🚨 Checklist de Emergência

### **⚡ Antes de Modificar**
- [ ] Li a estrutura atual do arquivo?
- [ ] Identifiquei onde adicionar exatamente?
- [ ] Escolhi o componente base correto?
- [ ] Defini o event handler necessário?

### **⚡ Durante a Modificação**
- [ ] Mantive toda estrutura existente?
- [ ] Usei apenas componentes aprovados?
- [ ] Segui padrões de nomenclatura?
- [ ] Adicionei acessibilidade (sr-only)?

### **⚡ Após Modificar**
- [ ] Testei em desktop e mobile?
- [ ] Verifiquei se não há erros TypeScript?
- [ ] Confirmei que funcionalidades existentes funcionam?
- [ ] Testei estados loading/disabled?

---

## 🔗 Links Úteis

- **[Guia Completo](./GUIA_MODIFICACOES_UI.md)** - Documentação detalhada
- **[Regras para IA](./REGRAS_INTERACAO_IA.md)** - Como fazer prompts efetivos
- **[shadcn/ui](https://ui.shadcn.com/docs/components)** - Componentes disponíveis
- **[Lucide Icons](https://lucide.dev/icons/)** - Ícones disponíveis

---

## 🎯 Dica de Ouro

**💡 Sempre que for modificar UI:**
1. **Leia** o arquivo primeiro
2. **Mapeie** a estrutura
3. **Escolha** o template apropriado
4. **Modifique** apenas o necessário
5. **Teste** imediatamente

**🚀 Modificações pequenas e frequentes são sempre melhores que grandes mudanças!** 