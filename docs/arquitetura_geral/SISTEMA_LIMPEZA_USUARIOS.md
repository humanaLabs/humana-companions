# Sistema de Limpeza e Manutenção de Usuários

## 📋 Visão Geral

Este documento descreve o sistema de limpeza e manutenção de usuários convidados (guest users) do projeto Humana Companions. O sistema foi desenvolvido para resolver o problema de acúmulo descontrolado de usuários temporários no banco de dados.

## 🚨 Problema Identificado

### **Situação Original:**
- **6.863 usuários convidados** acumulados no banco de dados
- **6.754 usuários (98%)** nunca utilizaram o sistema (zero atividade)
- **Crescimento médio**: ~980 usuários convidados por dia
- **Impacto**: Degradação da performance e uso excessivo de storage
- **Causa**: Ausência de sistema de limpeza automática (TTL)

### **Tipos de Usuário:**
1. **Usuários Regulares**: Cadastrados com email/senha
2. **Master Admins**: Usuários com permissões administrativas
3. **Usuários Convidados**: Temporários no formato `guest-{timestamp}`

## 🛠️ Scripts de Manutenção

### **1. Análise e Listagem**

#### **Listar Usuários Importantes**
```bash
# Lista apenas usuários regulares e admins (exclui guests)
node scripts/list-important-users.js
```

**Função**: Mostra usuários não-convidados para verificar administradores e usuários regulares.

#### **Analisar Idade dos Usuários Convidados**
```bash
# Análise detalhada dos usuários convidados por idade
node scripts/analyze-guest-ages.js
```

**Função**: Analisa a distribuição etária dos usuários convidados e identifica quantos podem ser limpos.

**Saída Esperada:**
```
🕒 ANÁLISE DE IDADE DOS USUÁRIOS CONVIDADOS
==========================================

📊 RESUMO ESTATÍSTICO:
- Total de usuários convidados: 109
- Usuários criados nas últimas 24h: 109
- Usuários criados há mais de 1 dia: 0
- Usuários criados há mais de 7 dias: 0

🧹 LIMPEZA RECOMENDADA:
- Usuários sem atividade (podem ser limpos): 109
- Usuários com atividade (manter): 0
```

### **2. Limpeza de Usuários**

#### **Limpeza de Usuários Inativos (Recomendado)**
```bash
# Modo simulação (dry-run) - apenas mostra o que seria deletado
node scripts/cleanup-inactive-guests.js --dry-run

# Execução real - deleta os usuários
node scripts/cleanup-inactive-guests.js --force
```

**Função**: Remove usuários convidados que nunca criaram chats ou tiveram atividade.

**Critérios de Limpeza:**
- Usuários com email no formato `guest-{timestamp}`
- Sem nenhum chat associado
- Sem atividade registrada

#### **Limpeza de Usuários Antigos**
```bash
# Modo simulação
node scripts/cleanup-old-guests.js --dry-run

# Execução real
node scripts/cleanup-old-guests.js --force
```

**Função**: Remove usuários convidados mais antigos que um determinado período (configurável).

**Critérios de Limpeza:**
- Usuários criados há mais de 7 dias (padrão)
- Inclui usuários com atividade mas expirados

### **3. Administração de Usuários**

#### **Criar Novo Master Admin (Recomendado)**
```bash
# Criar novo usuário master admin do zero
node scripts/create-new-admin.js seu-email@exemplo.com suasenha

# Usar senha padrão (admin123)
node scripts/create-new-admin.js admin@empresa.com

# Exemplos práticos
node scripts/create-new-admin.js joao@humana.com minhaSenha2025
node scripts/create-new-admin.js admin@projeto.com  # senha: admin123
```

**Função**: 
- ✅ **Cria usuários completamente novos** (email + senha hash)
- ✅ **Promove usuários existentes** se necessário
- ✅ **Validação inteligente** de duplicatas
- ✅ **Instruções de login** detalhadas

**Recursos Avançados:**
- Hash seguro de senhas com bcrypt
- Detecção automática de usuários existentes
- Promoção automática de usuários regulares
- Lista todos os master admins após criação

#### **Promover Usuário Existente Apenas**
```bash
# Promover usuário já cadastrado para master admin
node scripts/make-custom-admin.js seu-email@exemplo.com
```

**Função**: ❌ **NÃO cria usuários novos** - apenas promove usuários já existentes no banco.

**Limitações:**
- Requer que o usuário já esteja cadastrado
- Lista usuários disponíveis se não encontrar
- Não define senhas

#### **Criar Master Admin Padrão**
```bash
# Usa o email padrão configurado no script
node scripts/make-master-admin.js
```

**Função**: Cria master admin com email pré-configurado (`eduibrahim@yahoo.com.br`).

#### **Comparação dos Scripts de Administração**

