# Setup Environment - Configuração do Ambiente de Desenvolvimento

## 🎯 Visão Geral

Este guia fornece instruções completas para configurar o ambiente de desenvolvimento local da plataforma Humana AI Companions, incluindo todas as dependências, serviços e ferramentas necessárias.

## 📋 Pré-requisitos

### **💻 Sistema Operacional**
- **macOS**: 12.0+ (Monterey)
- **Windows**: 11 com WSL2
- **Linux**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### **🔧 Ferramentas Base**
- **Node.js**: v18.17.0+ (LTS)
- **npm**: v9.0.0+ ou **pnpm**: v8.0.0+ (recomendado)
- **Docker**: v24.0.0+
- **Docker Compose**: v2.20.0+
- **Git**: v2.40.0+

### **🗄️ Banco de Dados**
- **PostgreSQL**: v15.0+ (local ou container)
- **Redis**: v7.0+ (para cache e sessões)

## 🚀 Instalação Rápida

### **📦 Clone e Dependências**
```bash
# Clone do repositório
git clone https://github.com/humana-ai/companions.git
cd companions

# Instalação de dependências
pnpm install

# Setup do ambiente
cp .env.example .env.local
```

### **🗄️ Configuração do Banco**
```bash
# Subir serviços com Docker
docker-compose up -d postgres redis

# Executar migrations
pnpm db:migrate

# Seed com dados iniciais
pnpm db:seed
```

### **🎯 Configuração das APIs**
```bash
# Configurar variáveis de ambiente
echo "OPENAI_API_KEY=your-openai-key" >> .env.local
echo "AZURE_OPENAI_API_KEY=your-azure-key" >> .env.local
echo "ANTHROPIC_API_KEY=your-anthropic-key" >> .env.local
```

### **▶️ Executar Aplicação**
```bash
# Desenvolvimento local
pnpm dev

# Aplicação disponível em http://localhost:3000
```

## 🔧 Configuração Detalhada

### **🗄️ Database Setup**

#### **PostgreSQL Local**
```bash
# Instalação (macOS)
brew install postgresql@15
brew services start postgresql@15

# Criação do banco
createdb humana_companions_dev
createdb humana_companions_test

# Configuração no .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/humana_companions_dev"
```

#### **PostgreSQL Docker**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: humana_companions_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### **🤖 AI Provider Setup**

#### **OpenAI Configuration**
```bash
# .env.local
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...
OPENAI_PROJECT=proj_...
```

#### **Azure OpenAI Configuration**
```bash
# .env.local
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

#### **Anthropic Configuration**
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### **🔐 Authentication Setup**

#### **NextAuth.js Configuration**
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### **📁 File Storage Setup**

#### **Local Development**
```bash
# .env.local
STORAGE_TYPE=local
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760 # 10MB
```

#### **Vercel Blob (Production)**
```bash
# .env.local
STORAGE_TYPE=vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

## 🧪 Testing Setup

### **🔧 Test Dependencies**
```bash
# Instalar dependências de teste
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test

# Setup do banco de teste
createdb humana_companions_test
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/humana_companions_test"
```

### **🎭 Playwright E2E Tests**
```bash
# Instalar browsers
pnpm exec playwright install

# Executar testes E2E
pnpm test:e2e
```

### **⚡ Unit Tests**
```bash
# Executar testes unitários
pnpm test

# Testes com watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## 🛠️ Development Tools

### **📝 Code Editor Setup**

#### **VS Code Extensions**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

#### **VS Code Settings**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### **🔍 Code Quality Tools**

#### **ESLint Configuration**
```bash
# Já configurado no projeto
pnpm lint

# Auto-fix
pnpm lint:fix
```

#### **Prettier Configuration**
```bash
# Format código
pnpm format

# Check formatting
pnpm format:check
```

#### **TypeScript Check**
```bash
# Type checking
pnpm type-check
```

## 🔄 Development Workflow

### **📂 Estrutura de Branches**
```
main
├── develop
│   ├── feature/user-management
│   ├── feature/companion-designer
│   └── hotfix/critical-bug
└── release/v1.2.0
```

### **💻 Daily Development**
```bash
# 1. Atualizar develop
git checkout develop
git pull origin develop

# 2. Criar feature branch
git checkout -b feature/your-feature

# 3. Desenvolvimento
pnpm dev

# 4. Testes
pnpm test
pnpm test:e2e

# 5. Commit
git add .
git commit -m "feat: add your feature"

# 6. Push e PR
git push origin feature/your-feature
```

### **🚀 Pre-commit Hooks**
```bash
# Instalação do husky
pnpm add -D husky lint-staged

# Configuração automática
npx husky-init && pnpm install
```

## 📊 Monitoring & Debug

### **📈 Local Analytics**
```bash
# Configurar analytics local
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_DEBUG_MODE=true
```

### **🐛 Debug Configuration**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### **📋 Logging Setup**
```bash
# .env.local
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

## 🚨 Troubleshooting

### **❓ Common Issues**

#### **Node Version Conflicts**
```bash
# Usar nvm para gerenciar versões
nvm install 18.17.0
nvm use 18.17.0
```

#### **Port Already in Use**
```bash
# Encontrar processo usando porta 3000
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)
```

#### **Database Connection Issues**
```bash
# Verificar se PostgreSQL está rodando
brew services list | grep postgresql

# Restart do serviço
brew services restart postgresql@15
```

#### **Cache Issues**
```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules
rm -rf node_modules package-lock.json
pnpm install
```

---

**Este guia garante que qualquer desenvolvedor pode configurar o ambiente local completo em menos de 30 minutos e começar a contribuir imediatamente.** 