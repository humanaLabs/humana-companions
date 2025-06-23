import { auth } from '@/app/(auth)/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationsByUserId, getCompanionsByUserId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar organizações do usuário
    const organizations = await getOrganizationsByUserId(session.user.id);

    // Buscar companions do usuário
    const companions = await getCompanionsByUserId({ userId: session.user.id });

    // Transformar dados para o formato do ReactFlow
    const hierarchyData = {
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        values: org.values,
        teams: org.teams,
        positions: org.positions,
        orgUsers: org.orgUsers,
        tenantConfig: org.tenantConfig,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      })),
      companions: companions.map(comp => ({
        id: comp.id,
        name: comp.name,
        role: comp.role,
        responsibilities: comp.responsibilities,
        expertises: comp.expertises,
        sources: comp.sources,
        rules: comp.rules,
        contentPolicy: comp.contentPolicy,
        skills: comp.skills,
        fallbacks: comp.fallbacks,
        organizationId: comp.organizationId,
        positionId: comp.positionId,
        linkedTeamId: comp.linkedTeamId,
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
      })),
    };

    console.log('Dados carregados para visualizador:');
    console.log('- Organizações:', organizations.length);
    console.log('- Companions:', companions.length);

    return NextResponse.json({ 
      success: true, 
      data: hierarchyData 
    });
  } catch (error) {
    console.error('Erro ao carregar dados organizacionais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 