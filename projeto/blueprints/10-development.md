# 11. Desenvolvimento com IA/Cursor - Diretrizes e Boas Práticas

## 🎯 **Visão Geral**

Este blueprint define as **diretrizes obrigatórias** para desenvolvimento com IA (Cursor, GitHub Copilot, etc.) no projeto Humana AI Companions, garantindo qualidade, segurança e consistência do código.

---

## 🤖 **Filosofia de Desenvolvimento com IA**

### **🎯 Princípios Fundamentais**

1. **🧠 IA como Copiloto, não Piloto**
   - IA acelera, mas desenvolvedor decide
   - Review humano obrigatório em todo código
   - Entendimento completo antes de implementar

2. **🔍 Qualidade sobre Velocidade**
   - Prefira código bem estruturado a código rápido
   - Sempre documente decisões arquiteturais
   - Teste antes de committar

3. **🛡️ Segurança em Primeiro Lugar**
   - Nunca exponha secrets ou dados sensíveis
   - Valide toda entrada de dados
   - Implemente autenticação/autorização adequada

---

## 📋 **Fluxo de Desenvolvimento com IA**

### **🚀 Processo Padrão**

**Fluxo de Desenvolvimento:**
1. **Análise do Requisito**: Entendimento completo da necessidade
2. **Prompt Engineering**: Criação de prompts eficazes para IA
3. **Geração de Código IA**: Desenvolvimento assistido por IA
4. **Review Humano**: Análise crítica do código gerado
5. **Refatoração**: Melhorias até atingir qualidade desejada
6. **Testes Automatizados**: Validação através de testes
7. **Documentação**: Documentação do código e decisões
8. **Commit & Deploy**: Integração e deployment

### **⏱️ Tempos Esperados**
- **Análise**: 10-15% do tempo total
- **Geração com IA**: 40-50% do tempo
- **Review & Refatoração**: 25-35% do tempo
- **Testes & Documentação**: 15-20% do tempo

---

## 🎯 **Diretrizes por Tipo de Desenvolvimento**

### **🏗️ 1. Arquitetura & Estrutura**

#### **✅ Prompts Recomendados**
- **Estrutura Modular**: Solicitar estrutura seguindo Next.js 15 App Router
- **TypeScript Strict**: Sempre especificar modo strict do TypeScript
- **Padrões do Projeto**: Referenciar padrões estabelecidos da Humana
- **Separação de Responsabilidades**: Solicitar arquitetura bem organizada
- **Documentação**: Sempre incluir documentação inline em português

#### **📁 Estrutura de Arquivos**
- **Components**: Componentes React organizados por funcionalidade
- **Hooks**: Custom hooks para lógica reutilizável
- **Lib**: Lógica de negócio, APIs, tipos e utilitários
- **Tests**: Testes unitários e de integração
- **Documentation**: README e documentação de cada módulo

### **🎨 2. Componentes UI**

#### **✅ Prompt Template**
- **Design System**: Sempre usar cores semânticas, nunca hardcoded
- **Ícones**: ASCII/emojis para menus, Lucide para conteúdo principal
- **TypeScript**: Props bem tipadas e interfaces claras
- **Acessibilidade**: Conformidade WCAG 2.1 AA obrigatória
- **Responsividade**: Abordagem mobile-first sempre
- **Documentação**: Comentários em português, código em inglês

#### **🎨 Padrões Obrigatórios**
- **Cores Semânticas**: bg-card, text-foreground, text-muted-foreground
- **Evitar Hardcoded**: Nunca usar bg-white, dark:bg-gray-800
- **Consistência**: Seguir design system estabelecido
- **Temas**: Suporte automático a light/dark mode
- **Componentes**: Reutilizáveis e bem documentados

### **🔧 3. APIs & Backend**

#### **✅ Prompt Template**
- **Next.js API Routes**: Usar estrutura padrão do Next.js 15
- **Validação Zod**: Validação obrigatória de todas as entradas
- **Tratamento de Erros**: Padronização de respostas de erro
- **Autenticação**: Verificação de sessão em todas as APIs
- **Autorização**: Controle granular de permissões
- **Logs Estruturados**: Logging consistente para monitoramento
- **Documentação**: OpenAPI inline para todas as rotas

#### **🛡️ Segurança Obrigatória**
- **Validação de Entrada**: Zod schema para todos os inputs
- **Autenticação**: Verificação de sessão obrigatória
- **Autorização**: Controle de permissões por ação
- **Sanitização**: Limpeza de dados de entrada
- **Rate Limiting**: Limitação de requisições por usuário
- **Logs Seguros**: Nunca logar dados sensíveis

### **🧪 4. Testes**

