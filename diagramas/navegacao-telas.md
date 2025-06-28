# 🧭 Navegação de Telas - Humana Companions

## 📋 Visão Geral

Este documento apresenta os diagramas de navegação de telas da aplicação Humana Companions, mostrando os fluxos de usuário, estados de autenticação e transições entre páginas.

## 🗺️ Mapa Geral de Navegação

```mermaid
flowchart TD
    Start([Usuário Acessa Aplicação]) --> AuthCheck{Usuário Autenticado?}
    
    %% Fluxo de Autenticação
    AuthCheck -->|Não| GuestRedirect[/api/auth/guest/]
    GuestRedirect --> AuthChoice{Escolha de Autenticação}
    AuthChoice -->|Login| LoginPage[/login/Página de Login/]
    AuthChoice -->|Registro| RegisterPage[/register/Página de Registro/]
    AuthChoice -->|Convidado| GuestSession[Sessão de Convidado]
    
    %% Fluxo Principal
    AuthCheck -->|Sim| MainApp[/main/Página Principal/]
    LoginPage -->|Sucesso| MainApp
    RegisterPage -->|Sucesso| MainApp
    GuestSession --> MainApp
    
    %% Navegação Principal
    MainApp --> NewChat[Novo Chat ID gerado automaticamente]
    MainApp --> ExistingChat[/chat/id/Chat Específico/]
    
    %% Estados do Chat
    NewChat --> ChatInterface[Interface de Chat]
    ExistingChat --> ChatInterface
    
    %% Funcionalidades do Chat
    ChatInterface --> ModelSelector[Seletor de Modelos]
    ChatInterface --> DifySelector[Seletor Dify]
    ChatInterface --> ArtifactCreation[Criação de Artifacts]
    ChatInterface --> FileUpload[Upload de Arquivos]
    
    %% Artifacts
    ArtifactCreation --> TextArtifact[Text Artifact]
    ArtifactCreation --> CodeArtifact[Code Artifact]
    ArtifactCreation --> ImageArtifact[Image Artifact]
    ArtifactCreation --> SheetArtifact[Sheet Artifact]
    
    %% Sidebar Navigation
    ChatInterface --> Sidebar[Sidebar]
    Sidebar --> ChatHistory[Histórico de Chats]
    Sidebar --> NewChatBtn[Novo Chat]
    Sidebar --> UserProfile[Perfil do Usuário]
    
    %% Ações do Usuário
    ChatHistory --> ExistingChat
    NewChatBtn --> NewChat
    UserProfile --> Logout[Logout]
    Logout --> LoginPage
    
    %% Estilos
    classDef authPages fill:#ffe6e6,stroke:#ff6b6b,stroke-width:2px
    classDef mainPages fill:#e6f3ff,stroke:#4dabf7,stroke-width:2px
    classDef chatFeatures fill:#e6ffe6,stroke:#51cf66,stroke-width:2px
    classDef artifacts fill:#fff0e6,stroke:#ff922b,stroke-width:2px
    classDef navigation fill:#f0e6ff,stroke:#9775fa,stroke-width:2px
    
    class LoginPage,RegisterPage,GuestSession authPages
    class MainApp,ExistingChat,ChatInterface mainPages
    class ModelSelector,DifySelector,FileUpload chatFeatures
    class TextArtifact,CodeArtifact,ImageArtifact,SheetArtifact artifacts
    class Sidebar,ChatHistory,UserProfile navigation
```

## 🔐 Fluxo de Autenticação Detalhado

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as App
    participant Auth as Auth System
    participant API as API Routes
    participant DB as Database
    
    U->>A: Acessa aplicação
    A->>Auth: Verifica sessão
    
    alt Não autenticado
        Auth->>API: Redirect /api/auth/guest
        API->>Auth: Cria sessão de convidado
        Auth->>A: Sessão de convidado ativa
        A->>U: Acesso à aplicação (limitado)
    else Quer fazer login
        U->>A: Navega para /login
        A->>U: Exibe formulário de login
        U->>A: Submete credenciais
        A->>Auth: Valida credenciais
        Auth->>DB: Verifica usuário
        DB-->>Auth: Dados do usuário
        Auth->>A: Sessão autenticada
        A->>U: Redirect para página principal
    else Quer se registrar
        U->>A: Navega para /register
        A->>U: Exibe formulário de registro
        U->>A: Submete dados
        A->>Auth: Cria novo usuário
        Auth->>DB: Salva usuário
        DB-->>Auth: Usuário criado
        Auth->>A: Sessão autenticada
        A->>U: Redirect para página principal
    end
