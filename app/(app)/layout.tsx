import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell userEmail={user.email ?? "User"}>{children}</AppShell>;
}
