import { ProviderHealth, ProviderConfig } from '../base/provider-interface';
import { providerFactory, checkProviderHealth } from '../factory/provider-factory';

export interface HealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  providers: ProviderHealth[];
  metadata: {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
    degradedProviders: number;
  };
}

export interface OrganizationProviderConfig {
  organizationId: string;
  llm?: ProviderConfig;
  storage?: ProviderConfig;
  database?: ProviderConfig;
  vector?: ProviderConfig;
  email?: ProviderConfig;
}

export interface HealthCheckService {
  checkHealth(): Promise<HealthStatus>;
  checkProviders(organizationId: string): Promise<ProviderHealth[]>;
  checkSpecificProvider(type: string, config: ProviderConfig): Promise<ProviderHealth>;
  scheduleHealthChecks(intervalMs: number): void;
  stopHealthChecks(): void;
}

export class HealthCheckServiceImpl implements HealthCheckService {
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: HealthStatus;
  private organizationConfigs = new Map<string, OrganizationProviderConfig>();

  constructor(
    private configService: {
      getProviderConfig(organizationId: string): Promise<OrganizationProviderConfig>;
    }
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date();
    const allProviders: ProviderHealth[] = [];

    try {
      // Get all registered organizations and their provider configs
      const organizations = await this.getAllOrganizations();
      
      for (const orgId of organizations) {
        const orgProviders = await this.checkProviders(orgId);
        allProviders.push(...orgProviders);
      }

      // Calculate overall health
      const healthyCount = allProviders.filter(p => p.status === 'healthy').length;
      const unhealthyCount = allProviders.filter(p => p.status === 'unhealthy').length;
      const degradedCount = allProviders.filter(p => p.status === 'degraded').length;

      let overall: 'healthy' | 'unhealthy' | 'degraded';
      if (unhealthyCount > 0) {
        overall = 'unhealthy';
      } else if (degradedCount > 0) {
        overall = 'degraded';
      } else {
        overall = 'healthy';
      }

      const healthStatus: HealthStatus = {
        overall,
        timestamp,
        providers: allProviders,
        metadata: {
          totalProviders: allProviders.length,
          healthyProviders: healthyCount,
          unhealthyProviders: unhealthyCount,
          degradedProviders: degradedCount
        }
      };

      this.lastHealthCheck = healthStatus;
      return healthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        overall: 'unhealthy',
        timestamp,
        providers: [],
        metadata: {
          totalProviders: 0,
          healthyProviders: 0,
          unhealthyProviders: 0,
          degradedProviders: 0
        }
      };
    }
  }

  async checkProviders(organizationId: string): Promise<ProviderHealth[]> {
    try {
      const config = await this.configService.getProviderConfig(organizationId);
      const checks: Promise<ProviderHealth>[] = [];

      // Check LLM provider
      if (config.llm?.enabled) {
        checks.push(this.checkLLMProvider(config.llm, organizationId));
      }

      // Check Storage provider
      if (config.storage?.enabled) {
        checks.push(this.checkStorageProvider(config.storage, organizationId));
      }

      // Check Database provider
      if (config.database?.enabled) {
        checks.push(this.checkDatabaseProvider(config.database, organizationId));
      }

      // Check Vector provider
      if (config.vector?.enabled) {
        checks.push(this.checkVectorProvider(config.vector, organizationId));
      }

      // Check Email provider
      if (config.email?.enabled) {
        checks.push(this.checkEmailProvider(config.email, organizationId));
      }

      const results = await Promise.allSettled(checks);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Fallback for failed checks
          return {
            type: 'unknown',
            status: 'unhealthy' as const,
            error: `Health check failed: ${result.reason}`
          };
        }
      });
    } catch (error) {
      console.error(`Failed to check providers for organization ${organizationId}:`, error);
      return [];
    }
  }

  async checkSpecificProvider(type: string, config: ProviderConfig): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const result = await checkProviderHealth(type, config);
      const responseTime = Date.now() - startTime;
      
      return {
        type,
        status: result.healthy ? 'healthy' : 'unhealthy',
        responseTime: result.responseTime || responseTime,
        error: result.error,
        metadata: {
          provider: result.provider,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        type,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  scheduleHealthChecks(intervalMs: number = 60000): void {
    this.stopHealthChecks(); // Clear any existing interval
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
        console.log('Scheduled health check completed');
      } catch (error) {
        console.error('Scheduled health check failed:', error);
      }
    }, intervalMs);

    console.log(`Health checks scheduled every ${intervalMs}ms`);
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('Health checks stopped');
    }
  }

  // Get the last health check result without running a new check
  getLastHealthCheck(): HealthStatus | undefined {
    return this.lastHealthCheck;
  }

  // Private helper methods
  private async checkLLMProvider(config: ProviderConfig, organizationId: string): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const provider = await providerFactory.createLLMProvider(config);
      const health = await provider.checkHealth();
      await provider.destroy();
      
      return {
        ...health,
        metadata: {
          ...health.metadata,
          organizationId,
          provider: config.type
        }
      };
    } catch (error) {
      return {
        type: 'llm',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          organizationId,
          provider: config.type
        }
      };
    }
  }

  private async checkStorageProvider(config: ProviderConfig, organizationId: string): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const provider = await providerFactory.createStorageProvider(config);
      const health = await provider.checkHealth();
      await provider.destroy();
      
      return {
        ...health,
        metadata: {
          ...health.metadata,
          organizationId,
          provider: config.type
        }
      };
    } catch (error) {
      return {
        type: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          organizationId,
          provider: config.type
        }
      };
    }
  }

  private async checkDatabaseProvider(config: ProviderConfig, organizationId: string): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const provider = await providerFactory.createDatabaseProvider(config);
      const health = await provider.checkHealth();
      await provider.destroy();
      
      return {
        ...health,
        metadata: {
          ...health.metadata,
          organizationId,
          provider: config.type
        }
      };
    } catch (error) {
      return {
        type: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          organizationId,
          provider: config.type
        }
      };
    }
  }

  private async checkVectorProvider(config: ProviderConfig, organizationId: string): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const provider = await providerFactory.createVectorProvider(config);
      const health = await provider.checkHealth();
      await provider.destroy();
      
      return {
        ...health,
        metadata: {
          ...health.metadata,
          organizationId,
          provider: config.type
        }
      };
    } catch (error) {
      return {
        type: 'vector',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          organizationId,
          provider: config.type
        }
      };
    }
  }

  private async checkEmailProvider(config: ProviderConfig, organizationId: string): Promise<ProviderHealth> {
    const startTime = Date.now();
    
    try {
      const provider = await providerFactory.createEmailProvider(config);
      const health = await provider.checkHealth();
      await provider.destroy();
      
      return {
        ...health,
        metadata: {
          ...health.metadata,
          organizationId,
          provider: config.type
        }
      };
    } catch (error) {
      return {
        type: 'email',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          organizationId,
          provider: config.type
        }
      };
    }
  }

  private async getAllOrganizations(): Promise<string[]> {
    // TODO: This would typically query the database for all organizations
    // For now, return organizations from cached configs
    return Array.from(this.organizationConfigs.keys());
  }

  // Method to register organization configurations for health checking
  registerOrganizationConfig(config: OrganizationProviderConfig): void {
    this.organizationConfigs.set(config.organizationId, config);
  }

  unregisterOrganizationConfig(organizationId: string): void {
    this.organizationConfigs.delete(organizationId);
  }
} 