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
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    organizationId?: string;
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

        return { ...user, type: 'regular' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;

        // Determinar organizationId
        try {
          // Primeiro, tentar buscar organização específica do usuário
          const [userOrg] = await db
            .select({ id: organization.id })
            .from(organization)
            .where(eq(organization.userId, user.id as string))
            .limit(1);

          if (userOrg) {
            token.organizationId = userOrg.id;
          } else {
            // Se não tem organização específica, usar organização padrão baseada no tipo
            if (user.type === 'guest' || user.email?.includes('guest-')) {
              token.organizationId = GUEST_ORGANIZATION_ID;
            } else {
              token.organizationId = DEFAULT_ORGANIZATION_ID;
            }
          }

          console.log(
            `🔧 OrganizationId definido para ${user.email}: ${token.organizationId}`,
          );
        } catch (error) {
          console.error('Error fetching user organization:', error);
          // Fallback para organizações padrão
          if (user.type === 'guest' || user.email?.includes('guest-')) {
            token.organizationId = GUEST_ORGANIZATION_ID;
          } else {
            token.organizationId = DEFAULT_ORGANIZATION_ID;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.organizationId = token.organizationId;
      }

      return session;
    },
  },
});
