import React from 'react';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Service Worker Registration */}
      <ServiceWorkerRegister />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-20 md:pb-6">
        {/* Top Header */}
        <Header />

        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Offline & Sync Status Banner */}
        <OfflineBanner />

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
