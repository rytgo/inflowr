import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { parseDateOnly, todayDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

type CalendarItem = {
  deliverable_id: string;
  deliverable_title: string;
  due_date: string | null;
  is_posted: boolean;
  campaign_id: string;
  campaign_name: string;
  influencer_name: string;
  platform: string;
};

function formatDate(dateValue: string): string {
  const date = parseDateOnly(dateValue);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function groupByDate(items: CalendarItem[]): Array<{ date: string; entries: CalendarItem[] }> {
  const map = new Map<string, CalendarItem[]>();

  for (const item of items) {
    if (!item.due_date) continue;
    const bucket = map.get(item.due_date) ?? [];
    bucket.push(item);
    map.set(item.due_date, bucket);
  }

  return [...map.entries()]
    .sort((a, b) => parseDateOnly(a[0]).getTime() - parseDateOnly(b[0]).getTime())
    .map(([date, entries]) => ({ date, entries }));
}

function TimelineSection({
  title,
  emptyText,
  emptyDescription,
  groups,
  variant
}: {
  title: string;
  emptyText: string;
  emptyDescription?: string;
  groups: Array<{ date: string; entries: CalendarItem[] }>;
  variant: "overdue" | "upcoming" | "completed";
}) {
  const accent =
    variant === "overdue" ? "var(--status-overdue)" : variant === "upcoming" ? "var(--accent)" : "var(--status-completed)";

  return (
    <Card>
      <CardHeader title={title} />
      {groups.length ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.date} className="rounded-sm border border-border-subtle bg-panel-soft/45 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-text-faint">{formatDate(group.date)}</p>
              <div className="mt-3 space-y-2">
                {group.entries.map((entry) => (
                  <div
                    key={entry.deliverable_id}
                    className="rounded-sm border border-border-subtle bg-panel px-4 py-3"
                    style={{ boxShadow: `inset 2px 0 0 ${accent}` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{entry.deliverable_title}</p>
                        <p className="mt-1 text-xs text-text-faint">
                          {entry.influencer_name} | {entry.platform} | {entry.campaign_name}
                        </p>
                      </div>
                      {entry.is_posted ? (
                        <Badge variant="completed">Posted</Badge>
                      ) : variant === "overdue" ? (
                        <Badge variant="overdue">Overdue</Badge>
                      ) : (
                        <Badge variant="active">Upcoming</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <Link href={`/campaigns/${entry.campaign_id}`} className="text-xs font-medium text-accent hover:text-accent-hover">
                        Open campaign
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyText} description={emptyDescription} />
      )}
    </Card>
  );
}

export default async function CalendarPage() {
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
    .filter((item) => item.due_date)
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

  const overdue = calendarItems.filter((item) => !item.is_posted && item.due_date && parseDateOnly(item.due_date) < today);
  const upcoming = calendarItems.filter((item) => !item.is_posted && item.due_date && parseDateOnly(item.due_date) >= today);
  const completed = calendarItems.filter((item) => item.is_posted);

  const overdueGroups = groupByDate(overdue);
  const upcomingGroups = groupByDate(upcoming);
  const completedGroups = groupByDate(completed);

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Calendar"
        description="Deadline intelligence for deliverables across your private campaign workspace."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overdue" value={String(overdue.length)} accentColor="var(--status-overdue)" />
        <StatCard label="Upcoming" value={String(upcoming.length)} accentColor="var(--accent)" />
        <StatCard label="Completed" value={String(completed.length)} accentColor="var(--status-completed)" />
      </section>

      <TimelineSection
        title="Overdue"
        emptyText="No overdue deliverables"
        emptyDescription="Everything currently due has been handled on time."
        groups={overdueGroups}
        variant="overdue"
      />

      <TimelineSection
        title="Upcoming"
        emptyText="No upcoming deliverables"
        emptyDescription="No due dates scheduled right now."
        groups={upcomingGroups}
        variant="upcoming"
      />

      <TimelineSection
        title="Completed"
        emptyText="No completed deliverables"
        emptyDescription="Completed deliverables will appear here after posting."
        groups={completedGroups}
        variant="completed"
      />
    </div>
  );
}
