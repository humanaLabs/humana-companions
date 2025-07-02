import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// Mock data para teste inicial
const mockUsers = [
  {
    id: 'b00e5284-aa20-4b6a-9248-b7546b16499a',
    email: 'eduibrahim@yahoo.com.br',
    isMasterAdmin: true,
    quota: {
      quotaType: 'unlimited',
      messagesPerDay: 1000,
      messagesPerMonth: 30000,
      companionsLimit: 50,
      documentsLimit: 1000,
      storageLimit: 10000,
      mcpServersLimit: 20
    },
    usage: {
      dailyMessages: 45,
      monthlyMessages: 1250,
      companions: 8,
      documents: 15,
      storageUsed: 340,
      mcpServers: 3
    }
  },
  {
    id: 'admin-test-123',
    email: 'admin@humana.com',
    isMasterAdmin: true,
    quota: {
      quotaType: 'enterprise',
      messagesPerDay: 500,
      messagesPerMonth: 15000,
      companionsLimit: 25,
      documentsLimit: 500,
      storageLimit: 5000,
      mcpServersLimit: 10
    },
    usage: {
      dailyMessages: 120,
      monthlyMessages: 3200,
      companions: 12,
      documents: 45,
      storageUsed: 1200,
      mcpServers: 4
    }
  },
  {
    id: 'user-test-456',
    email: 'user@teste.com',
    isMasterAdmin: false,
    quota: {
      quotaType: 'standard',
      messagesPerDay: 100,
      messagesPerMonth: 3000,
      companionsLimit: 5,
      documentsLimit: 100,
      storageLimit: 1000,
      mcpServersLimit: 3
    },
    usage: {
      dailyMessages: 85,
      monthlyMessages: 2450,
      companions: 4,
      documents: 23,
      storageUsed: 450,
      mcpServers: 2
    }
  },
  {
    id: 'premium-user-789',
    email: 'premium@exemplo.com',
    isMasterAdmin: false,
    quota: {
      quotaType: 'premium',
      messagesPerDay: 250,
      messagesPerMonth: 7500,
      companionsLimit: 15,
      documentsLimit: 250,
      storageLimit: 2500,
      mcpServersLimit: 5
    },
    usage: {
      dailyMessages: 195,
      monthlyMessages: 5800,
      companions: 11,
      documents: 78,
      storageUsed: 1850,
      mcpServers: 4
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Para teste, vamos permitir qualquer usuário logado acessar
    // TODO: Adicionar verificação de admin depois
    console.log('Usuario logado:', session.user.email);

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calcular estatísticas
    const stats = {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.usage.monthlyMessages > 0).length,
      quotaExceeded: mockUsers.filter(u => 
        u.usage.dailyMessages >= u.quota.messagesPerDay ||
        u.usage.monthlyMessages >= u.quota.messagesPerMonth ||
        u.usage.companions >= u.quota.companionsLimit ||
        u.usage.documents >= u.quota.documentsLimit ||
        u.usage.storageUsed >= u.quota.storageLimit
      ).length,
      totalUsage: mockUsers.reduce((sum, u) => sum + u.usage.monthlyMessages, 0)
    };

    return NextResponse.json({
      success: true,
      users: mockUsers,
      stats,
      organizationId: 'mock-org-123'
    });

  } catch (error) {
    console.error('Erro na API admin/users/quotas:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 