import { BaseProvider, type ProviderConfiguration, type HealthCheckResult } from '../base/base-provider';

/**
 * @description Tipos de mensagem para LLM
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

/**
 * @description Contexto de geração
 */
export interface LLMGenerationContext {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  tools?: LLMTool[];
  metadata?: Record<string, any>;
}

/**
 * @description Ferramentas disponíveis para LLM
 */
export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * @description Resposta do LLM
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  toolCalls?: LLMToolCall[];
  metadata?: Record<string, any>;
}

/**
 * @description Chamada de ferramenta pelo LLM
 */
export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/**
 * @description Stream chunk para responses streaming
 */
export interface LLMStreamChunk {
  type: 'content' | 'tool_call' | 'done';
  content?: string;
  toolCall?: LLMToolCall;
  usage?: LLMResponse['usage'];
  finishReason?: LLMResponse['finishReason'];
}

/**
 * @description Modelos disponíveis
 */
export interface LLMModel {
  id: string;
  name: string;
  description?: string;
  maxTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  pricing?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * @description Configuração específica do LLM provider
 */
export interface LLMProviderConfig extends ProviderConfiguration {
  providerType: 'llm';
  settings: {
    defaultModel: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    retryAttempts?: number;
    supportedModels?: string[];
    apiVersion?: string;
    region?: string;
  };
}

/**
 * @description Interface base para LLM providers
 */
export abstract class LLMProvider extends BaseProvider<LLMProviderConfig> {
  constructor(organizationId: string, config: LLMProviderConfig) {
    super(organizationId, config, 'llm');
  }

  /**
   * @description Gerar resposta de chat
   */
  abstract generateResponse(context: LLMGenerationContext): Promise<LLMResponse>;

  /**
   * @description Gerar resposta em streaming
   */
  abstract generateStream(context: LLMGenerationContext): AsyncGenerator<LLMStreamChunk, void, unknown>;

  /**
   * @description Listar modelos disponíveis
   */
  abstract getAvailableModels(): Promise<LLMModel[]>;

  /**
   * @description Estimar custo de tokens
   */
  abstract estimateCost(tokens: number, model?: string): Promise<number>;

  /**
   * @description Validar se modelo é suportado
   */
  abstract supportsModel(modelId: string): Promise<boolean>;

