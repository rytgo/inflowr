import { LandingPage } from "@/components/landing-page";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <LandingPage isAuthenticated={Boolean(user)} userEmail={user?.email ?? null} />;
}
