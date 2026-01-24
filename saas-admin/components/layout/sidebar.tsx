'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Activity,
  LogOut,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    color: 'text-sky-500',
  },
  {
    label: 'Tenants',
    icon: Users,
    href: '/admin/tenants',
    color: 'text-violet-500',
  },
  {
    label: 'Analytics',
    icon: BarChart,
    href: '/admin/analytics',
    color: 'text-pink-700',
  },
  {
    label: 'System Health',
    icon: Activity,
    href: '/admin/system',
    color: 'text-emerald-500',
  },
  {
    label: 'Plans',
    icon: CreditCard,
    href: '/admin/plans',
    color: 'text-orange-700',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/admin" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            {/* Logo placeholder */}
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-black">SA</div>
          </div>
          <h1 className="text-2xl font-bold">SaaS Admin</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                pathname === route.href ? 'text-white bg-white/10' : 'text-zinc-400'
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3">
        <Link href="/login">
          <Button variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-white/10 justify-start">
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </Link>
      </div>
    </div>
  );
}
