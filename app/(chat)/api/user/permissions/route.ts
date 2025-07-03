import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
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

    let dbUser = null;
    let isMasterAdmin = false;

    // 🔧 Buscar usuário no banco com fallback robusto
    try {
      const [foundUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);
      
      dbUser = foundUser;
      isMasterAdmin = dbUser?.isMasterAdmin || false;
    } catch (dbError) {
      console.error('🚨 Database error in permissions API:', dbError);
      
      // 🔧 FALLBACK: Se há erro no banco mas usuário tem isMasterAdmin na sessão
      if (session.user.isMasterAdmin) {
        console.log('🔧 Using session fallback for Master Admin');
        isMasterAdmin = true;
        dbUser = {
          id: session.user.id,
          email: session.user.email,
          plan: 'pro',
          messagesSent: 0,
          isMasterAdmin: true
        };
      } else {
        // Re-throw se não for Master Admin
        throw dbError;
      }
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    // DEBUG: Log para verificar a detecção de Master Admin
    console.log('🔍 DEBUG API - Email:', session.user.email);
    console.log('🔍 DEBUG API - É Master Admin?', isMasterAdmin);
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
    const computedPermissions = computeUserPermissions(
      rolePermissions,
      isMasterAdmin,
    );

    // Calcular limites de mensagens baseado no plano
    let messagesLimit = 10; // Free plan
    if (dbUser.plan === 'guest') messagesLimit = 3;
    if (dbUser.plan === 'pro') messagesLimit = Number.POSITIVE_INFINITY;

    return NextResponse.json({
      // Compatibilidade com código existente
      canCreateOrganization,
      isMasterAdmin,
      userId: session.user.id,
      type: session.user.type,
      email: session.user.email,

      // Novas informações de permissões
      roleId,
      organizationId: session.user.organizationId || request.headers.get('x-organization-id'),
      teamIds: [], // TODO: Buscar times do usuário
      permissions: computedPermissions,
      rawPermissions: rolePermissions,
      plan: dbUser.plan,
      messagesSent: dbUser.messagesSent,

      // Informações de limite de mensagens
      messagesUsed: dbUser.messagesSent || 0,
      messagesLimit: messagesLimit,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    // 🔧 ÚLTIMO FALLBACK: Para Master Admins, retornar permissões básicas
    const session = await auth();
    if (session?.user?.isMasterAdmin) {
      console.log('🔧 Emergency fallback for Master Admin permissions');
      return NextResponse.json({
        canCreateOrganization: true,
        isMasterAdmin: true,
        userId: session.user.id,
        type: session.user.type,
        email: session.user.email,
        roleId: 'master_admin',
        organizationId: session.user.organizationId,
        teamIds: [],
        permissions: SYSTEM_ROLES.MASTER_ADMIN.permissions,
        rawPermissions: SYSTEM_ROLES.MASTER_ADMIN.permissions,
        plan: 'pro',
        messagesSent: 0,
        messagesUsed: 0,
        messagesLimit: Number.POSITIVE_INFINITY,
      });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
