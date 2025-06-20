# 📚 Documentação Completa: Integração com Dify

Este diretório contém toda a documentação relacionada à integração com agentes do Dify na aplicação Humana Companions.

## 📋 Índice da Documentação

### 🚀 **Começando**
1. **[DIFY_SETUP.md](./DIFY_SETUP.md)** - Configuração inicial da integração
   - Variáveis de ambiente
   - Como obter credenciais
   - Configuração básica

### 🎯 **Guias de Uso**
2. **[COMO_USAR_AGENTES_DIFY.md](./COMO_USAR_AGENTES_DIFY.md)** - Como usar no dia a dia
   - Onde selecionar agentes
   - Fluxo de uso
   - Exemplos práticos

3. **[GUIA_COMPLETO_DIFY_IDS.md](./GUIA_COMPLETO_DIFY_IDS.md)** - Como configurar IDs dos agentes
   - Onde informar IDs reais
   - Scripts para obter IDs
   - Configuração via ambiente

### 🔧 **Implementação Técnica**
4. **[README_DIFY_INTEGRATION.md](./README_DIFY_INTEGRATION.md)** - Documentação técnica completa
   - Arquitetura da integração
   - Estrutura de arquivos
   - Funcionalidades implementadas

### 🛠️ **Resolução de Problemas**
5. **[TROUBLESHOOTING_DIFY.md](./TROUBLESHOOTING_DIFY.md)** - Guia de troubleshooting
   - Diagnóstico de problemas
   - Scripts de debug
   - Soluções para erros comuns

## 🗂️ Estrutura da Integração

### **Arquivos Principais:**
```
lib/ai/
├── dify-agents.ts          # Definições dos agentes
└── providers.ts            # Configuração de providers

components/
├── dify-agent-selector.tsx # Seletor de agentes
├── dify-agent-demo.tsx     # Componente de demonstração
└── chat-header.tsx         # Integração no header

hooks/
└── use-dify-agent.ts       # Hook de gerenciamento

app/(chat)/api/
├── chat/route.ts           # Integração na API de chat
└── dify/route.ts           # API específica do Dify

scripts/
├── list-dify-agents.js     # Script para listar agentes
└── test-dify-agent.js      # Script para testar agentes
```

### **Scripts Disponíveis:**
```bash
pnpm run dify:list          # Listar agentes disponíveis
pnpm run dify:test ID MSG   # Testar agente específico
```

## 📖 Ordem de Leitura Recomendada

### **Para Iniciantes:**
1. **DIFY_SETUP.md** - Configure primeiro
2. **COMO_USAR_AGENTES_DIFY.md** - Aprenda a usar
3. **GUIA_COMPLETO_DIFY_IDS.md** - Configure IDs reais

### **Para Desenvolvedores:**
1. **README_DIFY_INTEGRATION.md** - Visão técnica geral
2. **DIFY_SETUP.md** - Configuração
3. **TROUBLESHOOTING_DIFY.md** - Debug e resolução

### **Para Resolução de Problemas:**
1. **TROUBLESHOOTING_DIFY.md** - Diagnóstico
2. **GUIA_COMPLETO_DIFY_IDS.md** - Verificar configuração
3. **DIFY_SETUP.md** - Reconfigurar se necessário

## 🎯 Links Rápidos

### **Configuração Rápida:**
```bash
# 1. Listar agentes
pnpm run dify:list

# 2. Testar agente
pnpm run dify:test app-SEU-ID "teste"

# 3. Configurar .env.local
NEXT_PUBLIC_DIFY_AGENT_DEFAULT=app-SEU-ID
```

### **Resolução Rápida:**
- ❌ **Erro de conexão** → [TROUBLESHOOTING_DIFY.md](./TROUBLESHOOTING_DIFY.md#verificar-configuração-básica)
- ❌ **IDs incorretos** → [GUIA_COMPLETO_DIFY_IDS.md](./GUIA_COMPLETO_DIFY_IDS.md#como-obter-os-ids-reais)
- ❌ **Agente não responde** → [TROUBLESHOOTING_DIFY.md](./TROUBLESHOOTING_DIFY.md#testar-agente-específico)

## 🔄 Atualizações e Manutenção

### **Histórico de Versões:**
- **v1.0** - Integração básica com agentes Dify
- **v1.1** - Melhor tratamento de erros e streaming
- **v1.2** - Scripts de debug e documentação completa

### **Próximas Funcionalidades:**
- [ ] Cache de agentes para melhor performance
- [ ] Interface de configuração visual
- [ ] Suporte a múltiplos workspaces
- [ ] Métricas de uso dos agentes

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte primeiro o [TROUBLESHOOTING_DIFY.md](./TROUBLESHOOTING_DIFY.md)
2. Execute os scripts de diagnóstico
3. Verifique os logs do servidor e navegador

**🎉 Documentação completa e organizada para integração com Dify!** 