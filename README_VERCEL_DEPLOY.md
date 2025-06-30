# 🚀 Deploy Vercel - Configuração de Autenticação

## 📋 Variáveis de Ambiente Obrigatórias

Configure estas variáveis no painel do Vercel (`Settings > Environment Variables`):

### 🔐 Autenticação
```bash
# SECRET para NextAuth (OBRIGATÓRIO)
AUTH_SECRET=your-super-secret-32-character-string
# ou alternativamente:
NEXTAUTH_SECRET=your-super-secret-32-character-string

# URL da aplicação em produção
NEXTAUTH_URL=https://your-app.vercel.app

# Configuração de cookies seguros
NODE_ENV=production
```

### 🗄️ Banco de Dados
```bash
# PostgreSQL Connection String
POSTGRES_URL=postgresql://user:password@host:port/database

# Vercel Postgres (se usar)
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:port/database
```

### 🤖 Azure OpenAI
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-21
```

### 📁 Vercel Blob Storage
```bash
# Para upload de arquivos
BLOB_READ_WRITE_TOKEN=your-blob-token
```

## ⚙️ Como Gerar AUTH_SECRET

Execute um dos comandos abaixo para gerar um secret seguro:

```bash
# Opção 1: OpenSSL
openssl rand -base64 32

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opção 3: Online (use com cuidado)
# Visite: https://generate-secret.vercel.app/32
```

## 🔧 Configuração no Vercel

1. **Acesse o projeto no Vercel**
2. **Vá em Settings > Environment Variables**
3. **Adicione cada variável uma por uma:**
   - Name: `AUTH_SECRET`
   - Value: `seu-secret-gerado`
   - Environments: `Production`, `Preview`, `Development`

4. **Repita para todas as variáveis listadas acima**

## 🐛 Resolução de Problemas de Autenticação

### ❌ "Unauthorized" em produção

**Possíveis causas:**
- `AUTH_SECRET` não configurado ou incorreto
- `NEXTAUTH_URL` não configurado ou com URL errada
- Cookies não funcionando (domínio/HTTPS)

**Soluções:**
1. Verifique se `AUTH_SECRET` está configurado no Vercel
2. Confirme que `NEXTAUTH_URL` aponta para sua URL de produção
3. Limpe cache do navegador e cookies
4. Verifique logs do Vercel em `Functions > Logs`

### ❌ "Session not found"

**Soluções:**
1. Redeploy após configurar variáveis de ambiente
2. Verifique se domínio de cookies está correto
3. Teste em janela privada/incógnita

### ❌ "Database connection failed"

**Soluções:**
1. Verifique `POSTGRES_URL` no Vercel
2. Teste conexão com banco separadamente
3. Confirme que banco aceita conexões externas

## 🚀 Deploy Checklist

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `AUTH_SECRET` gerado com 32+ caracteres
- [ ] `NEXTAUTH_URL` apontando para URL de produção
- [ ] Banco de dados PostgreSQL acessível
- [ ] Azure OpenAI configurado (se aplicável)
- [ ] Vercel Blob configurado (se aplicável)
- [ ] Deploy realizado após configurar variáveis
- [ ] Teste de login funcional em produção

## 📞 Debug em Produção

Para debugar problemas de autenticação:

1. **Verifique logs do Vercel:**
   ```
   Functions > View Function Logs
   ```

2. **Teste endpoints específicos:**
   ```
   https://your-app.vercel.app/api/auth/session
   https://your-app.vercel.app/api/auth/providers
   ```

3. **Headers úteis para debug:**
   - `x-middleware-duration`: Performance do middleware
   - `x-tenant-validated`: Validação de tenant
   - `x-middleware-error`: Erros no middleware

## 🔄 Redeployment

Após configurar novas variáveis de ambiente:

1. **Trigger novo deploy:**
   ```bash
   # Opção 1: Push novo commit
   git commit --allow-empty -m "trigger redeploy"
   git push

   # Opção 2: Redeploy via Vercel Dashboard
   Deployments > ... > Redeploy
   ```

2. **Aguarde deploy completo antes de testar**

## 📧 Suporte

Se continuar com problemas:
1. Verifique logs do Vercel
2. Teste localmente com as mesmas variáveis
3. Compare configuração com ambiente funcionando
4. Documenten erro específico para suporte 