#### **✅ Prompt Template**
- **Testes Unitários**: Jest/Vitest para funções isoladas
- **Testes de Componente**: React Testing Library para UI
- **Casos de Sucesso e Erro**: Cobertura completa de cenários
- **Mocks Adequados**: Simulação de dependências externas
- **Coverage Mínimo**: 80% de cobertura obrigatória
- **Documentação**: Testes bem documentados e legíveis

#### **📊 Tipos de Teste**
- **Testes Unitários**: Funções, hooks e utilitários isolados
- **Testes de Componente**: Renderização e interação de UI
- **Testes de Integração**: Fluxos completos de funcionalidades
- **Testes E2E**: Jornadas críticas do usuário
- **Testes de Performance**: Benchmarks de componentes pesados

---

## 🎯 **Prompts Específicos por Funcionalidade**

### **🤖 Companions**
- **Estrutura de Dados**: Seguir schema definido no projeto
- **AI SDK Integration**: Usar Vercel AI SDK como padrão
- **Multi-LLM Support**: Suporte a OpenAI, Azure, Google
- **Permissões**: Validação organizacional obrigatória
- **Analytics**: Integração com sistema de métricas
- **Escalabilidade**: Preparado para múltiplos usuários simultâneos

### **📚 Data Room**
"Implemente [funcionalidade] para data room seguindo:
- Upload de arquivos com validação
- Processamento de documentos (OCR, chunking)
- Busca semântica com embeddings
- Controle de acesso granular
- Versionamento de documentos"
```

### **🔧 MCP Servers**
```
"Desenvolva [funcionalidade] MCP seguindo:
- Protocolo MCP padrão
- Validação de ferramentas
- Níveis de interação humana (⚡❓👁️🔒🛡️)
- Sandbox de execução
- Monitoramento de saúde"
```

---

## 🛡️ **Segurança & Compliance**

### **🔒 Regras de Segurança**

#### **❌ NUNCA Faça**
```typescript
// ❌ Secrets no código
const API_KEY = "sk-1234567890abcdef";

// ❌ SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ XSS
dangerouslySetInnerHTML={{ __html: userInput }}

// ❌ Dados sensíveis em logs
console.log('User password:', password);
```

#### **✅ SEMPRE Faça**
```typescript
// ✅ Environment variables
const API_KEY = process.env.OPENAI_API_KEY;

// ✅ Prepared statements
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});

// ✅ Sanitização
const sanitizedHtml = DOMPurify.sanitize(userInput);

