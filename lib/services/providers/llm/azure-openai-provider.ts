import {
  LLMProvider,
  LLMModel,
  LLMRequest,
  LLMResponse,
  ProviderConfig,
  ProviderHealth
} from '../base/provider-interface';

export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  apiVersion?: string;
  deploymentName: string;
}

export class AzureOpenAIProvider implements LLMProvider {
  readonly type = 'llm' as const;
  readonly name = 'Azure OpenAI';

  private apiKey!: string;
  private endpoint!: string;
  private apiVersion: string = '2023-12-01-preview';
  private deploymentName!: string;

  async initialize(config: ProviderConfig): Promise<void> {
    const credentials = config.credentials as AzureOpenAIConfig;
    
    if (!credentials.apiKey) {
      throw new Error('Azure OpenAI API key is required');
    }
    if (!credentials.endpoint) {
      throw new Error('Azure OpenAI endpoint is required');
    }
    if (!credentials.deploymentName) {
      throw new Error('Azure OpenAI deployment name is required');
    }

    this.apiKey = credentials.apiKey;
    this.endpoint = credentials.endpoint.replace(/\/+$/, ''); // Remove trailing slashes
    this.apiVersion = credentials.apiVersion || this.apiVersion;
    this.deploymentName = credentials.deploymentName;
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Test with a simple completion request
      const testRequest: LLMRequest = {
        model: this.deploymentName,
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1
      };
      
      await this.generateResponse(testRequest);
      const responseTime = Date.now() - startTime;
      
      return {
        type: this.type,
        status: 'healthy',
        responseTime,
        metadata: {
          endpoint: this.endpoint,
          deployment: this.deploymentName,
          apiVersion: this.apiVersion
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
    // Azure OpenAI uses deployments, not models directly
    // Return the configured deployment as a model
    return [{
      id: this.deploymentName,
      name: this.deploymentName,
      maxTokens: this.getDeploymentMaxTokens(this.deploymentName),
      supportsFunctions: true,
      supportsStreaming: true,
      costPer1kTokens: this.getDeploymentCost(this.deploymentName)
    }];
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const payload = {
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
    const costs = this.getDeploymentCost(this.deploymentName);
    
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
    const url = `${this.endpoint}/openai/deployments/${this.deploymentName}${endpoint}?api-version=${this.apiVersion}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private getDeploymentMaxTokens(deploymentName: string): number {
    // Azure deployments typically use GPT-4 or GPT-3.5-turbo models
    // This would ideally come from deployment configuration
    if (deploymentName.toLowerCase().includes('gpt-4')) {
      return 8192;
    }
    if (deploymentName.toLowerCase().includes('32k')) {
      return 32768;
    }
    if (deploymentName.toLowerCase().includes('16k')) {
      return 16384;
    }
    return 4096; // Default for GPT-3.5-turbo
  }

  private getDeploymentCost(deploymentName: string): { input: number; output: number } {
    // Azure pricing can vary by region and contract
    // These are approximate values - should be configurable
    if (deploymentName.toLowerCase().includes('gpt-4')) {
      return { input: 0.03, output: 0.06 };
    }
    return { input: 0.0015, output: 0.002 }; // GPT-3.5-turbo default
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