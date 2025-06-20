# 📝 Templates de Documentação

## 🎯 Objetivo

Templates reutilizáveis para criar documentação consistente e de alta qualidade em todas as integrações e módulos do projeto.

## 📋 Template: README Principal de Integração

```markdown
# 📖 [Nome da Integração]

## 🎯 Visão Geral

[Descrição breve do que a integração faz e por que é útil]

## 🚀 Início Rápido

### Pré-requisitos
- [Listar pré-requisitos necessários]
- [Contas/APIs necessárias]
- [Versões mínimas]

### Configuração Rápida
```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env.local

# 2. Adicionar suas chaves de API
PROVIDER_API_KEY=sua-chave-aqui
PROVIDER_BASE_URL=https://api.provider.com

# 3. Testar configuração
pnpm run provider:test
```

### Primeiro Uso
[Passos básicos para começar a usar]

## 📚 Documentação Completa

- **[SETUP.md](./PROVIDER_SETUP.md)** - Configuração detalhada
- **[COMO_USAR.md](./COMO_USAR_PROVIDER.md)** - Guia de uso prático
- **[GUIA_COMPLETO.md](./GUIA_COMPLETO_PROVIDER.md)** - Documentação técnica
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING_PROVIDER.md)** - Resolução de problemas

## 🛠️ Scripts Úteis

```bash
# Listar recursos disponíveis
pnpm run provider:list

# Testar integração
pnpm run provider:test RESOURCE_ID "mensagem de teste"

# Diagnóstico completo
pnpm run provider:diagnose
```

## 🔧 Configuração Avançada

[Seção para configurações mais avançadas]

## 📊 Exemplos de Uso

### Exemplo Básico
[Código de exemplo básico]

### Exemplo Avançado
[Código de exemplo mais complexo]

## 🆘 Suporte

- **Documentação:** [Link para docs completas]
- **Issues:** [Link para issues do GitHub]
- **Discussões:** [Link para discussões]

## 📄 Licença

[Informações de licença se aplicável]
```

## 🔧 Template: Guia de Configuração

```markdown
# ⚙️ Configuração - [Nome da Integração]

## 📋 Pré-requisitos

### Requisitos do Sistema
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- [Outros requisitos específicos]

### Contas e APIs Necessárias
- [ ] Conta no [Provider]
- [ ] API Key obtida
- [ ] [Outros requisitos de conta]

## 🔧 Configuração Passo a Passo

### 1. Obter Credenciais

#### Passo 1.1: Criar Conta
1. Acesse [URL do provider]
2. Crie uma conta ou faça login
3. [Passos específicos]

#### Passo 1.2: Gerar API Key
1. Navegue para [seção de API]
2. Clique em "Gerar Nova Chave"
3. Copie a chave gerada
4. ⚠️ **Importante:** Guarde a chave em local seguro

### 2. Configurar Variáveis de Ambiente

#### Passo 2.1: Criar Arquivo .env.local
```bash
# Copiar template
cp .env.example .env.local
```

#### Passo 2.2: Adicionar Configurações
```env
# Configurações do [Provider]
PROVIDER_API_KEY=sua-chave-aqui
PROVIDER_BASE_URL=https://api.provider.com
PROVIDER_ENABLED=true

