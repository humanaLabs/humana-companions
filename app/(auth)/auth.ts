import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import {
  DUMMY_PASSWORD,
  GUEST_ORGANIZATION_ID,
  DEFAULT_ORGANIZATION_ID,
} from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';
import { guestRegex } from '@/lib/constants';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { organization } from '@/lib/db/schema';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      organizationId?: string;
      isMasterAdmin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    isMasterAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    organizationId?: string;
    isMasterAdmin?: boolean;
  }
}

// Database client for organization lookup
const client = postgres(process.env.POSTGRES_URL || '');
const db = drizzle(client);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password, type }: any) {
        // Se for um usuário convidado
        if (type === 'guest' && email && guestRegex.test(email)) {
          const users = await getUser(email);
          if (users.length === 0) return null;
          const [user] = users;
          return { ...user, type: 'guest' };
        }

        // Se for um usuário regular
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular', isMasterAdmin: user.isMasterAdmin };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔧 JWT CALLBACK EXECUTADO:', {
        hasUser: !!user,
        tokenBefore: { ...token },
        userInfo: user ? { id: user.id, email: user.email, type: user.type, isMasterAdmin: user.isMasterAdmin } : null
      });

      if (user) {
        console.log('🔧 PROCESSANDO USUÁRIO NO JWT:', user);
        
        token.id = user.id as string;
        token.type = user.type;
        token.isMasterAdmin = user.isMasterAdmin || false;

        console.log('🔧 TOKEN APÓS DEFINIR CAMPOS BÁSICOS:', {
          id: token.id,
          type: token.type,
          isMasterAdmin: token.isMasterAdmin
        });

        // Determinar organizationId
        try {
          console.log('🔧 BUSCANDO ORGANIZAÇÃO PARA USUÁRIO:', user.id);
          
          // Primeiro, tentar buscar organização específica do usuário
          const [userOrg] = await db
            .select({ id: organization.id })
            .from(organization)
            .where(eq(organization.userId, user.id as string))
            .limit(1);

          if (userOrg) {
            token.organizationId = userOrg.id;
            console.log('🔧 ORGANIZAÇÃO ESPECÍFICA ENCONTRADA:', userOrg.id);
          } else {
            // Se não tem organização específica, usar organização padrão baseada no tipo
            if (user.type === 'guest' || user.email?.includes('guest-')) {
              token.organizationId = GUEST_ORGANIZATION_ID;
              console.log('🔧 USANDO ORGANIZAÇÃO GUEST:', GUEST_ORGANIZATION_ID);
            } else {
              token.organizationId = DEFAULT_ORGANIZATION_ID;
              console.log('🔧 USANDO ORGANIZAÇÃO PADRÃO:', DEFAULT_ORGANIZATION_ID);
            }
          }

          console.log(
            `🔧 OrganizationId definido para ${user.email}: ${token.organizationId}`,
          );
          console.log(
            `👑 isMasterAdmin definido para ${user.email}: ${token.isMasterAdmin}`,
          );
        } catch (error) {
          console.error('🚨 Error fetching user organization:', error);
          // Fallback para organizações padrão
          if (user.type === 'guest' || user.email?.includes('guest-')) {
            token.organizationId = GUEST_ORGANIZATION_ID;
          } else {
            token.organizationId = DEFAULT_ORGANIZATION_ID;
          }
          console.log('🔧 FALLBACK ORGANIZAÇÃO:', token.organizationId);
        }

        console.log('🔧 TOKEN FINAL APÓS PROCESSAMENTO:', {
          id: token.id,
          type: token.type,
          isMasterAdmin: token.isMasterAdmin,
          organizationId: token.organizationId,
          allKeys: Object.keys(token)
        });
      }

      console.log('🔧 RETORNANDO TOKEN:', { ...token });
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.organizationId = token.organizationId;
        session.user.isMasterAdmin = token.isMasterAdmin;
      }

      return session;
    },
  },
});