// ✅ Logs seguros
console.log('User action:', { userId, action: 'login' });
```

### **📋 Checklist de Segurança**
- [ ] Validação de entrada com Zod
- [ ] Autenticação verificada
- [ ] Autorização implementada
- [ ] Sanitização de saídas
- [ ] Logs sem dados sensíveis
- [ ] Rate limiting configurado
- [ ] HTTPS obrigatório

---

## 🧪 **Estratégia de Testes com IA**

### **🎯 Cobertura Obrigatória**

#### **📊 Métricas Mínimas**
- **Cobertura de código**: >80%
- **Cobertura de branches**: >75%
- **Testes E2E críticos**: 100%

#### **🧪 Tipos de Teste**
- **Unit Tests (70%)**: Testes de funções e componentes isolados
- **Integration Tests (20%)**: Testes de fluxos completos de API
- **E2E Tests (10%)**: Testes de jornadas críticas do usuário
- **Performance Tests**: Benchmarks de componentes pesados
- **Visual Regression**: Testes de regressão visual automática

### **🤖 Prompts para Testes**
- **Happy Path e Edge Cases**: Cobertura completa de cenários
- **Mocks Adequados**: Simulação de dependências externas
- **Assertions Claras**: Verificações específicas e precisas
- **Setup/Teardown**: Configuração e limpeza adequada
- **Documentação**: Comentários explicativos em português

---

## 📝 **Documentação Automatizada**

### **📋 Padrões de Documentação**

#### **🔧 Funções/APIs**
- **JSDoc Padrão**: Documentação completa de funções
- **Parâmetros**: Descrição detalhada de todos os parâmetros
- **Retornos**: Especificação clara do que é retornado
- **Exemplos**: Casos práticos de uso da função
- **Tipos**: Definição clara de tipos TypeScript

#### **🎨 Componentes**
- **Props Interface**: Documentação de todas as propriedades
- **Callbacks**: Descrição de funções de callback
- **Exemplos de Uso**: Casos práticos de implementação
- **Estados**: Documentação de estados internos
- **Acessibilidade**: Requisitos de acessibilidade

### **🤖 Prompt para Documentação**
- **JSDoc Padrão**: Usar formato padrão de documentação
- **Comentários em Português**: Explicações em linguagem natural
- **Exemplos Práticos**: Casos reais de uso
- **Parâmetros e Retornos**: Descrição completa de interfaces
- **Links Relacionados**: Referências para documentação adicional

---

## 🔄 **Workflow de Desenvolvimento**

### **🌳 Estratégia de Branches e Deploy Automático**

#### **📋 Estrutura de Branches**
- **main**: Branch de produção (deploy automático)
- **preview**: Branch de homologação (testes finais)
- **desenv**: Branch de desenvolvimento integrado
- **local_[nome]**: Branches pessoais de cada desenvolvedor
- **hotfix/***: Branches para correções urgentes de produção

#### **🚀 Deploy Automático Vercel**
- **Production**: `main` → `humana-companions.vercel.app`
- **Preview**: `preview` → `preview-humana-companions.vercel.app`
- **Development**: `desenv` → `dev-humana-companions.vercel.app`
- **Personal Branches**: `local_*` → `local-[nome]-humana-companions.vercel.app`

#### **🤖 BugBot Cursor Integration**
- **Auto Review**: Análise automática de pull requests
- **Quality Check**: Verificação de qualidade do código
- **Test Validation**: Validação de testes obrigatórios
- **Standards Enforcement**: Aplicação de padrões do projeto
- **Merge Control**: Controle automático de merges após aprovação

### **🔄 Fluxo de Desenvolvimento Paralelo**

#### **👨‍💻 Desenvolvedor Individual**
1. **Sincronizar**: Atualizar branch desenv com últimas mudanças
2. **Branch Pessoal**: Criar/atualizar branch pessoal do desenvolvedor
3. **Feature Development**: Desenvolver funcionalidade com assistência de IA
4. **Merge Local**: Integrar feature na branch pessoal
5. **Deploy Automático**: Push ativa deploy automático para teste individual

#### **🔀 Integração com Branch Desenv**
6. **Pull Request**: Criar PR da branch pessoal para desenv
7. **BugBot Review**: Avaliação automática de qualidade, testes e padrões
8. **Merge Automático**: Após aprovação, integração automática com deploy

#### **🚀 Promoção para Preview/Produção**
- **Preview**: Merge de desenv para preview com deploy em homologação
- **Produção**: Após testes em preview, merge para main com deploy em produção
- **Rollback**: Capacidade de reverter rapidamente em caso de problemas

### **👥 Modelo de Comunidade de Desenvolvimento**

#### **🎯 Benefícios da Estratégia**
- **Desenvolvimento Paralelo**: Múltiplos devs trabalhando simultaneamente
- **Isolamento**: Cada dev tem seu ambiente próprio
- **Integração Contínua**: Merges frequentes no branch `desenv`
- **Deploy Automático**: Cada branch tem seu ambiente de teste
- **Qualidade Assegurada**: BugBot Cursor valida automaticamente

#### **🤖 BugBot Cursor - Responsabilidades**
- **Análise Automática**: Review completo de código em pull requests
- **Execução de Testes**: Validação automática de todos os testes
- **Verificação de Padrões**: Aplicação dos padrões de código do projeto
- **Controle de Qualidade**: Verificação de métricas de qualidade
- **Integração GitHub**: Workflow automático no GitHub Actions

#### **📋 Checklist BugBot**
- [ ] **Código Quality**: ESLint, Prettier, TypeScript
- [ ] **Testes**: Coverage >80%, testes passando
- [ ] **Padrões**: UI patterns, security guidelines
- [ ] **Performance**: Bundle size, Core Web Vitals
- [ ] **Documentação**: JSDoc, README updates
- [ ] **Conflitos**: Merge conflicts resolution

### **📋 Daily Workflow Atualizado**

```bash
# 1. Sincronizar com desenvolvimento
git checkout desenv && git pull origin desenv

# 2. Atualizar branch pessoal
git checkout local_[seu_nome]
git merge desenv

# 3. Criar feature branch
git checkout -b feature/nome-da-feature

# 4. Usar IA para desenvolvimento
# - Cursor: Ctrl+K para prompts
# - GitHub Copilot: Tab para aceitar sugestões
# - BugBot: Análise contínua de qualidade

# 5. Executar testes localmente
npm run test
npm run test:e2e
npm run lint

# 6. Commit e merge na branch pessoal
git add .
git commit -m "feat: implementa nova funcionalidade"
git checkout local_[seu_nome]
git merge feature/nome-da-feature

# 7. Push para deploy automático
git push origin local_[seu_nome]
# → Testa em: local-[nome]-humana-companions.vercel.app

