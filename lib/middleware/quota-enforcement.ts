import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserQuota, getUserUsage, incrementUsage } from '@/lib/db/queries';

export interface QuotaConfig {
  quotaType: 'messages_daily' | 'messages_monthly' | 'companions' | 'documents' | 'storage' | 'mcp_servers';
  actionType: 'create' | 'upload' | 'send';
  resourceSize?: number; // Para storage em MB
}

export class QuotaExceededError extends Error {
  constructor(
    public quotaType: string,
    public current: number,
    public limit: number,
    message?: string
  ) {
    super(message || `Quota exceeded for ${quotaType}: ${current}/${limit}`);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Middleware para verificar se uma ação pode ser executada dentro das quotas
 */
export async function checkQuotaBeforeAction({
  request,
  config,
}: {
  request: NextRequest;
  config: QuotaConfig;
}): Promise<{ allowed: boolean; error?: QuotaExceededError }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { allowed: false, error: new QuotaExceededError('auth', 0, 0, 'Usuário não autenticado') };
    }

    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return { allowed: false, error: new QuotaExceededError('organization', 0, 0, 'Organização não encontrada') };
    }

    // Buscar quota e uso atual
    const [quota, usage] = await Promise.all([
      getUserQuota({ userId: session.user.id, organizationId }),
      getUserUsage({ userId: session.user.id, organizationId }),
    ]);

    if (!quota) {
      // Se não há quota configurada, permitir ação (quotas ilimitadas)
      return { allowed: true };
    }

    // Verificar limites baseado no tipo de quota
    switch (config.quotaType) {
      case 'messages_daily':
        const dailyUsed = usage?.dailyMessagesUsed || 0;
        if (dailyUsed >= quota.dailyMessagesLimit) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'messages_daily',
              dailyUsed,
              quota.dailyMessagesLimit,
              `Limite diário de mensagens atingido: ${dailyUsed}/${quota.dailyMessagesLimit}`
            ),
          };
        }
        break;

      case 'messages_monthly':
        const monthlyUsed = usage?.monthlyMessagesUsed || 0;
        if (monthlyUsed >= quota.monthlyMessagesLimit) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'messages_monthly',
              monthlyUsed,
              quota.monthlyMessagesLimit,
              `Limite mensal de mensagens atingido: ${monthlyUsed}/${quota.monthlyMessagesLimit}`
            ),
          };
        }
        break;

      case 'companions':
        const companionsUsed = usage?.companionsCount || 0;
        if (companionsUsed >= quota.maxCompanions) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'companions',
              companionsUsed,
              quota.maxCompanions,
              `Limite de companions atingido: ${companionsUsed}/${quota.maxCompanions}`
            ),
          };
        }
        break;

      case 'documents':
        const documentsUsed = usage?.documentsCount || 0;
        if (documentsUsed >= quota.maxDocuments) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'documents',
              documentsUsed,
              quota.maxDocuments,
              `Limite de documentos atingido: ${documentsUsed}/${quota.maxDocuments}`
            ),
          };
        }
        break;

      case 'storage':
        const storageUsed = usage?.totalStorageUsedMb || 0;
        const newStorageUsed = storageUsed + (config.resourceSize || 0);
        if (newStorageUsed > quota.totalStorageMb) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'storage',
              Math.round(newStorageUsed * 100) / 100,
              quota.totalStorageMb,
              `Limite de armazenamento atingido: ${Math.round(newStorageUsed * 100) / 100}MB/${quota.totalStorageMb}MB`
            ),
          };
        }
        break;

      case 'mcp_servers':
        const mcpServersUsed = usage?.mcpServersCount || 0;
        if (mcpServersUsed >= quota.maxMcpServers) {
          return {
            allowed: false,
            error: new QuotaExceededError(
              'mcp_servers',
              mcpServersUsed,
              quota.maxMcpServers,
              `Limite de MCP servers atingido: ${mcpServersUsed}/${quota.maxMcpServers}`
            ),
          };
        }
        break;
    }

    return { allowed: true };
  } catch (error) {
    console.error('Erro ao verificar quota:', error);
    return {
      allowed: false,
      error: new QuotaExceededError(
        'system',
        0,
        0,
        'Erro interno ao verificar quotas'
      ),
    };
  }
}

/**
 * Helper para executar ação e incrementar uso automaticamente
 */
export async function executeWithQuotaTracking({
  request,
  config,
  action,
}: {
  request: NextRequest;
  config: QuotaConfig;
  action: () => Promise<any>;
}): Promise<any> {
  // Verificar quota antes da ação
  const quotaCheck = await checkQuotaBeforeAction({ request, config });
  
  if (!quotaCheck.allowed) {
    throw quotaCheck.error;
  }

  // Executar a ação
  const result = await action();

  // Incrementar uso após sucesso
  try {
    const session = await auth();
    const organizationId = request.headers.get('x-organization-id');
    
    if (session?.user?.id && organizationId) {
      await incrementUsage({
        userId: session.user.id,
        organizationId,
        usageType: config.quotaType,
        amount: config.resourceSize || 1,
      });
    }
  } catch (trackingError) {
    console.error('Erro ao rastrear uso:', trackingError);
    // Não falhar a operação por erro de tracking
  }

  return result;
}

/**
 * Middleware wrapper para Next.js API routes
 */
export function withQuotaEnforcement(config: QuotaConfig) {
  return function (
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest, ...args: any[]): Promise<NextResponse> {
      try {
        const quotaCheck = await checkQuotaBeforeAction({ request: req, config });
        
        if (!quotaCheck.allowed && quotaCheck.error) {
          return NextResponse.json(
            {
              error: quotaCheck.error.message,
              quotaType: quotaCheck.error.quotaType,
              current: quotaCheck.error.current,
              limit: quotaCheck.error.limit,
            },
            { status: 429 } // Too Many Requests
          );
        }

        return handler(req, ...args);
      } catch (error) {
        console.error('Erro no middleware de quota:', error);
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        );
      }
    };
  };
} 