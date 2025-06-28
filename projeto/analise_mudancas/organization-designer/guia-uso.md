# 👥 Guia de Uso - Organization Designer

## 🎯 Visão Geral

O **Organization Designer** é uma ferramenta poderosa que permite criar e gerenciar estruturas organizacionais completas, incluindo hierarquias, equipes, valores e companions de IA personalizados para cada posição.

## 🚀 Primeiros Passos

### **Acessando o Organization Designer**

1. **Login na plataforma** Humana Companions
2. **Clique em "Organization Designer"** no menu lateral esquerdo
3. **Visualize suas organizações** existentes ou crie uma nova

### **Tela Principal**

A tela principal exibe:
- **📊 Estatísticas** das suas organizações
- **🏢 Cards das organizações** com informações resumidas
- **➕ Botão "Nova Organização"** para criar uma nova
- **🤖 Contador de Companions** gerados automaticamente

---

## ✨ Criando uma Nova Organização

### **Opção 1: Geração Automática com IA (Recomendado)**

1. **Clique em "Nova Organização"**
2. **Preencha os 3 campos básicos:**
   - **Nome da Organização**: Ex: "Humana AI"
   - **Descrição**: Ex: "Plataforma de aprendizado corporativo com IA"
   - **Estrutura Organizacional**: Ex: "CEO, CTO, Head de Produto, Desenvolvedor Senior, Designer UX"

3. **Clique em "Gerar com IA"**
4. **Aguarde a geração** (pode levar alguns segundos)
5. **Revise a estrutura gerada** e faça ajustes se necessário

#### **🎯 Dicas para Melhor Geração**
- **Seja específico na descrição**: Inclua o setor, foco e objetivos
- **Liste cargos relevantes**: Use títulos claros e hierárquicos
- **Inclua contexto**: Ex: "Startup de tecnologia focada em IA para educação"

### **Opção 2: Criação Manual**

1. **Clique em "Nova Organização"**
2. **Preencha manualmente todos os campos:**
   - Configurações do Tenant
   - Valores Organizacionais
   - Equipes
   - Posições/Cargos
   - Usuários da Organização

---

## 🏗️ Estrutura de uma Organização

### **⚙️ Configurações do Tenant**

Define configurações globais da organização:

- **🌍 Timezone**: Fuso horário (ex: America/Sao_Paulo)
- **🗣️ Idioma**: Idioma padrão (ex: pt-BR)
- **🤖 Provedor LLM**: Serviço de IA (ex: azure-openai)
- **🧠 Modelo Padrão**: Modelo de IA (ex: gpt-4o)

### **🎯 Valores Organizacionais**

Definem a cultura e princípios da empresa:

- **Nome do Valor**: Ex: "Inovação"
- **Descrição**: Ex: "Buscamos sempre novas soluções tecnológicas"
- **Princípios**: Lista de comportamentos esperados
  - Ex: "Experimentar novas tecnologias"
  - Ex: "Questionar o status quo"
  - Ex: "Propor melhorias contínuas"

### **👥 Equipes**

Grupos de trabalho dentro da organização:

- **ID da Equipe**: Identificador único (ex: "team_product")
- **Nome da Equipe**: Nome amigável (ex: "Produto")
- **Descrição**: Propósito da equipe
- **Membros**: Lista de IDs dos usuários

### **💼 Posições/Cargos**

Estrutura hierárquica da organização:

- **ID da Posição**: Identificador único (ex: "pos_ceo")
- **Título da Posição**: Nome do cargo (ex: "Chief Executive Officer")
- **Descrição**: Responsabilidades gerais
- **Reporta Para**: Posição superior na hierarquia
- **R&Rs**: Lista detalhada de responsabilidades
- **Companions**: IAs vinculadas a esta posição

### **👤 Usuários da Organização**

Pessoas que fazem parte da organização:

- **ID do Usuário**: Identificador do usuário
- **ID da Posição**: Cargo que ocupa
- **Papel**: admin, member, viewer
- **Permissões**: Lista de permissões específicas

---

## 🤖 Companions Automáticos

### **Como Funciona**

Quando você cria uma organização (especialmente via IA), o sistema:

1. **Analisa cada posição** criada na estrutura
2. **Gera um Companion personalizado** para cada cargo
3. **Vincula automaticamente** o Companion à posição e equipe
4. **Define responsabilidades específicas** baseadas no cargo
5. **Configura expertise** relevante para a função

### **Exemplos de Companions Gerados**

#### **CEO.ai**
- **Papel**: Chief Executive Officer AI Assistant
- **Responsabilidades**:
  - Definir estratégia organizacional
  - Tomar decisões executivas
  - Representar a empresa
