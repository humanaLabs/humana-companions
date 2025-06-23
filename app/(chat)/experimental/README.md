# Área Experimental 🧪

Esta é uma área isolada e segura para desenvolvimento e teste de novos componentes e funcionalidades da aplicação Humana Companions.

## Estrutura

```
experimental/
├── page.tsx                    # Dashboard principal
├── components/                 # Laboratório de componentes
│   └── page.tsx
├── api-playground/            # Playground para APIs
│   └── page.tsx
├── api/                       # APIs experimentais
│   └── experimental/
│       └── route.ts
└── README.md                  # Esta documentação
```

## Funcionalidades

### 🎨 Laboratório de Componentes (`/experimental/components`)
- Teste de novos componentes UI
- Playground interativo para componentes
- Variações de design e interação
- Componentes experimentais isolados

### 🚀 API Playground (`/experimental/api-playground`)
- Interface para testar APIs experimentais
- Configuração de requisições HTTP
- Visualização de respostas
- Documentação de endpoints

### 🔧 APIs Experimentais (`/api/experimental`)
- Endpoints seguros para teste
- Logs isolados (não salvos no banco)
- Autenticação obrigatória
- Dados não persistidos

## Segurança e Isolamento

### ✅ Medidas de Segurança
- **Autenticação obrigatória**: Apenas usuários logados podem acessar
- **Dados não persistidos**: Informações experimentais não são salvas no banco
- **Logs isolados**: Logs experimentais ficam separados dos logs de produção
- **Ambiente controlado**: Funcionalidades isoladas do resto da aplicação

### 🛡️ Proteções Implementadas
- Verificação de sessão em todas as rotas
- APIs experimentais com middleware de segurança
- Dados de teste apenas em memória/logs
- Interface claramente marcada como experimental

## Como Usar

### Para Desenvolvedores

1. **Acesse a área experimental**:
   - Faça login na aplicação
   - Clique em "Experimental" no menu lateral
   - Verá o dashboard com todas as opções

2. **Teste componentes**:
   - Vá para "Laboratório de Componentes"
   - Explore os diferentes tipos de componentes
   - Use o playground para testar variações

3. **Teste APIs**:
   - Acesse "API Playground"
   - Configure requisições HTTP
   - Teste endpoints experimentais
   - Visualize respostas em tempo real

### Para Adicionar Novos Experimentos

1. **Novos Componentes**:
   ```tsx
   // components/experimental/meu-componente.tsx
   export function MeuComponenteExperimental() {
     return <div>Meu componente experimental</div>;
   }
   ```

2. **Novas APIs**:
   ```typescript
   // app/(chat)/api/experimental/minha-api/route.ts
   export async function GET() {
     // Sua lógica experimental aqui
   }
   ```

3. **Novas Páginas**:
   ```tsx
   // app/(chat)/experimental/minha-feature/page.tsx
   export default function MinhaFeaturePage() {
     // Sua página experimental aqui
   }
   ```

## Boas Práticas

### ✅ Faça
- Sempre autentique usuários
- Use prefixos claros para componentes experimentais
- Documente experimentos no código
- Mantenha logs organizados
- Teste isoladamente

### ❌ Não Faça
- Salvar dados experimentais no banco de produção
- Misturar código experimental com produção
- Remover avisos de "experimental"
- Usar em produção sem testes adequados
- Expor dados sensíveis

## Estrutura de Arquivos

### Componentes Experimentais
```
components/experimental/
├── experimental-button.tsx    # Botões com variações
├── experimental-card.tsx      # Cards experimentais
└── experimental-form.tsx      # Formulários de teste
```

### APIs Experimentais
```
app/(chat)/api/experimental/
├── route.ts                   # API principal
├── test/
│   └── route.ts              # Endpoints de teste
└── debug/
    └── route.ts              # Debug e logs
```

## Monitoramento

### Logs
- Logs experimentais ficam separados
- Não são persistidos no banco
- Apenas em console/arquivos temporários

### Métricas
- Uso de funcionalidades experimentais
- Performance de componentes
- Erros e exceções isolados

## Roadmap

### 🚧 Em Desenvolvimento
- [ ] Sistema de feature flags
- [ ] Métricas avançadas
- [ ] Testes automatizados
- [ ] Integração com CI/CD

### 💡 Futuras Funcionalidades
- [ ] A/B testing framework
- [ ] Componentes com variações automáticas
- [ ] Dashboard de métricas
- [ ] Feedback de usuários

## Contribuição

Para contribuir com a área experimental:

1. Crie sua funcionalidade na pasta apropriada
2. Adicione documentação
3. Teste isoladamente
4. Faça commit com prefixo `feat(experimental):`
5. Abra PR para revisão

## Suporte

Para dúvidas ou problemas:
- Verifique os logs experimentais
- Consulte esta documentação
- Abra uma issue no repositório
- Contate a equipe de desenvolvimento 