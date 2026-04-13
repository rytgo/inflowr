import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createDeliverable,
  createPayment,
  deleteCampaign,
  deleteDeliverable,
  deletePayment,
  updateCampaign,
  updateDeliverable,
  updatePayment
} from "@/app/(app)/actions";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { deriveCampaignStatus, formatCurrency, getNextScheduledDate } from "@/lib/campaign-logic";
import { parseDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

type CampaignDetailPageProps = {
  params: {
    id: string;
  };
};

function formatDate(value: string | null): string {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    parseDateOnly(value)
  );
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const supabase = createClient();
  const { id } = params;

  const [{ data: campaignRaw }, { data: deliverablesRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, influencer_id, name, total_value, notes, start_date, end_date")
      .eq("id", id)
      .single(),
    supabase
      .from("deliverables")
      .select("id, title, due_date, is_posted, live_url, posted_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("id, amount, payment_date, note")
      .eq("campaign_id", id)
      .order("payment_date", { ascending: false })
  ]);

  const campaign = campaignRaw as
    | {
        id: string;
        influencer_id: string;
        name: string;
        total_value: number;
        notes: string | null;
        start_date: string | null;
        end_date: string | null;
      }
    | null;

  const deliverables = (deliverablesRaw ?? []) as Array<{
    id: string;
    title: string;
    due_date: string | null;
    is_posted: boolean;
    live_url: string | null;
    posted_at: string | null;
  }>;

  const payments = (paymentsRaw ?? []) as Array<{
    id: string;
    amount: number;
    payment_date: string;
    note: string | null;
  }>;

  if (!campaign) {
    notFound();
  }

  const status = deriveCampaignStatus(deliverables);
  const nextDate = getNextScheduledDate(deliverables);
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = Number(campaign.total_value) - totalPaid;
  const deliverablesRemaining = deliverables.filter((item) => !item.is_posted).length;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title={campaign.name}
        description="Campaign command center with deliverable and payment operations."
        backHref={`/influencers/${campaign.influencer_id}`}
        backLabel="Back to influencer"
        meta={<Badge variant={statusToBadgeVariant(status)}>{status}</Badge>}
        action={
          <Drawer triggerLabel="Edit campaign" title="Edit campaign" description="Update campaign metadata.">
            <form action={updateCampaign} className="grid grid-cols-1 gap-4">
              <input type="hidden" name="id" value={campaign.id} />
              <Input name="name" defaultValue={campaign.name} required label="Campaign name" hint="Required" />
              <Input name="total_value" type="number" min="0" step="0.01" defaultValue={Number(campaign.total_value)} label="Total value ($)" hint="Cannot be negative" />
              <Input name="start_date" type="date" defaultValue={campaign.start_date ?? ""} label="Start date" />
              <Input name="end_date" type="date" defaultValue={campaign.end_date ?? ""} label="End date" hint="Must be after start date" />
              <Textarea name="notes" defaultValue={campaign.notes ?? ""} placeholder="Campaign notes..." label="Notes" />
              <div>
                <Button type="submit">Save campaign</Button>
              </div>
            </form>
          </Drawer>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="page-enter stagger-1"><StatCard label="Status" value={status} accentColor={status === "Overdue" ? "var(--status-overdue)" : status === "Completed" ? "var(--status-completed)" : "var(--status-active)"} /></div>
        <div className="page-enter stagger-2"><StatCard label="Open deliverables" value={String(deliverablesRemaining)} accentColor="var(--accent)" hint={`Next: ${formatDate(nextDate)}`} /></div>
        <div className="page-enter stagger-3"><StatCard label="Paid" value={formatCurrency(totalPaid)} accentColor="var(--status-active)" /></div>
        <div className="page-enter stagger-3"><StatCard label="Outstanding" value={formatCurrency(remaining)} accentColor={remaining > 0 ? "var(--status-warning)" : "var(--status-completed)"} /></div>
      </section>

      <Card>
        <CardHeader title="Campaign details" description="Current campaign values in read mode." />
        <div className="grid grid-cols-1 gap-4 rounded-sm border border-border-subtle bg-panel-soft/50 p-4 md:grid-cols-2">
          <div>
            <p className="data-label">Campaign name</p>
            <p className="data-value mt-1">{campaign.name}</p>
          </div>
          <div>
            <p className="data-label">Total value</p>
            <p className="data-value mt-1 font-mono text-sm">{formatCurrency(Number(campaign.total_value))}</p>
          </div>
          <div>
            <p className="data-label">Start date</p>
            <p className="data-value mt-1">{formatDate(campaign.start_date)}</p>
          </div>
          <div>
            <p className="data-label">End date</p>
            <p className="data-value mt-1">{formatDate(campaign.end_date)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="data-label">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{campaign.notes || "No notes"}</p>
          </div>
        </div>
      </Card>

      <Card id="deliverables" className="scroll-mt-24">
        <CardHeader
          title="Deliverables"
          description={`${deliverablesRemaining} open of ${deliverables.length} total`}
          action={
            <Drawer triggerLabel="New deliverable" title="Create deliverable" description="Add a deliverable to this campaign.">
              <form action={createDeliverable} className="grid grid-cols-1 gap-4">
                <input type="hidden" name="campaign_id" value={campaign.id} />
                <Input name="title" required placeholder="Deliverable title" label="Title" hint="Required" />
                <Input name="due_date" type="date" label="Due date" />
                <Input name="live_url" placeholder="https://..." label="Live URL" hint="Optional" />
                <div>
                  <Button type="submit">Create deliverable</Button>
                </div>
              </form>
            </Drawer>
          }
        />

        {deliverables.length ? (
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <div key={deliverable.id} className="rounded-sm border border-border-subtle bg-panel-soft/45 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{deliverable.title}</p>
                    <p className="mt-1 text-xs text-text-faint">Due {formatDate(deliverable.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deliverable.is_posted ? <Badge variant="completed">Posted</Badge> : <Badge variant="active">Pending</Badge>}
                    {deliverable.live_url ? (
                      <a href={deliverable.live_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-hover">
                        Open link
                      </a>
                    ) : null}
                    <Drawer triggerLabel="Edit" triggerVariant="ghost" size="sm" title="Edit deliverable" description="Update title, due date, URL, and status.">
                      <form action={updateDeliverable} className="grid grid-cols-1 gap-4">
                        <input type="hidden" name="id" value={deliverable.id} />
                        <input type="hidden" name="campaign_id" value={campaign.id} />
                        <Input name="title" required defaultValue={deliverable.title} label="Title" hint="Required" />
                        <Input name="due_date" type="date" defaultValue={deliverable.due_date ?? ""} label="Due date" />
                        <Input name="live_url" defaultValue={deliverable.live_url ?? ""} placeholder="https://..." label="Live URL" />
                        <label className="flex items-center gap-2 text-sm text-text-secondary">
                          <input type="checkbox" name="is_posted" defaultChecked={deliverable.is_posted} className="h-4 w-4 accent-accent" />
                          Mark as posted
                        </label>
                        <div>
                          <Button type="submit">Save deliverable</Button>
                        </div>
                      </form>
                    </Drawer>
                  </div>
                </div>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <form action={deleteDeliverable}>
                    <input type="hidden" name="id" value={deliverable.id} />
                    <input type="hidden" name="campaign_id" value={campaign.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-danger hover:text-danger">
                      Delete deliverable
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No deliverables yet" description="Add deliverables to start execution tracking." />
        )}
      </Card>

      <Card id="payments" className="scroll-mt-24">
        <CardHeader
          title="Payments"
          description="Payment logs keep paid and remaining balances accurate."
          action={
            <Drawer triggerLabel="Log payment" title="Log payment" description="Add a payment record for this campaign.">
              <form action={createPayment} className="grid grid-cols-1 gap-4">
                <input type="hidden" name="campaign_id" value={campaign.id} />
                <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                <Input name="amount" required type="number" min="0" step="0.01" placeholder="0.00" label="Amount ($)" hint="Cannot be negative" />
                <Input name="payment_date" type="date" label="Date" />
                <Input name="note" placeholder="Payment note" label="Note" />
                <div>
                  <Button type="submit">Log payment</Button>
                </div>
              </form>
            </Drawer>
          }
        />

        {payments.length ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-sm border border-border-subtle bg-panel-soft/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-text-primary">{formatCurrency(Number(payment.amount))}</p>
                    <p className="mt-1 text-xs text-text-faint">{formatDate(payment.payment_date)}</p>
                    {payment.note ? <p className="mt-1 text-sm text-text-secondary">{payment.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="active">Logged</Badge>
                    <Drawer triggerLabel="Edit" triggerVariant="ghost" size="sm" title="Edit payment" description="Update amount, date, and note.">
                      <form action={updatePayment} className="grid grid-cols-1 gap-4">
                        <input type="hidden" name="id" value={payment.id} />
                        <input type="hidden" name="campaign_id" value={campaign.id} />
                        <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                        <Input name="amount" required type="number" min="0" step="0.01" defaultValue={Number(payment.amount)} label="Amount" hint="Cannot be negative" />
                        <Input name="payment_date" type="date" defaultValue={payment.payment_date} label="Date" />
                        <Input name="note" defaultValue={payment.note ?? ""} placeholder="Payment note" label="Note" />
                        <div>
                          <Button type="submit">Save payment</Button>
                        </div>
                      </form>
                    </Drawer>
                  </div>
                </div>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <form action={deletePayment}>
                    <input type="hidden" name="id" value={payment.id} />
                    <input type="hidden" name="campaign_id" value={campaign.id} />
                    <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-danger hover:text-danger">
                      Delete payment
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No payments logged" description="Log a payment when funds are released for this campaign." />
        )}
      </Card>

      <Card>
        <CardHeader title="Danger zone" description="Deleting this campaign removes its deliverables and payments." />
        <form action={deleteCampaign}>
          <input type="hidden" name="id" value={campaign.id} />
          <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
          <Button type="submit" variant="destructive" size="sm">
            Delete campaign
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Quick navigation" />
        <div className="flex flex-wrap gap-2">
          <a href="#deliverables">
            <Button variant="ghost" size="sm">Deliverables</Button>
          </a>
          <a href="#payments">
            <Button variant="ghost" size="sm">Payments</Button>
          </a>
          <Link href={`/influencers/${campaign.influencer_id}`}>
            <Button variant="ghost" size="sm">Influencer page</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
