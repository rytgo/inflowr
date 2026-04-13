import Link from "next/link";
import { notFound } from "next/navigation";

import { createCampaign, deleteInfluencer, updateInfluencer } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableTh } from "@/components/ui/table";
import { formatCurrency } from "@/lib/campaign-logic";
import { createClient } from "@/lib/supabase/server";

type InfluencerDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function InfluencerDetailPage({ params }: InfluencerDetailPageProps) {
  const supabase = createClient();
  const { id } = params;

  const [{ data: influencerRaw }, { data: campaignsRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase.from("influencers").select("id, name, platform, profile_url, notes").eq("id", id).single(),
    supabase
      .from("campaigns")
      .select("id, name, total_value, start_date, end_date, created_at")
      .eq("influencer_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("campaign_id, amount")
  ]);

  const influencer = influencerRaw as
    | {
        id: string;
        name: string;
        platform: string;
        profile_url: string | null;
        notes: string | null;
      }
    | null;

  const campaigns = (campaignsRaw ?? []) as Array<{
    id: string;
    name: string;
    total_value: number;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
  }>;

  const payments = (paymentsRaw ?? []) as Array<{
    campaign_id: string;
    amount: number;
  }>;

  if (!influencer) {
    notFound();
  }

  const paidByCampaign = new Map<string, number>();
  for (const payment of payments) {
    const current = paidByCampaign.get(payment.campaign_id) ?? 0;
    paidByCampaign.set(payment.campaign_id, current + Number(payment.amount));
  }

  const totals = campaigns.reduce(
    (acc, campaign) => {
      const paid = paidByCampaign.get(campaign.id) ?? 0;
      acc.totalValue += Number(campaign.total_value);
      acc.totalPaid += paid;
      return acc;
    },
    { totalValue: 0, totalPaid: 0 }
  );

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title={influencer.name}
        description="Influencer overview and campaign relationship details."
        backHref="/influencers"
        backLabel="Back to influencers"
        action={
          <Drawer triggerLabel="New campaign" title="Create campaign" description="Add a campaign under this influencer.">
            <form action={createCampaign} className="grid grid-cols-1 gap-4">
              <input type="hidden" name="influencer_id" value={influencer.id} />
              <Input name="name" required placeholder="Campaign name" label="Campaign name" hint="Required" />
              <Input name="total_value" type="number" step="0.01" min="0" defaultValue="0" label="Total value ($)" hint="Use 0 if unknown" />
              <Input name="start_date" type="date" label="Start date" />
              <Input name="end_date" type="date" label="End date" hint="Must be after start date" />
              <Textarea name="notes" placeholder="Campaign notes..." label="Notes" />
              <div>
                <Button type="submit">Create campaign</Button>
              </div>
            </form>
          </Drawer>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="page-enter stagger-1"><StatCard label="Platform" value={influencer.platform} /></div>
        <div className="page-enter stagger-2"><StatCard label="Campaigns" value={String(campaigns.length)} /></div>
        <div className="page-enter stagger-3"><StatCard label="Total value" value={formatCurrency(totals.totalValue)} /></div>
        <div className="page-enter stagger-3"><StatCard label="Outstanding" value={formatCurrency(totals.totalValue - totals.totalPaid)} accentColor="var(--status-warning)" /></div>
      </section>

      <Card>
        <CardHeader
          title="Profile"
          description="Read mode by default. Open edit drawer when updates are needed."
          action={
            <Drawer triggerLabel="Edit details" title="Edit influencer" description="Update profile and notes.">
              <form action={updateInfluencer} className="grid grid-cols-1 gap-4">
                <input type="hidden" name="id" value={influencer.id} />
                <Input name="name" defaultValue={influencer.name} required label="Name" hint="Required" />
                <Input name="platform" defaultValue={influencer.platform} required label="Platform" hint="Required" />
                <Input name="profile_url" defaultValue={influencer.profile_url ?? ""} placeholder="https://..." label="Profile URL" hint="Optional, must start with https://" />
                <Textarea name="notes" defaultValue={influencer.notes ?? ""} placeholder="Notes..." label="Notes" />
                <div>
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </Drawer>
          }
        />

        <div className="grid grid-cols-1 gap-4 rounded-sm border border-border-subtle bg-panel-soft/50 p-4 md:grid-cols-2">
          <div>
            <p className="data-label">Name</p>
            <p className="data-value mt-1">{influencer.name}</p>
          </div>
          <div>
            <p className="data-label">Platform</p>
            <p className="data-value mt-1">{influencer.platform}</p>
          </div>
          <div className="md:col-span-2">
            <p className="data-label">Profile URL</p>
            {influencer.profile_url ? (
              <a className="mt-1 inline-block font-medium text-accent hover:text-accent-hover" href={influencer.profile_url} target="_blank" rel="noreferrer">
                {influencer.profile_url}
              </a>
            ) : (
              <p className="mt-1 text-text-faint">--</p>
            )}
          </div>
          <div className="md:col-span-2">
            <p className="data-label">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{influencer.notes || "No notes"}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Campaigns" description="Current campaigns linked to this influencer." />
        {campaigns.length ? (
          <Table>
            <TableHead>
              <TableTh>Campaign</TableTh>
              <TableTh>Total value</TableTh>
              <TableTh>Paid</TableTh>
              <TableTh>Outstanding</TableTh>
              <TableTh className="text-right">Actions</TableTh>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => {
                const paid = paidByCampaign.get(campaign.id) ?? 0;
                const remaining = Number(campaign.total_value) - paid;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-text-primary">{campaign.name}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCurrency(Number(campaign.total_value))}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCurrency(paid)}</TableCell>
                    <TableCell className={`font-mono text-xs ${remaining > 0 ? "text-[var(--status-warning)]" : "text-text-secondary"}`}>
                      {formatCurrency(remaining)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No campaigns yet" description="Create a campaign when this influencer is ready to go live." />
        )}
      </Card>

      <Card>
        <CardHeader title="Danger zone" description="Deleting an influencer removes all related campaigns, deliverables, and payments." />
        <form action={deleteInfluencer}>
          <input type="hidden" name="id" value={influencer.id} />
          <Button type="submit" variant="destructive" size="sm">
            Delete influencer
          </Button>
        </form>
      </Card>
    </div>
  );
}