- **Expertise**: Liderança Estratégica, Visão de Negócio

#### **CTO.ai**
- **Papel**: Chief Technology Officer AI Assistant
- **Responsabilidades**:
  - Liderar estratégia tecnológica
  - Supervisionar desenvolvimento
  - Avaliar novas tecnologias
- **Expertise**: Arquitetura de Software, Gestão Técnica

### **Personalizando Companions**

1. **Acesse a página da organização**
2. **Clique no número de Companions** no card
3. **Selecione o Companion** que deseja editar
4. **Modifique conforme necessário**:
   - Nome e papel
   - Responsabilidades
   - Áreas de expertise
   - Regras de comportamento

---

## ✏️ Editando uma Organização

### **Acessando a Edição**

1. **Clique no card da organização** na lista principal
2. **Você será direcionado** para a página de edição
3. **Faça as alterações necessárias**
4. **Clique em "Salvar"** para confirmar

### **Campos Editáveis**

Todos os campos podem ser editados:
- ✅ Nome e descrição da organização
- ✅ Configurações do tenant
- ✅ Valores organizacionais e princípios
- ✅ Equipes e membros
- ✅ Posições e hierarquia
- ✅ Usuários e permissões

### **🔧 Dicas de Edição**

#### **Adicionando Itens a Listas**
- **Digite o texto** no campo
- **Pressione Enter** ou clique no botão "+"
- **O item será adicionado** à lista

#### **Removendo Itens**
- **Clique no "X"** ao lado do item
- **O item será removido** imediatamente

#### **Editando Itens Existentes**
- **Clique no item** para editá-lo inline
- **Faça as alterações**
- **Pressione Enter** para confirmar

---

## 🎨 Interface e Usabilidade

### **💡 Tooltips Informativos**

Todos os campos possuem ícones **(i)** com explicações:
- **Passe o mouse** sobre o ícone
- **Leia a explicação** do campo
- **Entenda melhor** como preencher

### **📱 Design Responsivo**

A interface se adapta a diferentes tamanhos de tela:
- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado
- **Mobile**: Interface otimizada para touch

### **🎯 Campos Obrigatórios**

Campos marcados com **asterisco (*)** são obrigatórios:
- Nome da organização
- Descrição
- Configurações básicas do tenant

---

## 📊 Visualizando Estatísticas

### **Dashboard Principal**

A tela inicial mostra:
- **📈 Total de organizações** criadas
- **🤖 Total de companions** gerados
- **👥 Usuários ativos** nas organizações
- **📅 Atividade recente**

### **Estatísticas por Organização**

Cada card de organização exibe:
- **📋 Nome e descrição**
- **🤖 Número de companions** vinculados
- **👥 Número de posições** definidas
- **🏢 Número de equipes** criadas
- **📅 Data de criação**

---

## 🔄 Fluxos de Trabalho Recomendados

### **🚀 Para Startups**

1. **Comece simples**: CEO, CTO, Desenvolvedor
2. **Use geração automática** para estrutura básica
3. **Refine os companions** conforme necessário
4. **Expanda gradualmente** conforme crescimento

### **🏢 Para Empresas Médias**

1. **Mapeie departamentos** existentes
2. **Defina hierarquia clara** com reportes
3. **Crie equipes por função** (Produto, Eng, Marketing)
4. **Personalize valores** organizacionais específicos

### **🏭 Para Grandes Corporações**

1. **Comece com uma divisão** ou departamento
2. **Teste a estrutura** antes de expandir
3. **Replique padrões** para outras áreas
4. **Integre com sistemas** existentes de RH

---

## 🔧 Solução de Problemas

### **❌ Erro na Geração com IA**

**Problema**: "Falha ao gerar organização"
**Soluções**:
- Verifique se todos os 3 campos estão preenchidos
- Simplifique a descrição se estiver muito complexa
- Tente novamente após alguns segundos
- Use criação manual como alternativa

### **💾 Erro ao Salvar**

**Problema**: "Erro ao salvar organização"
**Soluções**:
- Verifique conexão com internet
- Confirme que todos os campos obrigatórios estão preenchidos
- Recarregue a página e tente novamente
- Verifique se não há caracteres especiais problemáticos

### **🔒 Erro de Permissão**

**Problema**: "Acesso negado"
**Soluções**:
- Confirme que está logado
- Verifique se é o proprietário da organização
- Faça logout e login novamente
- Contate o suporte se persistir

### **🤖 Companions Não Aparecem**

**Problema**: Companions não foram criados
**Soluções**:
- Aguarde alguns segundos após criação
- Recarregue a página
- Verifique se as posições foram criadas corretamente
- Crie companions manualmente se necessário

