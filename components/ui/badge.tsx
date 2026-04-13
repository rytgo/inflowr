import { CampaignStatus } from "@/lib/campaign-logic";

type BadgeVariant = "active" | "overdue" | "completed" | "warning" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  active: "border-[var(--status-active)]/30 bg-[var(--status-active-soft)] text-[var(--status-active)]",
  overdue: "border-[var(--status-overdue)]/30 bg-[var(--status-overdue-soft)] text-[var(--status-overdue)]",
  completed:
    "border-[var(--status-completed)]/30 bg-[var(--status-completed-soft)] text-[var(--status-completed)]",
  warning: "border-[var(--status-warning)]/30 bg-[var(--status-warning-soft)] text-[var(--status-warning)]",
  neutral: "border-border bg-panel-soft text-text-muted"
};

const dotStyles: Record<BadgeVariant, string> = {
  active: "bg-[var(--status-active)]",
  overdue: "bg-[var(--status-overdue)]",
  completed: "bg-[var(--status-completed)]",
  warning: "bg-[var(--status-warning)]",
  neutral: "bg-text-faint"
};

type BadgeProps = {
  variant: BadgeVariant;
  children: React.ReactNode;
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${variantStyles[variant]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
      {children}
    </span>
  );
}

export function statusToBadgeVariant(status: CampaignStatus): BadgeVariant {
  switch (status) {
    case "Active":
      return "active";
    case "Overdue":
      return "overdue";
    case "Completed":
      return "completed";
    default:
      return "neutral";
  }
}
