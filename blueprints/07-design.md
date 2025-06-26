# 🎨 Blueprint: Design System & UX

## 🎯 Filosofia de Design

### Princípios Fundamentais

1. **🎨 Minimalismo Inteligente**
   - Interface limpa e focada na função
   - Hierarquia visual clara
   - Elementos desnecessários eliminados

2. **🌓 Adaptive Theming**
   - Light/Dark mode nativo
   - Transições suaves entre temas
   - Preferências do sistema respeitadas

3. **⚡ Performance-First**
   - Componentes leves e otimizados
   - Lazy loading inteligente
   - Animações com purpose

4. **♿ Acessibilidade Universal**
   - WCAG 2.1 AA compliance
   - Navegação por teclado completa
   - Screen reader friendly

5. **📱 Mobile-First Responsive**
   - Design pensado primeiro para mobile
   - Escalabilidade elegante para desktop
   - Touch-friendly em todos os dispositivos

## 🎨 Sistema de Cores

### Paleta Principal (Semantic Colors)

```css
:root {
  /* Primary Colors - Humana Brand */
  --primary: 210 100% 50%;        /* Blue #0080FF */
  --primary-foreground: 0 0% 100%; /* White on primary */
  
  /* Neutral Palette */
  --background: 0 0% 100%;         /* Light: White */
  --foreground: 222 84% 5%;        /* Light: Near Black */
  
  --card: 0 0% 100%;               /* Cards background */
  --card-foreground: 222 84% 5%;   /* Text on cards */
  
  --muted: 210 40% 98%;            /* Subtle backgrounds */
  --muted-foreground: 215 16% 47%; /* Muted text */
  
  --border: 214 32% 91%;           /* Borders and dividers */
  --input: 214 32% 91%;            /* Input borders */
  --ring: 210 100% 50%;            /* Focus rings */
  
  /* Semantic States */
  --destructive: 0 84% 60%;        /* Error red */
  --destructive-foreground: 0 0% 100%;
  
  --warning: 38 92% 50%;           /* Warning amber */
  --warning-foreground: 0 0% 100%;
  
  --success: 142 76% 36%;          /* Success green */
  --success-foreground: 0 0% 100%;
}

[data-theme="dark"] {
  --background: 222 84% 5%;        /* Dark: Near Black */
  --foreground: 210 40% 98%;       /* Dark: Near White */
  
  --card: 222 84% 5%;
  --card-foreground: 210 40% 98%;
  
  --muted: 217 33% 17%;            /* Dark muted */
  --muted-foreground: 215 20% 65%; /* Dark muted text */
  
  --border: 217 33% 17%;
  --input: 217 33% 17%;
}
```

### Paleta de Apoio (Functional Colors)

```css
/* Additional functional colors */
:root {
  /* AI/Companion specific */
  --companion-primary: 260 100% 65%;    /* Purple for AI */
  --companion-secondary: 290 100% 85%;  /* Light purple */
  
  /* Status indicators */
  --status-online: 142 76% 36%;         /* Green */
  --status-busy: 38 92% 50%;            /* Amber */
  --status-offline: 215 16% 47%;        /* Gray */
  
  /* Data visualization */
  --chart-1: 210 100% 50%;              /* Primary blue */
  --chart-2: 142 76% 36%;               /* Green */
  --chart-3: 38 92% 50%;                /* Amber */
  --chart-4: 260 100% 65%;              /* Purple */
  --chart-5: 0 84% 60%;                 /* Red */
}
```

## 🔤 Tipografia

### Font Stack

```css
/* Primary font family - Geist Sans */
--font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Monospace for code - Geist Mono */
--font-mono: 'Geist Mono', 'Monaco', 'Cascadia Code', 'Fira Code', 
             'Roboto Mono', 'Courier New', monospace;
```

### Scale Tipográfica

```css
/* Type scale seguindo proporção 1.250 (Major Third) */
.text-xs    { font-size: 0.75rem; line-height: 1rem; }     /* 12px */
.text-sm    { font-size: 0.875rem; line-height: 1.25rem; } /* 14px */
.text-base  { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-lg    { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */
.text-xl    { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
.text-2xl   { font-size: 1.5rem; line-height: 2rem; }      /* 24px */
.text-3xl   { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
.text-4xl   { font-size: 2.25rem; line-height: 2.5rem; }   /* 36px */

/* Semantic typography */
.heading-1  { @apply text-4xl font-bold; }
.heading-2  { @apply text-3xl font-semibold; }
.heading-3  { @apply text-2xl font-semibold; }
.heading-4  { @apply text-xl font-medium; }

.body-large { @apply text-lg; }
.body-base  { @apply text-base; }
.body-small { @apply text-sm; }

.caption    { @apply text-xs text-muted-foreground; }
.code       { @apply font-mono text-sm; }
```

