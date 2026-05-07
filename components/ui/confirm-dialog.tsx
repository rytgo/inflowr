"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  triggerLabel: string;
  children: ReactNode;
};

export function ConfirmDialog({ title, description, triggerLabel, children }: ConfirmDialogProps) {
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
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-6">
              <button
                type="button"
                aria-label="Cancel delete"
                className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />
              <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-description"
                className="relative w-full max-w-[440px] rounded-lg border border-danger/30 bg-panel p-5 shadow-deep"
              >
                <div>
                  <h3 id="confirm-title" className="text-lg font-semibold tracking-tight text-text-primary">
                    {title}
                  </h3>
                  <p id="confirm-description" className="mt-2 text-sm leading-6 text-text-muted">
                    {description}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  {children}
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
