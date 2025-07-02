import { auth } from '@/app/(auth)/auth';
import { createCompanion, getCompanionsByUserId, incrementUsage } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { createCompanionSchema } from './schema';
import { checkQuotaBeforeAction } from '@/lib/middleware/quota-enforcement';

export async function GET() {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const companions = await getCompanionsByUserId({ 
      userId: session.user.id! 
    });
    
    return NextResponse.json({ companions });
  } catch (error) {
    console.error('Erro ao buscar companions:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar companions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 🛡️ VERIFICAÇÃO DE QUOTA - Companions
  try {
    const quotaCheck = await checkQuotaBeforeAction({ 
      request, 
      config: { 
        quotaType: 'companions', 
        actionType: 'create' 
      } 
    });
    
    if (!quotaCheck.allowed && quotaCheck.error) {
      return NextResponse.json(
        {
          error: quotaCheck.error.message,
          quotaType: quotaCheck.error.quotaType,
          current: quotaCheck.error.current,
          limit: quotaCheck.error.limit,
          type: 'quota_exceeded'
        },
        { status: 429 }
      );
    }
  } catch (quotaError) {
    console.error('Erro na verificação de quota de companions:', quotaError);
    // Continuar com a operação se houver erro na verificação
  }

  try {
    const body = await request.json();
    const validatedData = createCompanionSchema.parse(body);

    const [companion] = await createCompanion({
      ...validatedData,
      userId: session.user.id!,
    });

    // 📊 TRACKING DE USO - Incrementar contador de companions
    try {
      const organizationId = request.headers.get('x-organization-id');
      if (organizationId) {
        await incrementUsage({
          userId: session.user.id!,
          organizationId,
          usageType: 'companions',
          amount: 1,
        });
        console.log('✅ Criação de companion registrada');
      }
    } catch (trackingError) {
      console.error('❌ Erro ao registrar criação de companion:', trackingError);
    }

    return NextResponse.json({ companion }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar companion:', error);
    
    if (error instanceof Error && 'issues' in error) {
      // Erro de validação Zod
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao criar companion' },
      { status: 500 }
    );
  }
} 