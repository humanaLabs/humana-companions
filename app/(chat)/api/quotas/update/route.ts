import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { upsertUserQuota, checkCanCreateOrganization } from '@/lib/db/queries';
import { z } from 'zod';

const updateQuotaSchema = z.object({
  userId: z.string().uuid().optional(), // Se não fornecido, atualiza quota do próprio usuário
  monthlyMessagesLimit: z.number().int().min(0).optional(),
  dailyMessagesLimit: z.number().int().min(0).optional(),
  maxCompanions: z.number().int().min(0).optional(),
  maxCustomCompanions: z.number().int().min(0).optional(),
  maxDocuments: z.number().int().min(0).optional(),
  maxDocumentSizeMb: z.number().int().min(0).optional(),
  totalStorageMb: z.number().int().min(0).optional(),
  maxMcpServers: z.number().int().min(0).optional(),
  quotaType: z.enum(['standard', 'premium', 'enterprise']).optional(),
});

export async function PUT(request: NextRequest) {
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
    const validatedData = updateQuotaSchema.parse(body);

    // Determine target user
    const targetUserId = validatedData.userId || session.user.id;

    // Check permissions - only allow updating own quota or if user is admin
    if (targetUserId !== session.user.id) {
      // Check if user has admin permissions
      const isAdmin = await checkCanCreateOrganization(session.user.id);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Permissão insuficiente para alterar quotas de outros usuários' },
          { status: 403 }
        );
      }
    }

    const updatedQuota = await upsertUserQuota({
      userId: targetUserId,
      organizationId,
      ...validatedData,
    });

    return NextResponse.json({
      quota: updatedQuota,
      message: 'Quota atualizada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar quota:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar quota' },
      { status: 500 }
    );
  }
} 