# Configurações específicas (se aplicável)
NEXT_PUBLIC_PROVIDER_RESOURCE_1=resource-id-1
NEXT_PUBLIC_PROVIDER_RESOURCE_2=resource-id-2
```

### 3. Verificar Configuração

#### Passo 3.1: Executar Script de Verificação
```bash
pnpm run provider:diagnose
```

#### Passo 3.2: Testar Conectividade
```bash
pnpm run provider:list
```

#### Passo 3.3: Teste Funcional
```bash
pnpm run provider:test RESOURCE_ID "Teste de configuração"
```

## ✅ Checklist de Configuração

- [ ] **Credenciais obtidas**
  - [ ] Conta criada no [Provider]
  - [ ] API Key gerada
  - [ ] Permissões adequadas configuradas

- [ ] **Ambiente configurado**
  - [ ] Arquivo .env.local criado
  - [ ] Variáveis de ambiente definidas
  - [ ] Valores corretos inseridos

- [ ] **Testes executados**
  - [ ] Diagnóstico passou
  - [ ] Listagem funcionou
  - [ ] Teste funcional bem-sucedido

## 🚨 Problemas Comuns

### Erro: "API Key inválida"
**Causa:** Chave de API incorreta ou expirada
**Solução:**
1. Verificar se a chave foi copiada corretamente
2. Gerar nova chave se necessário
3. Verificar permissões da chave

### Erro: "Rate limit exceeded"
**Causa:** Muitas requisições em pouco tempo
**Solução:**
1. Aguardar alguns minutos
2. Verificar limites da sua conta
3. Implementar throttling se necessário

## 📞 Suporte

Se você encontrar problemas durante a configuração:

1. **Verifique a documentação:** [Link para troubleshooting]
2. **Execute o diagnóstico:** `pnpm run provider:diagnose`
3. **Consulte issues conhecidas:** [Link para issues]
4. **Abra uma nova issue:** [Link para criar issue]
```

## 🚨 Template: Troubleshooting

```markdown
# 🚨 Troubleshooting - [Nome da Integração]

## 🔍 Diagnóstico Rápido

Antes de investigar problemas específicos, execute o diagnóstico automático:

```bash
pnpm run provider:diagnose
```

Este comando verifica:
- ✅ Configuração de variáveis de ambiente
- ✅ Conectividade com a API
- ✅ Permissões e autenticação
- ✅ Recursos disponíveis

## 🐛 Problemas Comuns

### 1. Erro: "Provider not configured"

**Sintomas:**
- Mensagem de erro na inicialização
- Seletor de recursos não aparece
- Funcionalidade não disponível

**Causas Possíveis:**
- Variáveis de ambiente não configuradas
- Arquivo .env.local não existe
- Sintaxe incorreta no arquivo de ambiente

**Soluções:**
1. **Verificar arquivo .env.local:**
   ```bash
   ls -la .env.local
   ```

2. **Verificar conteúdo do arquivo:**
   ```bash
   cat .env.local | grep PROVIDER
   ```

3. **Recriar configuração:**
   ```bash
   cp .env.example .env.local
   # Editar .env.local com suas credenciais
   ```

4. **Reiniciar servidor:**
   ```bash
   pnpm run dev
   ```

### 2. Erro: "Failed to fetch resources"

**Sintomas:**
- Lista de recursos vazia
- Erro 401/403 nos logs
- Timeout de conexão

**Causas Possíveis:**
- API Key inválida ou expirada
- Problemas de conectividade
- Rate limiting
- Permissões insuficientes

**Soluções:**
1. **Testar API Key:**
   ```bash
   pnpm run provider:test
   ```

2. **Verificar conectividade:**
   ```bash
   curl -I https://api.provider.com
   ```

3. **Regenerar API Key:**
   - Acesse painel do provider
   - Gere nova chave
   - Atualize .env.local

4. **Verificar permissões:**
   - Confirme que a API Key tem permissões adequadas
   - Verifique limites da conta

### 3. Erro: "Resource execution failed"

**Sintomas:**
- Recursos listados corretamente
- Erro ao executar ação específica
- Timeout durante execução

**Causas Possíveis:**
- Resource ID inválido
- Parâmetros incorretos
- Problemas temporários da API
- Limites de quota excedidos

**Soluções:**
1. **Verificar Resource ID:**
   ```bash
   pnpm run provider:list
   ```

2. **Testar recurso específico:**
   ```bash
   pnpm run provider:test RESOURCE_ID "teste"
   ```

3. **Verificar logs detalhados:**
   ```bash
   DEBUG=provider:* pnpm run dev
   ```

4. **Tentar recurso alternativo:**
   - Use outro recurso da lista
   - Verifique se o problema é específico

## 🧪 Scripts de Diagnóstico

### Diagnóstico Completo
```bash
pnpm run provider:diagnose
```

### Listar Recursos Disponíveis
```bash
pnpm run provider:list
```

### Testar Recurso Específico
```bash
pnpm run provider:test RESOURCE_ID "mensagem de teste"
```

### Logs Detalhados
```bash
DEBUG=provider:* pnpm run dev
```

### Verificar Configuração
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('API Key:', process.env.PROVIDER_API_KEY?.substring(0, 10) + '...');
console.log('Base URL:', process.env.PROVIDER_BASE_URL);
console.log('Enabled:', process.env.PROVIDER_ENABLED);
"
```

