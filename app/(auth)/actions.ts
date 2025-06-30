'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  prevState: LoginActionState,
  formData: FormData | null,
): Promise<LoginActionState> => {
  if (!formData) return prevState;
  if (prevState.status === 'success') return prevState;

  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    console.log('🔐 Tentando login para:', validatedData.email);

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: '/', // Redirecionar automaticamente para home
    });

    console.log('✅ Resultado do signIn:', result);

    // Se chegou até aqui sem redirecionamento, houve erro
    return { status: 'failed' };
  } catch (error) {
    console.error('❌ Erro no login:', error);

    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    // Se o erro é de redirecionamento do NextAuth, é sucesso
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;
      if (message.includes('NEXT_REDIRECT') || message.includes('redirect')) {
        console.log('✅ Login bem-sucedido - redirecionamento detectado');
        return { status: 'success' };
      }
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    console.log('👤 Tentando registrar:', validatedData.email);

    const [user] = await getUser(validatedData.email);

    if (user) {
      console.log('❌ Usuário já existe:', validatedData.email);
      return { status: 'user_exists' } as RegisterActionState;
    }

    await createUser(validatedData.email, validatedData.password);
    console.log('✅ Usuário criado:', validatedData.email);

    // Fazer login automático após registro
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: '/', // Redirecionar automaticamente para home
    });

    console.log('✅ Login automático após registro realizado');
    return { status: 'success' };
  } catch (error) {
    console.error('❌ Erro no registro:', error);

    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    // Se o erro é de redirecionamento do NextAuth, é sucesso
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;
      if (message.includes('NEXT_REDIRECT') || message.includes('redirect')) {
        console.log('✅ Registro bem-sucedido - redirecionamento detectado');
        return { status: 'success' };
      }
    }

    return { status: 'failed' };
  }
};
