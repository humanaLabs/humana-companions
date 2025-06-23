import { NextRequest } from 'next/server';
import { seedAdminData } from '@/lib/db/seed-admin';

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
    
    await seedAdminData();
    
    return Response.json({ 
      success: true, 
      message: 'Dados de administração populados com sucesso!' 
    });
    
  } catch (error) {
    console.error('Erro no seed:', error);
    return Response.json(
      { error: 'Erro ao popular dados de administração' },
      { status: 500 }
    );
  }
} 