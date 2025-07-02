import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ProviderConfigurationService } from '@/lib/services/domain/provider-configuration-service';
import type { ServiceContext } from '@/lib/services/types/service-context';

// DELETE - Deletar configuração específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configId = params.id;
    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' }, 
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId || 'default-org';
    
    const context: ServiceContext = {
      organizationId,
      userId: session.user.id,
      timestamp: new Date(),
      requestId: `byoc-delete-${Date.now()}`
    };

    const service = new ProviderConfigurationService(context);
    const result = await service.deleteProviderConfiguration(configId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    console.log(`Provider configuration deleted:`, {
      id: configId,
      organizationId,
      deletedBy: session.user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Provider configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting provider configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET - Buscar configuração específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configId = params.id;
    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' }, 
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId || 'default-org';
    
    const context: ServiceContext = {
      organizationId,
      userId: session.user.id,
      timestamp: new Date(),
      requestId: `byoc-get-single-${Date.now()}`
    };

    const service = new ProviderConfigurationService(context);
    const result = await service.getProviderConfigurations();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Failed to fetch configurations' }, 
        { status: 500 }
      );
    }

    const config = result.data.find(c => c.id === configId);
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' }, 
        { status: 404 }
      );
    }

    // Sanitize credentials before returning
    const sanitizedConfig = {
      ...config,
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
    };

    return NextResponse.json({ 
      success: true,
      data: sanitizedConfig
    });

  } catch (error) {
    console.error('Error fetching provider configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 