| Funcionalidade | `create-new-admin.js` | `make-custom-admin.js` | `make-master-admin.js` |
|---|---|---|---|
| **Cria usuários novos** | ✅ Sim | ❌ Não | ✅ Sim (fixo) |
| **Promove existentes** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Senha personalizada** | ✅ Sim | ❌ Não | ❌ Não |
| **Email personalizado** | ✅ Sim | ✅ Sim | ❌ Não |
| **Validação inteligente** | ✅ Sim | ✅ Parcial | ❌ Não |
| **Hash de senha** | ✅ bcrypt | ❌ N/A | ✅ bcrypt |
| **Instruções de login** | ✅ Sim | ❌ Não | ❌ Não |

**📝 Recomendação**: Use `create-new-admin.js` para novos usuários e `make-custom-admin.js` apenas para promover usuários existentes.

#### **Exemplos Práticos de Uso (Testados)**

##### **Criar Novo Administrador:**
```bash
$ node scripts/create-new-admin.js admin@teste.com minhasenha123

👑 CRIADOR DE NOVO MASTER ADMIN
===============================
📧 Email: admin@teste.com
🔐 Senha: minhasenha123

🔍 Verificando se usuário já existe...
🔐 Gerando hash da senha...
👤 Criando novo usuário...

🎉 SUCESSO! Novo Master Admin criado!
==================================================
👑 Novo Master Admin: admin@teste.com
🆔 ID: 0cc5847a-a9f9-4b81-a6b0-b0c44b182f31
🔐 Senha: minhasenha123
👑 Master Admin: true
==================================================

📝 COMO FAZER LOGIN:
1. Acesse: http://localhost:3000/login
2. Email: admin@teste.com
3. Senha: minhasenha123
4. ✅ Você terá acesso total como Master Admin!
```

##### **Promover Usuário Existente:**
```bash
$ node scripts/create-new-admin.js demo@demo.com

🔍 Verificando se usuário já existe...
⚠️ Usuário já existe!
   📧 Email: demo@demo.com
   👑 Master Admin: Não
🔄 Promovendo usuário existente para Master Admin...
✅ Usuário promovido com sucesso!
👑 demo@demo.com agora é Master Admin
```

##### **Usuário Já É Master Admin:**
```bash
$ node scripts/create-new-admin.js admin@teste.com outrasenha

⚠️ Usuário já existe!
   📧 Email: admin@teste.com
   👑 Master Admin: Sim
✅ Usuário já é Master Admin. Nada a fazer!
```

## 🔄 Sistema de Limpeza Automática

### **Implementação TypeScript**

**Arquivo**: `lib/cleanup/guest-cleanup.ts`

#### **Funções Principais:**

##### **1. Limpeza Manual**
```typescript
import { cleanupGuestUsers } from '@/lib/cleanup/guest-cleanup';

const stats = await cleanupGuestUsers({
  ttlHours: 24,           // 24h para usuários com atividade
  inactiveTtlHours: 1,    // 1h para usuários sem atividade
  dryRun: false           // false = execução real
});

console.log('Resultado:', stats);
```

##### **2. Limpeza Agendada**
```typescript
import { scheduleGuestCleanup } from '@/lib/cleanup/guest-cleanup';

// Para usar em cron job ou scheduler
await scheduleGuestCleanup();
```

##### **3. Verificação de Necessidade**
```typescript
import { isCleanupNeeded } from '@/lib/cleanup/guest-cleanup';

const { needed, totalGuests, inactiveGuests } = await isCleanupNeeded();

if (needed) {
  console.log(`Limpeza necessária: ${totalGuests} guests, ${inactiveGuests} inativos`);
}
```

### **Configurações de Limpeza**

```typescript
const CLEANUP_CONFIG = {
  // Manter usuários guest por 24 horas por padrão
  DEFAULT_TTL_HOURS: 24,
  // Limpar usuários inativos após 1 hora
  INACTIVE_TTL_HOURS: 1,
  // Tamanho do lote para performance
  BATCH_SIZE: 50,
  // Máximo de usuários a limpar por execução
  MAX_CLEANUP_PER_RUN: 1000,
};
```

### **Critérios de Ativação Automática**

A limpeza é considerada necessária quando:
- **Mais de 500 usuários convidados** total no sistema
- **Mais de 100 usuários convidados** inativos

## 📊 Resultados da Implementação

### **Limpeza Inicial Realizada:**
- ✅ **6.754 usuários inativos** removidos
- 📉 **Redução de 98%**: De 6.863 → 109 usuários convidados
- 💾 **Storage liberado**: Significativo espaço no banco de dados
- 🚀 **Performance melhorada**: Queries mais rápidas

### **Situação Atual:**
- **2 Master Admins** configurados
- **34 usuários regulares** 
- **109 usuários convidados ativos** (com atividade real)
- **Sistema limpo e otimizado**

## 🔧 Manutenção Recomendada

