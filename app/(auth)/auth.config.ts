import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Se a URL é relativa, permitir
      if (url.startsWith('/')) {
        console.log('🔄 Redirecionamento relativo:', url);
        return `${baseUrl}${url}`;
      }

      // Se a URL é do mesmo domínio, permitir
      if (url.startsWith(baseUrl)) {
        console.log('🔄 Redirecionamento mesmo domínio:', url);
        return url;
      }

      // Default: ir para home
      console.log('🔄 Redirecionamento padrão para home');
      return baseUrl;
    },

    async signIn({ user, account, profile }) {
      // Sempre permitir sign in
      console.log('✅ SignIn callback - usuário permitido:', user?.email);
      return true;
    },
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;
