# 🎨 Diagramas do Sistema de Artifacts

## 📋 Visão Geral

Este documento apresenta os diagramas específicos do sistema de Artifacts, mostrando sua arquitetura, fluxos e integração com o resto da aplicação.

## 🏗️ Arquitetura dos Artifacts

```mermaid
C4Component
    title Arquitetura do Sistema de Artifacts
    
    Container_Boundary(ui_boundary, "Interface do Usuário") {
        Component(chat, "Chat Interface", "React", "Interface principal de chat")
        Component(artifact_comp, "Artifact Component", "React", "Container principal dos artifacts")
        Component(text_editor, "Text Editor", "React", "Editor de texto rico")
        Component(code_editor, "Code Editor", "React", "Editor de código")
        Component(image_viewer, "Image Viewer", "React", "Visualizador de imagens")
        Component(sheet_editor, "Sheet Editor", "React", "Editor de planilhas")
    }
    
    Container_Boundary(artifact_system, "Sistema de Artifacts") {
        Component(artifact_class, "Artifact Class", "TypeScript", "Classe base dos artifacts")
        Component(text_artifact, "Text Artifact", "TypeScript", "Implementação de texto")
        Component(code_artifact, "Code Artifact", "TypeScript", "Implementação de código")
        Component(image_artifact, "Image Artifact", "TypeScript", "Implementação de imagem")
        Component(sheet_artifact, "Sheet Artifact", "TypeScript", "Implementação de planilha")
    }
    
    Container_Boundary(tools_boundary, "Ferramentas de IA") {
        Component(create_tool, "create-document", "AI Tool", "Cria novos artifacts")
        Component(update_tool, "update-document", "AI Tool", "Atualiza artifacts")
        Component(suggest_tool, "request-suggestions", "AI Tool", "Gera sugestões")
    }
    
    ContainerDb(database, "Database", "PostgreSQL", "Persistência de artifacts")
    
    Rel(chat, artifact_comp, "Renderiza")
    Rel(artifact_comp, text_editor, "Usa para texto")
    Rel(artifact_comp, code_editor, "Usa para código")
    Rel(artifact_comp, image_viewer, "Usa para imagem")
    Rel(artifact_comp, sheet_editor, "Usa para planilha")
    
    Rel(artifact_comp, artifact_class, "Instancia")
    Rel(artifact_class, text_artifact, "Herda")
    Rel(artifact_class, code_artifact, "Herda")
    Rel(artifact_class, image_artifact, "Herda")
    Rel(artifact_class, sheet_artifact, "Herda")
    
    Rel(create_tool, artifact_system, "Cria")
    Rel(update_tool, artifact_system, "Atualiza")
    Rel(suggest_tool, artifact_system, "Sugere")
    
    Rel(artifact_system, database, "Persiste")
    
    UpdateRelStyle(artifact_comp, artifact_class, $textColor="blue", $lineColor="blue")
    UpdateRelStyle(artifact_system, database, $textColor="green", $lineColor="green")
```

## 🔄 Fluxo de Criação de Artifact

```mermaid
sequenceDiagram
    participant U as Usuário
    participant C as Chat
    participant AI as IA Engine
    participant T as create-document Tool
    participant A as Artifact System
    participant E as Editor Component
    participant DB as Database
    
    U->>C: "Escreva um email profissional"
    C->>AI: Processa mensagem
    AI->>AI: Identifica necessidade de artifact
    AI->>T: create-document(kind: 'text', title: 'Email')
    
    T->>DB: INSERT Document
    DB-->>T: documentId
    T->>A: Inicializa UIArtifact
    A->>E: Renderiza editor vazio
    
    AI->>A: Stream text-delta
    loop Streaming
        A->>E: Atualiza conteúdo
        E->>U: Exibe texto gradualmente
    end
    
    A->>A: content.length > 400?
    A->>E: isVisible = true
    E->>U: Artifact aparece na tela
    
    AI->>A: Finaliza streaming
    A->>E: status = 'idle'
    E->>U: Artifact pronto para edição
```

