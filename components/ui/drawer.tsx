"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

type DrawerProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "accent" | "ghost";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onCloseOverlays = () => setOpen(false);

    document.addEventListener("keydown", onEscape);
    window.addEventListener("inflowr:close-overlays", onCloseOverlays);
    return () => {
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("inflowr:close-overlays", onCloseOverlays);
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant={triggerVariant} size={size} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
              <button
                type="button"
                aria-label="Close modal"
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="relative max-h-[min(82vh,720px)] w-full max-w-[560px] overflow-hidden rounded-lg border border-border bg-panel shadow-deep"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
                  <div>
                    <h3 id="modal-title" className="text-lg font-semibold tracking-tight text-text-primary">{title}</h3>
                    {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="max-h-[calc(min(82vh,720px)-88px)] overflow-y-auto px-5 py-5">{children}</div>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
