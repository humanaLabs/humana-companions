import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para convite de usuário
const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  roleId: z.string().min(1, 'Role é obrigatória'),
  message: z.string().optional(), // Mensagem personalizada no convite
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Retornar dados mock para teste inicial
    const mockUsers = [
      {
        id: '1',
        email: 'admin@humana.com',
        name: 'Administrador Sistema',
        isMasterAdmin: true,
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        role: {
          id: '1',
          name: 'Administrador',
          displayName: 'Administrador',
          description: 'Acesso total ao sistema',
          permissions: ['read', 'write', 'delete', 'admin'],
        }
      },
      {
        id: '2',
        email: 'user@humana.com',
        name: 'João Silva',
        isMasterAdmin: false,
        status: 'active',
        createdAt: new Date('2024-02-10T14:30:00Z'),
        role: {
          id: '2',
          name: 'Usuário',
          displayName: 'Usuário',
          description: 'Usuário padrão',
          permissions: ['read'],
        }
      },
      {
        id: '3',
        email: 'manager@humana.com',
        name: 'Maria Santos',
        isMasterAdmin: false,
        status: 'active',
        createdAt: new Date('2024-03-05T09:15:00Z'),
        role: {
          id: '3',
          name: 'Gerente',
          displayName: 'Gerente',
          description: 'Gerente de equipe',
          permissions: ['read', 'write'],
        }
      },
      {
        id: '4',
        email: 'invited@humana.com',
        name: null,
        isMasterAdmin: false,
        status: 'invited',
        createdAt: new Date('2024-03-20T16:45:00Z'),
        role: {
          id: '2',
          name: 'Usuário',
          displayName: 'Usuário',
          description: 'Usuário padrão',
          permissions: ['read'],
        }
      }
    ];

    return NextResponse.json({ users: mockUsers });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
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
    const validatedData = inviteUserSchema.parse(body);
    
    // Mock de convite de usuário
    return NextResponse.json({ 
      message: 'Convite enviado com sucesso (mock)',
      invite: {
        id: 'new-invite-id',
        email: validatedData.email,
        roleId: validatedData.roleId,
        status: 'invited',
        sentAt: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 