## ✏️ Fluxo de Edição de Artifact

```mermaid
sequenceDiagram
    participant U as Usuário
    participant E as Editor
    participant A as Artifact System
    participant DB as Database
    
    U->>E: Edita conteúdo
    E->>A: onContentChange(newContent)
    A->>A: setIsContentDirty(true)
    
    Note over A: Debounce 2 segundos
    
    A->>A: debouncedHandleContentChange
    A->>DB: POST /api/document
    
    DB->>DB: INSERT nova versão
    Note over DB: Mesmo ID, novo createdAt
    
    DB-->>A: Sucesso
    A->>A: setIsContentDirty(false)
    A->>E: Confirma salvamento
    E->>U: Indicador visual de salvamento
```

## 🔄 Fluxo de Versionamento

```mermaid
graph TD
    A[Artifact Criado] --> B[Versão 1.0<br/>createdAt: 10:00]
    B --> C{Usuário Edita?}
    C -->|Sim| D[Versão 1.1<br/>createdAt: 10:05]
    C -->|Não| E[Mantém Versão]
    
    D --> F{IA Sugere?}
    F -->|Sim| G[Versão 1.2<br/>createdAt: 10:10]
    F -->|Não| H[Mantém Versão]
    
    G --> I[Histórico Completo]
    I --> J[Navegação: prev/next]
    I --> K[Diff View: comparar]
    
    style A fill:#e1f5fe
    style I fill:#f3e5f5
    style J fill:#e8f5e8
    style K fill:#fff3e0
```

## 🗄️ Modelo de Dados dos Artifacts

```mermaid
erDiagram
    Document {
        uuid id PK "ID do artifact"
        timestamp createdAt PK "Timestamp da versão"
        text title "Título do artifact"
        text content "Conteúdo atual"
        varchar kind "text | code | image | sheet"
        uuid userId FK "Proprietário"
    }
    
    Suggestion {
        uuid id PK "ID da sugestão"
        uuid documentId FK "Referência ao artifact"
        timestamp documentCreatedAt FK "Versão específica"
        text originalText "Texto original"
        text suggestedText "Texto sugerido"
        text description "Descrição da sugestão"
        boolean isResolved "Foi resolvida?"
        uuid userId FK "Quem fez a sugestão"
        timestamp createdAt "Quando foi criada"
    }
    
    Message_v2 {
        uuid id PK "ID da mensagem"
        uuid chatId FK "Chat onde aparece"
        varchar role "user | assistant"
        json parts "Partes da mensagem"
        json attachments "Anexos"
        timestamp createdAt "Timestamp"
    }
    
    User {
        uuid id PK "ID do usuário"
        varchar email "Email"
    }
    
    Document ||--o{ Suggestion : "recebe sugestões"
    User ||--o{ Document : "cria artifacts"
    User ||--o{ Suggestion : "faz sugestões"
    Message_v2 ||--o| Document : "pode referenciar"
```

## 🎨 Tipos de Artifacts e Componentes

```mermaid
classDiagram
    class Artifact {
        +kind: string
        +description: string
        +content: ComponentType
        +actions: ArtifactAction[]
        +toolbar: ArtifactToolbarItem[]
        +initialize(): void
        +onStreamPart(): void
    }
    
    class TextArtifact {
        +kind: "text"
        +content: TextEditor
        +actions: [ViewChanges, Copy, Undo, Redo]
        +toolbar: [Polish, RequestSuggestions]
    }
    
    class CodeArtifact {
        +kind: "code"
        +content: CodeEditor
        +actions: [Run, Format, Copy]
        +toolbar: [Optimize, AddTests]
    }
    
    class ImageArtifact {
        +kind: "image"
        +content: ImageViewer
        +actions: [Download, Regenerate]
        +toolbar: [EditPrompt, Variations]
    }
    
    class SheetArtifact {
        +kind: "sheet"
        +content: SheetEditor
        +actions: [Export, Chart]
        +toolbar: [Analyze, Format]
    }
    
    Artifact <|-- TextArtifact
    Artifact <|-- CodeArtifact
    Artifact <|-- ImageArtifact
    Artifact <|-- SheetArtifact
    
    class UIArtifact {
        +title: string
        +documentId: string
        +kind: ArtifactKind
        +content: string
        +isVisible: boolean
        +status: "streaming" | "idle"
        +boundingBox: BoundingBox
    }
    
    UIArtifact --> Artifact : "usa definição"
```

