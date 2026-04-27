import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Package, BarChart3, Settings, Zap, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Consultor IA' },
  { path: '/products', icon: Package, label: 'Produtos' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300",
        "w-64 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">PriceHunt</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium">Consultor IA</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 m-3 rounded-xl bg-sidebar-accent border border-sidebar-border">
          <div className="flex items-center gap-2 mb-1">
            <ShieldIcon />
            <span className="text-xs font-semibold text-sidebar-foreground/80">Sandbox Seguro</span>
          </div>
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            Bot opera em ambiente isolado. Seus dados estão protegidos.
          </p>
        </div>
      </aside>
    </>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 01.5-.87l7-4a1 1 0 011 0l7 4A1 1 0 0120 6z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}