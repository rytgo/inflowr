import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border-strong bg-panel-soft/50 px-6 py-10 text-center">
      {icon ? <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm border border-border-subtle bg-panel-strong text-text-muted">{icon}</div> : null}
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-text-faint">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