# 8. Criar PR para integração
gh pr create --base desenv --head local_[seu_nome] \
  --title "feat: Nova funcionalidade" \
  --body "- Implementa X\n- Testa Y\n- Resolve #123"

# 9. BugBot avalia e aprova/rejeita automaticamente
# 10. Após aprovação, merge automático em desenv
# → Deploy automático em: dev-humana-companions.vercel.app
```

### **⚙️ Configuração Vercel Multi-Branch**

#### **📋 Configuração Vercel**
- **Deploy Automático**: Habilitado para todos os branches principais
- **Auto Alias**: URLs automáticas para cada branch
- **Environment Variables**: Configuração específica por ambiente
- **Build Optimization**: Otimizações de build por branch
- **Function Timeout**: Configuração de timeout para APIs

#### **🌍 Environment Variables por Branch**
- **Production**: Variáveis de produção com databases e APIs reais
- **Preview**: Ambiente de homologação com dados de teste
- **Development**: Ambiente de desenvolvimento compartilhado
- **Personal Branches**: Configurações locais para cada desenvolvedor

#### **🔧 Branch Protection Rules**
- **Main Branch**: Requer 2 aprovações + BugBot + deploy preview
- **Preview Branch**: Requer 1 aprovação + BugBot + deploy preview  
- **Desenv Branch**: Requer apenas BugBot review
- **Status Checks**: Verificações automáticas obrigatórias
- **Admin Enforcement**: Regras aplicadas mesmo para administradores

### **📊 Monitoramento e Analytics**

#### **📈 Branch Performance Tracking**
- **Deploy Tracking**: Monitoramento de status de deployments por branch
- **Developer Analytics**: Métricas individuais por desenvolvedor
- **Environment Mapping**: Mapeamento automático de branch para ambiente
- **Timestamp Logging**: Registro temporal de todas as atividades
- **Success/Failure Rates**: Taxas de sucesso e falha por branch

#### **🚨 Alertas e Notificações**
- **Slack Integration**: Notificações automáticas por canal de desenvolvedor
- **Discord Alerts**: Alertas para deployments de produção
- **Status Tracking**: Acompanhamento de building, success e failed
- **URL Sharing**: Compartilhamento automático de URLs de deploy
- **Developer Channels**: Canais específicos para cada desenvolvedor

### **🔄 Automated Testing Pipeline**

#### **🧪 Multi-Environment Testing**
- **Test Matrix**: Testes em múltiplos ambientes e versões Node.js
- **Automated Triggers**: Execução automática em push e pull requests
- **Environment Isolation**: Testes isolados por ambiente
- **Coverage Tracking**: Acompanhamento de cobertura por ambiente
- **Node Version Support**: Suporte a múltiplas versões do Node.js

### **📋 Developer Onboarding Checklist**

#### **🎯 Setup para Novo Desenvolvedor**
1. **Clone do Repositório**: Baixar código fonte do projeto
2. **Branch Pessoal**: Configurar branch individual de desenvolvimento
3. **Dependências**: Instalar todas as dependências do projeto
4. **Environment Local**: Configurar variáveis de ambiente locais
5. **Vercel CLI**: Configurar ferramenta de deploy
6. **Cursor/BugBot**: Instalar e configurar extensões de IA
7. **Deploy de Teste**: Verificar funcionamento do pipeline
8. **Notificações**: Configurar canais de comunicação

#### **📚 Recursos de Aprendizado**
- **Documentação**: `/docs` folder
- **Blueprints**: `/blueprints` folder  
- **Exemplos**: `/examples` folder
- **Storybook**: `npm run storybook`
- **API Docs**: `npm run docs:api`

#### **🤝 Colaboração**
- **Daily Standups**: 9h30 via Discord
- **Code Reviews**: Via GitHub PRs + BugBot
- **Pair Programming**: Discord screen share
- **Knowledge Sharing**: Weekly tech talks

---

## 🎯 **Métricas de Desenvolvimento**

### **📊 KPIs por Desenvolvedor**
- **Commits por semana**: Target 15-25
- **PRs criados**: Target 3-5 por semana  
- **Code review participation**: Target 80%
- **Bug introduction rate**: Target <2%
- **Test coverage contribution**: Target >80%

### **🏆 Gamificação**
- **🥇 Weekly MVP**: Desenvolvedor com melhor contribuição
- **🐛 Bug Hunter**: Maior número de bugs encontrados/corrigidos
- **📚 Knowledge Sharer**: Melhor documentação/mentoria
- **🚀 Deploy Master**: Deploys mais estáveis

### **📈 Team Metrics**
- **Deployment frequency**: Target daily
- **Lead time**: Target <2 days
- **MTTR (Mean Time to Recovery)**: Target <1 hour
- **Change failure rate**: Target <5%

6. **Commit**: Criar commit com mensagem clara e descritiva
7. **Push e PR**: Enviar código e criar pull request para review

### **🎯 Code Review com IA**

#### **✅ Checklist de Review**
- Código segue padrões do projeto estabelecidos
- Não há secrets ou dados sensíveis expostos
- Testes adequados incluídos com boa cobertura
- Documentação atualizada e clara
- Performance adequada para o contexto
- Acessibilidade implementada conforme WCAG

#### **🤖 Prompts para Review**
- **Segurança**: Focar em vulnerabilidades e exposição de dados
- **Performance**: Identificar gargalos e otimizações possíveis
- **Padrões**: Verificar aderência aos padrões do projeto
- **Testes**: Avaliar qualidade e cobertura dos testes
- **Documentação**: Verificar clareza e completude

---

## 📊 **Métricas e Monitoramento**

### **📈 KPIs de Desenvolvimento**

#### **⏱️ Velocidade**
- **Lead time**: <3 dias da ideia ao deploy
- **Cycle time**: <1 dia do código ao merge
- **Deployment frequency**: >5x por semana

#### **🔍 Qualidade**
- **Bug rate**: <2% em produção
- **Test coverage**: >80%
- **Code review time**: <4 horas

#### **🤖 Eficiência da IA**
- **Code generation accuracy**: >85%
- **Time saved with AI**: >40%
- **AI suggestion acceptance**: >60%

### **📊 Ferramentas de Monitoramento**
- **Logging Estruturado**: Sistema de logs padronizado para debugging
- **Métricas de Performance**: Acompanhamento de tempos de resposta
- **Error Tracking**: Monitoramento e alertas de erros em produção
- **Analytics**: Métricas de uso e comportamento dos usuários
- **Health Checks**: Verificações automáticas de saúde do sistema

---

## 📂 **Gestão de Contexto no Cursor**

### **🎯 Estratégia de Contexto**

O Cursor funciona melhor quando tem **contexto adequado** sobre o projeto. Esta seção define como organizar e usar o contexto de forma eficiente.

#### **📋 Hierarquia de Contexto**
1. **Regras do Projeto**: Arquivo .cursorrules com padrões obrigatórios
2. **Documentação Estratégica**: Blueprints com visão de negócio
3. **Padrões de Código**: Documentação técnica e arquitetural
4. **Implementação Atual**: Código relevante para a tarefa
5. **Testes & Exemplos**: Casos de uso e implementações de referência

### **📁 Arquivos de Contexto Obrigatórios**

#### **🏛️ 1. Regras Fundamentais**
- **.cursorrules**: Regras principais do projeto
- **blueprints/README.md**: Visão geral dos blueprints
- **PADRAO_LAYOUT_UI.md**: Padrões obrigatórios de UI
- **package.json**: Dependências e scripts do projeto

#### **🎨 2. Para Desenvolvimento UI**
- **components/ui/**: Componentes base do design system
- **ESTRUTURA_COMPONENTES.md**: Padrões de componentes
- **REFERENCIA_RAPIDA_UI.md**: Guia rápido de UI
- **tailwind.config.ts**: Configuração de estilos

#### **🤖 3. Para Companions/IA**
- **lib/ai/**: Configurações e integrações de IA
- **lib/db/schema.ts**: Schema do banco de dados
- **companions-estrutura.md**: Estrutura de companions
- **FUNDAMENTOS_AI_SDK.md**: Fundamentos do AI SDK

#### **🔧 4. Para APIs/Backend**
Adicionar ao contexto:
├── app/api/                      # Rotas existentes
├── lib/auth/                     # Sistema de autenticação
├── docs/arquitetura_geral/BOAS_PRATICAS_CODIGO.md
└── docs/arquitetura_geral/CHECKLIST_INTEGRACAO.md
```

