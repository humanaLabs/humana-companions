# 🏗️ Arquitetura C4 - Humana Companions

## 📋 Visão Geral

Este documento apresenta a arquitetura da aplicação Humana Companions usando o modelo C4 (Context, Containers, Components, Code), mostrando desde a visão de alto nível até os detalhes de implementação.

## 🌍 Nível 1: Contexto do Sistema

```mermaid
C4Context
    title Contexto do Sistema - Humana Companions
    
    Person(usuario, "Usuário", "Pessoa que interage com o chatbot")
    
    System(humana, "Humana Companions", "Plataforma de chatbot com IA<br/>Next.js + AI SDK")
    
    System_Ext(dify, "Dify API", "Plataforma de agentes de IA")
    System_Ext(openai, "OpenAI API", "Modelos de linguagem GPT")
    System_Ext(xai, "xAI API", "Modelos Grok")
    System_Ext(auth, "Auth Provider", "Autenticação de usuários")
    System_Ext(db, "Neon PostgreSQL", "Banco de dados serverless")
    System_Ext(storage, "Vercel Blob", "Armazenamento de arquivos")
    
    Rel(usuario, humana, "Interage com", "HTTPS")
    Rel(humana, dify, "Executa agentes", "REST API")
    Rel(humana, openai, "Gera respostas", "REST API")
    Rel(humana, xai, "Gera respostas", "REST API")
    Rel(humana, auth, "Autentica", "OAuth")
    Rel(humana, db, "Persiste dados", "SQL")
    Rel(humana, storage, "Armazena arquivos", "REST API")
    
    UpdateRelStyle(usuario, humana, $textColor="blue", $lineColor="blue")
    UpdateRelStyle(humana, dify, $textColor="green", $lineColor="green")
```

## 🏢 Nível 2: Containers

```mermaid
C4Container
    title Containers - Humana Companions
    
    Person(usuario, "Usuário")
    
    Container_Boundary(humana_boundary, "Humana Companions") {
        Container(webapp, "Web Application", "Next.js 14", "Interface do usuário<br/>React + Tailwind CSS")
        Container(api, "API Routes", "Next.js API", "Endpoints REST<br/>Server Actions")
        Container(ai_engine, "AI Engine", "AI SDK", "Processamento de IA<br/>Streaming + Tools")
    }
    
    ContainerDb(db, "Database", "PostgreSQL", "Dados de usuários<br/>Histórico de chat")
    ContainerDb(storage, "File Storage", "Vercel Blob", "Arquivos e anexos")
    
    System_Ext(dify, "Dify API")
    System_Ext(openai, "OpenAI API")
    System_Ext(xai, "xAI API")
    System_Ext(auth, "Auth Provider")
    
    Rel(usuario, webapp, "Usa", "HTTPS")
    Rel(webapp, api, "Chama", "HTTP")
    Rel(api, ai_engine, "Processa", "Function calls")
    
    Rel(api, db, "Lê/Escreve", "SQL")
    Rel(api, storage, "Upload/Download", "REST")
    
    Rel(ai_engine, dify, "Executa agentes", "REST API")
    Rel(ai_engine, openai, "Gera texto", "REST API")
    Rel(ai_engine, xai, "Gera texto", "REST API")
    
    Rel(webapp, auth, "Autentica", "OAuth")
    
    UpdateRelStyle(usuario, webapp, $textColor="blue", $lineColor="blue")
    UpdateRelStyle(ai_engine, dify, $textColor="green", $lineColor="green")
```

## 🧩 Nível 3: Componentes - AI Engine

