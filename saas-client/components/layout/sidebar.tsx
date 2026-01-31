'use client';

import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  UtensilsCrossed, 
  Wallet, 
  Settings, 
  Menu,
  CreditCard,
  CalendarDays
} from 'lucide-react';

export default function Sidebar() {
  const { tenant } = useAuthStore();
  const pathname = usePathname();

  if (!tenant) return null;

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-slate-900",
          isActive ? "bg-slate-100 text-slate-900" : "text-slate-500"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="hidden border-r bg-white md:block w-64 h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <Package className="h-6 w-6" />
            <span className="">SaaS Client</span>
          </Link>
        </div>
        <div className="flex-1 mt-4">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />

            {tenant.businessType === 'inventory' && (
              <>
                <NavItem href="/inventory/products" icon={Package} label="Products" />
                <NavItem href="/inventory/stock" icon={LayoutDashboard} label="Stock" />
              </>
            )}

            {tenant.businessType === 'hotel' && (
              <>
                <NavItem href="/hotel/tables" icon={UtensilsCrossed} label="Tables" />
                <NavItem href="/hotel/menu" icon={Menu} label="Menu" />
                <NavItem href="/hotel/reservations" icon={CalendarDays} label="Reservations" />
              </>
            )}

            {tenant.businessType === 'finance' && (
              <>
                <NavItem href="/finance/accounts" icon={Wallet} label="Accounts" />
                <NavItem href="/finance/transactions" icon={CreditCard} label="Transactions" />
                <NavItem href="/finance/budget" icon={LayoutDashboard} label="Budget" />
              </>
            )}

            {tenant.businessType === 'ecommerce' && (
              <>
                <NavItem href="/ecommerce/products" icon={Package} label="Products" />
                <NavItem href="/ecommerce/orders" icon={ShoppingCart} label="Orders" />
                <NavItem href="/ecommerce/coupons" icon={LayoutDashboard} label="Coupons" />
              </>
            )}

            <div className="mt-4 border-t pt-4">
               <NavItem href="/settings" icon={Settings} label="Settings" />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
