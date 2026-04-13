import Link from "next/link";

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

function Section({
  title,
  emptyText,
  groups
}: {
  title: string;
  emptyText: string;
  groups: Array<{ date: string; entries: CalendarItem[] }>;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-medium">{title}</h2>
      {groups.length ? (
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.date}>
              <p className="text-sm font-medium">{formatDate(group.date)}</p>
              <div className="mt-2 space-y-2">
                {group.entries.map((entry) => (
                  <div
                    key={entry.deliverable_id}
                    className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{entry.deliverable_title}</p>
                    <p className="mt-1 text-[var(--muted)]">
                      {entry.influencer_name} ({entry.platform}) - {entry.campaign_name}
                    </p>
                    <Link className="mt-1 inline-block text-[var(--primary)]" href={`/campaigns/${entry.campaign_id}`}>
                      Open campaign
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">{emptyText}</p>
      )}
    </section>
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

  const overdue = calendarItems.filter(
    (item) => !item.is_posted && item.due_date && parseDateOnly(item.due_date) < today
  );
  const upcoming = calendarItems.filter(
    (item) => !item.is_posted && item.due_date && parseDateOnly(item.due_date) >= today
  );
  const completed = calendarItems.filter((item) => item.is_posted);

  const overdueGroups = groupByDate(overdue);
  const upcomingGroups = groupByDate(upcoming);
  const completedGroups = groupByDate(completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Deadline awareness for deliverables across your campaigns.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Overdue deliverables</p>
          <p className="mt-1 text-2xl font-semibold">{overdue.length}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Upcoming deliverables</p>
          <p className="mt-1 text-2xl font-semibold">{upcoming.length}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Completed deliverables</p>
          <p className="mt-1 text-2xl font-semibold">{completed.length}</p>
        </article>
      </section>

      <Section
        title="Overdue"
        emptyText="No overdue deliverables."
        groups={overdueGroups}
      />
      <Section
        title="Upcoming"
        emptyText="No upcoming deliverables."
        groups={upcomingGroups}
      />
      <Section
        title="Completed"
        emptyText="No completed deliverables."
        groups={completedGroups}
      />
    </div>
  );
}
