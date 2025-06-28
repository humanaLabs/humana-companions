# 📊 Diagramas de Arquitetura

Este diretório contém diagramas visuais da arquitetura do projeto Humana Companions.

## 📋 Diagramas Disponíveis

### 🏗️ [Arquitetura C4](./arquitetura-c4.md)
Diagrama completo da arquitetura usando o modelo C4 (Context, Containers, Components, Code).

**Inclui:**
- **Nível 1 - Contexto**: Visão geral do sistema e integrações externas
- **Nível 2 - Containers**: Aplicação web, API routes e AI engine
- **Nível 3 - Componentes**: Detalhes do AI engine e frontend React
- **Nível 4 - Código**: Estrutura de arquivos e organização
- **Fluxo de Dados**: Sequência da integração Dify
- **Métricas**: Indicadores de qualidade arquitetural

### 🗄️ [Modelo de Dados](./modelo-dados.md)
Diagrama completo do modelo de dados da aplicação com ERD e estruturas detalhadas.

**Inclui:**
- **ERD Completo**: Entidades, relacionamentos e cardinalidades
- **Estruturas Detalhadas**: Interfaces TypeScript de cada entidade
- **Fluxos de Dados**: Sequências de operações principais
- **Organização por Contexto**: Agrupamento lógico das entidades
- **Performance**: Índices recomendados e queries comuns
- **Migrations**: Evolução do schema e tabelas depreciadas

### 🎨 [Sistema de Artifacts](./artifacts.md)
Diagramas específicos do sistema de Artifacts mostrando arquitetura e fluxos.

**Inclui:**
- **Arquitetura C4**: Componentes e relacionamentos dos artifacts
- **Fluxos de Criação**: Sequência de criação de artifacts
- **Fluxos de Edição**: Processo de edição e versionamento
- **Estados e Transições**: Máquina de estados dos artifacts
- **Modelo de Dados**: ERD específico dos artifacts
- **Ferramentas de IA**: Integração com tools do AI SDK

### 🧭 [Navegação de Telas](./navegacao-telas.md)
Mapa completo da navegação entre telas e fluxos de usuário da aplicação.

**Inclui:**
- **Mapa Geral**: Visão completa da navegação da aplicação
- **Fluxo de Autenticação**: Sequência detalhada de login/registro
- **Estados do Chat**: Máquina de estados da interface de chat
- **Navegação de Artifacts**: Fluxos específicos dos artifacts
- **Estados Responsivos**: Comportamento em desktop/mobile
- **Jornada do Usuário**: Experiência típica de uso
- **Métricas de Navegação**: Distribuição de tempo por tela

## 🎯 Como Usar

### **Para Desenvolvedores**
- Use como referência para entender a estrutura geral
- Consulte antes de fazer mudanças arquiteturais significativas
- Ajuda no onboarding de novos membros da equipe

### **Para Arquitetos**
- Base para discussões de arquitetura
- Documentação de decisões arquiteturais
- Planejamento de futuras expansões

### **Para Stakeholders**
- Visão clara da estrutura técnica
- Entendimento das integrações e dependências
- Avaliação de complexidade e riscos

## 🔄 Manutenção

Os diagramas devem ser atualizados quando:
- ✅ Novos providers de IA são adicionados
- ✅ Estrutura de componentes muda significativamente
- ✅ Novas integrações externas são implementadas
- ✅ Arquitetura de dados é modificada

## 🛠️ Ferramentas

Os diagramas usam **Mermaid**, que pode ser visualizado em:
- GitHub (renderização automática)
- VS Code (extensão Mermaid Preview)
- Mermaid Live Editor (https://mermaid.live)
- Documentação online

---

**💡 Mantenha os diagramas atualizados para máxima utilidade!** 