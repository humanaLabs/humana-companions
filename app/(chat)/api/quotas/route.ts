import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserQuota, getUserUsage, getUserQuotaAlerts } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  // Get organizationId from middleware headers
  const organizationId = request.headers.get('x-organization-id');
  console.log('Quotas API - organizationId:', organizationId);
  console.log('Quotas API - userId:', session.user.id);
  console.log('Quotas API - userEmail:', session.user.email);

  try {
    let quota, usage, alerts;

    // Try to get real data first
    try {
      [quota, usage, alerts] = await Promise.all([
        getUserQuota({
          userId: session.user.id,
          organizationId: organizationId || 'default-org',
        }),
        getUserUsage({
          userId: session.user.id,
          organizationId: organizationId || 'default-org',
        }),
        getUserQuotaAlerts({
          userId: session.user.id,
          organizationId: organizationId || 'default-org',
        }),
      ]);

      console.log('Dados reais encontrados:', { quota, usage, alerts });
    } catch (dbError) {
      console.log('Erro ao buscar dados reais:', dbError);
      quota = null;
      usage = null;
      alerts = null;
    }

    // If no real data, use mock data
    if (!quota) {
      console.log('Usando dados mock para o usuário');
      quota = {
        id: 'mock-quota-' + session.user.id,
        userId: session.user.id,
        organizationId: organizationId || 'default-org',
        quotaType: 'unlimited',
        dailyMessagesLimit: 1000,
        monthlyMessagesLimit: 30000,
        maxCompanions: 50,
        maxDocuments: 1000,
        maxDocumentSizeMb: 100,
        totalStorageMb: 10000,
        maxMcpServers: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usage = {
        id: 'mock-usage-' + session.user.id,
        userId: session.user.id,
        organizationId: organizationId || 'default-org',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        dailyMessagesUsed: 45,
        monthlyMessagesUsed: 1250,
        companionsCount: 8,
        documentsCount: 15,
        totalStorageUsedMb: 340,
        mcpServersCount: 3,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      alerts = [];
    }

    // Calculate usage percentages and align with component expected structure
    const quotaWithUsage = {
      monthlyMessagesLimit: quota.monthlyMessagesLimit,
      dailyMessagesLimit: quota.dailyMessagesLimit,
      maxCompanions: quota.maxCompanions,
      maxCustomCompanions: quota.maxCompanions, // Same as maxCompanions for now
      maxDocuments: quota.maxDocuments,
      maxDocumentSizeMb: quota.maxDocumentSizeMb || 100,
      totalStorageMb: quota.totalStorageMb,
      maxMcpServers: quota.maxMcpServers,
      quotaType: quota.quotaType,
      usage: usage ? {
        monthlyMessagesUsed: usage.monthlyMessagesUsed,
        dailyMessagesUsed: usage.dailyMessagesUsed,
        companionsCount: usage.companionsCount,
        documentsCount: usage.documentsCount,
        totalStorageUsedMb: usage.totalStorageUsedMb,
        mcpServersCount: usage.mcpServersCount,
        messagesMonthlyPercentage: quota.monthlyMessagesLimit 
          ? Math.round((usage.monthlyMessagesUsed / quota.monthlyMessagesLimit) * 100)
          : 0,
        messagesDailyPercentage: quota.dailyMessagesLimit 
          ? Math.round((usage.dailyMessagesUsed / quota.dailyMessagesLimit) * 100)
          : 0,
        companionsPercentage: quota.maxCompanions 
          ? Math.round((usage.companionsCount / quota.maxCompanions) * 100)
          : 0,
        documentsPercentage: quota.maxDocuments 
          ? Math.round((usage.documentsCount / quota.maxDocuments) * 100)
          : 0,
        storagePercentage: quota.totalStorageMb 
          ? Math.round((usage.totalStorageUsedMb / quota.totalStorageMb) * 100)
          : 0,
        mcpServersPercentage: quota.maxMcpServers 
          ? Math.round((usage.mcpServersCount / quota.maxMcpServers) * 100)
          : 0,
      } : null,
    };

    console.log('Resposta final da API quotas:', { quota: quotaWithUsage, alerts });

    return NextResponse.json({
      quota: quotaWithUsage,
      alerts: alerts || [],
      isMockData: !quota || quota.id.startsWith('mock-'),
    });
  } catch (error) {
    console.error('Erro ao buscar quotas:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar quotas', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 