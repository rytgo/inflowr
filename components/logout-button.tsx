"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function onLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-slate-100"
    >
      Log out
    </button>
  );
}