  /**
   * @description Health check específico para LLM
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Teste simples com o modelo padrão
      const testContext: LLMGenerationContext = {
        messages: [
          { role: 'user', content: 'Hello, this is a health check. Please respond with "OK".' }
        ],
        model: this.getDefaultModel(),
        maxTokens: 10,
        temperature: 0
      };

      const response = await this.executeOperation(
        () => this.generateResponse(testContext),
        { timeout: 10000, context: 'health_check' }
      );

      const responseTime = Date.now() - startTime;
      
      // Verificar se resposta é válida
      if (response.content && response.usage.totalTokens > 0) {
        return this.createHealthResult('healthy', responseTime, undefined, {
          model: response.model,
          tokens: response.usage.totalTokens
        });
      } else {
        return this.createHealthResult('degraded', responseTime, 'Invalid response format');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return this.createHealthResult('unhealthy', responseTime, (error as Error).message);
    }
  }

  /**
   * @description Validar configuração do LLM provider
   */
  async validateConfig(): Promise<boolean> {
    try {
      // Validar credenciais essenciais
      this.validateCredentials(['apiKey']);

      // Validar se modelo padrão existe
      const models = await this.getAvailableModels();
      const defaultModel = this.getDefaultModel();
      
      if (!models.some(m => m.id === defaultModel)) {
        throw new Error(`Default model ${defaultModel} not available`);
      }

      return true;
    } catch (error) {
      this.auditLog('config_validation_failed', 'validate', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * @description Obter modelo padrão
   */
  getDefaultModel(): string {
    return this.getSetting('defaultModel', 'gpt-3.5-turbo');
  }

  /**
   * @description Obter temperatura padrão
   */
  getDefaultTemperature(): number {
    return this.getSetting('temperature', 0.7);
  }

  /**
   * @description Obter max tokens padrão
   */
  getDefaultMaxTokens(): number {
    return this.getSetting('maxTokens', 2048);
  }

  /**
   * @description Sanitizar contexto de geração
   */
  protected sanitizeContext(context: LLMGenerationContext): LLMGenerationContext {
    return {
      ...context,
      model: context.model || this.getDefaultModel(),
      temperature: context.temperature ?? this.getDefaultTemperature(),
      maxTokens: context.maxTokens || this.getDefaultMaxTokens(),
      // Limitar mensagens para evitar context overflow
      messages: this.limitMessages(context.messages, context.maxTokens || this.getDefaultMaxTokens())
    };
  }

  /**
   * @description Limitar número de mensagens baseado em tokens
   */
  protected limitMessages(messages: LLMMessage[], maxTokens: number): LLMMessage[] {
    // Estimativa simples: ~4 caracteres = 1 token
    let totalTokens = 0;
    const result: LLMMessage[] = [];

    // Manter system messages sempre
    const systemMessages = messages.filter(m => m.role === 'system');
    result.push(...systemMessages);
    totalTokens += systemMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);

    // Adicionar mensagens mais recentes até o limite
    const otherMessages = messages.filter(m => m.role !== 'system').reverse();
    
    for (const message of otherMessages) {
      const messageTokens = Math.ceil(message.content.length / 4);
      
      if (totalTokens + messageTokens > maxTokens * 0.8) { // 80% do limite
        break;
      }
      
      result.unshift(message);
      totalTokens += messageTokens;
    }

    return result;
  }

  /**
   * @description Calcular custo estimado
   */
  protected calculateEstimatedCost(usage: LLMResponse['usage'], model: string): number {
    // Implementação básica - cada provider pode sobrescrever
    const promptCost = usage.promptTokens * 0.001; // $0.001 per 1K tokens
    const completionCost = usage.completionTokens * 0.002; // $0.002 per 1K tokens
    
    return (promptCost + completionCost) / 1000;
  }

  /**
   * @description Mapear finish reason genérico
   */
  protected mapFinishReason(providerReason: string): LLMResponse['finishReason'] {
    const lowerReason = providerReason.toLowerCase();
    
    if (lowerReason.includes('stop')) return 'stop';
    if (lowerReason.includes('length') || lowerReason.includes('max_tokens')) return 'length';
    if (lowerReason.includes('tool') || lowerReason.includes('function')) return 'tool_calls';
    if (lowerReason.includes('filter') || lowerReason.includes('content_filter')) return 'content_filter';
    
    return 'stop';
  }
}

/**
 * @description Registry específico para LLM providers
 */
export class LLMProviderRegistry {
  private static instance: LLMProviderRegistry;
  private providers: Map<string, LLMProvider> = new Map();

  static getInstance(): LLMProviderRegistry {
    if (!LLMProviderRegistry.instance) {
      LLMProviderRegistry.instance = new LLMProviderRegistry();
    }
    return LLMProviderRegistry.instance;
  }

  /**
   * @description Registrar provider de LLM
   */
  register(organizationId: string, provider: LLMProvider): void {
    const key = `${organizationId}:${provider.getName()}`;
    this.providers.set(key, provider);
    
    this.auditLog('register', provider.getName(), organizationId, {
      isPrimary: provider.isPrimary(),
      isFallback: provider.isFallback()
    });
  }

  /**
   * @description Obter provider primário para organização
   */
  getPrimary(organizationId: string): LLMProvider | null {
    for (const [key, provider] of this.providers.entries()) {
      if (key.startsWith(`${organizationId}:`) && provider.isPrimary() && provider.isEnabled()) {
        return provider;
      }
    }
    return null;
  }

  /**
   * @description Obter providers de fallback para organização
   */
  getFallbacks(organizationId: string): LLMProvider[] {
    const fallbacks: LLMProvider[] = [];
    
    for (const [key, provider] of this.providers.entries()) {
      if (key.startsWith(`${organizationId}:`) && provider.isFallback() && provider.isEnabled()) {
        fallbacks.push(provider);
      }
    }
    
    // Ordenar por prioridade
    return fallbacks.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * @description Obter todos os providers da organização
   */
  getAll(organizationId: string): LLMProvider[] {
    const result: LLMProvider[] = [];
    
    for (const [key, provider] of this.providers.entries()) {
      if (key.startsWith(`${organizationId}:`)) {
        result.push(provider);
      }
    }
    
    return result.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * @description Limpar providers da organização
   */
  clear(organizationId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.providers.keys()) {
      if (key.startsWith(`${organizationId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const provider = this.providers.get(key);
      if (provider) {
        provider.dispose();
        this.providers.delete(key);
      }
    });
    
    this.auditLog('clear', 'all', organizationId, { count: keysToDelete.length });
  }

  /**
   * @description Log de auditoria
   */
  private auditLog(
    action: string,
    providerName: string,
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`🤖 LLM_REGISTRY: ${action} ${providerName} (org: ${organizationId})`, {
      action,
      providerName,
      organizationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

/**
 * @description Singleton do LLM registry
 */
export const llmProviderRegistry = LLMProviderRegistry.getInstance(); 