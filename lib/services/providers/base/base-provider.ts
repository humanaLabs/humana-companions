/**
 * @description Status de saúde do provider
 */
export type ProviderHealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown';

/**
 * @description Configuração base para providers
 */
export interface ProviderConfig {
  enabled: boolean;
  priority: number;
  timeout?: number;
  retryAttempts?: number;
  metadata?: Record<string, any>;
}

/**
 * @description Credenciais para providers (encrypted)
 */
export interface ProviderCredentials {
  [key: string]: string | number | boolean;
}

/**
 * @description Configuração completa do provider
 */
export interface ProviderConfiguration {
  id: string;
  organizationId: string;
  providerType: string;
  providerName: string;
  enabled: boolean;
  isPrimary: boolean;
  isFallback: boolean;
  priority: number;
  credentials: ProviderCredentials;
  settings: Record<string, any>;
  metadata?: Record<string, any>;
  healthStatus?: ProviderHealthStatus;
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description Resultado de health check
 */
export interface HealthCheckResult {
  status: ProviderHealthStatus;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * @description Métricas de uso do provider
 */
export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsed: Date;
  uptime: number;
}

/**
 * @description Interface base para todos os providers
 */
export abstract class BaseProvider<TConfig = any, TCredentials = any> {
  protected readonly organizationId: string;
  protected readonly config: ProviderConfiguration;
  protected readonly providerType: string;
  protected readonly providerName: string;

  constructor(
    organizationId: string,
    config: ProviderConfiguration,
    providerType: string
  ) {
    this.organizationId = organizationId;
    this.config = config;
    this.providerType = providerType;
    this.providerName = config.providerName;

    if (!organizationId) {
      throw new Error('BaseProvider: organizationId is required');
    }

    if (!config.enabled) {
      console.warn(`⚠️ Provider ${config.providerName} is disabled for org ${organizationId}`);
    }
  }

  /**
   * @description Inicializar provider (validar configuração)
   */
  abstract initialize(): Promise<void>;

  /**
   * @description Health check do provider
   */
  abstract healthCheck(): Promise<HealthCheckResult>;

  /**
   * @description Validar configuração do provider
   */
  abstract validateConfig(): Promise<boolean>;

  /**
   * @description Obter métricas de uso
   */
  abstract getMetrics(): Promise<ProviderMetrics>;

  /**
   * @description Cleanup de recursos
   */
  abstract dispose(): Promise<void>;

  /**
   * @description Verificar se provider está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * @description Verificar se é provider primário
   */
  isPrimary(): boolean {
    return this.config.isPrimary;
  }

  /**
   * @description Verificar se é fallback
   */
  isFallback(): boolean {
    return this.config.isFallback;
  }

  /**
   * @description Obter prioridade
   */
  getPriority(): number {
    return this.config.priority;
  }

  /**
   * @description Obter ID do provider
   */
  getId(): string {
    return this.config.id;
  }

  /**
   * @description Obter tipo do provider
   */
  getType(): string {
    return this.providerType;
  }

  /**
   * @description Obter nome do provider
   */
  getName(): string {
    return this.providerName;
  }

  /**
   * @description Obter configuração (sem credenciais)
   */
  getConfig(): Omit<ProviderConfiguration, 'credentials'> {
    const { credentials, ...config } = this.config;
    return config;
  }

  /**
   * @description Wrapper para operações com retry
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts?: number
  ): Promise<T> {
    const attempts = maxAttempts || this.getSetting('retryAttempts', 3);
    let lastError: Error;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === attempts || !this.isRetryableError(error)) {
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await this.delay(delay);
        
        this.auditLog('retry', attempt.toString(), {
          error: lastError.message,
          nextAttempt: attempt + 1
        });
      }
    }

    throw lastError!;
  }

  /**
   * @description Wrapper com timeout
   */
  protected async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.getSetting('timeout', 30000);
    
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  /**
   * @description Executar operação com retry e timeout
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    options?: {
      timeout?: number;
      retries?: number;
      context?: string;
    }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.withTimeout(
        () => this.withRetry(operation, options?.retries),
        options?.timeout
      );

      const duration = Date.now() - startTime;
      this.auditLog('operation_success', options?.context || 'unknown', {
        duration,
        provider: this.providerName
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.auditLog('operation_failed', options?.context || 'unknown', {
        duration,
        provider: this.providerName,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * @description Verificar se erro é passível de retry
   */
  protected isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'TEMP_FAILURE',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE'
    ];

