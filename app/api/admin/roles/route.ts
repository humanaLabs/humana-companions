import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, role } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para criação de role
const createRoleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  displayName: z.string().min(2, 'Nome de exibição deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string(),
    conditions: z.object({
      own_only: z.boolean().optional(),
      organization_only: z.boolean().optional(),
      team_only: z.boolean().optional(),
    }).optional(),
  })),
});

// Interface para criação de role
interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  organizationId?: string | null;
  permissions: string[];
}

// Interface para role
interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  organizationId?: string | null;
  organizationName?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data para roles existentes
const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'master_admin',
    displayName: 'Master Admin',
    description: 'Acesso total ao sistema',
    organizationId: null,
    permissions: ['*'],
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'admin',
    displayName: 'Admin',
    description: 'Administrador da organização',
    organizationId: null,
    permissions: [
      'users.read', 'users.create', 'users.update',
      'teams.read', 'teams.create', 'teams.update',
      'companions.read', 'companions.create', 'companions.update',
    ],
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'user',
    displayName: 'Usuário',
    description: 'Usuário padrão',
    organizationId: null,
    permissions: ['companions.read'],
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock organizations
const MOCK_ORGANIZATIONS = [
  { id: '1', name: 'Humana Inc.' },
  { id: '2', name: 'TechCorp' },
  { id: '3', name: 'StartupXYZ' },
];

// GET - Listar roles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    if (!session.user.role || !['master_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Master Admin vê todas as roles
    // Admin regular vê apenas roles da sua organização e roles globais
    let filteredRoles = MOCK_ROLES;

    if (session.user.role === 'admin' && organizationId) {
      filteredRoles = MOCK_ROLES.filter(role => 
        role.organizationId === organizationId || role.organizationId === null
      );
    }

    // Adicionar nome da organização
    const rolesWithOrgNames = filteredRoles.map(role => ({
      ...role,
      organizationName: role.organizationId 
        ? MOCK_ORGANIZATIONS.find(org => org.id === role.organizationId)?.name || 'Organização não encontrada'
        : 'Global'
    }));

    return NextResponse.json({ 
      roles: rolesWithOrgNames,
      total: rolesWithOrgNames.length 
    });

  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar role
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    if (!session.user.role || !['master_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body: CreateRoleRequest = await request.json();

    // Validações
    if (!body.name || !body.displayName) {
      return NextResponse.json({ 
        error: 'Nome e nome de exibição são obrigatórios' 
      }, { status: 400 });
    }

    if (!body.permissions || body.permissions.length === 0) {
      return NextResponse.json({ 
        error: 'Pelo menos uma permissão deve ser selecionada' 
      }, { status: 400 });
    }

    // Verificar se role já existe
    const existingRole = MOCK_ROLES.find(role => role.name === body.name);
    if (existingRole) {
      return NextResponse.json({ 
        error: 'Uma role com este nome já existe' 
      }, { status: 400 });
    }

    // Admin regular só pode criar roles para sua organização
    let organizationId = body.organizationId;
    if (session.user.role === 'admin') {
      // Para admin regular, sempre usar a organização do usuário
      organizationId = session.user.organizationId || null;
    }

    // Criar nova role (mock)
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: body.name,
      displayName: body.displayName,
      description: body.description,
      organizationId: organizationId,
      organizationName: organizationId 
        ? MOCK_ORGANIZATIONS.find(org => org.id === organizationId)?.name || 'Organização não encontrada'
        : 'Global',
      permissions: body.permissions,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Em um sistema real, salvaria no banco de dados
    // MOCK_ROLES.push(newRole);

    return NextResponse.json({ 
      message: 'Role criada com sucesso',
      role: newRole 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar role:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 