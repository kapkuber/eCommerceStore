import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  // Ensure stable encryption/signing key for JWT/cookies
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = (credentials?.password || '').trim();
        if (!email || !password) return null;

        // Look up by unique field; Prisma uses parameterized queries → SQLi-safe
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          // small, uniform delay to reduce user enumeration/brute-force timing
          await new Promise((r) => setTimeout(r, 150));
          return null;
        }
        const ok = await verifyPassword(password, user.password);
        if (!ok) {
          await new Promise((r) => setTimeout(r, 150));
          return null;
        }
        return { id: user.id, name: user.name || null, email: user.email } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        // add role to token
        const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id } });
        token.role = dbUser?.role;
      } else if (token.userId) {
        // ensure role persists across refresh
        if (!token.role) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
          token.role = dbUser?.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string | undefined;
        (session.user as any).role = token.role as string | undefined;
      }
      return session;
    },
  },
};