```

## 💬 Fluxo de Navegação do Chat

```mermaid
stateDiagram-v2
    [*] --> HomePage : Usuário acessa /
    HomePage --> NewChat : Gera novo ID
    HomePage --> ExistingChat : Clica em chat do histórico
    
    NewChat --> ChatLoaded : Chat inicializado
    ExistingChat --> ChatValidation : Valida permissões
    
    ChatValidation --> ChatLoaded : Acesso permitido
    ChatValidation --> NotFound : Acesso negado
    ChatValidation --> LoginRedirect : Não autenticado
    
    ChatLoaded --> Chatting : Interface carregada
    
    state Chatting {
        [*] --> Idle
        Idle --> Typing : Usuário digita
        Typing --> Sending : Envia mensagem
        Sending --> AIProcessing : IA processa
        AIProcessing --> Streaming : IA responde
        Streaming --> ArtifactCreation : Cria artifact
        Streaming --> SimpleResponse : Resposta simples
        ArtifactCreation --> Idle
        SimpleResponse --> Idle
        
        Idle --> ModelChange : Muda modelo
        ModelChange --> Idle
        
        Idle --> DifyAgent : Seleciona agente Dify
        DifyAgent --> Idle
        
        Idle --> FileUpload : Upload de arquivo
        FileUpload --> Idle
    }
    
    Chatting --> NewChatFromSidebar : Clica "Novo Chat"
    NewChatFromSidebar --> NewChat
    
    Chatting --> OtherChatFromSidebar : Clica outro chat
    OtherChatFromSidebar --> ExistingChat
    
    Chatting --> Logout : Faz logout
    Logout --> LoginRedirect
    
    LoginRedirect --> [*]
    NotFound --> [*]
```

## 🎨 Navegação dos Artifacts

```mermaid
flowchart LR
    subgraph "Chat Interface"
        ChatMsg[💬 Mensagem do Chat]
    end
    
    subgraph "Artifact Creation"
        CreateTool[🛠️ create-document tool]
        ArtifactType{Tipo de Artifact}
    end
    
    subgraph "Text Artifact"
        TextEditor[📝 Editor de Texto]
        TextActions[⚙️ Ações do Texto]
        TextVersions[🔄 Versões]
        TextSuggestions[💡 Sugestões]
    end
    
    subgraph "Code Artifact"
        CodeEditor[💻 Editor de Código]
        CodeActions[⚙️ Ações do Código]
        CodeExecution[▶️ Execução]
        CodeVersions[🔄 Versões]
    end
    
    subgraph "Image Artifact"
        ImageViewer[🖼️ Visualizador]
        ImageActions[⚙️ Ações da Imagem]
        ImagePrompt[✏️ Editar Prompt]
        ImageVariations[🎭 Variações]
    end
    
    subgraph "Sheet Artifact"
        SheetEditor[📊 Editor de Planilha]
        SheetActions[⚙️ Ações da Planilha]
        SheetCharts[📈 Gráficos]
        SheetExport[💾 Exportar]
    end
    
    %% Fluxo principal
    ChatMsg --> CreateTool
    CreateTool --> ArtifactType
    
    %% Ramificação por tipo
    ArtifactType -->|text| TextEditor
    ArtifactType -->|code| CodeEditor
    ArtifactType -->|image| ImageViewer
    ArtifactType -->|sheet| SheetEditor
    
    %% Navegação interna - Text
    TextEditor --> TextActions
    TextEditor --> TextVersions
    TextActions --> TextSuggestions
    TextVersions --> TextEditor
    
    %% Navegação interna - Code
    CodeEditor --> CodeActions
    CodeEditor --> CodeVersions
    CodeActions --> CodeExecution
    CodeVersions --> CodeEditor
    
    %% Navegação interna - Image
    ImageViewer --> ImageActions
    ImageActions --> ImagePrompt
    ImageActions --> ImageVariations
    ImagePrompt --> ImageViewer
    ImageVariations --> ImageViewer
    
    %% Navegação interna - Sheet
    SheetEditor --> SheetActions
    SheetActions --> SheetCharts
    SheetActions --> SheetExport
    SheetCharts --> SheetEditor
    
    %% Volta para o chat
    TextEditor -.-> ChatMsg
    CodeEditor -.-> ChatMsg
    ImageViewer -.-> ChatMsg
    SheetEditor -.-> ChatMsg
    
    %% Estilos
    classDef chat fill:#e6f3ff,stroke:#4dabf7
    classDef creation fill:#fff0e6,stroke:#ff922b
    classDef text fill:#e6ffe6,stroke:#51cf66
    classDef code fill:#ffe6f0,stroke:#f06292
    classDef image fill:#f0e6ff,stroke:#9775fa
    classDef sheet fill:#e6fff0,stroke:#66d9ef
    
    class ChatMsg chat
    class CreateTool,ArtifactType creation
    class TextEditor,TextActions,TextVersions,TextSuggestions text
    class CodeEditor,CodeActions,CodeExecution,CodeVersions code
    class ImageViewer,ImageActions,ImagePrompt,ImageVariations image
    class SheetEditor,SheetActions,SheetCharts,SheetExport sheet
