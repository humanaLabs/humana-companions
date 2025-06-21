import { createAzure } from '@ai-sdk/azure';

/**
 * @description Configuração do Azure OpenAI
 * Usando a abordagem padrão do AI SDK para Azure
 */
export const azureConfig = {
  apiKey: process.env.AZURE_API_KEY,
  resourceName: '1aifoundry',
  deploymentName: 'gpt-4o',
} as const;

/**
 * @description Verifica se as configurações do Azure estão disponíveis
 */
export const isAzureConfigured = !!(azureConfig.apiKey && azureConfig.resourceName);

if (isAzureConfigured) {
  console.log('✅ Azure configurado:', {
    hasApiKey: true,
    resourceName: azureConfig.resourceName,
    deploymentName: azureConfig.deploymentName,
  });
} else {
  console.warn('⚠️ Azure não configurado. Configure AZURE_API_KEY no .env.local');
  console.log('Configuração atual:', {
    hasApiKey: !!azureConfig.apiKey,
    resourceName: azureConfig.resourceName,
  });
}

/**
 * @description Instância do provider Azure configurada usando apenas as configurações básicas
 */
export const azureInstance = isAzureConfigured ? createAzure({
  resourceName: azureConfig.resourceName,
  apiKey: azureConfig.apiKey!,
  // Deixar o SDK usar a versão padrão da API
}) : null;

/**
 * @description Cria uma instância do modelo Azure se configurado
 */
export function createAzureModel() {
  if (!azureInstance) {
    console.warn('Azure OpenAI não está configurado');
    return null;
  }
  
  try {
    console.log(`🔄 Criando modelo Azure com deployment: ${azureConfig.deploymentName}`);
    const model = azureInstance(azureConfig.deploymentName);
    console.log(`✅ Modelo Azure criado: ${azureConfig.deploymentName}`);
    return model;
  } catch (error) {
    console.error(`❌ Erro ao criar modelo Azure:`, error);
    return null;
  }
}

/**
 * @description Cria modelo Azure para geração de imagens
 */
export function createAzureImageModel(modelName: string) {
  if (!azureInstance) {
    return null;
  }
  
  try {
    const model = azureInstance.imageModel(modelName);
    console.log(`✅ Modelo de imagem Azure criado: ${modelName}`);
    return model;
  } catch (error) {
    console.error(`❌ Erro ao criar modelo de imagem Azure ${modelName}:`, error);
    return null;
  }
}

/**
 * @description Modelos Azure OpenAI disponíveis
 */
export const azureModels = {
  'gpt-4o': 'gpt-4o',
} as const;

/**
 * @description Configurações recomendadas para diferentes casos de uso
 */
export const azureModelConfigs = {
  chat: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4000,
  },
  reasoning: {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 8000,
  },
  title: {
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 100,
  },
  artifact: {
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 6000,
  },
} as const; 