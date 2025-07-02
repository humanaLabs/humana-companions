import { and, eq, desc, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { providerConfiguration, organization } from '@/lib/db/schema';
import type { ProviderConfiguration } from '@/lib/db/schema';
import { TenantService } from '../base/tenant-service';
import type { ServiceContext, OperationResult } from '../types/service-context';
import { 
  checkProviderHealth, 
  providerFactory, 
  type HealthStatus, 
  type OrganizationProviderConfig 
} from '../providers/factory/provider-factory';
import type { 
  LLMProvider, 
  StorageProvider, 
  ProviderConfig 
} from '../providers/base/provider-interface';

export interface CreateProviderConfigRequest {
  providerType: 'llm' | 'storage' | 'database' | 'vector' | 'email';
  providerName: string;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
  metadata?: {
    name: string;
    description?: string;
    version?: string;
  };
  enabled?: boolean;
  isPrimary?: boolean;
  isFallback?: boolean;
  priority?: number;
}

export interface UpdateProviderConfigRequest {
  id: string;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  enabled?: boolean;
  isPrimary?: boolean;
  isFallback?: boolean;
  priority?: number;
}

export interface MigrationRequest {
  fromProviderId: string;
  toProviderId: string;
  validateOnly?: boolean;
  preserveOld?: boolean;
}

export interface MigrationResult {
  success: boolean;
  validationErrors?: string[];
  migrationDetails: {
    fromProvider: ProviderConfiguration;
    toProvider: ProviderConfiguration;
    startTime: Date;
    endTime?: Date;
    status: 'in_progress' | 'completed' | 'failed';
    errors?: string[];
  };
}

export class ProviderConfigurationService extends TenantService<ProviderConfiguration> {
  constructor(context: ServiceContext) {
    super(context.organizationId, null as any, context);
  }

  /**
   * Buscar todas as configurações de providers de uma organização
   */
  async getProviderConfigurations(): Promise<OperationResult<ProviderConfiguration[]>> {
    try {
      const configs = await db
        .select()
        .from(providerConfiguration)
        .where(eq(providerConfiguration.organizationId, this.organizationId))
        .orderBy(
          providerConfiguration.providerType,
          desc(providerConfiguration.isPrimary),
          providerConfiguration.priority
        );

      return {
        success: true,
        data: configs
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Buscar provider primário por tipo
   */
  async getPrimaryProvider(type: string): Promise<OperationResult<ProviderConfiguration | null>> {
    try {
      const config = await db
        .select()
        .from(providerConfiguration)
        .where(
          and(
            eq(providerConfiguration.organizationId, this.organizationId),
            eq(providerConfiguration.providerType, type),
            eq(providerConfiguration.isPrimary, true),
            eq(providerConfiguration.enabled, true)
          )
        )
        .limit(1);

      return {
        success: true,
        data: config[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar provider primário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Buscar providers de fallback por tipo
   */
  async getFallbackProviders(type: string): Promise<OperationResult<ProviderConfiguration[]>> {
    try {
      const configs = await db
        .select()
        .from(providerConfiguration)
        .where(
          and(
            eq(providerConfiguration.organizationId, this.organizationId),
            eq(providerConfiguration.providerType, type),
            eq(providerConfiguration.isFallback, true),
            eq(providerConfiguration.enabled, true)
          )
        )
        .orderBy(providerConfiguration.priority);

      return {
        success: true,
        data: configs
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar providers de fallback: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Criar nova configuração de provider
   */
  async createProviderConfiguration(request: CreateProviderConfigRequest): Promise<OperationResult<ProviderConfiguration>> {
    try {
      // Se está marcado como primário, desmarcar outros primários do mesmo tipo
      if (request.isPrimary) {
        await db
          .update(providerConfiguration)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(
            and(
              eq(providerConfiguration.organizationId, this.organizationId),
              eq(providerConfiguration.providerType, request.providerType),
              eq(providerConfiguration.isPrimary, true)
            )
          );
      }

      // Encrypt credentials (simplified - in production use proper encryption)
      const encryptedCredentials = this.encryptCredentials(request.credentials);

      const [created] = await db
        .insert(providerConfiguration)
        .values({
          organizationId: this.organizationId,
          providerType: request.providerType,
          providerName: request.providerName,
          credentials: encryptedCredentials,
          settings: request.settings || {},
          metadata: request.metadata || {},
          enabled: request.enabled ?? true,
          isPrimary: request.isPrimary ?? false,
          isFallback: request.isFallback ?? false,
          priority: request.priority ?? 100,
          createdBy: this.context.userId,
          updatedBy: this.context.userId
        })
        .returning();

      // Test provider health after creation
      await this.updateProviderHealth(created.id);

      return {
        success: true,
        data: created
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Atualizar configuração de provider
   */
  async updateProviderConfiguration(request: UpdateProviderConfigRequest): Promise<OperationResult<ProviderConfiguration>> {
    try {
      const updateData: Partial<ProviderConfiguration> = {
        updatedAt: new Date(),
        updatedBy: this.context.userId
      };

      if (request.credentials) {
        updateData.credentials = this.encryptCredentials(request.credentials);
      }
      if (request.settings) updateData.settings = request.settings;
      if (request.metadata) updateData.metadata = request.metadata;
      if (request.enabled !== undefined) updateData.enabled = request.enabled;
      if (request.priority !== undefined) updateData.priority = request.priority;
      if (request.isFallback !== undefined) updateData.isFallback = request.isFallback;

      // Handle primary provider logic
      if (request.isPrimary !== undefined) {
        if (request.isPrimary) {
          // Get current config to check type
          const [currentConfig] = await db
            .select()
            .from(providerConfiguration)
            .where(eq(providerConfiguration.id, request.id))
            .limit(1);

          if (currentConfig) {
            // Unmark other primary providers of same type
            await db
              .update(providerConfiguration)
              .set({ isPrimary: false, updatedAt: new Date() })
              .where(
                and(
                  eq(providerConfiguration.organizationId, this.organizationId),
                  eq(providerConfiguration.providerType, currentConfig.providerType),
                  eq(providerConfiguration.isPrimary, true)
                )
              );
          }
        }
        updateData.isPrimary = request.isPrimary;
      }

      const [updated] = await db
        .update(providerConfiguration)
        .set(updateData)
        .where(
          and(
            eq(providerConfiguration.id, request.id),
            eq(providerConfiguration.organizationId, this.organizationId)
          )
        )
        .returning();

      if (!updated) {
        return {
          success: false,
          error: 'Configuração não encontrada'
        };
      }

      // Update health check after changes
      await this.updateProviderHealth(updated.id);

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao atualizar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Atualizar status de saúde de um provider
   */
  async updateProviderHealth(configId: string): Promise<OperationResult<void>> {
    try {
      const [config] = await db
        .select()
        .from(providerConfiguration)
        .where(eq(providerConfiguration.id, configId))
        .limit(1);

      if (!config) {
        return {
          success: false,
          error: 'Configuração não encontrada'
        };
      }

      const decryptedCredentials = this.decryptCredentials(config.credentials);
      const providerConfig: ProviderConfig = {
        type: config.providerName,
        credentials: decryptedCredentials,
        settings: config.settings as Record<string, any>
      };

      const healthResult = await checkProviderHealth(config.providerType, providerConfig);

      await db
        .update(providerConfiguration)
        .set({
          lastHealthCheck: new Date(),
          healthStatus: healthResult.status,
          healthDetails: healthResult.details || {},
          updatedAt: new Date()
        })
        .where(eq(providerConfiguration.id, configId));

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      await db
        .update(providerConfiguration)
        .set({
          lastHealthCheck: new Date(),
          healthStatus: 'unhealthy',
          healthDetails: { 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          },
          updatedAt: new Date()
        })
        .where(eq(providerConfiguration.id, configId));

      return {
        success: false,
        error: `Erro ao verificar saúde do provider: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Migrar de um provider para outro
   */
  async migrateProvider(request: MigrationRequest): Promise<OperationResult<MigrationResult>> {
    try {
      // Get both provider configurations
      const [fromConfig, toConfig] = await Promise.all([
        db.select().from(providerConfiguration).where(eq(providerConfiguration.id, request.fromProviderId)).limit(1),
        db.select().from(providerConfiguration).where(eq(providerConfiguration.id, request.toProviderId)).limit(1)
      ]);

      if (!fromConfig[0] || !toConfig[0]) {
        return {
          success: false,
          error: 'Uma ou ambas configurações não foram encontradas'
        };
      }

      const from = fromConfig[0];
      const to = toConfig[0];

      // Validate providers are of same type
      if (from.providerType !== to.providerType) {
        return {
          success: false,
          error: 'Providers devem ser do mesmo tipo para migração'
        };
      }

      const migrationResult: MigrationResult = {
        success: false,
        migrationDetails: {
          fromProvider: from,
          toProvider: to,
          startTime: new Date(),
          status: 'in_progress'
        }
      };

      // Validation phase
      const validationErrors: string[] = [];

      // Check if target provider is healthy
      await this.updateProviderHealth(to.id);
      const updatedTo = await db.select().from(providerConfiguration).where(eq(providerConfiguration.id, to.id)).limit(1);
      
      if (updatedTo[0]?.healthStatus !== 'healthy') {
        validationErrors.push('Provider de destino não está saudável');
      }

      // Check if target provider is enabled
      if (!to.enabled) {
        validationErrors.push('Provider de destino está desabilitado');
      }

      if (validationErrors.length > 0) {
        migrationResult.validationErrors = validationErrors;
        migrationResult.migrationDetails.status = 'failed';
        migrationResult.migrationDetails.errors = validationErrors;
        migrationResult.migrationDetails.endTime = new Date();
        return {
          success: false,
          error: 'Validação falhou',
          data: migrationResult
        };
      }

      if (request.validateOnly) {
        migrationResult.success = true;
        migrationResult.migrationDetails.status = 'completed';
        migrationResult.migrationDetails.endTime = new Date();
        return {
          success: true,
          data: migrationResult
        };
      }

      // Mark migration as in progress
      await db
        .update(providerConfiguration)
        .set({
          migrationStatus: 'migrating',
          migrationDetails: { targetId: to.id, startTime: new Date() },
          updatedAt: new Date()
        })
        .where(eq(providerConfiguration.id, from.id));

      // Perform migration
      await db.transaction(async (tx) => {
        // Make target provider primary
        await tx
          .update(providerConfiguration)
          .set({
            isPrimary: true,
            priority: from.priority,
            updatedAt: new Date()
          })
          .where(eq(providerConfiguration.id, to.id));

        if (!request.preserveOld) {
          // Demote old provider to fallback or disable
          await tx
            .update(providerConfiguration)
            .set({
              isPrimary: false,
              isFallback: true,
              priority: (from.priority || 100) + 100,
              migrationStatus: 'stable',
              updatedAt: new Date()
            })
            .where(eq(providerConfiguration.id, from.id));
        } else {
          // Just mark as stable
          await tx
            .update(providerConfiguration)
            .set({
              migrationStatus: 'stable',
              updatedAt: new Date()
            })
            .where(eq(providerConfiguration.id, from.id));
        }
      });

      migrationResult.success = true;
      migrationResult.migrationDetails.status = 'completed';
      migrationResult.migrationDetails.endTime = new Date();

      return {
        success: true,
        data: migrationResult
      };
    } catch (error) {
      // Mark migration as failed
      await db
        .update(providerConfiguration)
        .set({
          migrationStatus: 'failed',
          migrationDetails: { 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            failTime: new Date()
          },
          updatedAt: new Date()
        })
        .where(eq(providerConfiguration.id, request.fromProviderId));

      return {
        success: false,
        error: `Erro durante migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Obter provider com fallback automático
   */
  async getProviderWithFallback<T>(
    type: 'llm' | 'storage' | 'database' | 'vector' | 'email'
  ): Promise<OperationResult<T | null>> {
    try {
      // Try primary provider first
      const primaryResult = await this.getPrimaryProvider(type);
      if (primaryResult.success && primaryResult.data && primaryResult.data.healthStatus === 'healthy') {
        const provider = await this.createProviderInstance<T>(primaryResult.data);
        if (provider.success) {
          return provider;
        }
      }

      // Fall back to fallback providers
      const fallbackResult = await this.getFallbackProviders(type);
      if (fallbackResult.success && fallbackResult.data) {
        for (const config of fallbackResult.data) {
          if (config.healthStatus === 'healthy') {
            const provider = await this.createProviderInstance<T>(config);
            if (provider.success) {
              return provider;
            }
          }
        }
      }

      return {
        success: false,
        error: `Nenhum provider ${type} saudável disponível`
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao obter provider com fallback: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Criar instância do provider a partir da configuração
   */
  private async createProviderInstance<T>(config: ProviderConfiguration): Promise<OperationResult<T>> {
    try {
      const decryptedCredentials = this.decryptCredentials(config.credentials);
      const providerConfig: ProviderConfig = {
        type: config.providerName,
        credentials: decryptedCredentials,
        settings: config.settings as Record<string, any>
      };

      const provider = providerFactory.createProvider(config.providerType, providerConfig) as T;

      return {
        success: true,
        data: provider
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar instância do provider: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Encrypt credentials (simplified - use proper encryption in production)
   */
  private encryptCredentials(credentials: Record<string, any>): Record<string, any> {
    // TODO: Implement proper encryption
    // For now, just return as-is but in production this should encrypt sensitive data
    const encrypted = { ...credentials };
    
    // Mark sensitive fields (for proper encryption later)
    Object.keys(encrypted).forEach(key => {
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('password')) {
        // In production: encrypted[key] = encrypt(credentials[key]);
        encrypted[`_encrypted_${key}`] = credentials[key];
      }
    });

    return encrypted;
  }

  /**
   * Decrypt credentials (simplified - use proper decryption in production)
   */
  private decryptCredentials(encryptedCredentials: Record<string, any>): Record<string, any> {
    // TODO: Implement proper decryption
    const decrypted = { ...encryptedCredentials };
    
    // Handle encrypted fields
    Object.keys(decrypted).forEach(key => {
      if (key.startsWith('_encrypted_')) {
        const originalKey = key.replace('_encrypted_', '');
        // In production: decrypted[originalKey] = decrypt(decrypted[key]);
        decrypted[originalKey] = decrypted[key];
        delete decrypted[key];
      }
    });

    return decrypted;
  }

  /**
   * Deletar configuração de provider
   */
  async deleteProviderConfiguration(configId: string): Promise<OperationResult<void>> {
    try {
      const [config] = await db
        .select()
        .from(providerConfiguration)
        .where(
          and(
            eq(providerConfiguration.id, configId),
            eq(providerConfiguration.organizationId, this.organizationId)
          )
        )
        .limit(1);

      if (!config) {
        return {
          success: false,
          error: 'Configuração não encontrada'
        };
      }

      // Prevent deletion of primary provider if it's the only one of its type
      if (config.isPrimary) {
        const otherConfigs = await db
          .select()
          .from(providerConfiguration)
          .where(
            and(
              eq(providerConfiguration.organizationId, this.organizationId),
              eq(providerConfiguration.providerType, config.providerType),
              eq(providerConfiguration.enabled, true)
            )
          );

        if (otherConfigs.length <= 1) {
          return {
            success: false,
            error: 'Não é possível deletar o único provider ativo deste tipo'
          };
        }
      }

      await db
        .delete(providerConfiguration)
        .where(eq(providerConfiguration.id, configId));

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao deletar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
} 