import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { createAzureModel, createAzureImageModel, isAzureConfigured } from './azure-config';

// Cache para evitar recriação de modelos a cada requisição
let azureModelsCache: Record<string, any> | null = null;
let azureImageModelsCache: Record<string, any> | null = null;

// Função auxiliar para configurar o modelo GPT-4o do Azure
function getValidAzureModels() {
  // Retornar do cache se já foi criado
  if (azureModelsCache) {
    return azureModelsCache;
  }

  if (!isAzureConfigured) {
    console.warn('⚠️  Azure OpenAI não está configurado. Configure AZURE_API_KEY no arquivo .env.local');
    azureModelsCache = {};
    return azureModelsCache;
  }
  
  const models: Record<string, any> = {};
  
  // Configurar apenas o GPT-4o para todas as funcionalidades
  const azureGpt4o = createAzureModel();
  
  if (azureGpt4o) {
    // Mapear todos os modelos padrão para o mesmo modelo Azure GPT-4o
    models['chat-model'] = azureGpt4o;
    models['artifact-model'] = azureGpt4o;
    models['title-model'] = azureGpt4o;
    models['chat-model-reasoning'] = wrapLanguageModel({
      model: azureGpt4o,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
    
    console.log('✅ Azure GPT-4o configurado para todos os modelos');
  } else {
    console.error('❌ Falha ao criar modelo Azure GPT-4o');
  }
  
  // Cachear para próximas requisições
  azureModelsCache = models;
  return models;
}

// Função auxiliar para modelos de imagem válidos do Azure
function getValidAzureImageModels() {
  // Retornar do cache se já foi criado
  if (azureImageModelsCache) {
    return azureImageModelsCache;
  }

  if (!isAzureConfigured) {
    azureImageModelsCache = {};
    return azureImageModelsCache;
  }
  
  const models: Record<string, any> = {};
  
  const azureDalle3 = createAzureImageModel('dall-e-3');
  if (azureDalle3) {
    models['image-model'] = azureDalle3;
  }
  
  // Cachear para próximas requisições
  azureImageModelsCache = models;
  return models;
}

// Função de fallback para quando Azure não estiver configurado
function getFallbackModels() {
  console.warn('🔄 Usando modelos OpenAI como fallback. Configure Azure para melhor performance.');
  return {
    'chat-model': openai('gpt-4o'),
    'chat-model-reasoning': wrapLanguageModel({
      model: openai('gpt-4o'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4o'),
    'artifact-model': openai('gpt-4o'),
  };
}

function getFallbackImageModels() {
  return {
    'image-model': openai.image('dall-e-3'),
  };
}

const languageModels = isAzureConfigured ? getValidAzureModels() : getFallbackModels();
const imageModels = isAzureConfigured ? getValidAzureImageModels() : getFallbackImageModels();

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels,
      imageModels,
    });

// Exportar configuração para uso em outros lugares
export { isAzureConfigured };
