import React from 'react';
import { Shell } from '@/components/layout/shell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