    if (error.code) {
      return retryableErrors.includes(error.code);
    }

    if (error.message) {
      return retryableErrors.some(code => 
        error.message.toLowerCase().includes(code.toLowerCase())
      );
    }

    // HTTP status codes que podem ser retentados
    if (error.status) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    return false;
  }

  /**
   * @description Delay para retry
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @description Log de auditoria
   */
  protected auditLog(
    action: string,
    entityId: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`🔌 PROVIDER: ${action} ${this.providerName}:${entityId} (org: ${this.organizationId})`, {
      action,
      providerName: this.providerName,
      providerType: this.providerType,
      entityId,
      organizationId: this.organizationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * @description Criar resultado de health check
   */
  protected createHealthResult(
    status: ProviderHealthStatus,
    responseTime: number,
    error?: string,
    metadata?: Record<string, any>
  ): HealthCheckResult {
    return {
      status,
      responseTime,
      error,
      metadata,
      timestamp: new Date()
    };
  }

  /**
   * @description Validar credenciais básicas
   */
  protected validateCredentials(requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!this.config.credentials[field]) {
        throw new Error(`Missing required credential: ${field}`);
      }
    }
  }

  /**
   * @description Obter credencial de forma segura
   */
  protected getCredential(key: string): string {
    const value = this.config.credentials[key];
    if (typeof value !== 'string') {
      throw new Error(`Credential ${key} must be a string`);
    }
    return value;
  }

  /**
   * @description Obter setting de configuração
   */
  protected getSetting<T>(key: string, defaultValue?: T): T {
    return this.config.settings[key] ?? defaultValue;
  }
}

/**
 * @description Factory interface para criar providers
 */
export interface ProviderFactory<T extends BaseProvider> {
  create(organizationId: string, config: ProviderConfiguration): T;
  getProviderType(): string;
  validateConfiguration(config: ProviderConfiguration): boolean;
}

/**
 * @description Registry de provider factories
 */
export class ProviderFactoryRegistry {
  private static instance: ProviderFactoryRegistry;
  private factories: Map<string, ProviderFactory<any>> = new Map();

  static getInstance(): ProviderFactoryRegistry {
    if (!ProviderFactoryRegistry.instance) {
      ProviderFactoryRegistry.instance = new ProviderFactoryRegistry();
    }
    return ProviderFactoryRegistry.instance;
  }

  /**
   * @description Registrar factory de provider
   */
  register<T extends BaseProvider>(
    providerType: string,
    factory: ProviderFactory<T>
  ): void {
    this.factories.set(providerType, factory);
    console.log(`📝 Provider factory registered: ${providerType}`);
  }

  /**
   * @description Criar provider através da factory
   */
  createProvider<T extends BaseProvider>(
    providerType: string,
    organizationId: string,
    config: ProviderConfiguration
  ): T {
    const factory = this.factories.get(providerType);
    if (!factory) {
      throw new Error(`No factory registered for provider type: ${providerType}`);
    }

    if (!factory.validateConfiguration(config)) {
      throw new Error(`Invalid configuration for provider type: ${providerType}`);
    }

    return factory.create(organizationId, config);
  }

  /**
   * @description Verificar se factory está registrada
   */
  hasFactory(providerType: string): boolean {
    return this.factories.has(providerType);
  }

  /**
   * @description Listar tipos de provider disponíveis
   */
  getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

/**
 * @description Singleton do registry
 */
export const providerFactoryRegistry = ProviderFactoryRegistry.getInstance(); 