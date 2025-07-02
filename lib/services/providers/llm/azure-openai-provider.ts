import { openai } from '@ai-sdk/openai';
import { azure } from '@ai-sdk/azure';
import { generateText, streamText } from 'ai';
import { 
  LLMProvider, 
  type LLMProviderConfig, 
  type LLMGenerationContext, 
  type LLMResponse, 
  type LLMStreamChunk, 
  type LLMModel 
} from './llm-provider-interface';
import type { ProviderMetrics, HealthCheckResult } from '../base/base-provider';

/**
 * @description Configuração específica para Azure OpenAI
 */
export interface AzureOpenAICredentials {
  apiKey: string;
  resourceName: string;
  deploymentName: string;
  apiVersion?: string;
}

/**
 * @description Implementação do Azure OpenAI provider
 */
export class AzureOpenAIProvider extends LLMProvider {
  private client: any;
  private metrics: ProviderMetrics;

  constructor(organizationId: string, config: LLMProviderConfig) {
    super(organizationId, config);
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      uptime: 100
    };
  }

  /**
   * @description Inicializar Azure OpenAI client
   */
  async initialize(): Promise<void> {
    try {
      this.validateCredentials(['apiKey', 'resourceName', 'deploymentName']);
      
      const credentials = this.getAzureCredentials();
      
      // Configurar Azure OpenAI client
      this.client = azure({
        apiKey: credentials.apiKey,
        resourceName: credentials.resourceName,
        apiVersion: credentials.apiVersion || '2024-02-01'
      });

      this.auditLog('initialize', 'azure-client', {
        resourceName: credentials.resourceName,
        deploymentName: credentials.deploymentName
      });
    } catch (error) {
      this.auditLog('initialize_failed', 'azure-client', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * @description Gerar resposta usando Azure OpenAI
   */
  async generateResponse(context: LLMGenerationContext): Promise<LLMResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const sanitizedContext = this.sanitizeContext(context);
      const credentials = this.getAzureCredentials();
      
      // Converter mensagens para formato AI SDK
      const messages = sanitizedContext.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await this.executeOperation(async () => {
        return await generateText({
          model: this.client(credentials.deploymentName),
          messages,
          temperature: sanitizedContext.temperature,
          maxTokens: sanitizedContext.maxTokens,
          topP: sanitizedContext.topP,
          frequencyPenalty: sanitizedContext.frequencyPenalty,
          presencePenalty: sanitizedContext.presencePenalty,
          // Tools support se disponível
          tools: sanitizedContext.tools ? this.convertTools(sanitizedContext.tools) : undefined
        });
      }, { context: 'generate_response' });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      const response: LLMResponse = {
        content: result.text,
        model: credentials.deploymentName,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0
        },
        finishReason: this.mapFinishReason(result.finishReason || 'stop'),
        toolCalls: result.toolCalls ? this.convertToolCalls(result.toolCalls) : undefined,
        metadata: {
          responseTime,
          provider: 'azure-openai',
          resourceName: credentials.resourceName
        }
      };

      this.auditLog('generate_response_success', 'response', {
        tokens: response.usage.totalTokens,
        responseTime,
        model: response.model
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      this.auditLog('generate_response_failed', 'response', {
        error: (error as Error).message,
        responseTime
      });
      
      throw error;
    }
  }

  /**
   * @description Gerar resposta em streaming
   */
  async* generateStream(context: LLMGenerationContext): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const sanitizedContext = this.sanitizeContext(context);
      const credentials = this.getAzureCredentials();
      
      const messages = sanitizedContext.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const stream = await this.executeOperation(async () => {
        return await streamText({
          model: this.client(credentials.deploymentName),
          messages,
          temperature: sanitizedContext.temperature,
          maxTokens: sanitizedContext.maxTokens,
          topP: sanitizedContext.topP,
          frequencyPenalty: sanitizedContext.frequencyPenalty,
          presencePenalty: sanitizedContext.presencePenalty,
          tools: sanitizedContext.tools ? this.convertTools(sanitizedContext.tools) : undefined
        });
      }, { context: 'generate_stream' });

      let totalTokens = 0;

      for await (const chunk of stream.textStream) {
        yield {
          type: 'content',
          content: chunk
        };
      }

      // Yield final chunk with usage
      const finalResult = await stream.text;
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(responseTime, true);

      yield {
        type: 'done',
        usage: {
          promptTokens: stream.usage?.promptTokens || 0,
          completionTokens: stream.usage?.completionTokens || 0,
          totalTokens: stream.usage?.totalTokens || 0
        },
        finishReason: this.mapFinishReason(stream.finishReason || 'stop')
      };

      this.auditLog('generate_stream_success', 'stream', {
        tokens: stream.usage?.totalTokens || 0,
        responseTime,
        model: credentials.deploymentName
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      this.auditLog('generate_stream_failed', 'stream', {
        error: (error as Error).message,
        responseTime
      });
      
      throw error;
    }
  }

  /**
   * @description Listar modelos disponíveis no Azure OpenAI
   */
  async getAvailableModels(): Promise<LLMModel[]> {
    // Azure OpenAI usa deployments específicos
    const credentials = this.getAzureCredentials();
    
    // Para Azure, retornamos o deployment configurado
    return [
      {
        id: credentials.deploymentName,
        name: `${credentials.deploymentName} (Azure)`,
        description: `Azure OpenAI deployment: ${credentials.deploymentName}`,
        maxTokens: this.getSetting('maxTokens', 4096),
        supportsFunctions: true,
        supportsVision: credentials.deploymentName.includes('gpt-4'),
        pricing: {
          promptTokens: 0.03, // $0.03 per 1K tokens (aproximado)
          completionTokens: 0.06 // $0.06 per 1K tokens (aproximado)
        }
      }
    ];
  }

  /**
   * @description Estimar custo baseado em tokens
   */
  async estimateCost(tokens: number, model?: string): Promise<number> {
    const models = await this.getAvailableModels();
    const targetModel = models.find(m => m.id === (model || this.getDefaultModel()));
    
    if (!targetModel?.pricing) {
      return this.calculateEstimatedCost({ 
        promptTokens: tokens * 0.7, 
        completionTokens: tokens * 0.3, 
        totalTokens: tokens 
      }, model || this.getDefaultModel());
    }

    // Estimativa: 70% prompt, 30% completion
    const promptTokens = tokens * 0.7;
    const completionTokens = tokens * 0.3;
    
    return ((promptTokens * targetModel.pricing.promptTokens) + 
            (completionTokens * targetModel.pricing.completionTokens)) / 1000;
  }

  /**
   * @description Verificar se modelo é suportado
   */
  async supportsModel(modelId: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return models.some(m => m.id === modelId);
  }

  /**
   * @description Obter métricas de uso
   */
  async getMetrics(): Promise<ProviderMetrics> {
    return { ...this.metrics };
  }

  /**
   * @description Cleanup de recursos
   */
  async dispose(): Promise<void> {
    this.client = null;
    this.auditLog('dispose', 'azure-client', {
      totalRequests: this.metrics.totalRequests,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0
    });
  }

  /**
   * @description Obter credenciais Azure de forma tipada
   */
  private getAzureCredentials(): AzureOpenAICredentials {
    return {
      apiKey: this.getCredential('apiKey'),
      resourceName: this.getCredential('resourceName'),
      deploymentName: this.getCredential('deploymentName'),
      apiVersion: this.getCredential('apiVersion') || '2024-02-01'
    };
  }

  /**
   * @description Converter tools para formato AI SDK
   */
  private convertTools(tools: any[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * @description Converter tool calls de volta
   */
  private convertToolCalls(toolCalls: any[]): any[] {
    return toolCalls.map(call => ({
      id: call.id || crypto.randomUUID(),
      name: call.function?.name || call.name,
      arguments: call.function?.arguments || call.arguments
    }));
  }

  /**
   * @description Atualizar métricas de uso
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Calcular média móvel do tempo de resposta
    const totalSuccessful = this.metrics.successfulRequests;
    if (totalSuccessful > 0) {
      this.metrics.averageResponseTime = 
        ((this.metrics.averageResponseTime * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
    }

    this.metrics.lastUsed = new Date();
    
    // Calcular uptime baseado na taxa de sucesso
    if (this.metrics.totalRequests > 0) {
      this.metrics.uptime = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    }
  }
}

/**
 * @description Factory para criar Azure OpenAI providers
 */
export class AzureOpenAIProviderFactory {
  create(organizationId: string, config: LLMProviderConfig): AzureOpenAIProvider {
    return new AzureOpenAIProvider(organizationId, config);
  }

  getProviderType(): string {
    return 'azure-openai';
  }

  validateConfiguration(config: LLMProviderConfig): boolean {
    const requiredCredentials = ['apiKey', 'resourceName', 'deploymentName'];
    
    for (const field of requiredCredentials) {
      if (!config.credentials[field]) {
        return false;
      }
    }

    // Validar settings essenciais
    if (!config.settings.defaultModel) {
      return false;
    }

    return true;
  }
}

/**
 * @description Helper para criar configuração Azure OpenAI a partir do ambiente
 */
export function createAzureOpenAIConfig(
  organizationId: string,
  envVars: {
    AZURE_API_KEY?: string;
    AZURE_RESOURCE_NAME?: string;
    AZURE_DEPLOYMENT_NAME?: string;
    AZURE_API_VERSION?: string;
  },
  options: {
    isPrimary?: boolean;
    isFallback?: boolean;
    priority?: number;
  } = {}
): LLMProviderConfig {
  if (!envVars.AZURE_API_KEY || !envVars.AZURE_RESOURCE_NAME || !envVars.AZURE_DEPLOYMENT_NAME) {
    throw new Error('Missing required Azure OpenAI environment variables');
  }

  return {
    id: `azure-openai-${organizationId}`,
    organizationId,
    providerType: 'llm',
    providerName: 'azure-openai',
    enabled: true,
    isPrimary: options.isPrimary ?? true,
    isFallback: options.isFallback ?? false,
    priority: options.priority ?? 100,
    credentials: {
      apiKey: envVars.AZURE_API_KEY,
      resourceName: envVars.AZURE_RESOURCE_NAME,
      deploymentName: envVars.AZURE_DEPLOYMENT_NAME,
      apiVersion: envVars.AZURE_API_VERSION || '2024-02-01'
    },
    settings: {
      defaultModel: envVars.AZURE_DEPLOYMENT_NAME,
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3,
      supportedModels: [envVars.AZURE_DEPLOYMENT_NAME],
      apiVersion: envVars.AZURE_API_VERSION || '2024-02-01',
      region: envVars.AZURE_RESOURCE_NAME.includes('east') ? 'eastus' : 'westus'
    },
    metadata: {
      name: 'Azure OpenAI (Production)',
      description: `Azure OpenAI deployment: ${envVars.AZURE_DEPLOYMENT_NAME}`,
      provider: 'microsoft-azure',
      service: 'openai'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 