import {
  LLMProvider,
  LLMModel,
  LLMRequest,
  LLMResponse,
  ProviderConfig,
  ProviderHealth
} from '../base/provider-interface';
import { OperationResult } from '../../types/service-context';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  defaultModel?: string;
}

export class OpenAIProvider implements LLMProvider {
  readonly type = 'llm' as const;
  readonly name = 'OpenAI';

  private apiKey!: string;
  private organization?: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private defaultModel: string = 'gpt-4';

  async initialize(config: ProviderConfig): Promise<void> {
    const credentials = config.credentials as OpenAIConfig;
    
    if (!credentials.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = credentials.apiKey;
    this.organization = credentials.organization;
    this.baseURL = credentials.baseURL || this.baseURL;
    this.defaultModel = credentials.defaultModel || this.defaultModel;
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const models = await this.listModels();
      const responseTime = Date.now() - startTime;
      
      return {
        type: this.type,
        status: 'healthy',
        responseTime,
        metadata: {
          modelCount: models.length,
          defaultModel: this.defaultModel
        }
      };
    } catch (error) {
      return {
        type: this.type,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listModels(): Promise<LLMModel[]> {
    const response = await this.makeRequest('/models');
    const models = response.data;

    return models
      .filter((model: any) => model.id.includes('gpt'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        maxTokens: this.getModelMaxTokens(model.id),
        supportsFunctions: this.modelSupportsFunctions(model.id),
        supportsStreaming: true,
        costPer1kTokens: this.getModelCost(model.id)
      }));
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const payload = {
      model: request.model || this.defaultModel,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.functionCall && { function_call: msg.functionCall })
      })),
      max_tokens: request.maxTokens,
      temperature: request.temperature || 0.7,
      stream: false,
      ...(request.functions && { functions: request.functions })
    };

    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      ...(choice.message.function_call && {
        functionCall: {
          name: choice.message.function_call.name,
          arguments: JSON.parse(choice.message.function_call.arguments || '{}')
        }
      })
    };
  }

  async *generateStream(request: LLMRequest): AsyncIterable<LLMResponse> {
    const payload = {
      model: request.model || this.defaultModel,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: request.maxTokens,
      temperature: request.temperature || 0.7,
      stream: true
    };

    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const choice = parsed.choices[0];
              
              if (choice.delta.content) {
                yield {
                  content: choice.delta.content,
                  finishReason: 'stop',
                  usage: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0
                  }
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async estimateCost(request: LLMRequest): Promise<number> {
    const model = request.model || this.defaultModel;
    const costs = this.getModelCost(model);
    
    // Estimate tokens (rough calculation)
    const inputTokens = request.messages.reduce((acc, msg) => 
      acc + Math.ceil(msg.content.length / 4), 0
    );
    const outputTokens = request.maxTokens || 1000;

    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (outputTokens / 1000) * costs.output;

    return inputCost + outputCost;
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.organization && { 'OpenAI-Organization': this.organization }),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private getModelMaxTokens(modelId: string): number {
    const tokenLimits: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-4o': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };

    return tokenLimits[modelId] || 4096;
  }

  private modelSupportsFunctions(modelId: string): boolean {
    return modelId.includes('gpt-4') || modelId.includes('gpt-3.5-turbo');
  }

  private getModelCost(modelId: string): { input: number; output: number } {
    // Cost per 1K tokens in USD
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
    };

    return costs[modelId] || { input: 0.01, output: 0.03 };
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'function_call' {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'function_call': return 'function_call';
      default: return 'stop';
    }
  }
} 