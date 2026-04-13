"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

  const title = mode === "login" ? "Log in" : "Create account";
  const cta = mode === "login" ? "Log in" : "Sign up";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

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
    <div className="mx-auto mt-24 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Inflowr gives each user a private campaign workspace.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none ring-0 focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none ring-0 focus:border-[var(--primary)]"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Please wait..." : cta}
        </button>
      </form>

      {mode === "login" ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          No account?{" "}
          <Link className="text-[var(--primary)]" href="/signup">
            Sign up
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="text-[var(--primary)]" href="/login">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
