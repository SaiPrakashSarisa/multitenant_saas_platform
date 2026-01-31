'use client';

import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Package2 } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user, tenant, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold text-slate-900">{tenant?.name || 'Dashboard'}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 hidden md:inline-block">
          {user?.email}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-900 border-slate-200">
          Logout
        </Button>
      </div>
    </header>
  );
}
