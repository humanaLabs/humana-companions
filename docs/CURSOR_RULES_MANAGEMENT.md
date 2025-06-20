# Gerenciamento das Regras do Cursor

## 📋 Visão Geral

Este documento define o **processo de manutenção e atualização das regras do Cursor** (`.cursor/rules/`) para garantir que a IA tenha sempre o contexto mais atualizado da nossa implementação.

## 🎯 Importância das Regras

### Por que são Críticas?
- **Contexto específico** - IA entende nossa arquitetura única
- **Evita problemas** - Previne "estragar código" com modificações inadequadas
- **Acelera desenvolvimento** - IA sugere soluções alinhadas com nossos padrões
- **Mantém consistência** - Garante que todas as modificações sigam os mesmos padrões

### Impacto de Regras Desatualizadas
- ❌ IA sugere padrões obsoletos
- ❌ Modificações que quebram a arquitetura
- ❌ Inconsistência entre componentes
- ❌ Retrabalho e bugs desnecessários

## 📁 Estrutura Atual das Regras

```
.cursor/rules/
├── humana-architecture.mdc        # Arquitetura geral e padrões
├── humana-ui-modifications.mdc    # Modificações seguras de UI
├── humana-dify-integration.mdc    # Integração Dify completa
├── humana-planning-system.mdc     # Sistema de análise de mudanças
├── ai-sdk-guides.mdc             # Guias do AI SDK
├── shadcn-usage.mdc              # Uso do shadcn/ui
├── tailwindcss-v4.mdc            # TailwindCSS v4
└── [outras regras específicas]
```

## 🔄 Processo de Atualização

### 1. Gatilhos para Atualização

#### Gatilhos Obrigatórios (Sempre atualizar)
- [ ] **Nova integração** implementada (APIs, serviços)
- [ ] **Mudança arquitetural** significativa
- [ ] **Novos componentes** ou padrões criados
- [ ] **Modificação de schemas** de banco de dados
- [ ] **Atualização de dependências** principais (Next.js, React, etc.)

#### Gatilhos Recomendados (Avaliar necessidade)
- [ ] **Novos helpers** ou utilities criados
- [ ] **Refatoração** de componentes existentes
- [ ] **Mudanças de configuração** (Tailwind, TypeScript, etc.)
- [ ] **Descoberta de bugs** relacionados a sugestões da IA

### 2. Frequência de Revisão

#### Revisão Semanal (Toda segunda-feira)
- [ ] Verificar se houve mudanças significativas na semana
- [ ] Atualizar regras se necessário
- [ ] Testar sugestões da IA com novo código

#### Revisão Mensal (Primeira semana do mês)
- [ ] Revisão completa de todas as regras
- [ ] Verificar se regras estão sendo seguidas pela IA
- [ ] Otimizar regras baseado na experiência

#### Revisão Trimestral (A cada 3 meses)
- [ ] Análise de eficácia das regras
- [ ] Reorganização e limpeza
- [ ] Atualização de templates e exemplos

## 📝 Templates de Atualização

### Template: Nova Integração
```markdown
## [Nome da Integração] - Adicionado em [Data]

### Localização
- Arquivos principais: `lib/[nome]/`
- Componentes: `components/[nome]/`
- Tipos: `lib/types.ts` (seção [Nome])

### Padrões Específicos
- **Configuração**: [Como configurar]
- **Uso**: [Como usar nos componentes]
- **Error Handling**: [Padrão de tratamento de erro]
- **Types**: [Tipos TypeScript específicos]

### Exemplo de Uso
```typescript
// Exemplo prático de implementação
```

### Red Flags
- ❌ Não usar [padrão incorreto]
- ❌ Evitar [anti-padrão]
- ✅ Sempre usar [padrão correto]
```

### Template: Mudança de Componente
```markdown
## [Nome do Componente] - Atualizado em [Data]

### Mudanças
- **Antes**: [Como era]
- **Depois**: [Como ficou]
- **Motivo**: [Por que mudou]

### Novos Padrões
- **Props**: [Novas props ou mudanças]
- **Uso**: [Como usar agora]
- **Styling**: [Mudanças de estilo]

### Migração
- **Automática**: [O que migra sozinho]
- **Manual**: [O que precisa ser ajustado]

### Exemplo Atualizado
```tsx
// Exemplo com novo padrão
```
```

## 🛠️ Processo Prático

### Passo 1: Identificar Necessidade
```bash
# Verificar mudanças recentes
git log --oneline --since="1 week ago" | grep -E "(feat|refactor|fix):"

# Verificar arquivos modificados
git diff --name-only HEAD~7..HEAD
```

### Passo 2: Analisar Impacto
- **Quais regras** são afetadas?
- **Novos padrões** foram criados?
- **Padrões antigos** foram deprecados?
- **Exemplos** precisam ser atualizados?

### Passo 3: Atualizar Regras
1. **Abrir arquivo** da regra específica
2. **Localizar seção** relevante
3. **Adicionar/atualizar** informações
4. **Atualizar exemplos** se necessário
5. **Adicionar red flags** se aplicável

### Passo 4: Testar Atualização
1. **Fazer pergunta** à IA sobre o novo padrão
2. **Verificar se resposta** está alinhada
3. **Testar modificação** de código relacionado
4. **Ajustar regra** se necessário

