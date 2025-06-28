# 🧩 Estrutura de Componentes React

## 🎯 Princípios de Organização

### **1. Hierarquia Clara**
Componentes organizados em hierarquia lógica e intuitiva.

### **2. Reutilização**
Componentes reutilizáveis e compostos por partes menores.

### **3. Responsabilidade Única**
Cada componente tem uma responsabilidade específica.

### **4. Composição sobre Herança**
Usar composição para criar componentes complexos.

## 📁 Estrutura de Diretórios

### **Organização Recomendada**
```
components/
├── ui/                       # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   └── ...
├── layout/                   # Componentes de layout
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── chat/                     # Componentes de chat
│   ├── chat.tsx
│   ├── message.tsx
│   ├── messages.tsx
│   └── chat-header.tsx
├── auth/                     # Componentes de autenticação e permissões
│   ├── auth-form.tsx
│   ├── sign-out-form.tsx
│   ├── permission-guard.tsx
│   └── protected-route.tsx
├── admin/                    # Componentes administrativos
│   ├── modals/
│   │   ├── invite-user-modal.tsx
│   │   ├── edit-user-modal.tsx
│   │   ├── create-team-modal.tsx
│   │   ├── create-role-modal.tsx
│   │   └── create-organization-modal.tsx
│   ├── debug-permissions.tsx
│   └── admin-section.tsx
├── [provider]/               # Componentes específicos de provider
│   ├── dify-agent-selector.tsx
│   ├── dify-agent-demo.tsx
│   └── dify-status.tsx
└── shared/                   # Componentes compartilhados
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── confirmation-dialog.tsx
```

### **Convenções de Nomenclatura**
```typescript
// ✅ Componentes: PascalCase
export function DifyAgentSelector() {}

// ✅ Arquivos: kebab-case
dify-agent-selector.tsx
chat-header.tsx
auth-form.tsx

// ✅ Props interfaces: ComponentProps
interface DifyAgentSelectorProps {}
interface ChatHeaderProps {}
```

## 🏗️ Padrões de Componentes

### **Componente Base**
```typescript
// components/dify-agent-selector.tsx
import { useState, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DifyAgentSelectorProps {
  agents: DifyAgent[]
  selectedAgent?: string
  onAgentChange: (agentId: string) => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function DifyAgentSelector({
  agents,
  selectedAgent,
  onAgentChange,
  loading = false,
  disabled = false,
  className,
}: DifyAgentSelectorProps) {
  // Lógica do componente
  const handleAgentChange = useCallback((agentId: string) => {
    onAgentChange(agentId)
  }, [onAgentChange])
  
  // Agrupamento por categoria
  const groupedAgents = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const category = agent.category || 'Geral'
      if (!acc[category]) acc[category] = []
      acc[category].push(agent)
      return acc
    }, {} as Record<string, DifyAgent[]>)
  }, [agents])
  
  if (loading) {
    return <div className="animate-pulse">Carregando agentes...</div>
  }
  
  return (
    <Select
      value={selectedAgent}
      onValueChange={handleAgentChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[200px]", className)}>
        <SelectValue placeholder="Selecionar agente" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
          <div key={category}>
            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
              {category}
            </div>
            {categoryAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex flex-col">
                  <span>{agent.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {agent.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### **Componente Composto**
```typescript
// components/chat/chat-header.tsx
import { ModelSelector } from '@/components/model-selector'
import { DifyAgentSelector } from '@/components/dify-agent-selector'
import { VisibilitySelector } from '@/components/visibility-selector'

interface ChatHeaderProps {
  chatId: string
  selectedModel: string
  onModelChange: (model: string) => void
  selectedAgent?: string
  onAgentChange: (agent: string) => void
  visibility: 'private' | 'public'
  onVisibilityChange: (visibility: 'private' | 'public') => void
}

export function ChatHeader({
  chatId,
  selectedModel,
  onModelChange,
  selectedAgent,
  onAgentChange,
  visibility,
  onVisibilityChange,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Chat {chatId}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        
        <DifyAgentSelector
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
        />
        
        <VisibilitySelector
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
        />
      </div>
    </header>
  )
}
```

## 🔐 Componentes de Permissões

### **Permission Guard - Controle de Acesso**
```typescript
// components/auth/permission-guard.tsx
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission(permission)) {
    return fallback || (
      <div className="p-4 text-center text-muted-foreground">
        Você não tem permissão para acessar esta funcionalidade.
      </div>
    )
  }
  
  return <>{children}</>
}

// Guards específicos para áreas administrativas
export const UsersGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="users.view">{children}</PermissionGuard>
)

export const TeamsGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="teams.view">{children}</PermissionGuard>
)

export const CompanionsGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="companions.view">{children}</PermissionGuard>
)

export const OrganizationsGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="organizations.view">{children}</PermissionGuard>
)

export const RolesGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="admin.roles">{children}</PermissionGuard>
)