### **Diária:**
```bash
# Verificar status do sistema
node scripts/analyze-guest-ages.js

# Limpeza de usuários inativos (se necessário)
node scripts/cleanup-inactive-guests.js --dry-run
```

### **Semanal:**
```bash
# Limpeza mais agressiva de usuários antigos
node scripts/cleanup-old-guests.js --dry-run

# Se aprovado, executar:
node scripts/cleanup-old-guests.js --force
```

### **Mensal:**
```bash
# Verificar usuários importantes
node scripts/list-important-users.js

# Análise completa do sistema
node scripts/analyze-guest-ages.js
```

## 🚀 Automação Futura

### **Implementação com Cron Jobs**

**Para Linux/macOS:**
```bash
# Limpeza diária às 2h da manhã
0 2 * * * cd /path/to/project && node scripts/cleanup-inactive-guests.js --force

# Limpeza semanal aos domingos às 3h
0 3 * * 0 cd /path/to/project && node scripts/cleanup-old-guests.js --force
```

**Para Windows (Task Scheduler):**
```powershell
# Criar tarefa agendada para limpeza diária
schtasks /create /tn "CleanupGuestUsers" /tr "node scripts/cleanup-inactive-guests.js --force" /sc daily /st 02:00
```

### **Integração com Next.js**

**API Route para limpeza manual:**
```typescript
// app/api/admin/cleanup/route.ts
import { cleanupGuestUsers } from '@/lib/cleanup/guest-cleanup';

export async function POST() {
  const stats = await cleanupGuestUsers({ dryRun: false });
  return Response.json(stats);
}
```

**Middleware para limpeza automática:**
```typescript
// middleware.ts
import { isCleanupNeeded, scheduleGuestCleanup } from '@/lib/cleanup/guest-cleanup';

export async function middleware(request: NextRequest) {
  // Verificar se precisa de limpeza a cada 100 requests
  if (Math.random() < 0.01) {
    const { needed } = await isCleanupNeeded();
    if (needed) {
      // Executar em background
      scheduleGuestCleanup().catch(console.error);
    }
  }
}
```

## ⚠️ Considerações Importantes

### **Segurança:**
- Scripts sempre verificam se usuários são realmente convidados (formato `guest-{timestamp}`)
- Não removem usuários regulares ou admins
- Modo `--dry-run` para validação antes da execução

### **Performance:**
- Limpeza em lotes para evitar travamento do banco
- Pausas entre operações para não sobrecarregar o sistema
- Límites de quantidade por execução

### **Monitoramento:**
- Logs detalhados de todas as operações
- Contadores de sucessos e erros
- Alertas para limpezas muito grandes (possível problema)

## 📝 Troubleshooting

### **Erro: "POSTGRES_URL environment variable is required"**
```bash
# Verificar se .env.local existe e tem POSTGRES_URL
cat .env.local | grep POSTGRES_URL
```

### **Erro: "Cannot connect to database"**
```bash
# Testar conexão com o banco
node -e "const postgres = require('postgres'); const sql = postgres(process.env.POSTGRES_URL); sql\`SELECT 1\`.then(console.log).catch(console.error);"
```

### **Script não encontra usuários**
```bash
# Verificar estrutura do banco
node scripts/list-important-users.js
```

## 📦 Dependências e Instalação

### **Dependências Necessárias**
```bash
# Para hash de senhas (script create-new-admin.js)
pnpm add bcrypt

# Verificar se está instalado
pnpm list bcrypt
```

### **Variáveis de Ambiente Obrigatórias**
```bash
# Arquivo: .env.local
POSTGRES_URL=postgresql://user:password@host:port/database
```

### **Verificar Conexão com Banco**
```bash
# Testar conexão antes de executar scripts
node -e "const postgres = require('postgres'); const sql = postgres(process.env.POSTGRES_URL); sql\`SELECT 1\`.then(console.log).catch(console.error);"
```

## 🔗 Arquivos Relacionados

- **Scripts**: `scripts/` (todos os scripts de manutenção)
  - `create-new-admin.js` - **Criar novos master admins (recomendado)**
  - `make-custom-admin.js` - Promover usuários existentes
  - `make-master-admin.js` - Admin padrão
  - `cleanup-inactive-guests.js` - Limpeza de usuários inativos
  - `cleanup-old-guests.js` - Limpeza de usuários antigos
  - `analyze-guest-ages.js` - Análise de idade dos guests
  - `list-important-users.js` - Listar usuários não-convidados
- **Sistema automático**: `lib/cleanup/guest-cleanup.ts`
- **Configuração**: `lib/constants.ts`
- **Schema do banco**: `lib/db/schema.ts`
- **Queries**: `lib/db/queries.ts`

---

**Última atualização**: Janeiro 2025  
**Responsável**: Sistema de Limpeza Automática  
**Status**: ✅ Implementado e Funcional 