### Passo 5: Documentar Mudança
```markdown
## Changelog - [Data]

### Atualizações
- **humana-architecture.mdc**: Adicionado padrão X
- **humana-ui-modifications.mdc**: Atualizado componente Y
- **humana-dify-integration.mdc**: Corrigido exemplo Z

### Motivo
[Breve explicação do que motivou as mudanças]

### Testado
- [x] IA sugere novos padrões corretamente
- [x] Modificações seguem guidelines atualizadas
```

## 📊 Checklist de Qualidade

### Para Cada Regra Atualizada
- [ ] **Exemplos práticos** incluídos
- [ ] **Red flags** claramente definidos
- [ ] **Contexto específico** da nossa implementação
- [ ] **Linguagem clara** e objetiva
- [ ] **Estrutura consistente** com outras regras

### Para o Conjunto de Regras
- [ ] **Não há contradições** entre regras
- [ ] **Cobertura completa** dos padrões principais
- [ ] **Atualizado** com últimas mudanças
- [ ] **Testado** com IA
- [ ] **Documentado** no changelog

## 🚨 Red Flags - Quando Atualizar URGENTE

### Sinais de Alerta
- 🔴 **IA sugere padrões incorretos** repetidamente
- 🔴 **Modificações quebram** funcionalidades existentes
- 🔴 **Inconsistência** entre sugestões da IA
- 🔴 **Padrões obsoletos** sendo sugeridos
- 🔴 **Falta de contexto** sobre novas funcionalidades

### Ação Imediata
1. **Parar desenvolvimento** relacionado
2. **Identificar regra** problemática
3. **Atualizar imediatamente**
4. **Testar correção**
5. **Comunicar equipe**

## 📚 Documentação de Referência

### Para Cada Tipo de Regra

#### humana-architecture.mdc
- **Fonte**: `docs/arquitetura_geral/ARQUITETURA_MODULAR.md`
- **Foco**: Padrões arquiteturais gerais
- **Atualizar quando**: Mudanças estruturais

#### humana-ui-modifications.mdc
- **Fonte**: `docs/arquitetura_geral/GUIA_MODIFICACOES_UI.md`
- **Foco**: Modificações seguras de interface
- **Atualizar quando**: Novos componentes ou padrões de UI

#### humana-dify-integration.mdc
- **Fonte**: `docs/dify/` + análise do código
- **Foco**: Integração com agentes Dify
- **Atualizar quando**: Mudanças na integração Dify

#### humana-planning-system.mdc
- **Fonte**: `docs/analise_mudancas/`
- **Foco**: Sistema de análise de mudanças
- **Atualizar quando**: Mudanças no processo de análise

## 🔧 Ferramentas de Apoio

### Scripts Úteis
```bash
# Verificar quando regras foram atualizadas
ls -la .cursor/rules/ | grep "\.mdc$"

# Contar linhas das regras
wc -l .cursor/rules/*.mdc

# Procurar padrão específico nas regras
grep -r "padrão_específico" .cursor/rules/
```

### Validação Automática
```bash
# Script para validar consistência das regras
# TODO: Criar script de validação
npm run validate:cursor-rules
```

## 🎯 Melhores Práticas

### Do's ✅
- **Seja específico** - Use exemplos da nossa base de código
- **Seja conciso** - IA funciona melhor com instruções claras
- **Use exemplos** - Código vale mais que descrições
- **Teste sempre** - Verifique se IA entende as regras
- **Mantenha atualizado** - Regras desatualizadas são piores que nenhuma regra

### Don'ts ❌
- **Não seja genérico** - Evite regras que se aplicam a qualquer projeto
- **Não contradiga** - Regras conflitantes confundem a IA
- **Não negligencie** - Regras desatualizadas causam problemas
- **Não seja verboso** - IA tem limite de contexto
- **Não esqueça de testar** - Regras não testadas podem não funcionar

## 📈 Métricas de Sucesso

### KPIs das Regras
- **Taxa de acerto** - % de sugestões corretas da IA
- **Tempo de desenvolvimento** - Velocidade de implementação
- **Bugs relacionados** - Problemas causados por sugestões incorretas
- **Consistência** - Aderência aos padrões estabelecidos

### Como Medir
1. **Feedback semanal** - Desenvolvedores reportam problemas
2. **Code review** - Verificar se padrões estão sendo seguidos
3. **Testes automatizados** - Detectar quebras de padrão
4. **Análise de commits** - Verificar qualidade das modificações

## 🚀 Roadmap de Evolução

### Próximos 30 dias
- [ ] Implementar processo semanal de revisão
- [ ] Criar script de validação automática
- [ ] Estabelecer métricas de qualidade

### Próximos 90 dias
- [ ] Automatizar detecção de mudanças que precisam atualizar regras
- [ ] Criar dashboard de saúde das regras
- [ ] Integrar com CI/CD para validação automática

### Próximos 6 meses
- [ ] IA auto-sugere atualizações de regras
- [ ] Sistema de versionamento das regras
- [ ] Integração com ferramentas de monitoramento

---

**🎯 Lembre-se**: Regras do Cursor bem mantidas são um **multiplicador de produtividade**. O investimento em manutenção retorna em velocidade e qualidade de desenvolvimento! 