#### **📚 5. Para Data Room**
```
Adicionar ao contexto:
├── blueprints/08-data-room.md
├── app/(chat)/data-room/         # Implementação atual
└── lib/db/queries.ts             # Queries do banco
```

#### **🔗 6. Para MCP Servers**
```
Adicionar ao contexto:
├── blueprints/09-mcp-servers.md
├── app/(chat)/mcp-servers/       # Implementação atual
└── lib/mcp/                      # Biblioteca MCP
```

### **🎯 Prompts de Contexto Inteligente**

#### **📋 Template para Contexto Inicial**
```
"Preciso desenvolver [funcionalidade] para o projeto Humana AI Companions.

CONTEXTO DO PROJETO:
- Plataforma B2B SaaS de companions de IA
- Next.js 15 + TypeScript + Tailwind CSS v4
- Suporte multi-LLM (OpenAI, Azure, Google)
- Design system com cores semânticas
- Ícones: ASCII/emojis para menus, Lucide para conteúdo

ARQUIVOS DE REFERÊNCIA:
- .cursorrules (regras do projeto)
- blueprints/[blueprint-relevante].md
- docs/arquitetura_geral/[documento-relevante].md

IMPLEMENTAR:
[descrição detalhada da funcionalidade]

SEGUIR:
- Padrões estabelecidos no projeto
- Validação de segurança
- Testes adequados
- Documentação inline"
```