## 🔧 Soluções Avançadas

### Problema: Performance Lenta

**Diagnóstico:**
```bash
# Medir tempo de resposta
time pnpm run provider:test RESOURCE_ID "teste"
```

**Soluções:**
1. Verificar latência de rede
2. Implementar cache local
3. Usar recursos mais próximos geograficamente
4. Otimizar tamanho das requisições

### Problema: Falhas Intermitentes

**Diagnóstico:**
```bash
# Executar múltiplos testes
for i in {1..10}; do
  echo "Teste $i:"
  pnpm run provider:test RESOURCE_ID "teste $i"
  sleep 2
done
```

**Soluções:**
1. Implementar retry automático
2. Adicionar circuit breaker
3. Usar multiple endpoints
4. Implementar fallback

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Métricas de Performance
```bash
# Verificar logs de performance
grep "Performance measurement" logs/app.log
```

### Status da API Externa
```bash
# Verificar status do provider
curl -I https://status.provider.com
```

## 📞 Suporte Escalado

### Quando Escalar

Escale para suporte avançado quando:
- [ ] Diagnóstico automático falha
- [ ] Múltiplas soluções tentadas sem sucesso
- [ ] Problema afeta produção
- [ ] Suspeita de bug no código

### Como Escalar

1. **Colete informações:**
   ```bash
   # Gerar relatório de diagnóstico
   pnpm run provider:diagnose > diagnostico.txt
   
   # Coletar logs relevantes
   tail -100 logs/app.log > logs-recentes.txt
   
   # Informações do ambiente
   node --version > ambiente.txt
   pnpm --version >> ambiente.txt
   ```

2. **Abra issue detalhada:**
   - Descreva o problema
   - Anexe arquivos de diagnóstico
   - Liste passos já tentados
   - Inclua informações do ambiente

3. **Canais de suporte:**
   - GitHub Issues: [link]
   - Discussões: [link]
   - Discord/Slack: [link]

---

**🎯 A maioria dos problemas pode ser resolvida com diagnóstico sistemático!**
```

## 🧪 Template: Guia de Uso Prático

```markdown
# 🚀 Como Usar - [Nome da Integração]

## 🎯 Visão Geral

Este guia mostra como usar a integração [Provider] no dia a dia, com exemplos práticos e casos de uso reais.

## 🏃‍♂️ Uso Básico

### 1. Selecionando um Recurso

1. **Abra o chat** na aplicação
2. **Localize o seletor** [Provider] no header
3. **Clique no dropdown** para ver recursos disponíveis
4. **Selecione o recurso** desejado

![Screenshot do seletor]

### 2. Enviando uma Mensagem

1. **Digite sua mensagem** no campo de input
2. **Pressione Enter** ou clique em "Enviar"
3. **Aguarde a resposta** do recurso selecionado

### 3. Alternando entre Recursos

- **Durante a conversa**, você pode trocar de recurso
- **Clique no seletor** novamente
- **Escolha outro recurso** da lista
- **Continue a conversa** com o novo recurso

## 💡 Casos de Uso Práticos

### Caso 1: Assistência Geral
**Cenário:** Precisa de ajuda geral
**Recurso:** Assistente Geral
**Exemplo:**
```
Usuário: "Como posso melhorar minha produtividade no trabalho?"
Assistente: [Resposta personalizada com dicas práticas]
```

### Caso 2: Ajuda com Código
**Cenário:** Debugging ou desenvolvimento
**Recurso:** Assistente de Código
**Exemplo:**
```
Usuário: "Como posso otimizar esta função JavaScript?"
Assistente: [Análise do código e sugestões de otimização]
```

### Caso 3: Consulta Especializada
**Cenário:** Questões específicas de domínio
**Recurso:** Consultor Especializado
**Exemplo:**
```
Usuário: "Quais são as melhores práticas para segurança web?"
Consultor: [Resposta especializada em segurança]
```