```mermaid
C4Component
    title Componentes - AI Engine
    
    Container_Boundary(ai_boundary, "AI Engine") {
        Component(providers, "AI Providers", "TypeScript", "Configuração de provedores<br/>xAI, OpenAI, Dify")
        Component(models, "Model Manager", "TypeScript", "Gerenciamento de modelos<br/>Seleção e configuração")
        Component(tools, "AI Tools", "TypeScript", "Ferramentas de IA<br/>Documentos, Weather, etc.")
        Component(streaming, "Stream Handler", "TypeScript", "Processamento de streaming<br/>Respostas em tempo real")
        Component(dify_client, "Dify Client", "TypeScript", "Cliente para API Dify<br/>Execução de agentes")
    }
    
    Container_Boundary(api_boundary, "API Routes") {
        Component(chat_api, "Chat API", "Next.js Route", "Endpoint principal de chat<br/>/api/chat")
        Component(dify_api, "Dify API", "Next.js Route", "Endpoint Dify<br/>/api/dify")
        Component(history_api, "History API", "Next.js Route", "Histórico de conversas<br/>/api/history")
    }
    
    System_Ext(dify_external, "Dify API")
    System_Ext(openai_external, "OpenAI API")
    System_Ext(xai_external, "xAI API")
    
    Rel(chat_api, providers, "Usa")
    Rel(chat_api, models, "Seleciona modelo")
    Rel(chat_api, streaming, "Processa stream")
    Rel(chat_api, tools, "Executa ferramentas")
    
    Rel(dify_api, dify_client, "Executa agente")
    Rel(dify_client, dify_external, "API calls", "HTTPS")
    
    Rel(providers, openai_external, "Gera texto", "HTTPS")
    Rel(providers, xai_external, "Gera texto", "HTTPS")
    
    Rel(streaming, chat_api, "Stream response")
    
    UpdateRelStyle(dify_client, dify_external, $textColor="green", $lineColor="green")
```

## 🧩 Nível 3: Componentes - Frontend

```mermaid
C4Component
    title Componentes - Frontend (React)
    
    Container_Boundary(webapp_boundary, "Web Application") {
        Component(chat_layout, "Chat Layout", "React", "Layout principal<br/>Sidebar + Header + Chat")
        Component(chat_comp, "Chat Component", "React", "Área de conversação<br/>Mensagens + Input")
        Component(model_selector, "Model Selector", "React", "Seletor de modelos<br/>xAI, OpenAI")
        Component(dify_selector, "Dify Agent Selector", "React", "Seletor de agentes Dify<br/>Agrupado por categoria")
        Component(messages, "Messages", "React", "Lista de mensagens<br/>Markdown + Artifacts")
        Component(artifacts, "Artifacts System", "React", "Sistema de artifacts<br/>Text, Code, Image, Sheet")
        Component(input, "Multimodal Input", "React", "Input com suporte<br/>Texto, arquivos, voz")
        Component(sidebar, "Sidebar", "React", "Navegação e histórico<br/>Lista de conversas")
        Component(auth_comp, "Auth Components", "React", "Login/Logout<br/>Gestão de sessão")
    }
    
    Container_Boundary(hooks_boundary, "React Hooks") {
        Component(use_chat, "useChat", "React Hook", "Estado do chat<br/>AI SDK hook")
        Component(use_dify, "useDifyAgent", "React Hook", "Estado dos agentes Dify<br/>Seleção e execução")
        Component(use_messages, "useMessages", "React Hook", "Gerenciamento de mensagens<br/>Histórico local")
    }
    
    Container_Boundary(ui_boundary, "UI Components") {
        Component(ui_select, "Select", "shadcn/ui", "Componente de seleção")
        Component(ui_button, "Button", "shadcn/ui", "Botões do sistema")
        Component(ui_input, "Input", "shadcn/ui", "Campos de entrada")
        Component(ui_sidebar, "Sidebar", "shadcn/ui", "Componente de sidebar")
    }
    
    Rel(chat_layout, sidebar, "Renderiza")
    Rel(chat_layout, chat_comp, "Renderiza")
    Rel(chat_comp, model_selector, "Inclui")
    Rel(chat_comp, dify_selector, "Inclui")
    Rel(chat_comp, messages, "Renderiza")
    Rel(chat_comp, input, "Renderiza")
    Rel(messages, artifacts, "Contém")
    
    Rel(chat_comp, use_chat, "Usa estado")
    Rel(dify_selector, use_dify, "Usa estado")
    Rel(messages, use_messages, "Usa estado")
    
    Rel(model_selector, ui_select, "Usa")
    Rel(dify_selector, ui_select, "Usa")
    Rel(input, ui_input, "Usa")
    Rel(sidebar, ui_sidebar, "Usa")
    
    UpdateRelStyle(dify_selector, use_dify, $textColor="green", $lineColor="green")
```

