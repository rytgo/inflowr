import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  accentColor?: string;
  hint?: string;
};

export function StatCard({ label, value, icon, accentColor, hint }: StatCardProps) {
  return (
    <div className="surface-panel group rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-faint">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight" style={accentColor ? { color: accentColor } : undefined}>
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-text-faint">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle bg-panel-soft text-text-muted"
            style={accentColor ? { color: accentColor, borderColor: `${accentColor}55` } : undefined}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