## 🎨 Recursos Avançados

### Conversas Contextuais
- **Mantenha contexto** durante toda a conversa
- **Referencie mensagens anteriores** quando necessário
- **Use follow-ups** para aprofundar tópicos

### Múltiplos Recursos na Mesma Conversa
- **Alterne recursos** conforme a necessidade
- **Compare respostas** de diferentes recursos
- **Use recursos especializados** para tópicos específicos

### Personalização
- **Configure recursos favoritos** (se disponível)
- **Ajuste parâmetros** de resposta (se disponível)
- **Salve configurações** preferidas

## 🔧 Dicas e Truques

### Para Melhores Resultados

1. **Seja específico** nas suas perguntas
2. **Forneça contexto** quando necessário
3. **Use exemplos** para ilustrar o que precisa
4. **Divida perguntas complexas** em partes menores

### Exemplos de Boas Perguntas

```
❌ Ruim: "Como fazer isso?"
✅ Bom: "Como implementar autenticação JWT em Node.js?"

❌ Ruim: "Não funciona"
✅ Bom: "Estou recebendo erro 401 ao fazer login, como debugar?"

❌ Ruim: "Ajuda"
✅ Bom: "Preciso de ajuda para otimizar uma consulta SQL que está lenta"
```

### Quando Usar Cada Recurso

| Tipo de Pergunta | Recurso Recomendado | Exemplo |
|------------------|---------------------|---------|
| Dúvida geral | Assistente Geral | "Como organizar meu tempo?" |
| Problema técnico | Assistente de Código | "Bug no meu JavaScript" |
| Questão específica | Consultor Especializado | "Conformidade LGPD" |

## 🚨 Limitações e Considerações

### Limitações Conhecidas
- **Rate limits:** [X] mensagens por minuto
- **Tamanho máximo:** [Y] caracteres por mensagem
- **Contexto:** Mantido por [Z] mensagens

### Boas Práticas
- **Aguarde a resposta** antes de enviar nova mensagem
- **Seja paciente** com respostas longas
- **Reporte problemas** quando encontrar

### Fallback Automático
- Se o recurso [Provider] falhar, o sistema automaticamente usa o modelo padrão
- Você será notificado quando isso acontecer
- A conversa continua normalmente

## 📊 Monitoramento de Uso

### Verificar Status
```bash
# Status geral do sistema
curl http://localhost:3000/api/health

# Status específico do provider
pnpm run provider:diagnose
```

### Métricas Pessoais (se disponível)
- Acesse configurações da conta
- Veja estatísticas de uso
- Monitore limites de quota

## 🆘 Quando Algo Não Funciona

### Problemas Comuns
1. **Recurso não responde:** Aguarde alguns segundos e tente novamente
2. **Lista vazia:** Execute `pnpm run provider:list` para verificar
3. **Erro de configuração:** Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING_PROVIDER.md)

### Suporte Rápido
- **Documentação:** [Link para docs]
- **FAQ:** [Link para perguntas frequentes]
- **Suporte técnico:** [Link para suporte]

---

**🎯 Com essas dicas, você aproveitará ao máximo a integração [Provider]!**
```

## 📋 Checklist de Templates

### **✅ Template README Principal**
- [ ] Visão geral clara
- [ ] Início rápido funcional
- [ ] Links para documentação completa
- [ ] Scripts úteis documentados
- [ ] Informações de suporte

### **✅ Template Configuração**
- [ ] Pré-requisitos listados
- [ ] Passos detalhados
- [ ] Exemplos de configuração
- [ ] Checklist de verificação
- [ ] Problemas comuns

### **✅ Template Troubleshooting**
- [ ] Diagnóstico automático
- [ ] Problemas comuns catalogados
- [ ] Scripts de diagnóstico
- [ ] Soluções passo a passo
- [ ] Escalação de suporte

### **✅ Template Guia de Uso**
- [ ] Casos de uso práticos
- [ ] Exemplos funcionais
- [ ] Dicas e truques
- [ ] Limitações conhecidas
- [ ] Boas práticas

---

**🎯 Templates consistentes garantem documentação de alta qualidade em todo o projeto!** 