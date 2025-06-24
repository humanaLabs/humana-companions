import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

// Schema de validação para criação de role
const createRoleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  displayName: z
    .string()
    .min(2, 'Nome de exibição deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      action: z.string(),
      conditions: z
        .object({
          own_only: z.boolean().optional(),
          organization_only: z.boolean().optional(),
          team_only: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
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
      'users.read',
      'users.create',
      'users.update',
      'teams.read',
      'teams.create',
      'teams.update',
      'companions.read',
      'companions.create',
      'companions.update',
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

// Função helper para verificar se é admin
function isAdmin(session: any): boolean {
  return (
    session.user.email === 'master@humana.com' ||
    session.user.type === 'regular'
  );
}

// Função helper para verificar se é master admin
function isMasterAdmin(session: any): boolean {
  return session.user.email === 'master@humana.com';
}

// GET - Listar roles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin - usando apenas propriedades que existem
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Master Admin vê todas as roles
    // Admin regular vê apenas roles da sua organização e roles globais
    let filteredRoles = MOCK_ROLES;
    if (!isMasterAdmin(session) && organizationId) {
      filteredRoles = MOCK_ROLES.filter(
        (role) =>
          role.organizationId === organizationId ||
          role.organizationId === null,
      );
    }

    // Adicionar nome da organização
    const rolesWithOrgNames = filteredRoles.map((role) => ({
      ...role,
      organizationName: role.organizationId
        ? MOCK_ORGANIZATIONS.find((org) => org.id === role.organizationId)
            ?.name || 'Organização não encontrada'
        : 'Global',
    }));

    return NextResponse.json({
      roles: rolesWithOrgNames,
      total: rolesWithOrgNames.length,
    });
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// POST - Criar role
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin - usando apenas propriedades que existem
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body: CreateRoleRequest = await request.json();

    // Validações
    if (!body.name || !body.displayName) {
      return NextResponse.json(
        {
          error: 'Nome e nome de exibição são obrigatórios',
        },
        { status: 400 },
      );
    }

    if (!body.permissions || body.permissions.length === 0) {
      return NextResponse.json(
        {
          error: 'Pelo menos uma permissão deve ser selecionada',
        },
        { status: 400 },
      );
    }

    // Verificar se role já existe
    const existingRole = MOCK_ROLES.find((role) => role.name === body.name);
    if (existingRole) {
      return NextResponse.json(
        {
          error: 'Uma role com este nome já existe',
        },
        { status: 400 },
      );
    }

    // Admin regular só pode criar roles para sua organização
    let organizationId = body.organizationId;
    if (!isMasterAdmin(session)) {
      // Para admin regular, sempre usar a organização do usuário (se existir)
      organizationId = (session.user as any).organizationId || null;
    }

    // Criar nova role (mock)
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: body.name,
      displayName: body.displayName,
      description: body.description,
      organizationId: organizationId,
      organizationName: organizationId
        ? MOCK_ORGANIZATIONS.find((org) => org.id === organizationId)?.name ||
          'Organização não encontrada'
        : 'Global',
      permissions: body.permissions,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Em um sistema real, salvaria no banco de dados
    // MOCK_ROLES.push(newRole);

    return NextResponse.json(
      {
        message: 'Role criada com sucesso',
        role: newRole,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao criar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// PUT - Atualizar role
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, displayName, description, permissions } = body;

    // Validações
    if (!id) {
      return NextResponse.json(
        { error: 'ID da role é obrigatório' },
        { status: 400 },
      );
    }

    if (!name || !displayName) {
      return NextResponse.json(
        {
          error: 'Nome e nome de exibição são obrigatórios',
        },
        { status: 400 },
      );
    }

    if (!permissions || permissions.length === 0) {
      return NextResponse.json(
        {
          error: 'Pelo menos uma permissão deve ser selecionada',
        },
        { status: 400 },
      );
    }

    // Verificar se role existe
    const existingRole = MOCK_ROLES.find((role) => role.id === id);
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 },
      );
    }

    // Não permitir edição de roles do sistema
    if (existingRole.isSystemRole) {
      return NextResponse.json(
        {
          error: 'Roles do sistema não podem ser editadas',
        },
        { status: 400 },
      );
    }

    // Mock: simular atualização
    const updatedRole = {
      ...existingRole,
      name,
      displayName,
      description,
      permissions,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Role atualizada com sucesso',
      role: updatedRole,
    });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// DELETE - Excluir role
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');

    if (!roleId) {
      return NextResponse.json(
        { error: 'ID da role é obrigatório' },
        { status: 400 },
      );
    }

    // Verificar se role existe
    const existingRole = MOCK_ROLES.find((role) => role.id === roleId);
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 },
      );
    }

    // Não permitir exclusão de roles do sistema
    if (existingRole.isSystemRole) {
      return NextResponse.json(
        {
          error: 'Roles do sistema não podem ser excluídas',
        },
        { status: 400 },
      );
    }

    // Verificar se role está sendo usada por usuários (mock)
    // Em um sistema real, verificaria no banco de dados
    const isRoleInUse = false; // Mock: assumir que não está em uso

    if (isRoleInUse) {
      return NextResponse.json(
        {
          error:
            'Não é possível excluir role que está sendo usada por usuários',
        },
        { status: 400 },
      );
    }

    // Mock: simular exclusão
    console.log('Mock: Excluindo role:', roleId);

    return NextResponse.json({
      message: 'Role excluída com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
