import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

type AppShellProps = {
  children: React.ReactNode;
  userEmail: string;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/influencers", label: "Influencers" },
  { href: "/calendar", label: "Calendar" }
];

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold">Inflowr</p>
            <p className="text-xs text-[var(--muted)]">{userEmail}</p>
          </div>
          <nav className="flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
              >
                {link.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
