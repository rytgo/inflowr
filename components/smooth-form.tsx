"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useRef, useState, useTransition } from "react";

type SmoothFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean }>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
};

export function SmoothForm({ action, children, className = "", resetOnSuccess = false }: SmoothFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void action(formData)
        .then(() => {
          if (resetOnSuccess) {
            formRef.current?.reset();
          }

          window.dispatchEvent(new Event("inflowr:close-overlays"));
          router.refresh();
        })
        .catch((caughtError: unknown) => {
          setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
        });
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={className}>
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>
      {error ? <p className="mt-3 rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
    </form>
  );
}
