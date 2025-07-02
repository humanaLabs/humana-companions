# 🚀 Performance Tests

Este diretório contém testes específicos de performance para prevenir regressões e monitorar a saúde do sistema.

## 📊 Propósito

Estes testes foram criados para prevenir problemas de performance como os que identificamos:

1. **Tempo de resposta de 7.6 segundos** → Deve ser < 3 segundos
2. **Recriação de modelos Azure** → Modelos devem ser cachados
3. **Erros SQL no incrementUsage** → Operações DB devem ser rápidas
4. **Modificação de headers immutáveis** → Verificação de quota eficiente

## 🧪 Tipos de Teste

### `chat-performance.test.ts`
- ⚡ **Tempo de resposta**: Chat deve responder em < 3 segundos
- 🔄 **Concorrência**: Múltiplas requisições simultâneas
- 📊 **Compilação**: Detecta delays de compilação em produção
- 💾 **Cache de modelos**: Verifica consistência de tempo de resposta
- 🛡️ **Verificação de quota**: Performance da validação
- 🗄️ **Operações DB**: Detecta erros SQL
- 🚨 **Alertas de regressão**: Thresholds automáticos

### `azure-caching.test.ts`
- 🔥 **Cache de modelos**: Modelos Azure não devem ser recriados
- 🌐 **Cache entre endpoints**: Cache deve funcionar em toda a API
- 💾 **Uso de memória**: Detecta vazamentos de memória
- ⚙️ **Configuração**: Validação de config deve ser feita uma vez só

## 🏃 Como Executar

### Todos os testes de performance:
```bash
npm test -- tests/performance
```

### Teste específico:
```bash
npm test -- tests/performance/chat-performance.test.ts
```

### Com relatório detalhado:
```bash
npm test -- tests/performance --reporter=html
```

## 📈 Métricas de Baseline

### ✅ Performance Ideal:
- **Chat simples**: < 1 segundo
- **Chat complexo**: < 2 segundos
- **Compilação**: 0ms (produção)
- **Cache hit**: Tempo consistente

### ⚠️ Performance Aceitável:
- **Chat simples**: < 2 segundos
- **Chat complexo**: < 3 segundos
- **Variance de cache**: < 1 segundo

### 🚨 Performance Crítica:
- **Qualquer resposta**: > 5 segundos
- **Erros SQL**: Qualquer erro
- **Recriação de modelos**: Logs repetidos

## 🔧 Configuração CI/CD

Adicione aos workflows de CI:

```yaml
- name: Performance Tests
  run: npm test -- tests/performance
  env:
    PERFORMANCE_THRESHOLD: strict
```

## 📋 Checklist de Performance

Antes de fazer deploy:

- [ ] Testes de performance passando
- [ ] Tempo de resposta < 3 segundos
- [ ] Nenhum erro SQL nos logs
- [ ] Azure models sendo cachados
- [ ] Headers de request não sendo modificados

## 🚨 Alertas de Regressão

Os testes incluem alertas automáticos:

- **🚨 CRITICAL** (>5s): Falha o teste
- **🚨 WARNING** (>3s): Log de erro
- **⚠️ NOTICE** (>2s): Log de aviso
- **✅ EXCELLENT** (<1s): Log de sucesso

## 🔍 Debugging Performance

Se os testes falharem:

1. **Verifique os logs** para erros SQL
2. **Monitore** recriação de modelos Azure
3. **Analise** tempos de resposta individuais
4. **Compare** com baseline anterior
5. **Execute testes localmente** para investigar

## 📚 Recursos

- [Playwright Performance Testing](https://playwright.dev/docs/api/class-request)
- [Azure AI SDK Performance](https://sdk.vercel.ai/docs)
- [Next.js Performance Monitoring](https://nextjs.org/docs/advanced-features/measuring-performance) 