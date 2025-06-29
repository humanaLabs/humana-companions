# 🔐 Sistema de Permissões - Humana Companions

## 🎯 Visão Geral

O sistema de permissões do Humana Companions implementa um controle de acesso granular baseado em **roles** e **permissões específicas**, permitindo governança detalhada de todas as funcionalidades da plataforma.

## 📊 Arquitetura do Sistema

### **Estrutura Hierárquica**
```
Master Admin (Superusuário)
├── Admin (Administrador)
├── Manager (Gerente)
└── User (Usuário)
```

### **26 Permissões Granulares**
Organizadas em **5 categorias principais**:

#### 🧑‍💼 **Gestão de Usuários (6 permissões)**
- `users.view` - Visualizar usuários
- `users.create` - Criar usuários
- `users.edit` - Editar usuários
- `users.delete` - Deletar usuários
- `users.invite` - Convidar usuários
- `users.manage_roles` - Gerenciar roles de usuários

#### 👥 **Gestão de Equipes (5 permissões)**
- `teams.view` - Visualizar equipes
- `teams.create` - Criar equipes
- `teams.edit` - Editar equipes
- `teams.delete` - Deletar equipes
- `teams.manage_members` - Gerenciar membros

#### 🤖 **Gestão de Companions (5 permissões)**
- `companions.view` - Visualizar companions
- `companions.create` - Criar companions
- `companions.edit` - Editar companions
- `companions.delete` - Deletar companions
- `companions.manage_sharing` - Gerenciar compartilhamento

#### 🏢 **Gestão de Organizações (5 permissões)**
- `organizations.view` - Visualizar organizações
- `organizations.create` - Criar organizações
- `organizations.edit` - Editar organizações
- `organizations.delete` - Deletar organizações
- `organizations.manage_settings` - Gerenciar configurações

#### ⚙️ **Administração (5 permissões)**
- `admin.view_dashboard` - Visualizar dashboard admin
- `admin.manage_system` - Gerenciar sistema
- `admin.view_logs` - Visualizar logs
- `admin.manage_integrations` - Gerenciar integrações
- `admin.roles` - Gerenciar roles e permissões

## 🎭 Roles e Permissões

### **Master Admin** (Superusuário)
```typescript
const MASTER_ADMIN_PERMISSIONS = [
  // Todas as 26 permissões
  'users.view', 'users.create', 'users.edit', 'users.delete', 
  'users.invite', 'users.manage_roles',
  'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 
  'teams.manage_members',
  'companions.view', 'companions.create', 'companions.edit', 
  'companions.delete', 'companions.manage_sharing',
  'organizations.view', 'organizations.create', 'organizations.edit', 
  'organizations.delete', 'organizations.manage_settings',
  'admin.view_dashboard', 'admin.manage_system', 'admin.view_logs', 
  'admin.manage_integrations', 'admin.roles'
]
```

### **Admin** (Administrador)
```typescript
const ADMIN_PERMISSIONS = [
  // Usuários (completo)
  'users.view', 'users.create', 'users.edit', 'users.delete', 'users.invite',
  // Equipes (completo)
  'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 'teams.manage_members',
  // Companions (completo)
  'companions.view', 'companions.create', 'companions.edit', 'companions.delete', 'companions.manage_sharing',
  // Organizações (completo)
  'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete', 'organizations.manage_settings',
  // Admin (limitado - sem roles)
  'admin.view_dashboard', 'admin.manage_system', 'admin.view_logs', 'admin.manage_integrations'
]
```

### **Manager** (Gerente)
```typescript
const MANAGER_PERMISSIONS = [
  // Usuários (limitado)
  'users.view', 'users.invite',
  // Equipes (gerenciamento)
  'teams.view', 'teams.create', 'teams.edit', 'teams.manage_members',
  // Companions (completo)
  'companions.view', 'companions.create', 'companions.edit', 'companions.delete', 'companions.manage_sharing',
  // Organizações (visualização)
  'organizations.view'
]
```

### **User** (Usuário)
```typescript
const USER_PERMISSIONS = [
  // Companions (básico)
  'companions.view', 'companions.create', 'companions.edit'
]
```

## 🛡️ Implementação Técnica

### **1. Arquivos Core**
```
lib/permissions/
├── index.ts           # Definições de permissões e roles
└── middleware.ts      # Middleware para APIs

hooks/
└── use-permissions.tsx # Hook React para permissões

components/auth/
└── permission-guard.tsx # Guards de componentes
```

### **2. Hook de Permissões**
```typescript
// hooks/use-permissions.tsx
export function usePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  
  // Carrega permissões do usuário
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserPermissions(session.user.email)
    }
  }, [session])
  
  return {
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAnyPermission: (perms: string[]) => perms.some(p => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every(p => permissions.includes(p)),
    isAdmin: permissions.includes('admin.view_dashboard'),
    isMasterAdmin: permissions.includes('admin.roles')
  }
}
```

