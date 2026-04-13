"use client";

import { ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type DrawerProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Drawer({
  triggerLabel,
  title,
  description,
  children,
  triggerVariant = "secondary",
  size = "sm"
}: DrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <>
      <Button type="button" variant={triggerVariant} size={size} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close drawer"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-border bg-panel p-5 shadow-deep sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h3>
                {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-1">{children}</div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
