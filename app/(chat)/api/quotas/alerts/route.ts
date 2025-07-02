import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserQuotaAlerts, upsertQuotaAlert } from '@/lib/db/queries';
import { z } from 'zod';

const alertSchema = z.object({
  alertType: z.enum(['messages_daily', 'messages_monthly', 'companions', 'documents', 'storage', 'mcp_servers']),
  thresholdPercentage: z.number().int().min(1).max(100),
  isEnabled: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  // Get organizationId from middleware headers
  const organizationId = request.headers.get('x-organization-id');
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization context missing' },
      { status: 400 }
    );
  }

  try {
    const alerts = await getUserQuotaAlerts({
      userId: session.user.id,
      organizationId,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar alertas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  // Get organizationId from middleware headers
  const organizationId = request.headers.get('x-organization-id');
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization context missing' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = alertSchema.parse(body);

    const alert = await upsertQuotaAlert({
      userId: session.user.id,
      organizationId,
      ...validatedData,
    });

    return NextResponse.json({
      alert,
      message: 'Alerta configurado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar alerta:', error);
    return NextResponse.json(
      { error: 'Falha ao criar alerta' },
      { status: 500 }
    );
  }
} 