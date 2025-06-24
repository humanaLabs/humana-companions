'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useFormState } from 'react-dom';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';

import { login, type LoginActionState } from '../actions';
import { signIn, useSession } from 'next-auth/react';

// Componente que usa useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const [state, formAction] = useFormState(login, {
    status: 'idle',
  } as LoginActionState);

  const { update: updateSession } = useSession();

  useEffect(() => {
    // Verificar erros na URL
    if (!searchParams) return;
    const error = searchParams.get('error');
    if (error === 'GuestSignInFailed') {
      toast({
        type: 'error',
        description:
          'Falha ao entrar como convidado. Por favor, tente novamente.',
      });
      setIsGuestLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Credenciais inválidas!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Dados inválidos!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  const handleGuestAccess = async () => {
    try {
      setIsGuestLoading(true);

      const result = await signIn('guest', {
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Atualiza a sessão e redireciona
      await updateSession();
      router.push('/');
    } catch (error) {
      console.error('Error accessing as guest:', error);
      toast({
        type: 'error',
        description:
          'Falha ao entrar como convidado. Por favor, tente novamente.',
      });
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Entrar</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use seu email e senha para entrar
          </p>
        </div>
        <AuthForm action={formAction} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Entrar</SubmitButton>
          <div className="mt-4 flex flex-col gap-4 items-center">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGuestAccess}
              disabled={isGuestLoading}
            >
              {isGuestLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Carregando...</span>
                </div>
              ) : (
                <span>Continuar como Convidado</span>
              )}
            </Button>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Não tem uma conta? '}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Cadastre-se
            </Link>
            {' gratuitamente.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
