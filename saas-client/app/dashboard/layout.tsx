'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Simple client-side protection
    // Only redirect if hydration is complete and no token exists
    if (_hasHydrated && !token && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [_hasHydrated, token, router]);

  if (!_hasHydrated || (!token && typeof window === 'undefined')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If still no token after hydration, don't show children (useEffect will handle redirect)
  if (!token || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
