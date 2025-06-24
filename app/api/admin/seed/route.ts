import { NextRequest } from 'next/server';
import { seedAdminData } from '@/lib/db/seed-admin';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function createTestUsers() {
  console.log('👥 Criando usuários de teste...');
  
  const testUsers = [
    {
      email: 'master@humana.com',
      password: 'password123', // Em produção, usar hash
      isMasterAdmin: true,
    },
    {
      email: 'admin@humana.com', 
      password: 'password123',
      isMasterAdmin: false,
    },
    {
      email: 'user1@humana.com',
      password: 'password123',
      isMasterAdmin: false,
    },
    {
      email: 'user2@humana.com',
      password: 'password123',
      isMasterAdmin: false,
    },
  ];

  for (const userData of testUsers) {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(user).values(userData);
      console.log(`✅ Usuário '${userData.email}' criado (Master Admin: ${userData.isMasterAdmin})`);
    } else {
      console.log(`ℹ️ Usuário '${userData.email}' já existe`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário tem permissão (pode adicionar autenticação aqui)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      return Response.json(
        { error: 'Seed só pode ser executado em desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Criar usuários de teste primeiro
    await createTestUsers();
    
    // Depois popular dados de administração
    await seedAdminData();
    
    return Response.json({ 
      success: true, 
      message: 'Dados de administração e usuários de teste criados com sucesso!' 
    });
    
  } catch (error) {
    console.error('Erro no seed:', error);
    return Response.json(
      { error: 'Erro ao popular dados de administração' },
      { status: 500 }
    );
  }
} 