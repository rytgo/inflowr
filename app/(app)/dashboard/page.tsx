import Link from "next/link";

import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableTh } from "@/components/ui/table";
import { CampaignStatus, deriveCampaignStatus, formatCurrency, getNextScheduledDate } from "@/lib/campaign-logic";
import { addDays, parseDateOnly, todayDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

type CampaignRow = {
  id: string;
  influencerName: string;
  platform: string;
  name: string;
  deliverablesRemaining: number;
  paid: number;
  remaining: number;
  nextDate: string | null;
  status: CampaignStatus;
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
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "--";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    parseDateOnly(dateValue)
  );
}

function ActiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function OverdueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function BalanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();

  const [{ data: campaignsRaw }, { data: deliverablesRaw }, { data: paymentsRaw }, { data: influencersRaw }] =
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
      influencerName: influencer?.name ?? "Unknown",
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

  const query = normalize(getParam(searchParams?.q, ""));
  const statusFilter = getParam(searchParams?.status, "all");
  const dueFilter = getParam(searchParams?.due, "all");
  const outstandingFilter = getParam(searchParams?.outstanding, "all");
  const sortFilter = getParam(searchParams?.sort, "next_date_asc");

  const filteredRows = rows.filter((row) => {
    const matchesQuery =
      !query ||
      normalize(row.influencerName).includes(query) ||
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

    const matchesOutstanding = outstandingFilter === "yes" ? row.remaining > 0 : true;

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
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        description="Real-time operational overview across your private campaigns."
        action={
          <Link href="/influencers">
            <Button size="sm">Manage influencers</Button>
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active campaigns" value={String(activeCount)} icon={<ActiveIcon />} accentColor="var(--status-active)" />
        <StatCard label="Overdue campaigns" value={String(overdueCount)} icon={<OverdueIcon />} accentColor="var(--status-overdue)" />
        <StatCard label="Outstanding balance" value={formatCurrency(outstandingBalance)} icon={<BalanceIcon />} accentColor="var(--status-warning)" />
        <StatCard label="Due in 7 days" value={String(dueSoonCount)} icon={<ClockIcon />} accentColor="var(--accent)" />
      </section>

      <Card className="mt-6">
        <CardHeader title="Campaign pipeline" description="Filter by risk, due dates, and financial exposure." />

        <form method="get" className="grid grid-cols-1 gap-3 rounded-sm border border-border-subtle bg-panel-soft/55 p-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Input name="q" defaultValue={getParam(searchParams?.q, "")} placeholder="Search influencer, campaign, platform" />
          </div>
          <Select name="status" defaultValue={statusFilter}>
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </Select>
          <Select name="due" defaultValue={dueFilter}>
            <option value="all">All due dates</option>
            <option value="soon">Due this week</option>
          </Select>
          <Select name="outstanding" defaultValue={outstandingFilter}>
            <option value="all">Any balance</option>
            <option value="yes">Outstanding only</option>
          </Select>
          <Select name="sort" defaultValue={sortFilter}>
            <option value="next_date_asc">Next due date</option>
            <option value="balance_desc">Highest outstanding</option>
            <option value="created_desc">Newest campaigns</option>
          </Select>
          <div className="flex items-end gap-2 xl:col-span-6">
            <Button type="submit" size="sm">
              Apply filters
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="ghost" size="sm">
                Reset
              </Button>
            </Link>
          </div>
        </form>

        <div className="mt-5">
          {sortedRows.length ? (
            <Table>
              <TableHead>
                <TableTh>Influencer</TableTh>
                <TableTh>Campaign</TableTh>
                <TableTh>Platform</TableTh>
                <TableTh>Open deliverables</TableTh>
                <TableTh>Paid</TableTh>
                <TableTh>Outstanding</TableTh>
                <TableTh>Next due</TableTh>
                <TableTh>Status</TableTh>
              </TableHead>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-text-primary">{row.influencerName}</TableCell>
                    <TableCell>
                      <Link href={`/campaigns/${row.id}`} className="font-medium text-accent hover:text-accent-hover">
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>{row.platform}</TableCell>
                    <TableCell>{row.deliverablesRemaining}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCurrency(row.paid)}</TableCell>
                    <TableCell className={`font-mono text-xs ${row.remaining > 0 ? "text-[var(--status-warning)]" : "text-text-secondary"}`}>
                      {formatCurrency(row.remaining)}
                    </TableCell>
                    <TableCell muted>{formatDate(row.nextDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No campaigns match this filter set"
              description="Adjust filters or clear search terms to reveal active records."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
