import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { parseDateOnly, toDateOnly, todayDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

type CalendarItem = {
  deliverable_id: string;
  deliverable_title: string;
  due_date: string;
  is_posted: boolean;
  campaign_id: string;
  campaign_name: string;
  influencer_name: string;
  platform: string;
};

type CalendarPageProps = {
  searchParams?: {
    month?: string | string[];
  };
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getVisibleMonth(value: string | null): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const today = todayDateOnly();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatShortDate(dateValue: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseDateOnly(dateValue));
}

function getItemState(item: CalendarItem, today: Date): "overdue" | "completed" | "upcoming" {
  if (item.is_posted) return "completed";
  return parseDateOnly(item.due_date) < today ? "overdue" : "upcoming";
}

function getStateClasses(state: "overdue" | "completed" | "upcoming"): string {
  if (state === "overdue") {
    return "border-[var(--status-overdue)]/30 bg-[var(--status-overdue-soft)] text-[var(--status-overdue)]";
  }

  if (state === "completed") {
    return "border-[var(--status-completed)]/30 bg-[var(--status-completed-soft)] text-[var(--status-completed)]";
  }

  return "border-accent/30 bg-accent-soft text-accent";
}

function buildCalendarDays(visibleMonth: Date, itemsByDate: Map<string, CalendarItem[]>): CalendarDay[] {
  const todayKey = toDateOnly(todayDateOnly());
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateOnly(date);

    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      isToday: dateKey === todayKey,
      items: itemsByDate.get(dateKey) ?? []
    };
  });
}

function EventChip({ item, today }: { item: CalendarItem; today: Date }) {
  const state = getItemState(item, today);

  return (
    <Link
      href={`/campaigns/${item.campaign_id}`}
      className={`block rounded-sm border px-2 py-1.5 text-left transition hover:border-border-strong hover:bg-panel-strong ${getStateClasses(state)}`}
    >
      <span className="block truncate text-[11px] font-semibold leading-4">{item.deliverable_title}</span>
      <span className="mt-0.5 block truncate text-[10px] opacity-80">{item.influencer_name}</span>
    </Link>
  );
}

