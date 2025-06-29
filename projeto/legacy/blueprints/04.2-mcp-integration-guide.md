# Guia de Integração MCP (Model Context Protocol)

## Visão Geral

O sistema MCP (Model Context Protocol) foi implementado no Humana Companions para permitir a integração com servidores MCP externos, expandindo as capacidades do chat com ferramentas personalizadas.

## Funcionalidades Implementadas

### 1. Gerenciamento de Servidores MCP
- **CRUD completo**: Criar, listar, editar e excluir servidores MCP
- **Teste de conexão**: Verificar se um servidor MCP está funcionando
- **Ativação/Desativação**: Controlar quais servidores estão ativos
- **Suporte a transportes**: SSE (Server-Sent Events) implementado

### 2. Interface de Usuário
- **Página dedicada**: `/mcp-servers` para gerenciar servidores
- **Menu integrado**: Opção "Servidores MCP" no dropdown do usuário
- **Formulários responsivos**: Interface moderna para CRUD
- **Feedback visual**: Toasts e indicadores de status

### 3. Integração no Chat
- **Carregamento automático**: Ferramentas MCP são carregadas automaticamente
- **Execução transparente**: IA pode usar ferramentas MCP naturalmente
- **Isolamento por usuário**: Cada usuário vê apenas seus servidores

## Como Usar

### Passo 1: Acessar Gerenciamento MCP
1. Faça login no sistema
2. Clique no menu do usuário (canto superior direito)
3. Selecione "Servidores MCP"

### Passo 2: Adicionar Servidor MCP
1. Clique em "Novo Servidor"
2. Preencha os campos:
   - **Nome**: Nome identificador do servidor
   - **URL**: Endpoint do servidor MCP (ex: `https://exemplo.com/mcp`)
   - **Transporte**: Selecione "SSE" (padrão)
   - **Descrição**: Descrição opcional
3. Clique em "Criar"

### Passo 3: Testar Conexão
1. Na lista de servidores, clique em "Testar"
2. Aguarde o resultado da conexão
3. Se bem-sucedido, o servidor está pronto para uso

### Passo 4: Usar no Chat
1. As ferramentas MCP são carregadas automaticamente
2. A IA pode usar as ferramentas durante conversas
3. Exemplo: "Use a ferramenta do GitHub para criar uma issue"

## Estrutura Técnica

### Banco de Dados
```sql
CREATE TABLE "McpServer" (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  transport VARCHAR CHECK (transport IN ('sse', 'stdio')) DEFAULT 'sse',
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  userId UUID REFERENCES "User"(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### APIs REST
- `GET/POST /api/mcp-servers` - Listar/criar servidores
- `GET/PUT/DELETE /api/mcp-servers/[id]` - Operações individuais
- `POST /api/mcp-servers/test` - Testar conexão

### Cliente MCP
- **Conexão automática**: Conecta aos servidores ativos
- **Cache de clientes**: Reutiliza conexões existentes
- **Conversão de ferramentas**: Adapta ferramentas MCP para AI SDK
- **Tratamento de erros**: Logs detalhados e recuperação

## Exemplos de Servidores MCP

### 1. Servidor de Exemplo (Dice Roll)
```bash
# Deploy usando template Vercel
# URL: https://seu-app.vercel.app/api/mcp
```

### 2. GitHub MCP Server
```bash
# Configure um servidor MCP para GitHub
# URL: https://github-mcp.exemplo.com/mcp
```

### 3. Slack MCP Server
```bash
# Configure um servidor MCP para Slack
# URL: https://slack-mcp.exemplo.com/mcp
```

## Desenvolvimento

### Estrutura de Arquivos
```
lib/ai/mcp-client.ts          # Cliente MCP principal
app/(chat)/api/mcp-servers/   # APIs REST
app/(chat)/mcp-servers/       # Página de gerenciamento
components/mcp-server-form.tsx # Formulário
components/mcp-servers-list.tsx # Lista
```

### Adicionando Suporte a STDIO
Para adicionar suporte ao transporte STDIO:

1. Modifique `lib/ai/mcp-client.ts`
2. Implemente `StdioClientTransport` 
3. Configure processo filho para executar servidor MCP

### Logs e Debug
```bash
# Logs no console do servidor
✅ Conectado ao servidor MCP: NomeServidor com 3 ferramentas
🔧 Carregadas 5 ferramentas MCP de 2 servidores
❌ Erro ao conectar ao servidor MCP NomeServidor: ConnectionError
```

## Segurança

### Isolamento por Usuário
- Cada usuário só vê seus próprios servidores MCP
- Ferramentas MCP só são carregadas para o usuário proprietário
- Validação de propriedade em todas as operações

### Validação de URLs
- URLs são validadas antes de salvar
- Apenas protocolos HTTPS são recomendados em produção
- Timeouts configurados para evitar travamentos

### Tratamento de Erros
- Conexões falhadas não afetam outras ferramentas
- Logs detalhados para debug
- Graceful degradation se MCP não estiver disponível

## Troubleshooting

### Servidor MCP não conecta
1. Verifique se a URL está correta
2. Teste a URL manualmente no browser
3. Verifique logs do servidor
4. Confirme que o servidor suporta SSE

### Ferramentas não aparecem no chat
1. Verifique se o servidor está marcado como "ativo"
2. Confirme que a conexão foi bem-sucedida
3. Reinicie o chat (refresh da página)
4. Verifique logs do console

### Performance lenta
1. Verifique latência do servidor MCP
2. Considere cache local de ferramentas
3. Monitore número de conexões simultâneas
4. Otimize servidor MCP para resposta rápida

## Roadmap

### Próximas Funcionalidades
- [ ] Suporte a transporte STDIO
- [ ] Cache de ferramentas MCP
- [ ] Métricas de uso de ferramentas
- [ ] Templates de servidores populares
- [ ] Autenticação OAuth para servidores MCP
- [ ] Marketplace de servidores MCP públicos

### Melhorias Planejadas
- [ ] Interface para visualizar ferramentas disponíveis
- [ ] Histórico de execução de ferramentas
- [ ] Rate limiting por servidor
- [ ] Health checks automáticos
- [ ] Backup/restore de configurações MCP

## Contribuindo

Para contribuir com melhorias no sistema MCP:

1. Faça fork do repositório
2. Crie branch para sua feature: `git checkout -b feature/mcp-enhancement`
3. Implemente as mudanças
4. Adicione testes se necessário
5. Faça commit: `git commit -m "feat: adiciona nova funcionalidade MCP"`
6. Push para branch: `git push origin feature/mcp-enhancement`
7. Abra Pull Request

## Referências

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Vercel AI SDK MCP Integration](https://vercel.com/docs/mcp)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) 