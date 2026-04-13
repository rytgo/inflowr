"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export function FlashToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = searchParams.get("notice");
  const error = searchParams.get("error");
  const message = notice ?? error;
  const tone = notice ? "success" : error ? "error" : null;
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => {
      setVisible(false);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("notice");
      next.delete("error");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 3600);

    return () => clearTimeout(timeout);
  }, [message, pathname, router, searchParams]);

  const classes = useMemo(() => {
    if (tone === "success") {
      return "border-[var(--status-active)]/35 bg-[var(--status-active-soft)] text-[var(--status-active)]";
    }
    if (tone === "error") {
      return "border-danger/35 bg-danger-soft text-danger";
    }
    return "border-border bg-panel-soft text-text-secondary";
  }, [tone]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div className={`toast-enter fixed right-4 top-4 z-[95] max-w-[420px] rounded-sm border px-3 py-2 shadow-float ${classes}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{message}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setVisible(false);
            const next = new URLSearchParams(searchParams.toString());
            next.delete("notice");
            next.delete("error");
            const query = next.toString();
            router.replace(query ? `${pathname}?${query}` : pathname);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
