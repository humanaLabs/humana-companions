import { auth } from '@/app/(auth)/auth';
import { deleteMessageById } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const chatId = searchParams.get('chatId');

  if (!messageId || !chatId) {
    return NextResponse.json(
      { error: 'messageId e chatId são obrigatórios' },
      { status: 400 }
    );
  }

  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await deleteMessageById({ messageId, chatId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir mensagem' },
      { status: 500 }
    );
  }
} 