### **3. Guards de Componentes**
```typescript
// components/auth/permission-guard.tsx
interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission(permission)) {
    return fallback || <AccessDenied />
  }
  
  return <>{children}</>
}

// Guards específicos
export const UsersGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="users.view">{children}</PermissionGuard>
)

export const TeamsGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="teams.view">{children}</PermissionGuard>
)

export const RolesGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="admin.roles">{children}</PermissionGuard>
)
```

### **4. Middleware de API**
```typescript
// lib/permissions/middleware.ts
export function withPermissions(requiredPermission: string) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const userPermissions = await getUserPermissions(session.user.email)
    
    if (!userPermissions.includes(requiredPermission)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    
    return null // Permite continuar
  }
}
```

## 🔍 Sistema de Detecção Master Admin

### **Configuração**
```typescript
// lib/permissions/index.ts
const MASTER_ADMIN_EMAILS = [
  'admin@humana.com.br',
  'eduibrahim@yahoo.com.br'
]

export function isMasterAdminEmail(email: string): boolean {
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase())
}
```

### **API de Permissões**
```typescript
// app/api/user/permissions/route.ts
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  
  const userEmail = session.user.email
  const isMasterAdmin = isMasterAdminEmail(userEmail)
  
  let permissions: string[]
  
  if (isMasterAdmin) {
    permissions = MASTER_ADMIN_PERMISSIONS
  } else {
    // Buscar do banco de dados baseado no role do usuário
    permissions = await getUserPermissionsFromDB(userEmail)
  }
  
  return NextResponse.json({
    permissions,
    roles: isMasterAdmin ? ['master_admin'] : await getUserRoles(userEmail),
    isMasterAdmin
  })
}
```

## 🎨 Aplicação na Interface

### **Proteção de Seções Admin**
```typescript
// app/(chat)/admin/page.tsx
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <AdminGuard>
        <AdminSection title="Gestão de Usuários">
          <UsersGuard>
            <UsersManagement />
          </UsersGuard>
        </AdminSection>
      </AdminGuard>
      
      <AdminGuard>
        <AdminSection title="Gestão de Equipes">
          <TeamsGuard>
            <TeamsManagement />
          </TeamsGuard>
        </AdminSection>
      </AdminGuard>
      
      <RolesGuard>
        <AdminSection title="Roles e Permissões">
          <RolesManagement />
        </AdminSection>
      </RolesGuard>
    </div>
  )
}
```

### **Proteção de Botões/Ações**
```typescript
// Exemplo de uso em componentes
function UserActions({ user }: { user: User }) {
  const { hasPermission } = usePermissions()
  
  return (
    <div className="flex gap-2">
      {hasPermission('users.edit') && (
        <Button onClick={() => editUser(user.id)}>
          Editar
        </Button>
      )}
      
      {hasPermission('users.delete') && (
        <Button variant="destructive" onClick={() => deleteUser(user.id)}>
          Deletar
        </Button>
      )}
    </div>
  )
}
```

## 🧪 Debug e Monitoramento

### **Componente de Debug**
```typescript
// components/debug-permissions.tsx
export function DebugPermissions() {
  const { permissions, isAdmin, isMasterAdmin } = usePermissions()
  
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-2">🔍 Debug Permissões</h3>
      <div className="space-y-2 text-sm">
        <div>Master Admin: {isMasterAdmin ? '✅' : '❌'}</div>
        <div>Admin: {isAdmin ? '✅' : '❌'}</div>
        <div>Total Permissões: {permissions.length}</div>
        <details>
          <summary>Ver todas as permissões</summary>
          <ul className="mt-2 space-y-1">
            {permissions.map(perm => (
              <li key={perm} className="text-xs font-mono">
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

## 📊 Monitoramento e Logs

### **Logs de Acesso**
```typescript
// Exemplo de log estruturado
console.log('🔐 Permission Check:', {
  user: session.user.email,
  permission: requiredPermission,
  granted: hasPermission,
  timestamp: new Date().toISOString(),
  route: req.url
})
```

### **Métricas de Permissões**
- Tentativas de acesso negado
- Permissões mais utilizadas
- Usuários com mais permissões
- Tempo de verificação de permissões

## 🚀 Próximos Passos

### **Melhorias Planejadas**
1. **Cache de Permissões** - Redis/Memory cache
2. **Permissões Dinâmicas** - Baseadas em contexto
3. **Auditoria Completa** - Log de todas as ações
4. **Interface de Gestão** - UI para gerenciar roles
5. **Testes Automatizados** - Cobertura completa

### **Extensibilidade**
- Permissões baseadas em recursos específicos
- Permissões temporárias
- Delegação de permissões
- Aprovação de permissões

## 🔗 Referências

- **Implementação:** `lib/permissions/index.ts`
- **Hook:** `hooks/use-permissions.tsx`
- **Guards:** `components/auth/permission-guard.tsx`
- **API:** `app/api/user/permissions/route.ts`
- **Middleware:** `lib/permissions/middleware.ts`

---

> **Nota:** Este sistema foi implementado seguindo as melhores práticas de segurança e está em constante evolução para atender às necessidades da plataforma. 