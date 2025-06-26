# 🚀 Blueprints - Humana App Generator

Este diretório contém os **blueprints** (plantas arquiteturais) do **Humana App Generator**, uma aplicação que implementa todos os padrões e metodologias aprendidas no desenvolvimento do Humana AI Companions para acelerar a criação de novos projetos.

## 📋 **Índice de Blueprints**

### **🎯 Core System**
- **[01-visao-produto](./01-visao-produto.md)** - Visão do produto e objetivos
- **[02-arquitetura-generator](./02-arquitetura-generator.md)** - Arquitetura do sistema gerador
- **[03-templates-engine](./03-templates-engine.md)** - Engine de templates e geração
- **[04-ai-integration](./04-ai-integration.md)** - Integração com IA para geração automática

### **🎨 UI/UX & Design**
- **[05-design-system](./05-design-system.md)** - Sistema de design e componentes
- **[06-interface-generator](./06-interface-generator.md)** - Interface do gerador
- **[07-preview-system](./07-preview-system.md)** - Sistema de preview em tempo real

### **⚙️ Technical & Development**
- **[08-development-workflow](./08-development-workflow.md)** - Workflow de desenvolvimento
- **[09-testing-strategy](./09-testing-strategy.md)** - Estratégia de testes
- **[10-deployment](./10-deployment.md)** - Deploy e distribuição

## 🎯 **Objetivo Principal**

O **Humana App Generator** é uma aplicação que demonstra e implementa:

1. **Metodologia de Blueprints**: Como estruturar e documentar projetos complexos
2. **Padrões de Desenvolvimento**: Aplicação dos padrões estabelecidos no Humana Companions
3. **Geração Automática**: Uso de IA para acelerar a criação de aplicações
4. **Best Practices**: Implementação de melhores práticas de desenvolvimento

## 🚀 **Como Usar**

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Gerar nova aplicação
pnpm generate

# Criar novo blueprint
pnpm blueprint
```

## 📁 **Estrutura do Projeto**

```
humana-app-generator/
├── blueprints/          # Documentação arquitetural
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Componentes React
│   ├── lib/           # Utilitários e lógica
│   └── styles/        # Estilos globais
├── scripts/           # Scripts de automação
└── docs/             # Documentação adicional
```

## 🎨 **Design Philosophy**

- **Simplicidade**: Interface limpa e intuitiva
- **Velocidade**: Geração rápida de aplicações
- **Flexibilidade**: Templates customizáveis
- **Qualidade**: Código gerado seguindo best practices

## 🔧 **Tecnologias**

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **AI SDK** - Integração com IA
- **Radix UI** - Componentes base
- **Zod** - Validação de schemas

---

*Este projeto serve como exemplo prático de como aplicar metodologias de blueprints e padrões de desenvolvimento para criar aplicações robustas e escaláveis.* 