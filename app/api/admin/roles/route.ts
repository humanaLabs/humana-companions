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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é master admin
    const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
    if (!userData[0]?.isMasterAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas Master Admin pode gerenciar roles.' }, { status: 403 });
    }

    // Retornar dados mock para teste inicial
    const mockRoles = [
      {
        id: '1',
        name: 'super_admin',
        displayName: 'Super Administrador',
        description: 'Acesso total ao sistema, incluindo gestão de roles',
        isSystemRole: true,
        userCount: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        permissions: [
          { resource: 'admin_dashboard', action: 'manage' },
          { resource: 'studio', action: 'manage' },
          { resource: 'data_room', action: 'manage' },
          { resource: 'university', action: 'manage' },
          { resource: 'applications', action: 'manage' },
          { resource: 'mcp_servers', action: 'manage' },
          { resource: 'organizations', action: 'manage' },
          { resource: 'user_management', action: 'manage' },
          { resource: 'audit_logs', action: 'read' },
          { resource: 'companions', action: 'manage' },
          { resource: 'chats', action: 'manage' },
          { resource: 'documents', action: 'manage' },
          { resource: 'folders', action: 'manage' },
          { resource: 'users', action: 'manage' },
          { resource: 'teams', action: 'manage' },
          { resource: 'permissions', action: 'manage' },
          { resource: 'analytics', action: 'read' },
        ]
      },
      {
        id: '2',
        name: 'admin',
        displayName: 'Administrador',
        description: 'Acesso administrativo limitado à organização',
        isSystemRole: true,
        userCount: 2,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        permissions: [
          { resource: 'admin_dashboard', action: 'view', conditions: { organization_only: true } },
          { resource: 'studio', action: 'manage', conditions: { organization_only: true } },
          { resource: 'data_room', action: 'manage', conditions: { organization_only: true } },
          { resource: 'university', action: 'manage', conditions: { organization_only: true } },
          { resource: 'applications', action: 'manage', conditions: { organization_only: true } },
          { resource: 'mcp_servers', action: 'manage', conditions: { organization_only: true } },
          { resource: 'user_management', action: 'manage', conditions: { organization_only: true } },
          { resource: 'companions', action: 'manage', conditions: { organization_only: true } },
          { resource: 'chats', action: 'read', conditions: { organization_only: true } },
          { resource: 'documents', action: 'manage', conditions: { organization_only: true } },
          { resource: 'folders', action: 'manage', conditions: { organization_only: true } },
          { resource: 'users', action: 'manage', conditions: { organization_only: true } },
          { resource: 'teams', action: 'manage', conditions: { organization_only: true } },
          { resource: 'analytics', action: 'read', conditions: { organization_only: true } },
        ]
      },
      {
        id: '3',
        name: 'manager',
        displayName: 'Gerente',
        description: 'Gestão de equipes e projetos',
        isSystemRole: true,
        userCount: 3,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        permissions: [
          { resource: 'studio', action: 'manage', conditions: { team_only: true } },
          { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
          { resource: 'university', action: 'read', conditions: { organization_only: true } },
          { resource: 'applications', action: 'read' },
          { resource: 'mcp_servers', action: 'read', conditions: { organization_only: true } },
          { resource: 'companions', action: 'manage', conditions: { team_only: true } },
          { resource: 'chats', action: 'read', conditions: { team_only: true } },
          { resource: 'documents', action: 'manage', conditions: { team_only: true } },
          { resource: 'folders', action: 'manage', conditions: { own_only: true } },
          { resource: 'users', action: 'read', conditions: { team_only: true } },
          { resource: 'analytics', action: 'read', conditions: { team_only: true } },
        ]
      },
      {
        id: '4',
        name: 'user',
        displayName: 'Usuário',
        description: 'Usuário padrão com acesso básico',
        isSystemRole: true,
        userCount: 15,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        permissions: [
          { resource: 'studio', action: 'read' },
          { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
          { resource: 'university', action: 'read' },
          { resource: 'applications', action: 'read' },
          { resource: 'mcp_servers', action: 'read', conditions: { own_only: true } },
          { resource: 'companions', action: 'manage', conditions: { own_only: true } },
          { resource: 'chats', action: 'manage', conditions: { own_only: true } },
          { resource: 'documents', action: 'manage', conditions: { own_only: true } },
          { resource: 'folders', action: 'manage', conditions: { own_only: true } },
        ]
      },
      {
        id: '5',
        name: 'sales_manager',
        displayName: 'Gerente de Vendas',
        description: 'Role customizada para gerentes de vendas',
        isSystemRole: false,
        userCount: 2,
        createdAt: new Date('2024-02-15T10:30:00Z'),
        permissions: [
          { resource: 'studio', action: 'read' },
          { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
          { resource: 'university', action: 'read' },
          { resource: 'applications', action: 'read' },
          { resource: 'companions', action: 'manage', conditions: { team_only: true } },
          { resource: 'chats', action: 'read', conditions: { team_only: true } },
          { resource: 'documents', action: 'manage', conditions: { team_only: true } },
          { resource: 'analytics', action: 'read', conditions: { team_only: true } },
          { resource: 'users', action: 'read', conditions: { team_only: true } },
        ]
      },
      {
        id: '6',
        name: 'content_creator',
        displayName: 'Criador de Conteúdo',
        description: 'Role customizada para criadores de conteúdo',
        isSystemRole: false,
        userCount: 4,
        createdAt: new Date('2024-03-01T14:15:00Z'),
        permissions: [
          { resource: 'studio', action: 'manage', conditions: { own_only: true } },
          { resource: 'data_room', action: 'read', conditions: { organization_only: true } },
          { resource: 'university', action: 'manage', conditions: { own_only: true } },
          { resource: 'companions', action: 'manage', conditions: { own_only: true } },
          { resource: 'chats', action: 'manage', conditions: { own_only: true } },
          { resource: 'documents', action: 'manage', conditions: { own_only: true } },
          { resource: 'folders', action: 'manage', conditions: { own_only: true } },
        ]
      }
    ];

    return NextResponse.json({ roles: mockRoles });

  } catch (error) {
    console.error('Erro ao buscar roles:', error);
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

    // Verificar se é master admin
    const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
    if (!userData[0]?.isMasterAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas Master Admin pode criar roles.' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);
    
    // Mock de criação de role
    return NextResponse.json({ 
      message: 'Role criada com sucesso (mock)',
      role: {
        id: 'new-role-id',
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description || '',
        permissions: validatedData.permissions,
        isSystemRole: false,
        userCount: 0,
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 