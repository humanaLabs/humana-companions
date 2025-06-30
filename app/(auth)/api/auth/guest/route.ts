import { NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';
import { createGuestUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl') || '/';

    console.log('🔄 Iniciando criação de usuário convidado...');

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.POSTGRES_URL) {
      console.error('❌ POSTGRES_URL não configurado');
      return NextResponse.json(
        { error: 'Configuração de banco de dados não encontrada' },
        { status: 500 },
      );
    }

    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      console.error('❌ AUTH_SECRET/NEXTAUTH_SECRET não configurado');
      return NextResponse.json(
        { error: 'Configuração de autenticação não encontrada' },
        { status: 500 },
      );
    }

    console.log('✅ Variáveis de ambiente verificadas');

    // Tentar conectar ao banco antes de criar o usuário
    try {
      console.log('🔄 Testando conexão com banco de dados...');
      const [guestUser] = await createGuestUser();
      console.log('✅ Usuário convidado criado:', {
        email: guestUser.email,
        id: guestUser.id,
      });

      if (!guestUser) {
        console.error('❌ Falha ao criar usuário convidado - retorno vazio');
        return NextResponse.json(
          { error: 'Erro ao criar usuário convidado' },
          { status: 500 },
        );
      }

      console.log('🔐 Iniciando login automático com redirecionamento...');

      // Fazer login automático do usuário convidado com redirecionamento
      try {
        await signIn('credentials', {
          email: guestUser.email,
          type: 'guest',
          redirectTo: redirectUrl, // NextAuth vai redirecionar automaticamente
        });

        // Se chegou até aqui, não redirecionou - tentar redirecionamento manual
        console.log(
          '⚠️ Login não redirecionou automaticamente, fazendo redirecionamento manual',
        );
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      } catch (signInError) {
        // Se o erro é de redirecionamento do NextAuth, é normal
        if (
          signInError &&
          typeof signInError === 'object' &&
          'message' in signInError
        ) {
          const message = signInError.message as string;
          if (
            message.includes('NEXT_REDIRECT') ||
            message.includes('redirect')
          ) {
            console.log(
              '✅ Login bem-sucedido - redirecionamento do NextAuth detectado',
            );
            // O NextAuth já está fazendo o redirecionamento, não precisamos fazer nada
            return NextResponse.redirect(new URL(redirectUrl, request.url));
          }
        }

        console.error('❌ Erro no signIn:', signInError);
        throw signInError;
      }
    } catch (dbError) {
      console.error('❌ Erro específico do banco de dados:', {
        message:
          dbError instanceof Error ? dbError.message : 'Erro desconhecido',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        name: dbError instanceof Error ? dbError.name : undefined,
        code: (dbError as any)?.code,
        detail: (dbError as any)?.detail,
        constraint: (dbError as any)?.constraint,
      });

      // Retornar erro específico para debug
      return NextResponse.json(
        {
          error: 'Erro de banco de dados',
          details:
            dbError instanceof Error ? dbError.message : 'Erro desconhecido',
          type: 'database_error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('❌ Erro geral ao criar usuário convidado:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasAuthSecret: !!(
          process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
        ),
      },
    });

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'general_error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
