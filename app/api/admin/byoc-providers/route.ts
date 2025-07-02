import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  providerFactory,
  checkProviderHealth
} from '@/lib/services/providers/factory/provider-factory';
import { z } from 'zod';

// Validation schemas
const ProviderConfigSchema = z.object({
  type: z.string(),
  enabled: z.boolean(),
  credentials: z.record(z.any()),
  settings: z.record(z.any()).optional().default({}),
  metadata: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional()
  }).optional()
});

const OrganizationConfigSchema = z.object({
  organizationId: z.string(),
  llm: ProviderConfigSchema.optional(),
  storage: ProviderConfigSchema.optional(),
  database: ProviderConfigSchema.optional(),
  vector: ProviderConfigSchema.optional(),
  email: ProviderConfigSchema.optional()
});

// GET - Carregar configurações atuais
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId || 'default-org';

    // Por enquanto, retornar configuração mock
    // Em produção, isso viria do banco de dados
    const mockConfig = {
      organizationId,
      // Configurações vazias por padrão
    };

    // Health status mock
    const healthStatus: Record<string, any> = {};

    return NextResponse.json({
      config: mockConfig,
      health: healthStatus,
      organizationId
    });

  } catch (error) {
    console.error('Error loading BYOC configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Salvar configurações
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados de entrada
    const validatedConfig = OrganizationConfigSchema.parse(body);

    // Sanitizar credenciais sensíveis para log
    const sanitizedConfig = JSON.parse(JSON.stringify(validatedConfig));
    if (sanitizedConfig.llm?.credentials) {
      Object.keys(sanitizedConfig.llm.credentials).forEach(key => {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
          sanitizedConfig.llm.credentials[key] = '***REDACTED***';
        }
      });
    }
    if (sanitizedConfig.storage?.credentials) {
      Object.keys(sanitizedConfig.storage.credentials).forEach(key => {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
          sanitizedConfig.storage.credentials[key] = '***REDACTED***';
        }
      });
    }

    console.log('Saving BYOC configuration:', sanitizedConfig);

    // TODO: Salvar no banco de dados
    // Por enquanto, apenas simular o salvamento
    console.log(`BYOC configuration would be saved for organization ${validatedConfig.organizationId} by user ${session.user.id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'BYOC configuration saved successfully' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.errors }, 
        { status: 400 }
      );
    }

    console.error('Error saving BYOC configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 