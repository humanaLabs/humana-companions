# Sistema de Context Switching de Organizações

## 📋 **Visão Geral**

Sistema implementado para permitir que Master Admins naveguem entre diferentes organizações, mantendo contexto administrativo adequado para cada uma. Soluciona a necessidade de segregação de funcionalidades organizacionais vs. globais.

## 🎯 **Problema Resolvido**

Antes: Master Admins não tinham como selecionar contexto organizacional específico
Agora: Master Admins podem alternar entre organizações e gerenciar funcionalidades específicas de cada uma

## 🏗️ **Arquitetura Implementada**

### 1. **Hook de Contexto Organizacional**
```typescript
// hooks/use-organization-context.tsx
- useOrganizationContext(): Contexto completo
- useCurrentOrganization(): Organização atual simplificado
- OrganizationProvider: Provider para toda a aplicação
```

**Funcionalidades:**
- ✅ Fetch de organizações disponíveis
- ✅ Switching entre organizações
- ✅ Persistência no localStorage
- ✅ Reload automático para aplicar contexto
- ✅ Loading states

### 2. **Componente Seletor de Organização**
```typescript
// components/organization-selector.tsx
- OrganizationSelector: Componente base
- OrganizationSelectorCompact: Para sidebar
- OrganizationSelectorHeader: Para cabeçalho
```

### 3. **Integração no Menu do Usuário**
```typescript
// components/sidebar-user-nav.tsx
- Exibe organização atual abaixo do email
- Dropdown com lista de organizações
- Switching direto no menu
- Visível apenas para Master Admin ou múltiplas orgs
```

### 4. **Provider Global**
```typescript
// app/layout.tsx
- OrganizationProvider integrado no SessionProvider
- Contexto disponível em toda aplicação
```

## 🔧 **Funcionalidades Implementadas**

### ✅ **Concluído**
1. **Seletor Visual de Organização**
   - Dropdown no menu do usuário
   - Indicação visual da organização ativa
   - Switching com feedback visual

2. **Contexto Organizacional**
   - Hook useOrganizationContext
   - Persistência entre sessões
   - Loading states apropriados

3. **Integração com UI**
   - Menu do usuário atualizado
   - Visibilidade condicional para Master Admin
   - Layout responsivo

## 🚧 **Ainda Precisa Ser Implementado**

### 1. **🔄 Backend: Context Switching API**
```typescript
// PRIORIDADE ALTA
POST /api/organizations/switch
{
  "organizationId": "uuid",
  "targetContext": "admin" | "user"
}

// Deve:
- Atualizar sessão com novo organizationId
- Validar permissões para a organização
- Atualizar cookies/headers
- Retornar contexto atualizado
```

### 2. **🔒 Middleware: Context Validation**
```typescript
// middleware/tenant.ts - MELHORAR
// Deve suportar:
- Múltiplas organizações por usuário
- Context switching dinâmico
- Validação de permissões por contexto
- Cache de contexto organizacional
```

### 3. **🎛️ Permissions: Context-Aware**
```typescript
// hooks/use-permissions.tsx - ATUALIZAR
// Deve incluir:
- Permissões específicas da organização ativa
- Permissões globais (Master Admin)
- Cache de permissões por organização
- Invalidação ao trocar contexto
```

### 4. **📊 UI Components: Context-Aware**

#### 4.1 **Admin Dashboard**
```typescript
// components/admin/ - ATUALIZAR TODOS
// Deve filtrar por organização ativa:
- user-management.tsx: Usuários da org ativa
- team-management.tsx: Times da org ativa  
- companion-management.tsx: Companions da org ativa
- quota-management.tsx: Quotas da org ativa
```

#### 4.2 **Navigation Guards**
```typescript
// components/auth/ - MELHORAR
// Deve incluir:
- Validação de contexto organizacional
- Redirecionamento se sem acesso à org
- Loading durante mudança de contexto
```

#### 4.3 **Bread Crumbs e Headers**
```typescript
// CRIAR: components/org-breadcrumb.tsx
// Deve mostrar:
- Organização ativa atual
- Breadcrumb de navegação contextual
- Indicador visual de contexto
```

### 5. **🗄️ API Routes: Context-Aware**

#### 5.1 **Filtros Organizacionais**
```typescript
// ATUALIZAR TODAS as APIs:
- /api/companions → Filtrar por org ativa
- /api/users → Filtrar por org ativa  
- /api/teams → Filtrar por org ativa
- /api/roles → Incluir contexto org
- /api/quotas → Filtrar por org ativa
```

#### 5.2 **Validação de Contexto**
```typescript
// ADICIONAR em todas APIs:
function validateOrganizationContext(req, organizationId) {
  // Verificar se usuário tem acesso à organização
  // Validar se é Master Admin ou membro da org
  // Retornar contexto apropriado
}
```

### 6. **💾 Estado e Cache**

#### 6.1 **Client-Side Cache**
```typescript
// IMPLEMENTAR: lib/organization-cache.ts
// Deve incluir:
- Cache de organizações por usuário
- Cache de permissões por organização
- Invalidação inteligente
- Prefetch de contextos
```

