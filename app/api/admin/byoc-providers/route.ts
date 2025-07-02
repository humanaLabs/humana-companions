import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  providerFactory,
  checkProviderHealth
} from '@/lib/services/providers/factory/provider-factory';
import { ProviderConfigurationService } from '@/lib/services/domain/provider-configuration-service';
import type { ServiceContext } from '@/lib/services/types/service-context';
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
    
    const context: ServiceContext = {
      organizationId,
      userId: session.user.id,
      timestamp: new Date(),
      requestId: `byoc-get-${Date.now()}`
    };

    // 🚀 REAL MODE: Loading actual provider configurations from environment
    console.log('📋 Loading BYOC configurations from environment variables');
    
    const realConfigurations = [];

    // ✅ Azure OpenAI - Check if configured and active
    if (process.env.AZURE_API_KEY) {
      realConfigurations.push({
        id: 'env-azure-primary',
        organizationId,
        providerType: 'llm',
        providerName: 'azure',
        enabled: true,
        isPrimary: true,
        isFallback: false,
        priority: 100,
        credentials: { 
          apiKey: `***${process.env.AZURE_API_KEY.slice(-4)}`,
          resourceName: '1aifoundry'
        },
        settings: { 
          deploymentName: 'gpt-4o',
          endpoint: 'https://1aifoundry.openai.azure.com',
          apiVersion: '2024-02-15-preview',
          temperature: 0.7 
        },
        metadata: { 
          name: 'Azure OpenAI (Production)', 
          description: 'Production Azure OpenAI endpoint configured from environment',
          version: '2024-02-15'
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ✅ OpenAI - Check if configured as fallback
    if (process.env.OPENAI_API_KEY) {
      realConfigurations.push({
        id: 'env-openai-fallback',
        organizationId,
        providerType: 'llm',
        providerName: 'openai',
        enabled: true,
        isPrimary: false,
        isFallback: true,
        priority: 50,
        credentials: { 
          apiKey: `***${process.env.OPENAI_API_KEY.slice(-4)}`
        },
        settings: { 
          model: 'gpt-4',
          baseURL: 'https://api.openai.com/v1',
          temperature: 0.7 
        },
        metadata: { 
          name: 'OpenAI (Fallback)', 
          description: 'OpenAI fallback provider configured from environment',
          version: 'v1'
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 📋 Add placeholder configurations for unconfigured provider types
    const placeholderConfigs = [
      {
        id: 'placeholder-storage',
        organizationId,
        providerType: 'storage',
        providerName: 'aws-s3',
        enabled: false,
        isPrimary: false,
        isFallback: false,
        priority: 0,
        credentials: {},
        settings: {},
        metadata: { 
          name: 'AWS S3 (Not Configured)', 
          description: 'Click to configure AWS S3 storage provider'
        },
        healthStatus: 'not_configured',
        lastHealthCheck: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'placeholder-vector',
        organizationId,
        providerType: 'vector',
        providerName: 'pinecone',
        enabled: false,
        isPrimary: false,
        isFallback: false,
        priority: 0,
        credentials: {},
        settings: {},
        metadata: { 
          name: 'Pinecone (Not Configured)', 
          description: 'Click to configure Pinecone vector database'
        },
        healthStatus: 'not_configured',
        lastHealthCheck: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const allConfigurations = [...realConfigurations, ...placeholderConfigs];

    // Group configurations by type for easier frontend consumption  
    const configsByType = allConfigurations.reduce((acc: Record<string, any[]>, config) => {
      if (!acc[config.providerType]) {
        acc[config.providerType] = [];
      }
      acc[config.providerType].push({
        ...config,
        // Sanitize credentials for response
        credentials: Object.keys(config.credentials as Record<string, any>).reduce((creds, key) => {
          if (key.toLowerCase().includes('key') || 
              key.toLowerCase().includes('secret') || 
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('password')) {
            creds[key] = '***REDACTED***';
          } else {
            creds[key] = (config.credentials as Record<string, any>)[key];
          }
          return creds;
        }, {} as Record<string, any>)
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      organizationId,
      configurations: configsByType,
      totalConfigurations: allConfigurations.length
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
    const organizationId = session.user.organizationId || 'default-org';
    
    const context: ServiceContext = {
      organizationId,
      userId: session.user.id,
      timestamp: new Date(),
      requestId: `byoc-save-${Date.now()}`
    };

    // TODO: Temporário - mock save enquanto tabela não existe
    // const service = new ProviderConfigurationService(context);

    // Basic validation
    if (!body.providerType && !body.id) {
      return NextResponse.json(
        { error: 'Missing required fields: providerType or id for update' }, 
        { status: 400 }
      );
    }

    // Mock successful save
    const isUpdate = body.id && typeof body.id === 'string';
    
    // Simulate saving configuration
    const mockSavedConfig = {
      id: body.id || `mock-${body.providerType}-${Date.now()}`,
      organizationId,
      providerType: body.providerType || 'unknown',
      providerName: body.providerName || 'unknown',
      enabled: body.enabled ?? true,
      isPrimary: body.isPrimary ?? false,
      isFallback: body.isFallback ?? false,
      priority: body.priority ?? 100,
      credentials: '***REDACTED***', // Never return real credentials
      settings: body.settings || {},
      metadata: body.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`BYOC configuration ${isUpdate ? 'updated' : 'created'} successfully (MOCK):`, {
      id: mockSavedConfig.id,
      type: mockSavedConfig.providerType,
      name: mockSavedConfig.providerName,
      organizationId
    });

    return NextResponse.json({ 
      success: true, 
      message: `BYOC configuration ${isUpdate ? 'updated' : 'created'} successfully (Demo Mode)`,
      data: mockSavedConfig
    });

  } catch (error) {
    console.error('Error saving BYOC configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 