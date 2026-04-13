import { parseDateOnly, toDateOnly, todayDateOnly } from "@/lib/date";

type DeliverableState = {
  due_date: string | null;
  is_posted: boolean;
};

export type CampaignStatus = "Active" | "Overdue" | "Completed";

export function deriveCampaignStatus(deliverables: DeliverableState[]): CampaignStatus {
  if (deliverables.length === 0) {
    return "Active";
  }

  const incomplete = deliverables.filter((item) => !item.is_posted);

  if (incomplete.length === 0) {
    return "Completed";
  }

  const today = todayDateOnly();

  const hasOverdue = incomplete.some((item) => {
    if (!item.due_date) return false;
    return parseDateOnly(item.due_date) < today;
  });

  return hasOverdue ? "Overdue" : "Active";
}

export function getNextScheduledDate(deliverables: DeliverableState[]): string | null {
  const today = todayDateOnly();

  const upcoming = deliverables
    .filter((item) => !item.is_posted && item.due_date)
    .map((item) => parseDateOnly(item.due_date as string))
    .filter((date) => date >= today)
    .sort((a, b) => a.getTime() - b.getTime());

  if (upcoming.length === 0) return null;
  return toDateOnly(upcoming[0]);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}