## 📁 Nível 4: Estrutura de Código

```mermaid
C4Component
    title Estrutura de Código - Organização de Arquivos
    
    Container_Boundary(project_boundary, "Projeto Humana Companions") {
        Component(app_dir, "app/", "Next.js App Router", "Rotas e páginas<br/>(chat), (auth)")
        Component(components_dir, "components/", "React Components", "Componentes reutilizáveis<br/>UI, Chat, Dify")
        Component(lib_dir, "lib/", "Biblioteca", "Lógica de negócio<br/>AI, DB, Utils")
        Component(hooks_dir, "hooks/", "React Hooks", "Estado customizado<br/>Chat, Dify, Auto-resume")
        Component(docs_dir, "docs/", "Documentação", "Arquitetura, Dify<br/>Guias e troubleshooting")
        Component(scripts_dir, "scripts/", "Scripts", "Utilitários<br/>Dify list/test")
    }
    
    Container_Boundary(lib_detail, "lib/ - Detalhes") {
        Component(ai_lib, "ai/", "AI Logic", "providers.ts<br/>models.ts<br/>dify-agents.ts")
        Component(db_lib, "db/", "Database", "schema.ts<br/>queries.ts<br/>migrations/")
        Component(utils_lib, "utils/", "Utilities", "Funções auxiliares<br/>Validações")
    }
    
    Container_Boundary(components_detail, "components/ - Detalhes") {
        Component(ui_comp, "ui/", "Base UI", "shadcn/ui components<br/>button, select, input")
        Component(chat_comp_detail, "chat/", "Chat UI", "chat.tsx<br/>messages.tsx<br/>chat-header.tsx")
        Component(dify_comp, "dify/", "Dify UI", "dify-agent-selector.tsx<br/>dify-demo.tsx")
    }
    
    Rel(app_dir, components_dir, "Importa")
    Rel(app_dir, lib_dir, "Usa")
    Rel(app_dir, hooks_dir, "Usa")
    
    Rel(components_dir, ui_comp, "Contém")
    Rel(components_dir, chat_comp_detail, "Contém")
    Rel(components_dir, dify_comp, "Contém")
    
    Rel(lib_dir, ai_lib, "Contém")
    Rel(lib_dir, db_lib, "Contém")
    Rel(lib_dir, utils_lib, "Contém")
    
    Rel(hooks_dir, lib_dir, "Usa")
    Rel(components_dir, hooks_dir, "Usa")
    
    UpdateRelStyle(dify_comp, ai_lib, $textColor="green", $lineColor="green")
```

## 🔄 Fluxo de Dados - Integração Dify

```mermaid
sequenceDiagram
    participant U as Usuário
    participant UI as Dify Selector
    participant H as useDifyAgent Hook
    participant API as /api/dify
    participant C as Dify Client
    participant D as Dify API
    
    U->>UI: Seleciona agente Dify
    UI->>H: setSelectedAgent(id)
    H->>H: Atualiza estado local
    
    U->>UI: Envia mensagem
    UI->>API: POST /api/dify
    API->>C: executeAgent(id, message)
    C->>D: HTTP POST /v1/chat-messages
    D-->>C: Streaming response
    C-->>API: Processa stream
    API-->>UI: Server-Sent Events
    UI->>H: Atualiza resposta
    H->>UI: Re-render com nova resposta
```

## 📊 Métricas de Arquitetura

### **Modularidade**
- ✅ **Alta coesão**: Cada módulo tem responsabilidade específica
- ✅ **Baixo acoplamento**: Interfaces bem definidas entre módulos
- ✅ **Reutilização**: Componentes e hooks reutilizáveis

### **Escalabilidade**
- ✅ **Horizontal**: Fácil adição de novos providers de IA
- ✅ **Vertical**: Componentes podem ser estendidos independentemente
- ✅ **Performance**: Lazy loading e otimizações React

### **Manutenibilidade**
- ✅ **Separação de responsabilidades**: UI, lógica e dados separados
- ✅ **Testabilidade**: Componentes isolados e testáveis
- ✅ **Documentação**: Arquitetura bem documentada

---

**🎯 Esta arquitetura C4 representa a estrutura atual e serve como base para futuras expansões!**
