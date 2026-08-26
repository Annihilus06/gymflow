import type { DefaultSession } from 'next-auth';

/**
 * NextAuth v5 type augmentation.
 * Extends the built-in session/user types with GymFlow custom fields.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      onboardingComplete: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    onboardingComplete?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    onboardingComplete?: boolean;
  }
}