function AgendaItem({ item, today }: { item: CalendarItem; today: Date }) {
  const state = getItemState(item, today);

  return (
    <Link
      href={`/campaigns/${item.campaign_id}`}
      className="block rounded-sm border border-border-subtle bg-panel-soft/50 p-3 transition hover:border-border-strong hover:bg-panel-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{item.deliverable_title}</p>
          <p className="mt-1 truncate text-xs text-text-faint">
            {item.influencer_name} | {item.platform} | {item.campaign_name}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStateClasses(state)}`}>
          {state === "completed" ? "Posted" : state === "overdue" ? "Overdue" : "Due"}
        </span>
      </div>
      <p className="mt-2 text-xs text-text-muted">{formatShortDate(item.due_date)}</p>
    </Link>
  );
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const supabase = createClient();

  const [{ data: deliverablesRaw }, { data: campaignsRaw }, { data: influencersRaw }] = await Promise.all([
    supabase.from("deliverables").select("id, title, due_date, is_posted, campaign_id"),
    supabase.from("campaigns").select("id, name, influencer_id"),
    supabase.from("influencers").select("id, name, platform")
  ]);

  const deliverables = (deliverablesRaw ?? []) as Array<{
    id: string;
    title: string;
    due_date: string | null;
    is_posted: boolean;
    campaign_id: string;
  }>;

  const campaigns = (campaignsRaw ?? []) as Array<{
    id: string;
    name: string;
    influencer_id: string;
  }>;

  const influencers = (influencersRaw ?? []) as Array<{
    id: string;
    name: string;
    platform: string;
  }>;

  const campaignMap = new Map(campaigns.map((item) => [item.id, item]));
  const influencerMap = new Map(influencers.map((item) => [item.id, item]));

  const calendarItems: CalendarItem[] = deliverables
    .filter((item): item is typeof item & { due_date: string } => Boolean(item.due_date))
    .map((item) => {
      const campaign = campaignMap.get(item.campaign_id);
      const influencer = campaign ? influencerMap.get(campaign.influencer_id) : null;

      return {
        deliverable_id: item.id,
        deliverable_title: item.title,
        due_date: item.due_date,
        is_posted: item.is_posted,
        campaign_id: item.campaign_id,
        campaign_name: campaign?.name ?? "Unknown campaign",
        influencer_name: influencer?.name ?? "Unknown influencer",
        platform: influencer?.platform ?? "-"
      };
    });

  const today = todayDateOnly();
  const visibleMonth = getVisibleMonth(getParam(searchParams?.month));
  const previousMonth = monthKey(addMonths(visibleMonth, -1));
  const nextMonth = monthKey(addMonths(visibleMonth, 1));
  const currentMonthKey = monthKey(today);

  const itemsByDate = new Map<string, CalendarItem[]>();
  for (const item of calendarItems) {
    const bucket = itemsByDate.get(item.due_date) ?? [];
    bucket.push(item);
    itemsByDate.set(item.due_date, bucket);
  }

  for (const items of itemsByDate.values()) {
    items.sort((a, b) => {
      const stateOrder = { overdue: 0, upcoming: 1, completed: 2 };
      return stateOrder[getItemState(a, today)] - stateOrder[getItemState(b, today)];
    });
  }

  const calendarDays = buildCalendarDays(visibleMonth, itemsByDate);
  const visibleMonthItems = calendarItems
    .filter((item) => monthKey(parseDateOnly(item.due_date)) === monthKey(visibleMonth))
    .sort((a, b) => parseDateOnly(a.due_date).getTime() - parseDateOnly(b.due_date).getTime());

  const overdue = calendarItems.filter((item) => getItemState(item, today) === "overdue");
  const upcoming = calendarItems.filter((item) => getItemState(item, today) === "upcoming");
  const completed = calendarItems.filter((item) => item.is_posted);
  const nextUpcoming = upcoming
    .sort((a, b) => parseDateOnly(a.due_date).getTime() - parseDateOnly(b.due_date).getTime())
    .slice(0, 6);

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Calendar"
        description="Month-by-month deadline visibility for deliverables across your private campaign workspace."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overdue" value={String(overdue.length)} accentColor="var(--status-overdue)" />
        <StatCard label="Upcoming" value={String(upcoming.length)} accentColor="var(--accent)" />
        <StatCard label="Completed" value={String(completed.length)} accentColor="var(--status-completed)" />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-text-faint">Month view</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{formatMonth(visibleMonth)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/calendar?month=${previousMonth}`}>
                <Button type="button" variant="ghost" size="sm">Previous</Button>
              </Link>
              <Link href={`/calendar?month=${currentMonthKey}`}>
                <Button type="button" variant="secondary" size="sm">Today</Button>
              </Link>
              <Link href={`/calendar?month=${nextMonth}`}>
                <Button type="button" variant="ghost" size="sm">Next</Button>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[840px] rounded-sm border border-border-subtle">
              <div className="grid grid-cols-7 border-b border-border-subtle bg-panel-soft/65">
                {weekDays.map((day) => (
                  <div key={day} className="px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] text-text-faint">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const visibleItems = day.items.slice(0, 3);
                  const hiddenCount = day.items.length - visibleItems.length;

                  return (
                    <div
                      key={day.dateKey}
                      className={`min-h-[138px] border-b border-r border-border-subtle p-2 last:border-r-0 ${
                        day.isCurrentMonth ? "bg-panel-soft/35" : "bg-panel/30"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            day.isToday
                              ? "bg-accent text-bg-canvas"
                              : day.isCurrentMonth
                                ? "text-text-secondary"
                                : "text-text-faint"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                        {day.items.length ? (
                          <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] text-text-faint">
                            {day.items.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        {visibleItems.map((item) => (
                          <EventChip key={item.deliverable_id} item={item} today={today} />
                        ))}
                        {hiddenCount > 0 ? (
                          <Link
                            href="#month-agenda"
                            className="block rounded-sm border border-border-subtle bg-panel px-2 py-1 text-[11px] font-medium text-text-faint hover:text-text-secondary"
                          >
                            +{hiddenCount} more
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="overdue">Overdue</Badge>
            <Badge variant="active">Upcoming</Badge>
            <Badge variant="completed">Posted</Badge>
          </div>
        </Card>

        <div className="space-y-6">
          <Card id="month-agenda" className="scroll-mt-24">
            <CardHeader
              title="This month"
              description={`${visibleMonthItems.length} deliverable${visibleMonthItems.length === 1 ? "" : "s"} scheduled`}
            />
            {visibleMonthItems.length ? (
              <div className="space-y-2">
                {visibleMonthItems.map((item) => (
                  <AgendaItem key={item.deliverable_id} item={item} today={today} />
                ))}
              </div>
            ) : (
              <EmptyState title="No deliverables this month" description="Use the month controls to review another schedule window." />
            )}
          </Card>

          <Card>
            <CardHeader title="Next due" description="Nearest incomplete deliverables across all months." />
            {nextUpcoming.length ? (
              <div className="space-y-2">
                {nextUpcoming.map((item) => (
                  <AgendaItem key={item.deliverable_id} item={item} today={today} />
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming deliverables" description="Incomplete deliverables with future due dates will appear here." />
            )}
          </Card>

          {overdue.length ? (
            <Card>
              <CardHeader title="Overdue backlog" description="Incomplete deliverables past their due date." />
              <div className="space-y-2">
                {overdue.slice(0, 5).map((item) => (
                  <AgendaItem key={item.deliverable_id} item={item} today={today} />
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
