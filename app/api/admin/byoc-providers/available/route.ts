import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { providerFactory } from '@/lib/services/providers/factory/provider-factory';

// GET - Listar providers disponíveis
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar providers disponíveis de cada tipo
    const availableProviders = {
      llm: providerFactory.getAvailableProviders('llm'),
      storage: providerFactory.getAvailableProviders('storage'),
      database: providerFactory.getAvailableProviders('database'),
      vector: providerFactory.getAvailableProviders('vector'),
      email: providerFactory.getAvailableProviders('email')
    };

    // Informações detalhadas sobre os providers
    const providerInfo = providerFactory.getProviderInfo();

    return NextResponse.json({
      ...availableProviders,
      details: providerInfo
    });

  } catch (error) {
    console.error('Error loading available providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 