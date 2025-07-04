import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await segmentData.params;
    const userId = resolvedParams.id;

    // Mock data para usuário específico
    const mockUser = {
      id: userId,
      email: `user-${userId}@example.com`,
      isMasterAdmin: userId === 'master-1',
    };

    const mockOrganizationId = userId === 'master-1' ? null : 'org-1';

    return NextResponse.json({
      user: mockUser,
      organizationId: mockOrganizationId,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await segmentData.params;
    const userId = resolvedParams.id;
    const body = await request.json();

    const { name, email, roleId, status, organizationId, isMasterAdmin } = body;

    // Mock validação de permissões
    const isCurrentUserMasterAdmin = session.user.email === 'master@humana.com';

    // Validações de permissão
    if (!isCurrentUserMasterAdmin) {
      if (isMasterAdmin !== undefined) {
        return NextResponse.json(
          {
            error:
              'Apenas Master Admin pode alterar privilégios de Master Admin',
          },
          { status: 403 },
        );
      }

      if (organizationId !== undefined) {
        return NextResponse.json(
          {
            error: 'Apenas Master Admin pode alterar organização',
          },
          { status: 403 },
        );
      }
    }

    // Mock validações
    if (roleId && !['1', '2', 'admin', 'user'].includes(roleId)) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 400 },
      );
    }

    if (organizationId && !['org-1', 'org-2', ''].includes(organizationId)) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 },
      );
    }

    console.log('Mock: Atualizando usuário', userId, 'com dados:', {
      name,
      email,
      roleId,
      status,
      organizationId,
      isMasterAdmin,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é master admin
    const isCurrentUserMasterAdmin = session.user.email === 'master@humana.com';
    if (!isCurrentUserMasterAdmin) {
      return NextResponse.json(
        { error: 'Apenas Master Admin pode excluir usuários' },
        { status: 403 },
      );
    }

    const resolvedParams = await segmentData.params;
    const userId = resolvedParams.id;

    // Não permitir excluir a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 },
      );
    }

    console.log('Mock: Excluindo usuário', userId);

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 },
    );
  }
}
