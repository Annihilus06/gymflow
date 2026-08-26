'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

/**
 * Root client-side providers wrapper.
 * SessionProvider is required for next-auth/react client hooks
 * (useSession, signIn, signOut) to function correctly.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