#### 6.2 **Session Management**
```typescript
// MELHORAR: auth.ts
// Deve incluir:
- organizationId na sessão
- lastActiveOrganization
- organizationPermissions
- contextSwitchTimestamp
```

### 7. **📱 Mobile e Responsivo**

#### 7.1 **Seletor Mobile**
```typescript
// CRIAR: components/organization-selector-mobile.tsx
// Deve incluir:
- Bottom sheet para mobile
- Gestos de switching
- Indicador visual compacto
```

#### 7.2 **Navigation Mobile**
```typescript
// ATUALIZAR: sidebar mobile
// Deve incluir:
- Contexto organizacional visível
- Switching fácil em mobile
- Breadcrumb compacto
```

### 8. **🔍 Search e Filtering**

#### 8.1 **Search Context-Aware**
```typescript
// ATUALIZAR: Todos os searches
// Deve incluir:
- Filtro automático por organização ativa
- Toggle para search global (Master Admin)
- Indicador de escopo de busca
```

#### 8.2 **Global vs Organizational**
```typescript
// IMPLEMENTAR: Toggles de escopo
// Funcionalidades:
- Busca global (todas as orgs) - só Master Admin
- Busca organizacional (org ativa)
- Filtros cruzados entre organizações
```

### 9. **📊 Analytics e Reporting**

#### 9.1 **Context-Aware Analytics**
```typescript
// CRIAR: components/analytics-dashboard.tsx
// Deve incluir:
- Métricas da organização ativa
- Comparação entre organizações (Master Admin)
- Drill-down por contexto
```

#### 9.2 **Audit Logs**
```typescript
// IMPLEMENTAR: Organization context tracking
// Deve logar:
- Mudanças de contexto organizacional
- Ações realizadas em cada contexto
- Trail de auditoria por organização
```

### 10. **🧪 Testing**

#### 10.1 **Context Switching Tests**
```typescript
// CRIAR: __tests__/organization-context.test.ts
// Deve testar:
- Switching entre organizações
- Persistência de contexto
- Permissões por contexto
- UI updates ao trocar contexto
```

#### 10.2 **Integration Tests**
```typescript
// ATUALIZAR: Todos os testes existentes
// Deve incluir:
- Contexto organizacional em setup
- Multi-tenant test scenarios
- Permission boundaries testing
```

## 📈 **Roadmap de Implementação**

### **Fase 1: Core Backend (1-2 dias)**
1. ✅ Hook e Provider (concluído)
2. 🔲 API de switching (`/api/organizations/switch`)
3. 🔲 Middleware context-aware
4. 🔲 Session management atualizado

### **Fase 2: UI Components (1 dia)**
1. ✅ Seletor no menu (concluído)
2. 🔲 Breadcrumbs organizacionais
3. 🔲 Indicadores de contexto
4. 🔲 Mobile responsive

### **Fase 3: API Integration (2 dias)**
1. 🔲 Context-aware filtering
2. 🔲 Permission validation
3. 🔲 Audit logging
4. 🔲 Error handling

### **Fase 4: Admin Features (1-2 dias)**
1. 🔲 Admin dashboard updates
2. 🔲 User management scoped
3. 🔲 Analytics por organização
4. 🔲 Global vs org toggles

### **Fase 5: Testing & Polish (1 dia)**
1. 🔲 Comprehensive testing
2. 🔲 Performance optimization
3. 🔲 Documentation
4. 🔲 Migration scripts

## 🎯 **Benefícios Esperados**

### **Para Master Admins:**
- ✅ Contexto organizacional claro
- ✅ Switching fácil entre organizações  
- ✅ Funcionalidades administrativas segregadas
- 🔲 Analytics comparativas entre organizações

### **Para Usuários Regulares:**
- ✅ Experiência não impactada
- 🔲 Contexto organizacional sempre claro
- 🔲 Navegação intuitiva

### **Para Desenvolvedores:**
- ✅ Arquitetura clara de multi-tenancy
- 🔲 Testing mais robusto
- 🔲 Debugging facilitado por contexto

## 🔧 **Como Usar Agora**

```typescript
// Em qualquer componente:
import { useOrganizationContext } from '@/hooks/use-organization-context';

function MyComponent() {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization 
  } = useOrganizationContext();
  
  return (
    <div>
      <p>Organização Ativa: {currentOrganization?.name}</p>
      {/* Resto do componente */}
    </div>
  );
}
```

## 🚨 **Limitações Atuais**

1. **Reload Obrigatório**: Switching requer page reload
2. **Cache Simples**: Apenas localStorage, sem cache inteligente
3. **APIs Não Integradas**: Ainda não filtram por contexto
4. **Permissions**: Hook use-permissions não integrado
5. **Mobile**: Não otimizado para dispositivos móveis

## 🎭 **Próximos Passos Recomendados**

1. **PRIORIDADE 1**: Implementar API de switching
2. **PRIORIDADE 2**: Atualizar middleware para suportar contexto
3. **PRIORIDADE 3**: Integrar com hook de permissions
4. **PRIORIDADE 4**: Atualizar componentes admin existentes

---

**Status**: 🟡 **Parcialmente Implementado** - Frontend funcional, backend needs work
**Última Atualização**: 2025-01-02
**Próxima Revisão**: Após implementação da API de switching 