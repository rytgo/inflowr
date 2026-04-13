import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { Database } from "@/types/database";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      }
    }
  });
}