#### **🔄 Template para Refatoração**
```
"Preciso refatorar [componente/função] no projeto Humana AI Companions.

CONTEXTO ATUAL:
[código existente]

REFERÊNCIAS:
- .cursorrules (padrões do projeto)
- [arquivo de implementação similar]
- [documentação relevante]

OBJETIVOS:
- Melhorar performance
- Seguir padrões atualizados
- Manter funcionalidade
- Adicionar testes se necessário

MANTER COMPATIBILIDADE COM:
[dependências e integrações existentes]"
```

### **📚 Documentação Externa como Contexto**

#### **🔗 Links de Referência Úteis**
- **Next.js 15 Docs**: Documentação oficial do framework
- **Tailwind CSS v4**: Guia de estilos e componentes
- **AI SDK (Vercel)**: Integração com modelos de IA
- **Drizzle ORM**: Documentação do ORM utilizado
- **Radix UI**: Primitivos de componentes acessíveis
- **React Hook Form**: Gerenciamento de formulários

#### **📖 Como Usar Docs Externas**
- **Adaptação Obrigatória**: Seguir padrões do projeto Humana
- **Cores Semânticas**: Usar design system, não cores hardcoded
- **Validação Zod**: Implementar validação em todas as entradas
- **Tratamento de Erros**: Adicionar handling adequado
- **Estrutura de Arquivos**: Seguir organização do projeto
- **Referência Interna**: Usar arquivo similar como base

### **🎮 Comandos Cursor Específicos**

#### **⌨️ Atalhos Essenciais**
- **Ctrl+K**: Prompt inline para geração/edição de código
- **Ctrl+L**: Chat lateral para discussão e planejamento
- **Ctrl+I**: Comando rápido para ações específicas
- **Ctrl+Shift+L**: Aplicar mudanças sugeridas automaticamente
- **Ctrl+.**: Quick fix/refactor para melhorias rápidas

#### **🎯 Comandos por Tipo de Tarefa**

##### **🏗️ Para Arquitetura**
- **Comando**: Criar estrutura modular seguindo padrões
- **Contexto**: .cursorrules + blueprint + exemplo similar
- **Foco**: Organização e separação de responsabilidades

##### **🎨 Para UI**
- **Comando**: Criar componente seguindo design system
- **Contexto**: components/ui/ + padrões UI + componente similar
- **Foco**: Consistência visual e acessibilidade

##### **🔧 Para API**
- **Comando**: Criar endpoint com validação e segurança
- **Contexto**: app/api/ + boas práticas + schema.ts
- **Foco**: Segurança e performance

##### **🧪 Para Testes**
- **Comando**: Gerar testes abrangentes
- **Contexto**: tests/ + código a testar + exemplo similar
- **Foco**: Cobertura e qualidade

### **📂 Organização de Contexto por Sessão**

#### **🚀 Setup de Sessão de Desenvolvimento**

##### **1. Início de Sessão**
1. **Regras do Projeto**: .cursorrules sempre aberto
2. **Visão Geral**: blueprints/README.md para contexto
3. **Guia de Desenvolvimento**: DEVELOPMENT_GUIDE.md
4. **Arquivos Alvo**: Código que será modificado
5. **Testes Relacionados**: Tests existentes para referência

##### **2. Durante o Desenvolvimento**
- **Blueprint Específico**: Documentação da funcionalidade
- **Documentação Técnica**: Guias arquiteturais relevantes
- **Exemplos Similares**: Implementações de referência
- **Schema/Tipos**: Definições de dados relacionadas

##### **3. Antes de Finalizar**
- **Checklist de Qualidade**: Verificação de padrões
- **Padrões de Teste**: Validação de cobertura
- **Documentação de API**: Se aplicável à mudança
- **Guia de Deploy**: Se necessário para a feature

### **🎯 Contexto por Tipo de Funcionalidade**

#### **🤖 Desenvolvimento de Companions**
**Contexto Obrigatório:**
- .cursorrules (regras do projeto)
- companions-estrutura.md (blueprint específico)
- lib/ai/companion-prompt.ts (configurações)
- lib/db/schema.ts (tabelas companions)
- components/companion-*.tsx (exemplos existentes)
- app/api/companions/ (APIs implementadas)