## 📐 Spacing & Layout

### Sistema de Espaçamento

```css
/* Base: 4px (0.25rem) */
.space-0   { margin: 0; }
.space-1   { margin: 0.25rem; }  /* 4px */
.space-2   { margin: 0.5rem; }   /* 8px */
.space-3   { margin: 0.75rem; }  /* 12px */
.space-4   { margin: 1rem; }     /* 16px */
.space-6   { margin: 1.5rem; }   /* 24px */
.space-8   { margin: 2rem; }     /* 32px */
.space-12  { margin: 3rem; }     /* 48px */
.space-16  { margin: 4rem; }     /* 64px */
.space-24  { margin: 6rem; }     /* 96px */
```

### Grid System

```css
/* Container system */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-sm  { max-width: 640px; }
.container-md  { max-width: 768px; }
.container-lg  { max-width: 1024px; }
.container-xl  { max-width: 1280px; }
.container-2xl { max-width: 1536px; }

/* Layout grids */
.grid-layout-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas: 
    "sidebar header"
    "sidebar main";
  min-height: 100vh;
}

.grid-layout-chat {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  grid-template-areas: "companions chat sidebar";
  height: 100vh;
}
```

## 🧩 Componentes Base

### Button System

```tsx
// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-muted hover:text-muted-foreground",
        secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Input System

```tsx
// Input variants
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

// Select component
const Select = ({ children, ...props }) => (
  <RadixSelect.Root {...props}>
    <RadixSelect.Trigger className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      <RadixSelect.Value />
      <RadixSelect.Icon>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
    <RadixSelect.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-background text-foreground shadow-lg animate-in fade-in-80">
      {children}
    </RadixSelect.Content>
  </RadixSelect.Root>
)
```

### Card System

```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-lg",
        className
      )}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
```

## 🎭 Padrão de Ícones

### **✅ Diretrizes de Uso**

#### **1. Menus e Sidebar (ASCII/Emojis)**
```tsx
// Navigation items
const navigationItems = [
  { icon: "💬", label: "AI Companions", href: "/companions" },
  { icon: "🏢", label: "Organizações", href: "/organizations" },
  { icon: "📊", label: "Analytics", href: "/analytics" },
  { icon: "⚙️", label: "Configurações", href: "/settings" },
  { icon: "🔧", label: "MCP Servers", href: "/mcp-servers" },
  { icon: "📋", label: "Templates", href: "/templates" },
  { icon: "👥", label: "Usuários", href: "/users" },
]

// Sidebar component
const Sidebar = () => (
  <nav className="space-y-2">
    {navigationItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <span className="text-lg">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </Link>
    ))}
  </nav>
)
```

#### **2. Telas e Cards (Lucide Icons)**
```tsx
import { 
  BotIcon, 
  FileIcon, 
  ServerIcon, 
  SettingsIcon,
  UserIcon,
  ChartIcon,
  DatabaseIcon,
  MessageSquareIcon 
} from 'lucide-react'

// Card components
const CompanionCard = ({ companion }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between">
      <div className="flex items-center gap-3">
        <BotIcon size={32} className="text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{companion.name}</h3>
          <p className="text-sm text-muted-foreground">{companion.type}</p>
        </div>
      </div>
      <SettingsIcon size={16} className="text-muted-foreground" />
    </CardHeader>
  </Card>
)

// Page headers
const PageHeader = ({ title, icon: Icon, children }) => (
  <header className="flex items-center justify-between py-6">
    <div className="flex items-center gap-4">
      <Icon size={32} className="text-muted-foreground" />
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
    {children}
  </header>
)
```

### **📏 Tamanhos Padronizados**
```tsx
// Icon sizes
const iconSizes = {
  xs: 12,    // Inline icons
  sm: 16,    // Button icons, small UI elements
  md: 20,    // Default size, list items
  lg: 24,    // Section headers, important UI
  xl: 32,    // Page headers, card headers
  "2xl": 48  // Main feature icons, empty states
}

// Usage examples
<UserIcon size={iconSizes.sm} />  // In buttons
<BotIcon size={iconSizes.xl} />   // In cards
<ServerIcon size={iconSizes.lg} /> // In headers
```

## 🎬 Sistema de Animações

### Transições Base

```css
/* Transition utilities */
.transition-default { transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); }
.transition-fast    { transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1); }
.transition-slow    { transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }

/* Custom easing curves */
.ease-spring       { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.ease-bounce       { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
```

### Animações Específicas

```tsx
// Framer Motion presets
const animationPresets = {
  // Page transitions
  pageSlide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 }
  },
  
  // Modal animations
  modalScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.15 }
  },
  
  // List item animations
  listItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 }
  },
  
  // Hover effects
  cardHover: {
    whileHover: { 
      scale: 1.02, 
      transition: { duration: 0.15 }
    }
  }
}

// Usage in components
const AnimatedCard = ({ children, ...props }) => (
  <motion.div
    {...animationPresets.cardHover}
    {...animationPresets.listItem}
    {...props}
  >
    {children}
  </motion.div>
)
```

## 📱 Responsive Design

### Breakpoints System

```css
/* Mobile-first breakpoints */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {  /* sm */
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {  /* md */
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) { /* lg */
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}
```

### Mobile Navigation

```tsx
// Mobile-first navigation
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* Mobile header */}
      <header className="flex items-center justify-between p-4 border-b lg:hidden">
        <Logo />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon size={20} />
        </Button>
      </header>
      
      {/* Mobile drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80">
          <nav className="space-y-4">
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

## ♿ Acessibilidade

### Guidelines WCAG 2.1

```tsx
// Accessible components
const AccessibleButton = ({ children, ...props }) => (
  <Button
    {...props}
    // Keyboard navigation
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        props.onClick?.(e)
      }
    }}
    // Screen reader support
    aria-label={props['aria-label'] || props.children}
    // Focus management
    className={cn(
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      props.className
    )}
  >
    {children}
  </Button>
)

// Skip navigation
const SkipNav = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50"
  >
    Pular para o conteúdo principal
  </a>
)

// Semantic HTML structure
const Layout = ({ children }) => (
  <div className="min-h-screen bg-background">
    <SkipNav />
    <header role="banner">
      <Navigation />
    </header>
    <main id="main-content" role="main" className="flex-1">
      {children}
    </main>
    <footer role="contentinfo">
      <Footer />
    </footer>
  </div>
)
```

### Color Contrast

```css
/* Ensuring WCAG AA compliance */
:root {
  --foreground: 222 84% 5%;           /* Contrast ratio: 16.75:1 */
  --muted-foreground: 215 16% 47%;    /* Contrast ratio: 4.5:1 */
  --border: 214 32% 91%;              /* Contrast ratio: 3:1 */
}

[data-theme="dark"] {
  --foreground: 210 40% 98%;          /* Contrast ratio: 18.5:1 */
  --muted-foreground: 215 20% 65%;    /* Contrast ratio: 4.8:1 */
}
```

## 🎯 Padrões de Interação

### Feedback States

```tsx
// Loading states
const LoadingSpinner = ({ size = "md", className }) => (
  <div
    className={cn(
      "animate-spin rounded-full border-2 border-current border-t-transparent",
      {
        "h-4 w-4": size === "sm",
        "h-6 w-6": size === "md",
        "h-8 w-8": size === "lg",
      },
      className
    )}
  />
)

// Error states
const ErrorState = ({ title, description, action }) => (
  <div className="text-center py-12">
    <AlertTriangleIcon size={48} className="mx-auto text-destructive mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    {action}
  </div>
)

// Empty states
const EmptyState = ({ title, description, action, icon: Icon }) => (
  <div className="text-center py-12">
    <Icon size={48} className="mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    {action}
  </div>
)
```

### Toast Notifications

```tsx
// Toast system
const toast = {
  success: (message: string) => ({
    title: "Sucesso",
    description: message,
    variant: "default",
    icon: <CheckIcon size={16} className="text-success" />
  }),
  
  error: (message: string) => ({
    title: "Erro",
    description: message,
    variant: "destructive",
    icon: <AlertTriangleIcon size={16} />
  }),
  
  warning: (message: string) => ({
    title: "Atenção",
    description: message,
    variant: "warning",
    icon: <AlertCircleIcon size={16} />
  }),
  
  info: (message: string) => ({
    title: "Informação",
    description: message,
    variant: "default",
    icon: <InfoIcon size={16} />
  })
}
```

---

**Status:** 🟢 Ativo  
**Owner:** Design System Team  
**Última Review:** Janeiro 2025  
**Próxima Review:** Abril 2025