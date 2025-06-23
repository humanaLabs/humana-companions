import { auth } from '@/app/(auth)/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

// Função para simular atualização de usuário (apenas para fins experimentais)
async function updateUserEmail(currentEmail: string, newEmail: string) {
  try {
    // Verificar se o usuário existe
    const users = await getUser(currentEmail);
    if (users.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    console.log(`✅ Usuário encontrado: ${currentEmail}`);
    console.log(`🔄 Simulando atualização para: ${newEmail}`);
    console.log(`📝 ID do usuário: ${users[0].id}`);
    
    // Retornar dados simulados da atualização
    return {
      id: users[0].id,
      email: newEmail,
      password: users[0].password,
      isMasterAdmin: users[0].isMasterAdmin,
      updated: true
    };
  } catch (error) {
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Para teste, vamos usar parâmetros da URL
    const { searchParams } = new URL(request.url);
    const currentEmail = searchParams.get('current') || 'guest-1750352907765';
    const newEmail = searchParams.get('new') || 'Eduardo Ibrahim';
    
    const updatedUser = await updateUserEmail(currentEmail, newEmail);
    
    console.log('✅ Simulação de atualização de usuário:', {
      from: currentEmail,
      to: newEmail,
      userId: updatedUser.id
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simulação de atualização executada com sucesso',
      simulation: true,
      user: {
        id: updatedUser.id,
        oldEmail: currentEmail,
        newEmail: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Erro na simulação:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentEmail, newEmail } = await request.json();
    
    if (!currentEmail || !newEmail) {
      return NextResponse.json(
        { error: 'currentEmail e newEmail são obrigatórios' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserEmail(currentEmail, newEmail);
    
    console.log('Usuário atualizado:', {
      from: currentEmail,
      to: newEmail,
      userId: updatedUser.id
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 