import Link from "next/link";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, description, backHref, backLabel, action, meta }: PageHeaderProps) {
  return (
    <header className="mb-7 rounded-md border border-border-subtle bg-panel-soft/80 p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-text-faint transition hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              {backLabel ?? "Back"}
            </Link>
          ) : null}
          <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-text-muted">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