export const AdminGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="admin.view_dashboard">{children}</PermissionGuard>
)
```

## 🎭 Modais Administrativos

### **Modal de Convite de Usuário**
```typescript
// components/invite-user-modal.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSuccess: () => void
}

export function InviteUserModal({ isOpen, onClose, onInviteSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      if (!response.ok) throw new Error('Erro ao enviar convite')

      toast({
        title: 'Convite enviado!',
        description: `Convite enviado para ${email}`,
      })

      onInviteSuccess()
      onClose()
      setEmail('')
      setRole('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o convite',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### **Modal de Edição de Usuário**
```typescript
// components/edit-user-modal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onEditSuccess: () => void
}

export function EditUserModal({ isOpen, onClose, user, onEditSuccess }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setRole(user.role || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role })
      })

      if (!response.ok) throw new Error('Erro ao atualizar usuário')

      toast({
        title: 'Usuário atualizado!',
        description: `${name} foi atualizado com sucesso`,
      })

      onEditSuccess()
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o usuário',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### **Modal de Criação de Equipe**
```typescript
// components/create-team-modal.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateSuccess: () => void
}

export function CreateTeamModal({ isOpen, onClose, onCreateSuccess }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) throw new Error('Erro ao criar equipe')

      toast({
        title: 'Equipe criada!',
        description: `Equipe "${name}" foi criada com sucesso`,
      })

      onCreateSuccess()
      onClose()
      setName('')
      setDescription('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a equipe',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Equipe</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da equipe"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da equipe"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Equipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## 🧪 Componentes de Debug

### **Debug de Permissões**
```typescript
// components/debug-permissions.tsx
import { usePermissions } from '@/hooks/use-permissions'
import { useSession } from 'next-auth/react'

export function DebugPermissions() {
  const { data: session } = useSession()
  const { permissions, isAdmin, isMasterAdmin, loading } = usePermissions()

  if (loading) {
    return <div className="p-4 bg-muted rounded-lg animate-pulse">Carregando permissões...</div>
  }

  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-2">🔍 Debug Permissões</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Email:</strong> {session?.user?.email}</div>
        <div><strong>Master Admin:</strong> {isMasterAdmin ? '✅' : '❌'}</div>
        <div><strong>Admin:</strong> {isAdmin ? '✅' : '❌'}</div>
        <div><strong>Total Permissões:</strong> {permissions.length}</div>
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">Ver todas as permissões</summary>
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {permissions.map(perm => (
              <li key={perm} className="text-xs font-mono bg-background px-2 py-1 rounded">
                {perm}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
```

## 📋 Padrões de Formulários

### **Formulário com Validação**
```typescript
// Exemplo de formulário seguindo padrões
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['user', 'manager', 'admin'])
})

type FormData = z.infer<typeof formSchema>

export function UserForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user'
    }
  })

  const onSubmit = async (data: FormData) => {
    // Lógica de submissão
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Outros campos... */}
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  )
}
```

## 🎨 Padrões de Design System

### **Uso Correto das Classes CSS**
```typescript
// ✅ CORRETO - Usando classes do design system
<div className="bg-card border rounded-lg p-6">
  <h3 className="text-foreground font-semibold">Título</h3>
  <p className="text-muted-foreground text-sm">Descrição</p>
  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
    Ação
  </Button>
</div>

// ❌ NUNCA use cores hardcoded
<div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  <h3 className="text-gray-900 dark:text-white">Título</h3>
  <p className="text-gray-600 dark:text-gray-400">Descrição</p>
</div>
```

### **Padrão de Ícones**
```typescript
// ✅ CORRETO - Ícones do framework para telas
import { UserIcon, TeamIcon, SettingsIcon } from 'lucide-react'

<div className="flex items-center gap-2">
  <UserIcon size={20} />
  <span>Usuários</span>
</div>

// ✅ CORRETO - ASCII/emojis para menus/sidebar
<nav>
  <a href="/users">👥 Usuários</a>
  <a href="/teams">🏢 Equipes</a>
  <a href="/settings">⚙️ Configurações</a>
</nav>
```

## 🔗 Referências

### **Documentação Relacionada**
- [`SISTEMA_PERMISSOES.md`](./SISTEMA_PERMISSOES.md) - Sistema de permissões
- [`PADRAO_LAYOUT_UI.md`](./PADRAO_LAYOUT_UI.md) - Padrões de UI
- [`BOAS_PRATICAS_CODIGO.md`](./BOAS_PRATICAS_CODIGO.md) - Boas práticas

### **Componentes Implementados**
- **Modais Admin:** `components/invite-user-modal.tsx`, `components/edit-user-modal.tsx`
- **Guards:** `components/auth/permission-guard.tsx`
- **Debug:** `components/debug-permissions.tsx`
- **Hooks:** `hooks/use-permissions.tsx`

---

> **Nota:** Esta estrutura segue os padrões estabelecidos no projeto e está em constante evolução para atender às necessidades da plataforma. 