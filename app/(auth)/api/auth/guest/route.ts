import { NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl');

    const result = await signIn('guest', {
      redirect: false,
    });

    if (!result?.ok) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário convidado' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: redirectUrl || '/',
    });
  } catch (error) {
    console.error('Erro ao criar usuário convidado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