## 🔧 Fluxo de Ferramentas de IA

```mermaid
flowchart TD
    A[Mensagem do Usuário] --> B{Análise da IA}
    
    B -->|Criar conteúdo| C[create-document Tool]
    B -->|Modificar existente| D[update-document Tool]
    B -->|Melhorar qualidade| E[request-suggestions Tool]
    B -->|Resposta simples| F[Resposta de Chat]
    
    C --> G[Escolhe Tipo]
    G -->|Texto| H[textArtifact]
    G -->|Código| I[codeArtifact]
    G -->|Imagem| J[imageArtifact]
    G -->|Planilha| K[sheetArtifact]
    
    H --> L[Inicializa Editor]
    I --> L
    J --> L
    K --> L
    
    L --> M[Streaming de Conteúdo]
    M --> N[Artifact Visível]
    
    D --> O[Localiza Artifact]
    O --> P[Atualiza Conteúdo]
    P --> Q[Nova Versão]
    
    E --> R[Analisa Conteúdo]
    R --> S[Gera Sugestões]
    S --> T[Exibe Inline]
    
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#e1f5fe
```

## 🎯 Estados e Transições dos Artifacts

```mermaid
stateDiagram-v2
    [*] --> Creating : create-document tool
    Creating --> Streaming : IA inicia geração
    Streaming --> Visible : content.length > 400
    Streaming --> Idle : streaming completo
    
    Visible --> Idle : streaming completo
    Idle --> Editing : usuário edita
    Editing --> Saving : debounce trigger
    Saving --> Idle : salvamento completo
    
    Idle --> Updating : update-document tool
    Updating --> Streaming : IA atualiza
    
    Idle --> Suggesting : request-suggestions tool
    Suggesting --> WithSuggestions : sugestões geradas
    WithSuggestions --> Idle : sugestões aplicadas
    
    Idle --> Versioning : navegação de versões
    Versioning --> DiffView : toggle diff
    DiffView --> Versioning : toggle edit
    Versioning --> Idle : volta para latest
    
    state Creating {
        [*] --> InitializingMetadata
        InitializingMetadata --> ReadyForStream
    }
    
    state Streaming {
        [*] --> ReceivingDeltas
        ReceivingDeltas --> AccumulatingContent
        AccumulatingContent --> CheckingVisibility
    }
```

## 📊 Métricas e Performance dos Artifacts

```mermaid
graph LR
    subgraph "Métricas de Criação"
        A[Tempo Médio<br/>< 3 segundos] --> B[Taxa de Sucesso<br/>99.5%]
        B --> C[Primeiros 400 chars<br/>< 2 segundos]
    end
    
    subgraph "Métricas de Uso"
        D[Engajamento<br/>> 80%] --> E[Edições por Artifact<br/>Média: 3.2]
        E --> F[Retenção<br/>> 70%]
    end
    
    subgraph "Métricas de Performance"
        G[Debounce Save<br/>2 segundos] --> H[Bundle Size<br/>< 50KB por tipo]
        H --> I[Memory Usage<br/>< 10MB por artifact]
    end
    
    subgraph "Métricas de Satisfação"
        J[Satisfação Usuário<br/>> 90%] --> K[Bugs Reportados<br/>< 1%]
        K --> L[Tempo de Resposta<br/>< 100ms]
    end
```

---

**🎯 Estes diagramas mostram como os Artifacts funcionam como uma extensão natural do chat, criando experiências colaborativas entre humano e IA!** 🎨✨ 