```

## 📱 Estados Responsivos da Interface

```mermaid
stateDiagram-v2
    [*] --> Desktop : Tela > 768px
    [*] --> Mobile : Tela ≤ 768px
    
    state Desktop {
        [*] --> SidebarOpen
        SidebarOpen --> SidebarClosed : Clica toggle
        SidebarClosed --> SidebarOpen : Clica toggle
        
        state SidebarOpen {
            [*] --> ChatWithSidebar
            ChatWithSidebar --> ArtifactWithSidebar : Artifact visível
            ArtifactWithSidebar --> ChatWithSidebar : Artifact fechado
        }
        
        state SidebarClosed {
            [*] --> ChatFullWidth
            ChatFullWidth --> ArtifactFullWidth : Artifact visível
            ArtifactFullWidth --> ChatFullWidth : Artifact fechado
        }
    }
    
    state Mobile {
        [*] --> MobileChatView
        MobileChatView --> MobileSidebarOpen : Clica menu
        MobileSidebarOpen --> MobileChatView : Seleciona chat/fecha
        
        MobileChatView --> MobileArtifactView : Artifact visível
        MobileArtifactView --> MobileChatView : Fecha artifact
        
        state MobileArtifactView {
            [*] --> ArtifactOverlay
            ArtifactOverlay --> ArtifactFullscreen : Maximiza
            ArtifactFullscreen --> ArtifactOverlay : Minimiza
        }
    }
    
    Desktop --> Mobile : Redimensiona para mobile
    Mobile --> Desktop : Redimensiona para desktop
```

## 🔄 Fluxo de Dados e Navegação

```mermaid
graph TD
    subgraph "Client Side"
        Router[Next.js Router]
        Components[React Components]
        State[Client State]
    end
    
    subgraph "Server Side"
        Pages[Page Components]
        API[API Routes]
        Auth[Auth Middleware]
        DB[(Database)]
    end
    
    subgraph "Navigation Events"
        UserClick[👆 User Click]
        URLChange[🔗 URL Change]
        Redirect[↩️ Redirect]
        Back[⬅️ Browser Back]
    end
    
    %% User Actions
    UserClick --> Router
    URLChange --> Router
    Back --> Router
    
    %% Router Flow
    Router --> Auth
    Auth --> Pages
    Pages --> Components
    Components --> State
    
    %% Server Communication
    Components --> API
    API --> DB
    DB --> API
    API --> Components
    
    %% Redirects
    Auth --> Redirect
    Redirect --> Router
    
    %% State Updates
    State --> Components
    Components --> Router
    
    %% Styling
    classDef client fill:#e6f3ff,stroke:#4dabf7
    classDef server fill:#e6ffe6,stroke:#51cf66
    classDef events fill:#fff0e6,stroke:#ff922b
    
    class Router,Components,State client
    class Pages,API,Auth,DB server
    class UserClick,URLChange,Redirect,Back events
```

## 🎯 Pontos de Entrada da Aplicação

```mermaid
mindmap
  root((Humana Companions))
    🏠 Página Principal
      ➕ Novo Chat
        🎯 Chat Interface
        🤖 Model Selection
        🔧 Dify Agents
      📚 Chat History
        💬 Chat Específico
        🗑️ Delete Chat
        📝 Rename Chat
    🔐 Autenticação
      📱 Login Page
        ✅ Login Success
        ❌ Login Error
      📝 Register Page
        ✅ Register Success
        ❌ Register Error
      👤 Guest Access
        ⚠️ Limited Features
    🎨 Artifacts
      📝 Text Editor
        💡 Suggestions
        🔄 Versions
        📋 Actions
      💻 Code Editor
        ▶️ Execute
        🎨 Format
        📋 Copy
      🖼️ Image Viewer
        🔄 Regenerate
        💾 Download
        ✏️ Edit Prompt
      📊 Sheet Editor
        📈 Charts
        💾 Export
        🧮 Formulas
    ⚙️ Settings
      🌙 Theme Toggle
      🔊 Sound Settings
      🌐 Language
      🚪 Logout
```

## 📊 Métricas de Navegação

```mermaid
pie title Distribuição de Tempo por Tela
    "Chat Interface" : 60
    "Artifact Editing" : 25
    "Navigation/Sidebar" : 10
    "Authentication" : 3
    "Settings" : 2
```

```mermaid
journey
    title Jornada Típica do Usuário
    section Entrada
      Acessa app: 5: Usuário
      Faz login: 4: Usuário
      Vê página inicial: 5: Usuário
    section Uso Principal
      Inicia novo chat: 5: Usuário
      Seleciona modelo: 4: Usuário
      Envia mensagem: 5: Usuário
      IA responde: 5: IA
      Cria artifact: 4: IA
    section Interação
      Edita artifact: 5: Usuário
      Salva mudanças: 4: Sistema
      Continua conversa: 5: Usuário
    section Finalização
      Navega histórico: 3: Usuário
      Acessa chat anterior: 4: Usuário
      Faz logout: 3: Usuário
```

---

**🎯 Este mapa de navegação mostra como os usuários fluem através da aplicação, desde a autenticação até a criação colaborativa de artifacts!** 🧭✨ 