import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { checkProviderHealth } from '@/lib/services/providers/factory/provider-factory';
import { z } from 'zod';

// Validation schema
const TestProviderSchema = z.object({
  type: z.enum(['llm', 'storage', 'database', 'vector', 'email']),
  config: z.object({
    type: z.string(),
    enabled: z.boolean(),
    credentials: z.record(z.any()),
    settings: z.record(z.any()).optional().default({}),
    metadata: z.object({
      name: z.string(),
      version: z.string(),
      description: z.string().optional()
    }).optional()
  })
});

// POST - Testar conexão de um provider
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados de entrada
    const { type, config } = TestProviderSchema.parse(body);

    console.log(`Testing ${type} provider: ${config.type}`);

    // Testar a conexão do provider
    const healthResult = await checkProviderHealth(type, config);

    return NextResponse.json({
      provider: config.type,
      healthy: healthResult.healthy,
      error: healthResult.error,
      responseTime: healthResult.responseTime
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid test configuration', details: error.errors }, 
        { status: 400 }
      );
    }

    console.error('Error testing provider:', error);
    return NextResponse.json({
      provider: 'unknown',
      healthy: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 