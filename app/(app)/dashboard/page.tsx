import Link from "next/link";

import { deriveCampaignStatus, formatCurrency, getNextScheduledDate } from "@/lib/campaign-logic";
import { addDays, parseDateOnly, todayDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

type CampaignRow = {
  id: string;
  influencer_name: string;
  platform: string;
  name: string;
  deliverablesRemaining: number;
  paid: number;
  remaining: number;
  nextDate: string | null;
  status: string;
};

type DashboardPageProps = {
  searchParams?: {
    q?: string | string[];
    status?: string | string[];
    due?: string | string[];
    outstanding?: string | string[];
    sort?: string | string[];
  };
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();

  const [
    { data: campaignsRaw },
    { data: deliverablesRaw },
    { data: paymentsRaw },
    { data: influencersRaw }
  ] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, total_value, influencer_id, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("deliverables").select("campaign_id, due_date, is_posted"),
      supabase.from("payments").select("campaign_id, amount"),
      supabase.from("influencers").select("id, name, platform")
    ]);

  const campaigns = (campaignsRaw ?? []) as Array<{
    id: string;
    name: string;
    total_value: number;
    influencer_id: string;
    created_at: string;
  }>;

  const deliverables = (deliverablesRaw ?? []) as Array<{
    campaign_id: string;
    due_date: string | null;
    is_posted: boolean;
  }>;

  const payments = (paymentsRaw ?? []) as Array<{
    campaign_id: string;
    amount: number;
  }>;

  const influencers = (influencersRaw ?? []) as Array<{
    id: string;
    name: string;
    platform: string;
  }>;

  const influencerMap = new Map(influencers.map((item) => [item.id, item]));
  const campaignById = new Map(campaigns.map((item) => [item.id, item]));
  const deliverablesByCampaign = new Map<string, typeof deliverables>();
  const paidByCampaign = new Map<string, number>();

  for (const item of deliverables) {
    const bucket = deliverablesByCampaign.get(item.campaign_id) ?? [];
    bucket.push(item);
    deliverablesByCampaign.set(item.campaign_id, bucket);
  }

  for (const payment of payments) {
    const current = paidByCampaign.get(payment.campaign_id) ?? 0;
    paidByCampaign.set(payment.campaign_id, current + Number(payment.amount));
  }

  const rows: CampaignRow[] = campaigns.map((campaign) => {
    const campaignDeliverables = deliverablesByCampaign.get(campaign.id) ?? [];
    const paid = paidByCampaign.get(campaign.id) ?? 0;
    const remaining = Number(campaign.total_value) - paid;
    const influencer = influencerMap.get(campaign.influencer_id);

    return {
      id: campaign.id,
      influencer_name: influencer?.name ?? "Unknown",
      platform: influencer?.platform ?? "-",
      name: campaign.name,
      deliverablesRemaining: campaignDeliverables.filter((item) => !item.is_posted).length,
      paid,
      remaining,
      nextDate: getNextScheduledDate(campaignDeliverables),
      status: deriveCampaignStatus(campaignDeliverables)
    };
  });

  const activeCount = rows.filter((item) => item.status === "Active").length;
  const overdueCount = rows.filter((item) => item.status === "Overdue").length;
  const outstandingBalance = rows.reduce((sum, item) => sum + item.remaining, 0);

  const today = todayDateOnly();
  const nextWeek = addDays(today, 7);

  const dueSoonCount = deliverables.filter((item) => {
    if (item.is_posted || !item.due_date) return false;
    const due = parseDateOnly(item.due_date);
    return due >= today && due <= nextWeek;
  }).length;

  const cards = [
    { label: "Active campaigns", value: String(activeCount) },
    { label: "Overdue campaigns", value: String(overdueCount) },
    { label: "Outstanding balance", value: formatCurrency(outstandingBalance) },
    { label: "Deliverables due soon", value: String(dueSoonCount) }
  ];

  const query = normalize(getParam(searchParams?.q, ""));
  const statusFilter = getParam(searchParams?.status, "all");
  const dueFilter = getParam(searchParams?.due, "all");
  const outstandingFilter = getParam(searchParams?.outstanding, "all");
  const sortFilter = getParam(searchParams?.sort, "next_date_asc");

  const filteredRows = rows.filter((row) => {
    const matchesQuery =
      !query ||
      normalize(row.influencer_name).includes(query) ||
      normalize(row.name).includes(query) ||
      normalize(row.platform).includes(query);

    const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter;

    const matchesDueSoon =
      dueFilter === "soon"
        ? row.nextDate !== null &&
          (() => {
            const due = parseDateOnly(row.nextDate as string);
            return due >= today && due <= nextWeek;
          })()
        : true;

    const matchesOutstanding =
      outstandingFilter === "yes" ? row.remaining > 0 : true;

    return matchesQuery && matchesStatus && matchesDueSoon && matchesOutstanding;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortFilter === "balance_desc") {
      return b.remaining - a.remaining;
    }

    if (sortFilter === "created_desc") {
      const aCampaign = campaignById.get(a.id);
      const bCampaign = campaignById.get(b.id);
      const aTime = aCampaign ? new Date(aCampaign.created_at).getTime() : 0;
      const bTime = bCampaign ? new Date(bCampaign.created_at).getTime() : 0;
      return bTime - aTime;
    }

    const aDate = a.nextDate ? parseDateOnly(a.nextDate).getTime() : Number.POSITIVE_INFINITY;
    const bDate = b.nextDate ? parseDateOnly(b.nextDate).getTime() : Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Operational overview for your private campaign workspace.
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-medium">Campaign pipeline</h2>
        <form method="get" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            name="q"
            defaultValue={getParam(searchParams?.q, "")}
            placeholder="Search influencer, campaign, platform"
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            name="due"
            defaultValue={dueFilter}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          >
            <option value="all">All due dates</option>
            <option value="soon">Due soon (7 days)</option>
          </select>
          <select
            name="outstanding"
            defaultValue={outstandingFilter}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          >
            <option value="all">Any balance</option>
            <option value="yes">Outstanding only</option>
          </select>
          <select
            name="sort"
            defaultValue={sortFilter}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          >
            <option value="next_date_asc">Sort: next post date</option>
            <option value="balance_desc">Sort: highest outstanding</option>
            <option value="created_desc">Sort: recently created</option>
          </select>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
            <Link href="/dashboard" className="text-sm text-[var(--primary)]">
              Reset
            </Link>
          </div>
        </form>

        {sortedRows.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2 font-medium">Influencer</th>
                  <th className="py-2 font-medium">Platform</th>
                  <th className="py-2 font-medium">Campaign</th>
                  <th className="py-2 font-medium">Remaining deliverables</th>
                  <th className="py-2 font-medium">Paid</th>
                  <th className="py-2 font-medium">Outstanding</th>
                  <th className="py-2 font-medium">Next post date</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]">
                    <td className="py-3">{row.influencer_name}</td>
                    <td className="py-3">{row.platform}</td>
                    <td className="py-3">
                      <Link href={`/campaigns/${row.id}`} className="text-[var(--primary)]">
                        {row.name}
                      </Link>
                    </td>
                    <td className="py-3">{row.deliverablesRemaining}</td>
                    <td className="py-3">{formatCurrency(row.paid)}</td>
                    <td className="py-3">{formatCurrency(row.remaining)}</td>
                    <td className="py-3">{row.nextDate ?? "-"}</td>
                    <td className="py-3">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            No results for the current filters.
          </p>
        )}
      </section>
    </div>
  );
}