**Contexto Adicional:**
- FUNDAMENTOS_AI_SDK.md (documentação técnica)
- lib/ai/azure-config.ts (configuração de providers)
- tests/unit/companion.test.ts (testes de referência)

#### **📚 Desenvolvimento Data Room**
**Contexto Obrigatório:**
- .cursorrules (regras do projeto)
- data-room.md (blueprint específico)
- app/(chat)/data-room/ (implementação atual)
- lib/db/schema.ts (tabelas documents)
- components/document-*.tsx (componentes existentes)

**Contexto Adicional:**
- ESTRATEGIA_DADOS_SQL_JSON.md (estratégia de dados)
- lib/ai/tools/create-document.ts (ferramentas)
- app/api/document/route.ts (API de documentos)

#### **🔧 Desenvolvimento MCP**
**Contexto Obrigatório:**
- .cursorrules (regras do projeto)
- mcp-servers.md (blueprint específico)
- app/(chat)/mcp-servers/ (implementação atual)
- lib/mcp/ (se existir)
- app/api/mcp-servers/ (APIs MCP)

**Contexto Adicional:**
- experiencia-chat.md (integração com chat)
- lib/ai/tools/ (ferramentas existentes)
- components/mcp-*.tsx (componentes MCP)

### **⚠️ Armadilhas Comuns e Como Evitar**

#### **❌ Contexto Insuficiente**
- **Problema**: IA gera código que não segue padrões do projeto
- **Solução**: Sempre incluir .cursorrules + blueprint relevante

#### **❌ Contexto Excessivo**
- **Problema**: IA fica confusa com informações demais
- **Solução**: Foque em 5-10 arquivos mais relevantes

#### **❌ Contexto Desatualizado**
- **Problema**: IA usa padrões antigos ou obsoletos
- **Solução**: Sempre incluir versão mais recente dos docs

#### **❌ Falta de Exemplos**
- **Problema**: IA não entende padrões específicos do projeto
- **Solução**: Inclua implementação similar como referência

### **📊 Métricas de Eficiência do Contexto**

#### **🎯 KPIs de Contexto**
- **Precisão das sugestões**: >90%
- **Aderência aos padrões**: >95%
- **Redução de refatoração**: >60%
- **Tempo de setup de contexto**: <2 minutos

#### **📈 Como Medir**
**Após cada sessão de desenvolvimento, avalie:**
- **Sugestões Aceitas**: Proporção de sugestões úteis da IA
- **Refatorações Necessárias**: Quantas mudanças foram precisas
- **Aderência aos Padrões**: Nível de conformidade com regras
- **Tempo de Setup**: Eficiência na preparação do contexto
---

## 🚀 **Ferramentas e Configurações**

### **🔧 Cursor Configuration**

#### **⚙️ .cursorrules Otimizado**

##### **📋 Versão Completa Recomendada**
**Estrutura do arquivo .cursorrules para máxima eficiência:**

**Contexto do Projeto:**
- Plataforma B2B SaaS para companions de IA empresariais
- Stack: Next.js 15 + TypeScript + Tailwind CSS v4 + Drizzle ORM
- Providers: Multi-LLM (OpenAI, Azure, Google, Anthropic)
- Arquitetura: Agnóstica, multi-tenant, enterprise-ready

