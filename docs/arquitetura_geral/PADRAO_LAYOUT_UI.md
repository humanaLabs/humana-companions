# Padrão de Layout UI - Humana Companions

## Visão Geral

Este documento define o padrão de layout e design system da aplicação Humana Companions. Todos os componentes e páginas devem seguir estas diretrizes para garantir consistência visual e melhor experiência do usuário.

## Sistema de Cores e Classes

### 1. Backgrounds de Cards e Containers

**✅ CORRETO:**
```tsx
// Cards principais
<div className="bg-card border rounded-lg p-6">

// Containers de seção
<div className="bg-muted/50 rounded-lg p-6">

// Background da aplicação
<div className="bg-background">
```

**❌ EVITAR:**
```tsx
// NÃO usar cores hardcoded
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
<div className="bg-gray-50 dark:bg-gray-800">
```

### 2. Cores de Texto

**✅ CORRETO:**
```tsx
// Texto principal
<h1 className="text-foreground">Título</h1>
<p className="text-foreground">Texto principal</p>

// Texto secundário/descritivo
<p className="text-muted-foreground">Texto secundário</p>
<span className="text-muted-foreground">Descrição</span>
```

**❌ EVITAR:**
```tsx
// NÃO usar cores específicas
<h1 className="text-gray-900 dark:text-white">
<p className="text-gray-600 dark:text-gray-400">
```

### 3. Botões

**✅ CORRETO:**
```tsx
// Botão primário
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Ação Principal
</button>

// Botão secundário
<button className="bg-muted hover:bg-muted/80 text-muted-foreground">
  Ação Secundária
</button>
```

**❌ EVITAR:**
```tsx
// NÃO usar cores específicas
<button className="bg-blue-600 hover:bg-blue-700 text-white">
<button className="bg-green-600 hover:bg-green-700 text-white">
```

### 4. Inputs e Forms

**✅ CORRETO:**
```tsx
<input className="bg-background text-foreground border rounded-lg" />
<select className="bg-background text-foreground border rounded-lg" />
```

**❌ EVITAR:**
```tsx
<input className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" />
```

### 5. Estados Interativos

**✅ CORRETO:**
```tsx
// Hover states
<div className="bg-muted/50 hover:bg-muted cursor-pointer transition-colors">

// Focus states  
<input className="focus:ring-2 focus:ring-primary focus:border-transparent">
```

## Ícones

### Padrão de Ícones

**✅ USAR:** Ícones ASCII/Emoji sutis
```tsx
<span className="text-lg">📄</span>  // Documentos
<span className="text-lg">📋</span>  // Templates
<span className="text-lg">🔗</span>  // Integrações
<span className="text-lg">🧪</span>  // Experimental
<span className="text-lg">💾</span>  // Armazenamento
<span className="text-lg">💬</span>  // Comunicação
<span className="text-lg">⚡</span>  // Produtividade/API
<span className="text-lg">🧩</span>  // Componentes
<span className="text-lg">👁️</span>  // Visualização
<span className="text-lg">⚙</span>   // Configurações
<span className="text-lg">🗑</span>   // Deletar
<span className="text-sm">↓</span>   // Download
<span className="text-sm">+</span>   // Adicionar
<span className="text-sm">✓</span>   // Sucesso/Conectado
<span className="text-sm">⋯</span>   // Menu/Opções
<span className="text-sm">🔍</span>  // Busca
```

**❌ EVITAR:** SVG coloridos ou ícones com cores específicas

## Estrutura de Layout

### 1. Página Padrão

```tsx
export default function ExamplePage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header fixo */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-20 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Título da Página</h1>
            <p className="text-sm text-muted-foreground mt-1">Descrição</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botões de ação */}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto p-6">
        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            {/* Card content */}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-6">
          {/* Seções */}
        </div>
      </div>
    </div>
  );
}
```

### 2. Cards de Conteúdo

```tsx
// Card principal
<div className="bg-card border rounded-lg p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-muted rounded-lg">
      <span className="text-lg">📄</span>
    </div>
    <h3 className="text-lg font-semibold text-foreground">Título</h3>
  </div>
  
  <div className="space-y-3">
    <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors">
      <p className="font-medium text-foreground">Item</p>
      <p className="text-xs text-muted-foreground">Descrição</p>
    </div>
  </div>
</div>
```

### 3. Areas de Upload/Placeholder

```tsx
<div className="bg-muted/50 rounded-lg border-2 border-dashed border-muted p-6 hover:border-muted-foreground/50 transition-colors cursor-pointer">
  <div className="text-center">
    <span className="text-4xl text-muted-foreground block mb-3">📁</span>
    <p className="text-sm font-medium text-muted-foreground mb-1">
      Arraste arquivos aqui
    </p>
    <p className="text-xs text-muted-foreground">
      ou clique para selecionar
    </p>
  </div>
</div>
```

## Badges e Status

```tsx
// Badge neutro
<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
  🧪 Status
</div>

// Badge de sucesso
<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
  ✓ Conectado
</div>
```

## Responsividade

### Grid System
```tsx
// Grids responsivos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">

// Flex responsivo
<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
```

## Animações e Transições

```tsx
// Transições suaves
className="hover:shadow-lg transition-shadow"
className="hover:bg-muted cursor-pointer transition-colors"
className="hover:bg-primary/90 transition-colors"
```

## Checklist de Validação

Antes de criar/modificar qualquer componente, verifique:

- [ ] ✅ Usa `bg-card` em vez de `bg-white dark:bg-gray-800`
- [ ] ✅ Usa `text-foreground` em vez de `text-gray-900 dark:text-white`
- [ ] ✅ Usa `text-muted-foreground` em vez de `text-gray-600 dark:text-gray-400`
- [ ] ✅ Usa `bg-muted` em vez de `bg-gray-100 dark:bg-gray-700`
- [ ] ✅ Usa `border` em vez de `border-gray-200 dark:border-gray-700`
- [ ] ✅ Usa ícones ASCII/emoji em vez de SVG coloridos
- [ ] ✅ Usa `bg-primary` para botões principais
- [ ] ✅ Inclui estados hover e focus apropriados
- [ ] ✅ É responsivo (mobile-first)
- [ ] ✅ Segue a estrutura de layout padrão

## Exemplos de Migração

### Antes (❌)
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400">...</svg>
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Título</h3>
  <p className="text-gray-600 dark:text-gray-400">Descrição</p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white">Ação</button>
</div>
```

### Depois (✅)
```tsx
<div className="bg-card border rounded-lg p-6">
  <div className="p-2 bg-muted rounded-lg">
    <span className="text-lg">📄</span>
  </div>
  <h3 className="text-lg font-semibold text-foreground">Título</h3>
  <p className="text-muted-foreground">Descrição</p>
  <button className="bg-primary hover:bg-primary/90 text-primary-foreground">Ação</button>
</div>
```

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento 