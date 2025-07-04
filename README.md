# Humana AI Companions

> **IA que se adapta à sua organização** - Companions de IA personalizados que compreendem sua cultura, processos e objetivos.

## 🎨 Design System

**🎨 [Padrão de Layout UI](projeto/diagramas/README.md)** - Guia completo do design system e padrões visuais da aplicação.

## 📚 Documentação

- **📁 [Documentação Completa](projeto/)**
- **🏗️ [Arquitetura Modular](projeto/architecture/)**
- **🎯 [Boas Práticas](projeto/blueprints/10.1-boas-praticas.md)**

## 🚀 Tecnologias

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS v4
- **Backend:** Node.js, Drizzle ORM
- **IA:** Vercel AI SDK, OpenAI, Azure OpenAI
- **Database:** PostgreSQL
- **Deploy:** Vercel

## 🧠 Design System Classes

### Classes Essenciais:
- **Cards:** `bg-card border rounded-lg`
- **Texto:** `text-foreground` / `text-muted-foreground`
- **Botões:** `bg-primary hover:bg-primary/90 text-primary-foreground`
- **Ícones:** Emojis/ASCII sutis (📄 📋 🔗 etc.)

## ⚡️ Quick Start

### Pré-requisitos

- Node.js >= 20 (LTS recomendado)
- pnpm >= 9 (o projeto usa `packageManager` no *package.json*)
- PostgreSQL 15+ local ou serviço gerenciado (ex.: Neon, Supabase, Vercel Postgres)

### Clonando o repositório

```bash
# SSH
git clone git@github.com:humana-inc/humana-companions.git
# ou HTTPS
# git clone https://github.com/humana-inc/humana-companions.git

cd humana-companions
pnpm install
```

### Variáveis de ambiente
Crie um arquivo `.env.local` na raiz com as chaves mínimas para rodar localmente:

```dotenv
# Autenticação
AUTH_SECRET=changeme-super-secret

# IA (fallback para OpenAI se não preencher)
AZURE_API_KEY=

# Banco de Dados
POSTGRES_URL=postgres://user:pass@localhost:5432/humana

# Cache opcional (Redis Cloud, Upstash…)
REDIS_URL=

# Uploads (Vercel Blob) – opcional em dev
BLOB_READ_WRITE_TOKEN=
```

*Dica:* copie o arquivo `.env.example` quando disponível ou confira `lib/ai/azure-config.ts` para ver variáveis opcionais.

### Rodando em modo desenvolvimento

```bash
pnpm dev          # inicia Next.js com Hot Reload
```

### Build de produção local

```bash
pnpm build        # gera .next otimizado
pnpm start        # inicia em http://localhost:3000
```

### Migrations do banco

```bash
# Gera arquivos de migração a partir dos schemas TypeScript
pnpm db:generate

# Aplica migrações pendentes
pnpm db:migrate

# Abre Drizzle Studio (UI web)
pnpm db:studio
```

## 🧪 Testes

### Tipos de Teste Disponíveis

- **🎭 E2E Funcionais:** Playwright (`pnpm test` ou `pnpm test:ui`)
- **📸 Testes Visuais:** Screenshots automatizados e regressão visual
- **📱 Responsividade:** Mobile, tablet, desktop
- **🌐 Cross-Browser:** Chrome, Firefox, Safari
- **♿ Acessibilidade:** Navegação por teclado, contraste
- **⚡ Performance:** Core Web Vitals, tempo de carregamento

### Comandos de Teste

```bash
# Testes básicos
pnpm test                    # Suite E2E completa
pnpm test:ui                 # Interface gráfica Playwright

# Testes visuais automatizados
pnpm test:visual             # Todos os testes visuais
pnpm test:visual:admin       # Apenas telas administrativas
pnpm test:visual:mobile      # Testes responsivos
pnpm test:visual:cross-browser # Multi-browser
pnpm test:visual:report      # Gerar relatório HTML

# Validação completa
pnpm lint                    # ESLint + Tailwind plugin
pnpm lint && pnpm test       # Validação completa
```

### Documentação de Testes

- **📖 [Guia Completo de Testes Visuais](projeto/testes/TESTES_VISUAIS_AUTOMATIZADOS.md)**
- **📊 [Documentação Geral de Testes](projeto/testes/README.md)**

## 📂 Estrutura do Projeto (high-level)

```
app/                # Rotas App Router (Next.js 15)
  (auth)/           # Páginas & APIs de autenticação
  (chat)/           # Domínio Chat + Data Room
components/         # UI & componentes de domínio
lib/                # Código isolado (AI, DB, utilitários)
hooks/              # React hooks reutilizáveis
public/             # Arquivos estáticos
scripts/            # Scripts auxiliares (migrations, etc.)
projeto/            # Documentação completa e organizada
```

## 🤝 Contribuindo

1. Crie um *fork* e branch a partir de `main`.
2. Siga o design system ("Padrão de Layout UI").
3. Garanta que `pnpm lint && pnpm test` passem.
4. Abra seu Pull Request com descrição clara do problema/solução.

Para discussões maiores use *issues* ou [Discussions](https://github.com/humana-inc/humana-companions/discussions).

## 📜 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais detalhes.

## ⚠️ Padrão de UI/UX Rigoroso

Este projeto segue um padrão rigoroso de design system. **SEMPRE** consulte o [Padrão de Layout UI](projeto/diagramas/README.md) antes de criar ou modificar componentes.

### 🚫 Proibições
- ❌ Não use cores hardcoded (`bg-white`, `dark:bg-gray-800`)
- ❌ Não crie componentes sem consultar o design system
- ❌ Não use Tailwind CSS sem seguir os tokens de design

### ✅ Obrigatório
- ✅ Use apenas tokens de design (`bg-card`, `text-foreground`)
- ✅ Siga os padrões de layout estabelecidos
- ✅ Teste em tema claro E escuro
- ✅ Valide responsividade em todos os breakpoints