**Padrões Arquiteturais Obrigatórios:**
- Estrutura modular por funcionalidade
- Tecnologias core bem definidas
- Design system com cores semânticas
- Segurança em primeiro lugar
- Testes obrigatórios com cobertura mínima
  });

  it('should handle error case', () => {
    // Error handling test
  });
});
```

## 📝 Documentação

### JSDoc Obrigatório
```tsx
/**
 * Cria um novo companion com configurações específicas
**Documentação e Performance:**
- JSDoc obrigatório em funções
- Comentários em português para explicações
- Otimização de bundle com dynamic imports
- Lazy loading para componentes pesados
- Prepared statements para queries do banco

**Checklist Pré-Commit:**
- Testes passando com cobertura mínima de 80%
- Lint e TypeScript sem erros
- Cores semânticas utilizadas corretamente
- Ícones seguindo padrão estabelecido
- Validação Zod implementada
- Logs sem dados sensíveis
- Documentação atualizada

**Referências Essenciais:**
- blueprints/README.md para visão geral
- PADRAO_LAYOUT_UI.md para padrões de interface
- BOAS_PRATICAS_CODIGO.md para qualidade
- lib/db/schema.ts para estruturas de dados

**Dicas de Desenvolvimento:**
1. Sempre incluir .cursorrules no contexto
2. Consultar blueprint específico da funcionalidade
3. Usar exemplos de código similar já implementado
4. Testar localmente antes de commitar
5. Documentar decisões arquiteturais importantes

**Lembre-se: Qualidade > Velocidade. IA acelera, mas você decide!**

##### **⚙️ Versão Mínima**
**Para projetos menores, versão simplificada do .cursorrules:**
- Stack: Next.js 15 + TypeScript + Tailwind CSS v4 + Drizzle ORM
- Design System: Cores semânticas, ícones ASCII/Lucide, layout padrão
- Segurança: Validação Zod, auth/permissions, environment variables
- Qualidade: Testes >80%, JSDoc, comentários em português

#### **🎯 Snippets Úteis**
**Configuração de snippets para componentes padrão do projeto**

### **🧪 Testing Configuration**
**Configuração Jest para testes automatizados:**
- Ambiente jsdom para testes de componentes React
- Setup files para configuração inicial
- Mapeamento de módulos para aliases
- Cobertura mínima configurada (75-80%)
- Exclusão de arquivos desnecessários

---

## 🎯 **Casos de Uso Específicos**
- [ ] Performance adequada
- [ ] Acessibilidade implementada

### **✅ Antes de Deploy**
- [ ] Code review aprovado
- [ ] Testes E2E passando
- [ ] Build sem erros
- [ ] Migrações de banco testadas
- [ ] Rollback plan definido
- [ ] Monitoramento configurado

---

**🎯 Lembre-se: IA acelera, mas a qualidade é responsabilidade humana!**

---

## 📄 **Arquivo .cursorrules Completo**

### **🎯 Copie e cole este conteúdo no seu .cursorrules**

```markdown
# Humana AI Companions - Cursor Rules

Você é um especialista em desenvolvimento para o projeto Humana AI Companions, uma plataforma B2B SaaS de companions de IA.

## 🎯 Contexto do Projeto
- **Plataforma**: B2B SaaS para companions de IA empresariais
- **Stack**: Next.js 15 + TypeScript + Tailwind CSS v4 + Drizzle ORM
- **Providers**: Multi-LLM (OpenAI, Azure, Google, Anthropic)
- **Arquitetura**: Agnóstica, multi-tenant, enterprise-ready

## 🏗️ Padrões Arquiteturais OBRIGATÓRIOS

### Estrutura de Arquivos
```
feature/
├── components/           # Componentes React
├── hooks/               # Custom hooks
├── lib/                 # Lógica de negócio
├── tests/               # Testes
└── README.md           # Documentação
```

### Tecnologias Core
- **Frontend**: Next.js 15 App Router, React 18, TypeScript strict
- **Styling**: Tailwind CSS v4 com cores semânticas
- **Database**: Drizzle ORM + PostgreSQL (default)
- **AI**: Vercel AI SDK com suporte multi-provider
- **Auth**: NextAuth.js com RBAC granular

## 🎨 Design System OBRIGATÓRIO

### Cores (NUNCA hardcode)
```tsx
// ✅ SEMPRE use cores semânticas
<div className="bg-card text-foreground border">
  <h2 className="text-foreground">Título</h2>
  <p className="text-muted-foreground">Descrição</p>
</div>

// ❌ NUNCA use cores diretas
<div className="bg-white dark:bg-gray-800">
```

### Ícones (Padrão RIGOROSO)
- **Menus/Sidebar**: ASCII/emojis (📄 📋 🔗 💾 💬 ⚡ 🧪)
- **Telas/Cards**: Lucide React (profissionais e sobrios)
- **Tamanhos**: 16px (pequenos), 24px (médios), 32px (grandes)
- **NUNCA**: Fundos nos ícones (`bg-muted rounded-lg`)

### Layout Padrão
```tsx
<div className="flex flex-col h-screen">
  <PageHeader title="Título" description="Desc" showBackButton={true} />
**Principais elementos do .cursorrules:**
- Layout padrão com PageHeader e estrutura responsiva
- Segurança obrigatória com validação Zod e verificação de permissões
- Estruturas específicas para Companions, Data Room e MCP Servers
- Testes obrigatórios com cobertura mínima de 80%
- Documentação JSDoc e comentários em português
- Otimização de performance com dynamic imports e prepared statements
- Checklist pré-commit para garantir qualidade
- Referências essenciais sempre consultadas
- Dicas práticas de desenvolvimento com IA

**Lembre-se: Qualidade > Velocidade. IA acelera, mas você decide!**

---

**Status:** 🟢 Documento Vivo  
**Última Atualização:** Janeiro 2025  
**Próxima Revisão:** Fevereiro 2025  
**Owner:** Engineering Team 