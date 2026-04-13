"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

import { LogoutButton } from "@/components/logout-button";
import { FlashToast } from "@/components/ui/flash-toast";

type AppShellProps = {
  children: ReactNode;
  userEmail: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function InfluencersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/influencers", label: "Influencers", icon: <InfluencersIcon /> },
  { href: "/calendar", label: "Calendar", icon: <CalendarIcon /> }
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition ${
        isActive
          ? "border-accent/35 bg-accent-soft text-accent shadow-panel"
          : "border-transparent text-text-muted hover:border-border-subtle hover:bg-panel-soft hover:text-text-secondary"
      }`}
    >
      <span className={isActive ? "text-accent" : "text-text-faint group-hover:text-text-secondary"}>{item.icon}</span>
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <FlashToast />

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-sidebar flex-col border-r border-border bg-subtle/95 p-3 backdrop-blur transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="rounded-md border border-border-subtle bg-panel-soft px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent-soft text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-text-primary">Inflowr</p>
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-faint">Private workspace</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1">{navItems.map((item) => <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)} />)}</nav>

        <div className="rounded-md border border-border-subtle bg-panel-soft p-3">
          <p className="truncate text-xs text-text-faint">Signed in as</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-text-secondary">{userEmail}</p>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border-subtle bg-subtle/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-sm border border-border bg-panel-soft px-2.5 py-1.5 text-text-secondary"
          >
            Menu
          </button>
          <p className="text-sm font-semibold tracking-tight text-text-primary">Inflowr</p>
          <div className="w-[52px]" />
        </div>
      </header>

      <main className="min-h-screen lg:pl-sidebar">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
