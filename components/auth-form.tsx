"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "login" ? "Welcome back" : "Create your workspace";
  const subtitle =
    mode === "login"
      ? "Sign in to continue managing your campaigns."
      : "Launch your private campaign operations workspace.";
  const cta = mode === "login" ? "Sign in" : "Create account";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message);
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="mb-5 rounded-md border border-border-subtle bg-panel-soft/70 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/35 bg-accent-soft text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Inflowr</p>
              <p className="text-xs text-text-faint">Private campaign workspace</p>
            </div>
          </div>
        </div>

        <div className="surface-panel rounded-lg p-6 sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="mt-2 text-sm text-text-muted">{subtitle}</p>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />

            {error ? (
              <div className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Please wait..." : cta}
            </Button>
          </form>

          <p className="mt-5 border-t border-border-subtle pt-4 text-center text-sm text-text-muted">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
