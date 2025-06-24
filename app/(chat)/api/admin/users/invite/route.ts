import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, role, organization, userInvite, userOrganization } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    let { email, roleId, organizationId, message } = body;

    if (!email || !roleId) {
      return NextResponse.json({ 
        error: 'Email e roleId são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para convidar
    const currentUser = await db
      .select({
        id: user.id,
        isMasterAdmin: user.isMasterAdmin,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const currentUserData = currentUser[0];

    // Verificar se a role existe
    const roleExists = await db
      .select({ id: role.id })
      .from(role)
      .where(eq(role.id, roleId))
      .limit(1);

    if (!roleExists[0]) {
      return NextResponse.json({ error: 'Role não encontrada' }, { status: 400 });
    }

    // Se for Master Admin, organização é obrigatória
    if (currentUserData.isMasterAdmin) {
      if (!organizationId) {
        return NextResponse.json({ 
          error: 'Organização é obrigatória para Master Admin' 
        }, { status: 400 });
      }
    } else {
      // Se não for Master Admin, pegar a organização do usuário atual
      const userOrg = await db
        .select({ organizationId: userOrganization.organizationId })
        .from(userOrganization)
        .where(eq(userOrganization.userId, currentUserData.id))
        .limit(1);

      if (!userOrg[0]) {
        return NextResponse.json({ 
          error: 'Usuário não está associado a nenhuma organização' 
        }, { status: 400 });
      }

      // Forçar a organização do usuário atual se não for Master Admin
      organizationId = userOrg[0].organizationId;
    }

    // Verificar se a organização existe (se especificada)
    if (organizationId) {
      const orgExists = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1);

      if (!orgExists[0]) {
        return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
      }
    }

    // Verificar se o usuário já existe
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser[0]) {
      return NextResponse.json({ 
        error: 'Usuário já existe no sistema' 
      }, { status: 400 });
    }

    // Verificar se já existe um convite pendente
    const existingInvite = await db
      .select({ id: userInvite.id })
      .from(userInvite)
      .where(
        and(
          eq(userInvite.email, email),
          eq(userInvite.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvite[0]) {
      return NextResponse.json({ 
        error: 'Já existe um convite pendente para este email' 
      }, { status: 400 });
    }

    // Criar convite
    const inviteToken = nanoid(32);
    
    const newInvite = await db.insert(userInvite).values({
      email,
      roleId,
      organizationId: organizationId || null,
      invitedBy: currentUserData.id,
      token: inviteToken,
      message: message || null,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    }).returning();

    // TODO: Enviar email com o convite
    // const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${inviteToken}`;
    // await sendInviteEmail(email, inviteUrl, message);

    return NextResponse.json({
      success: true,
      invite: newInvite[0],
      message: `Convite enviado para ${email}`,
    });

  } catch (error) {
    console.error('Erro ao criar convite:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 