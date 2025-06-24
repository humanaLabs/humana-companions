import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_ROLES, computeUserPermissions } from '@/lib/permissions/index';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data devido a problemas de compatibilidade do Drizzle
    // TODO: Implementar busca real no banco quando resolver conflitos de versão
    const isMasterAdmin = session.user.email === 'admin@humana.com.br' || false;
    const canCreateOrganization = session.user.type === 'regular';

    // Determinar role baseado no tipo de usuário
    let roleId = 'user';
    let rolePermissions: string[] = SYSTEM_ROLES.USER.permissions;

    if (isMasterAdmin) {
      roleId = 'master_admin';
      rolePermissions = SYSTEM_ROLES.MASTER_ADMIN.permissions;
    } else if (session.user.type === 'regular') {
      // TODO: Implementar lógica para determinar se é admin baseado na organização
      roleId = 'admin';
      rolePermissions = SYSTEM_ROLES.ADMIN.permissions;
    }

    // Computar permissões finais
    const computedPermissions = computeUserPermissions(rolePermissions, isMasterAdmin);

    return NextResponse.json({
      // Compatibilidade com código existente
      canCreateOrganization,
      isMasterAdmin,
      userId: session.user.id,
      type: session.user.type,
      email: session.user.email,
      
      // Novas informações de permissões
      roleId,
      organizationId: undefined, // TODO: Buscar organização do usuário
      teamIds: [], // TODO: Buscar times do usuário
      permissions: computedPermissions,
      rawPermissions: rolePermissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 