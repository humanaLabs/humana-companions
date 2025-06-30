# 🐛 Debug de Login em Produção

## 📋 Problema Identificado
O login em produção estava redirecionando para `/login` ao invés de `/` após autenticação bem-sucedida.

## 🔍 Causa Raiz
O middleware não conseguia encontrar o token de sessão em produção devido a diferenças na configuração de cookies entre desenvolvimento e produção.

## ✅ Correções Implementadas

### 1. Configuração de Cookies NextAuth
```typescript
// app/(auth)/auth.config.ts
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

### 2. Middleware com CookieName Específico
```typescript
// middleware.ts
const token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  cookieName: process.env.NODE_ENV === 'production' 
    ? '__Secure-next-auth.session-token' 
    : 'next-auth.session-token',
});
```

### 3. Logs de Debug em Produção
- ✅ Logs específicos para produção
- ✅ Informações sobre cookies encontrados
- ✅ Status do token (presente/ausente)
- ✅ Caminho sendo acessado

## 🧪 Como Testar em Produção

### 1. Verificar Logs do Vercel
```
Functions > View Function Logs
```

### 2. Procurar por estas mensagens:
- `🔍 [PROD] Middleware check:` - Status do middleware
- `✅ [PROD] Token found, allowing access` - Token encontrado com sucesso
- `🚫 [PROD] No token found, redirecting to login` - Token não encontrado

### 3. Teste Manual:
1. Faça login como usuário regular
2. Verifique se redireciona para `/` 
3. Teste login como guest
4. Teste registro de nova conta

## 🔧 Variáveis de Ambiente Necessárias

Confirme que estão configuradas no Vercel:
```
AUTH_SECRET=sua-chave-secreta-de-32-caracteres
NEXTAUTH_URL=https://sua-app.vercel.app
POSTGRES_URL=sua-connection-string
```

## 📊 Monitoramento

### Logs Esperados Após Correção:
```
✅ [PROD] Token found, allowing access. Path: / User: user@example.com
✅ SignIn callback - usuário permitido: user@example.com
🔄 Redirecionamento padrão para home
```

### Logs de Problema (se ainda existir):
```
🚫 [PROD] No token found, redirecting to login. Path: /
🔍 [PROD] Middleware check: { hasToken: false, ... }
```

## 🚀 Status das Correções

- ✅ Configuração de cookies para produção
- ✅ Middleware com cookieName específico
- ✅ Logs de debug em produção
- ✅ Tratamento de erros robusto
- ✅ Consistência entre middlewares
- ✅ Callbacks de redirecionamento NextAuth

## 🔄 Próximos Passos

1. **Deploy das correções** - Push para trigger deploy
2. **Monitorar logs** - Verificar se token é encontrado
3. **Teste funcional** - Login/Register/Guest
4. **Validar redirecionamento** - Confirma que vai para `/`

## 📧 Se Problema Persistir

1. Verificar se `AUTH_SECRET` está igual em dev/prod
2. Confirmar `NEXTAUTH_URL` aponta para domínio correto
3. Testar em janela incógnita (limpar cookies)
4. Verificar se Vercel está usando as env vars mais recentes 