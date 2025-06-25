import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createGuestUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl');

    const [guestUser] = await createGuestUser();

    if (!guestUser) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário convidado' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: redirectUrl || '/',
      user: {
        ...guestUser,
        type: 'guest',
      },
    });
  } catch (error) {
    console.error('Erro ao criar usuário convidado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
