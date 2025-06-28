# Sistema de Regras Contextuais do Cursor

Este projeto utiliza um sistema modular de regras do Cursor que permite alternar entre diferentes contextos conforme a necessidade do desenvolvimento.

## 📋 Contextos Disponíveis

### 🔧 Core (`cursorrules-core`)
**Regras fundamentais e tecnologias base**
- Next.js 15 App Router
- TypeScript strict mode
- Estrutura de arquivos e projeto
- Performance e best practices
- Terminologia padrão

### 🎨 Frontend (`cursorrules-frontend`)
**Design system, UI/UX e componentes React**
- Design system obrigatório (cores, ícones)
- Estruturas de layout padrão
- Componentes React e estados
- Responsividade e acessibilidade
- Performance frontend

### ⚙️ Backend (`cursorrules-backend`)
**APIs, banco de dados e server-side**
- Drizzle ORM e schema design
- API patterns com Next.js
- Autenticação e autorização
- Multi-tenancy e segurança
- File handling e background jobs

### 🤖 AI (`cursorrules-ai`)
**Integrações AI/LLM, prompts e providers**
- AI SDK (Vercel) patterns
- Provider management (OpenAI, Anthropic, Azure)
- Prompt engineering e templates
- Tool integration (MCP)
- Memory, context e performance

### 📚 Docs (`cursorrules-docs`)
**Documentação, blueprints e estrutura**
- Regras de blueprints
- Estrutura de documentação
- Formatação markdown
- Qualidade e revisão
- Versionamento

## 🔄 Como Usar

### Alternando Contextos

**Windows (PowerShell):**
```powershell
# Ativar contexto específico
.\scripts\switch-rules.ps1 frontend

# Combinar todas as regras
.\scripts\switch-rules.ps1 full
```

**Unix/Linux/macOS (Bash):**
```bash
# Tornar executável (primeira vez)
chmod +x scripts/switch-rules.sh

# Ativar contexto específico
./scripts/switch-rules.sh frontend

# Combinar todas as regras
./scripts/switch-rules.sh full
```

### 🔮 Auto-Switch Inteligente

**Windows (PowerShell):**
```powershell
# Auto-detecta contexto baseado no arquivo
.\scripts\auto-switch-rules.ps1 components/ui/button.tsx  # → frontend
.\scripts\auto-switch-rules.ps1 app/api/chat/route.ts     # → backend
.\scripts\auto-switch-rules.ps1 projeto/blueprints/x.md  # → docs
.\scripts\auto-switch-rules.ps1 lib/ai/prompts.ts        # → ai
```

### Contextos por Tarefa

| Tarefa | Contexto Recomendado |
|--------|---------------------|
| 🎨 **Desenvolvimento UI** | `frontend` |
| ⚙️ **APIs e Database** | `backend` |
| 🤖 **Integração AI/LLM** | `ai` |
| 📚 **Escrevendo Blueprints** | `docs` |
| 🔧 **Setup inicial** | `core` |
| 🚀 **Desenvolvimento geral** | `full` |
| 🔮 **Auto-detecção** | `auto-switch-rules.ps1` |

## 💡 Estratégias de Uso

### 🎯 Desenvolvimento Focado
Use contextos específicos quando trabalhando em uma área:
```bash
# Trabalhando na interface
./scripts/switch-rules.sh frontend

# Implementando APIs
./scripts/switch-rules.sh backend

# Configurando LLMs
./scripts/switch-rules.sh ai
```

### 🔄 Desenvolvimento Multi-área
Use o contexto `full` quando trabalhando em múltiplas áreas:
```bash
# Todas as regras disponíveis
./scripts/switch-rules.sh full
```

### 📝 Documentação
Use contexto `docs` para blueprints e documentação:
```bash
# Foco em documentação
./scripts/switch-rules.sh docs
```

### 🎯 Integração com VSCode
Use tasks do VSCode (Ctrl+Shift+P → "Tasks: Run Task"):
- **Cursor: Auto Switch Context** - Detecta automaticamente
- **Cursor: Switch to Frontend** - Força contexto frontend
- **Cursor: Switch to Backend** - Força contexto backend
- **Cursor: Switch to AI** - Força contexto AI
- **Cursor: Switch to Docs** - Força contexto docs
- **Cursor: Switch to Full Context** - Todas as regras

## 🔍 Arquivo Ativo

O arquivo `.cursorrules` na raiz é sempre o **ativo**. Os scripts fazem:

1. **Backup automático** → `.cursorrules.backup`
2. **Cópia do contexto** → `.cursorrules`
3. **Instrução para reiniciar** o Cursor

## ⚠️ Importante

### Reiniciar o Cursor
**Sempre reinicie o Cursor após trocar contextos** para aplicar as novas regras.

### Backup Automático
Toda troca cria automaticamente backup do arquivo anterior em `.cursorrules.backup`.

### Arquivos Fonte
**Nunca edite `.cursorrules` diretamente**. Edite os arquivos fonte:
- `.cursorrules-core`
- `.cursorrules-frontend`
- `.cursorrules-backend`
- `.cursorrules-ai`
- `.cursorrules-docs`

## 🛠️ Troubleshooting

### Script não executa (Unix/Linux)
```bash
chmod +x scripts/switch-rules.sh
```

### Regras não aplicam
1. Verifique se reiniciou o Cursor
2. Confirme se `.cursorrules` foi alterado
3. Verifique permissões dos arquivos

### Arquivo não encontrado
```bash
# Verificar se todos os arquivos existem
ls -la .cursorrules-*
```

### Restaurar backup
```bash
cp .cursorrules.backup .cursorrules
```

## 🔍 Padrões de Auto-Detecção

O script `auto-switch-rules.ps1` detecta contextos baseado nos padrões:

| Contexto | Padrões de Arquivo |
|----------|-------------------|
| **docs** | `projeto/`, `docs/`, `README`, `blueprint`, `*.md` |
| **ai** | `lib/ai/`, `ai.ts`, `tool.ts`, `mcp.ts` |
| **backend** | `app/api/`, `lib/db/`, `lib/auth/`, `*.sql`, `drizzle.`, `middleware.ts` |
| **frontend** | `components/`, `*.tsx`, `*.css`, `tailwind.`, `ui` (exceto .md) |
| **core** | Qualquer outro arquivo |

## 📈 Benefícios

### ✅ Vantagens
- **Foco contextual**: Regras relevantes para a tarefa
- **Performance**: Menos tokens, processamento mais rápido
- **Clareza**: Regras específicas sem ruído
- **Flexibilidade**: Alterna conforme necessidade
- **Backup automático**: Segurança nas mudanças

### ❌ Considerações
- **Mudança manual**: Requer comando para alternar
- **Reinicialização**: Cursor precisa ser reiniciado
- **Manutenção**: Múltiplos arquivos para manter

## 🔧 Personalização

### Criando Novos Contextos
1. Crie arquivo `.cursorrules-<nome>`
2. Adicione ao script `switch-rules`
3. Documente no README

### Modificando Contextos
1. Edite arquivo fonte (`.cursorrules-<contexto>`)
2. Execute script para reaplicar
3. Reinicie o Cursor

---

💡 **Dica**: Comece com `core` para configuração básica, depois use contextos específicos conforme a tarefa. 