---

## 💡 Dicas Avançadas

### **🎯 Otimizando Prompts de IA**

Para melhor geração automática:

```
❌ Ruim: "Empresa de tecnologia"
✅ Bom: "Startup de IA focada em educação corporativa, com 20 funcionários, atuando no mercado B2B brasileiro"
```

### **📝 Estruturando Org Charts**

```
❌ Ruim: "Gerente, Funcionário, Chefe"
✅ Bom: "CEO, CTO, Head de Produto, Senior Developer, UX Designer, Marketing Manager"
```

### **🎨 Personalizando Valores**

Seja específico nos valores organizacionais:

```
❌ Genérico: "Qualidade"
✅ Específico: "Excelência Técnica - Priorizamos código limpo, testes abrangentes e documentação clara"
```

### **🔗 Vinculando Equipes**

Organize equipes por função:
- **team_product**: Produto e Design
- **team_engineering**: Desenvolvimento
- **team_growth**: Marketing e Vendas
- **team_operations**: Operações e RH

---

## 📚 Casos de Uso Práticos

### **🎓 Empresa de Educação**

```yaml
Organização: "EduTech Solutions"
Descrição: "Plataforma de e-learning com IA para escolas"
Estrutura:
  - CEO (Visão estratégica)
  - Head Pedagógico (Currículo e conteúdo)
  - CTO (Plataforma técnica)
  - UX Designer (Experiência do aluno)
  - Desenvolvedor (Implementação)
```

### **🏥 Healthtech**

```yaml
Organização: "MedAI Solutions"
Descrição: "IA para diagnóstico médico"
Estrutura:
  - CEO (Estratégia e regulamentação)
  - Chief Medical Officer (Validação clínica)
  - Head de IA (Algoritmos e modelos)
  - Engenheiro de Dados (Pipeline de dados)
  - Especialista Regulatório (Compliance)
```

### **💰 Fintech**

```yaml
Organização: "PayTech Brasil"
Descrição: "Soluções de pagamento digital"
Estrutura:
  - CEO (Visão e parcerias)
  - CTO (Arquitetura e segurança)
  - Head de Produto (UX financeira)
  - Engenheiro Backend (APIs e integrações)
  - Especialista em Compliance (Regulamentação)
```

---

## 🎯 Melhores Práticas

### **✅ Faça**

- **Use nomes descritivos** para posições e equipes
- **Defina hierarquias claras** com reportes
- **Personalize companions** após geração automática
- **Revise e atualize** regularmente a estrutura
- **Teste diferentes configurações** antes de finalizar

### **❌ Evite**

- **Estruturas muito complexas** inicialmente
- **Nomes genéricos** para posições
- **Hierarquias circulares** (A reporta para B que reporta para A)
- **Equipes sem propósito claro**
- **Valores organizacionais vagos**

---

## 🆘 Suporte e Ajuda

### **📞 Canais de Suporte**

- **💬 Chat interno**: Disponível na plataforma
- **📧 Email**: suporte@humana.ai
- **📖 Documentação**: Este guia e documentação técnica
- **🎥 Tutoriais**: Vídeos explicativos (em breve)

### **🐛 Reportando Bugs**

Ao reportar problemas, inclua:
- **Passos para reproduzir** o erro
- **Screenshots** da tela de erro
- **Informações do navegador** (Chrome, Firefox, etc.)
- **ID da organização** afetada (se aplicável)

### **💡 Sugestões de Melhoria**

Estamos sempre melhorando! Envie sugestões sobre:
- **Novas funcionalidades** desejadas
- **Melhorias na interface**
- **Integrações** com outras ferramentas
- **Casos de uso** específicos da sua empresa

---

## 🔄 Atualizações e Roadmap

### **🆕 Funcionalidades Recentes**

- ✅ Geração automática com IA
- ✅ Companions vinculados a posições
- ✅ Interface de edição melhorada
- ✅ Tooltips informativos
- ✅ Estatísticas detalhadas

### **🚀 Próximas Funcionalidades**

- 🔄 **Importação/Exportação** de estruturas organizacionais
- 🔄 **Templates pré-definidos** por setor
- 🔄 **Integração com RH** (importar funcionários)
- 🔄 **Relatórios avançados** de utilização
- 🔄 **Colaboração em equipe** (múltiplos editores)

### **📅 Timeline Estimado**

- **Q1 2024**: Templates e importação/exportação
- **Q2 2024**: Integrações com sistemas de RH
- **Q3 2024**: Relatórios e analytics avançados
- **Q4 2024**: Colaboração e permissões granulares

---

*Este guia é atualizado regularmente. Última atualização: Janeiro 2024* 