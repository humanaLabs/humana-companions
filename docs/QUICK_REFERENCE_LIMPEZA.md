# 🧹 Referência Rápida - Limpeza de Usuários

> **Guia prático** para manutenção do sistema de usuários convidados.

## 🚀 Comandos Essenciais

### **📊 Análise do Sistema**
```bash
# Ver usuários importantes (não-convidados)
node scripts/list-important-users.js

# Analisar idade dos usuários convidados
node scripts/analyze-guest-ages.js
```

### **🧹 Limpeza Recomendada**
```bash
# 1. Simulação (sempre fazer primeiro!)
node scripts/cleanup-inactive-guests.js --dry-run

# 2. Execução real (após validar simulação)
node scripts/cleanup-inactive-guests.js --force
```

### **👑 Administração**
```bash
# CRIAR novo master admin (RECOMENDADO)
node scripts/create-new-admin.js seu-email@exemplo.com suasenha
node scripts/create-new-admin.js admin@projeto.com  # senha padrão: admin123

# PROMOVER usuário existente apenas
node scripts/make-custom-admin.js seu-email@exemplo.com

# Usar master admin padrão
node scripts/make-master-admin.js
```

## ⚡ Rotina de Manutenção

### **Diário (2 min)**
```bash
node scripts/analyze-guest-ages.js
```

### **Semanal (5 min)**
```bash
# Análise completa
node scripts/analyze-guest-ages.js

# Limpeza se necessário
node scripts/cleanup-inactive-guests.js --dry-run
node scripts/cleanup-inactive-guests.js --force  # se aprovado
```

## 🎯 Situação Atual

- **✅ Sistema limpo**: 6.754 usuários inativos removidos
- **✅ Performance otimizada**: Redução de 98% nos guests
- **✅ Automação disponível**: Scripts TypeScript prontos
- **✅ Novo script de admin**: `create-new-admin.js` disponível e testado

## 💡 Dicas Importantes

### **Para Criar Admins:**
- **Use `create-new-admin.js`** - Cria usuários do zero
- **Use `make-custom-admin.js`** - Apenas para promover existentes
- **Dependência**: `pnpm add bcrypt` (já instalada)

### **Exemplos Rápidos:**
```bash
# Criar novo admin com senha personalizada
node scripts/create-new-admin.js admin@projeto.com minhaSenha123

# Criar com senha padrão (admin123)
node scripts/create-new-admin.js admin@projeto.com

# Promover usuário existente
node scripts/make-custom-admin.js usuario@existente.com
```

## 📚 Documentação Completa

Ver **[`SISTEMA_LIMPEZA_USUARIOS.md`](./arquitetura_geral/SISTEMA_LIMPEZA_USUARIOS.md)** para guia detalhado.

---
*Última atualização: Janeiro 2025* 