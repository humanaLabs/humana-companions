import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, userOrganization, organization } from '@/lib/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para atualização de MasterAdmin
const updateMasterAdminSchema = z.object({
  userId: z.string().uuid('ID do usuário deve ser um UUID válido'),
  isMasterAdmin: z.boolean(),
});

interface MasterUser {
  id: string;
  email: string;
  isMasterAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/admin/master-users - Iniciando...');
    
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log(`👤 Usuário logado: ${session.user.email} (ID: ${session.user.id})`);

    // Verificar se o usuário atual é Master Admin
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const isMasterAdmin = currentUser[0].isMasterAdmin;
    console.log(`🔑 É Master Admin: ${isMasterAdmin}`);

    let allUsers: any[] = [];

    if (isMasterAdmin) {
      // Master Admin vê TODOS os usuários de TODAS as organizações
      console.log('👑 Master Admin - Buscando TODOS os usuários...');
      allUsers = await db
        .select({
          id: user.id,
          email: user.email,
          isMasterAdmin: user.isMasterAdmin,
        })
        .from(user)
        .orderBy(desc(user.isMasterAdmin), user.email)
        .limit(50);
    } else {
      // Admin de organização vê apenas usuários da PRÓPRIA organização
      console.log('🏢 Admin de Organização - Buscando usuários da organização...');
      
      // Primeiro, encontrar as organizações do usuário atual
      const userOrgs = await db
        .select({ organizationId: userOrganization.organizationId })
        .from(userOrganization)
        .where(
          and(
            eq(userOrganization.userId, session.user.id),
            inArray(userOrganization.roleInOrganization, ['owner', 'admin', 'manager'])
          )
        );

      if (userOrgs.length === 0) {
        return NextResponse.json(
          { error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' },
          { status: 403 }
        );
      }

      const orgIds = userOrgs.map(org => org.organizationId);
      console.log(`🎯 Organizações do usuário: ${orgIds.length}`);

      // Buscar usuários das organizações do admin
      allUsers = await db
        .select({
          id: user.id,
          email: user.email,
          isMasterAdmin: user.isMasterAdmin,
        })
        .from(user)
        .innerJoin(userOrganization, eq(user.id, userOrganization.userId))
        .where(inArray(userOrganization.organizationId, orgIds))
        .orderBy(desc(user.isMasterAdmin), user.email)
        .limit(50);
    }

    console.log(`✅ Encontrados ${allUsers.length} usuários`);

    // Transformar para o formato esperado pela interface
    const usersWithMockData: MasterUser[] = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      isMasterAdmin: u.isMasterAdmin,
      createdAt: new Date().toISOString(), // TODO: Adicionar campo createdAt na tabela user
      lastLogin: Math.random() > 0.5 
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() 
        : undefined, // TODO: Implementar tracking de lastLogin
    }));

    console.log('📤 Retornando dados dos usuários');
    return NextResponse.json({
      users: usersWithMockData,
      total: usersWithMockData.length,
      scope: isMasterAdmin ? 'global' : 'organization'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários master:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('📥 PATCH /api/admin/master-users - Iniciando...');
    
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário atual é Master Admin
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser[0]?.isMasterAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Master Admin pode alterar privilégios master.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📋 Body recebido:', body);
    
    const validatedData = updateMasterAdminSchema.parse(body);
    console.log('✅ Dados validados:', validatedData);

    // Verificar se não está tentando alterar a si mesmo
    if (validatedData.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar seu próprio status de Master Admin.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário alvo existe
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, validatedData.userId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    // Atualizar o status de MasterAdmin no banco
    const updatedUsers = await db
      .update(user)
      .set({ isMasterAdmin: validatedData.isMasterAdmin })
      .where(eq(user.id, validatedData.userId))
      .returning({
        id: user.id,
        email: user.email,
        isMasterAdmin: user.isMasterAdmin,
      });

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar usuário.' },
        { status: 500 }
      );
    }

    const action = validatedData.isMasterAdmin ? 'promovido para' : 'removido de';
    console.log(`Usuário ${updatedUsers[0].email} ${action} Master Admin`);

    return NextResponse.json({
      user: updatedUsers[0],
      message: `Usuário ${action} Master Admin com sucesso`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar usuário master:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 