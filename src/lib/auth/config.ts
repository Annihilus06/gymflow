import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { AuthService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validations/auth.schema';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await AuthService.validateCredentials(
          parsed.data.email,
          parsed.data.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.onboardingComplete = (user as any).onboardingComplete ?? false;
      }

      if (trigger === 'update' && session?.onboardingComplete !== undefined) {
        token.onboardingComplete = session.onboardingComplete;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).onboardingComplete = token.onboardingComplete as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'gymflow-dev-secret-at-least-32-chars-key-abc123',
};
