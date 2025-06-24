import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, team, teamMember, organization } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para criação de team
const createTeamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Retornar dados mock para teste inicial
    const mockTeams = [
      {
        id: '1',
        name: 'Equipe de Desenvolvimento',
        description: 'Responsável pelo desenvolvimento e manutenção do sistema',
        color: 'bg-blue-500',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        members: [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@humana.com',
            role: 'Tech Lead'
          },
          {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@humana.com',
            role: 'Developer'
          },
          {
            id: '3',
            name: 'Pedro Costa',
            email: 'pedro@humana.com',
            role: 'QA Engineer'
          }
        ]
      },
      {
        id: '2',
        name: 'Equipe de Design',
        description: 'Criação de interfaces e experiência do usuário',
        color: 'bg-purple-500',
        createdAt: new Date('2024-01-20T14:30:00Z'),
        members: [
          {
            id: '4',
            name: 'Ana Oliveira',
            email: 'ana@humana.com',
            role: 'UX Designer'
          },
          {
            id: '5',
            name: 'Carlos Lima',
            email: 'carlos@humana.com',
            role: 'UI Designer'
          }
        ]
      },
      {
        id: '3',
        name: 'Equipe de Vendas',
        description: 'Responsável pela prospecção e fechamento de negócios',
        color: 'bg-green-500',
        createdAt: new Date('2024-02-05T09:15:00Z'),
        members: [
          {
            id: '6',
            name: 'Roberto Alves',
            email: 'roberto@humana.com',
            role: 'Sales Manager'
          },
          {
            id: '7',
            name: 'Lucia Ferreira',
            email: 'lucia@humana.com',
            role: 'SDR'
          },
          {
            id: '8',
            name: 'Felipe Souza',
            email: 'felipe@humana.com',
            role: 'Account Executive'
          },
          {
            id: '9',
            name: 'Camila Rocha',
            email: 'camila@humana.com',
            role: 'Customer Success'
          }
        ]
      }
    ];

    return NextResponse.json({ teams: mockTeams });

  } catch (error) {
    console.error('Erro ao buscar teams:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, organizationId, managerId, parentTeamId, isActive } = body;

    if (!name) {
      return NextResponse.json({ 
        error: 'Nome é obrigatório' 
      }, { status: 400 });
    }

    // Verificar permissões do usuário atual
    const isCurrentUserMasterAdmin = session.user.email === 'master@humana.com';

    // Se for Master Admin, organização é obrigatória
    if (isCurrentUserMasterAdmin && !organizationId) {
      return NextResponse.json({ 
        error: 'Organização é obrigatória para Master Admin' 
      }, { status: 400 });
    }

    // Mock validações
    if (organizationId && !['org-1', 'org-2'].includes(organizationId)) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
    }

    if (managerId && !['user-1', 'user-2', 'master-1'].includes(managerId)) {
      return NextResponse.json({ error: 'Manager não encontrado' }, { status: 400 });
    }

    if (parentTeamId && !['1', '2', '3'].includes(parentTeamId)) {
      return NextResponse.json({ error: 'Time pai não encontrado' }, { status: 400 });
    }

    // Mock de criação de team
    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      description: description || '',
      organizationId: organizationId || null,
      managerId: managerId || null,
      parentTeamId: parentTeamId || null,
      isActive: isActive !== false,
      color: 'bg-blue-500',
      members: [],
      createdAt: new Date().toISOString(),
    };

    console.log('Mock: Criando time:', newTeam);

    return NextResponse.json({ 
      success: true,
      message: `Time "${name}" criado com sucesso`,
      team: newTeam
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar team:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 