import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createDeliverableSmooth,
  createPaymentSmooth,
  deleteCampaign,
  deleteDeliverableSmooth,
  deletePaymentSmooth,
  updateCampaignSmooth,
  updateDeliverableSmooth,
  updatePaymentSmooth
} from "@/app/(app)/actions";
import { DeliverablePostedButton } from "@/components/deliverable-posted-button";
import { SmoothForm } from "@/components/smooth-form";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { deriveCampaignStatus, formatCurrency, getNextScheduledDate } from "@/lib/campaign-logic";
import { parseDateOnly, todayDateOnly } from "@/lib/date";
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

type TimelineItem = {
  id: string;
  date: string;
  sortTime: number;
  type: "deliverable" | "payment";
  title: string;
  description: string;
  badge: React.ReactNode;
  detail?: React.ReactNode;
};

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
  const today = todayDateOnly();

  // The timeline blends operational deadlines with money movement so a manager
  // can read the campaign history without jumping between sections.
  const timelineItems: TimelineItem[] = [
    ...deliverables
      .filter((deliverable) => deliverable.due_date)
      .map((deliverable) => {
        const due = parseDateOnly(deliverable.due_date as string);
        const isOverdue = !deliverable.is_posted && due < today;

        return {
          id: `deliverable-${deliverable.id}`,
          date: deliverable.due_date as string,
          sortTime: due.getTime(),
          type: "deliverable" as const,
          title: deliverable.title,
          description: `Deliverable due ${formatDate(deliverable.due_date)}`,
          badge: deliverable.is_posted ? (
            <Badge variant="completed">Posted</Badge>
          ) : isOverdue ? (
            <Badge variant="overdue">Overdue</Badge>
          ) : (
            <Badge variant="active">Pending</Badge>
          ),
          detail: deliverable.live_url ? (
            <a href={deliverable.live_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-hover">
              Open live link
            </a>
          ) : null
        };
      }),
    ...payments.map((payment) => {
      const paymentDate = parseDateOnly(payment.payment_date);

      return {
        id: `payment-${payment.id}`,
        date: payment.payment_date,
        sortTime: paymentDate.getTime(),
        type: "payment" as const,
        title: formatCurrency(Number(payment.amount)),
        description: `Payment logged ${formatDate(payment.payment_date)}`,
        badge: <Badge variant="warning">Payment</Badge>,
        detail: payment.note ? <p className="text-sm text-text-secondary">{payment.note}</p> : null
      };
    })
  ].sort((a, b) => a.sortTime - b.sortTime || a.type.localeCompare(b.type));

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
            <SmoothForm action={updateCampaignSmooth} className="grid grid-cols-1 gap-4">
              <input type="hidden" name="id" value={campaign.id} />
              <Input name="name" defaultValue={campaign.name} required label="Campaign name" hint="Required" />
              <Input name="total_value" type="number" min="0" step="0.01" defaultValue={Number(campaign.total_value)} label="Total value ($)" hint="Cannot be negative" />
              <Input name="start_date" type="date" defaultValue={campaign.start_date ?? ""} label="Start date" />
              <Input name="end_date" type="date" defaultValue={campaign.end_date ?? ""} label="End date" hint="Must be after start date" />
              <Textarea name="notes" defaultValue={campaign.notes ?? ""} placeholder="Campaign notes..." label="Notes" />
              <div>
                <Button type="submit">Save campaign</Button>
              </div>
            </SmoothForm>
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

      <Card id="timeline" className="scroll-mt-24">
        <CardHeader
          title="Campaign timeline"
          description="Deliverable due dates and payment logs shown together for contract context."
        />
        {timelineItems.length ? (
          <div className="space-y-3">
            {timelineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-sm border border-border-subtle bg-panel-soft/45 p-4 md:grid-cols-[140px_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-text-faint">{formatDate(item.date)}</p>
                  <p className="mt-1 text-xs font-medium text-text-muted">{item.type === "payment" ? "Payment" : "Deliverable"}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                      <p className="mt-1 text-xs text-text-faint">{item.description}</p>
                    </div>
                    {item.badge}
                  </div>
                  {item.detail ? <div className="mt-2">{item.detail}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No timeline activity yet" description="Add deliverables with due dates or log payments to build campaign context." />
        )}
      </Card>

      <Card id="deliverables" className="scroll-mt-24">
        <CardHeader
          title="Deliverables"
          description={`${deliverablesRemaining} open of ${deliverables.length} total`}
          action={
            <Drawer triggerLabel="New deliverable" title="Create deliverable" description="Add a deliverable to this campaign.">
              <SmoothForm action={createDeliverableSmooth} className="grid grid-cols-1 gap-4" resetOnSuccess>
                <input type="hidden" name="campaign_id" value={campaign.id} />
                <Input name="title" required placeholder="Deliverable title" label="Title" hint="Required" />
                <Input name="due_date" type="date" label="Due date" />
                <Input name="live_url" placeholder="https://..." label="Live URL" hint="Optional" />
                <div>
                  <Button type="submit">Create deliverable</Button>
                </div>
              </SmoothForm>
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
                    <DeliverablePostedButton
                      campaignId={campaign.id}
                      deliverableId={deliverable.id}
                      isPosted={deliverable.is_posted}
                    />
                    <Drawer triggerLabel="Edit" triggerVariant="ghost" size="sm" title="Edit deliverable" description="Update title, due date, live URL, or remove this deliverable.">
                      <div className="space-y-5">
                        <SmoothForm action={updateDeliverableSmooth} className="grid grid-cols-1 gap-4">
                          <input type="hidden" name="id" value={deliverable.id} />
                          <input type="hidden" name="campaign_id" value={campaign.id} />
                          <Input name="title" required defaultValue={deliverable.title} label="Title" hint="Required" />
                          <Input name="due_date" type="date" defaultValue={deliverable.due_date ?? ""} label="Due date" />
                          <Input name="live_url" defaultValue={deliverable.live_url ?? ""} placeholder="https://..." label="Live URL" />
                          <div>
                            <Button type="submit">Save deliverable</Button>
                          </div>
                        </SmoothForm>

                        <div className="border-t border-border-subtle pt-4">
                          <p className="mb-3 text-xs text-text-muted">Remove this deliverable from the campaign.</p>
                          <ConfirmDialog
                            triggerLabel="Delete"
                            title="Delete deliverable?"
                            description="This will permanently remove this deliverable from the campaign."
                          >
                            <SmoothForm action={deleteDeliverableSmooth}>
                              <input type="hidden" name="id" value={deliverable.id} />
                              <input type="hidden" name="campaign_id" value={campaign.id} />
                              <Button type="submit" variant="destructive" size="sm">
                                Delete deliverable
                              </Button>
                            </SmoothForm>
                          </ConfirmDialog>
                        </div>
                      </div>
                    </Drawer>
                  </div>
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
              <SmoothForm action={createPaymentSmooth} className="grid grid-cols-1 gap-4" resetOnSuccess>
                <input type="hidden" name="campaign_id" value={campaign.id} />
                <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                <Input name="amount" required type="number" min="0" step="0.01" placeholder="0.00" label="Amount ($)" hint="Cannot be negative" />
                <Input name="payment_date" type="date" label="Date" />
                <Input name="note" placeholder="Deposit, final payment, payment for Reel 1, bonus..." label="Note" />
                <div>
                  <Button type="submit">Log payment</Button>
                </div>
              </SmoothForm>
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
                    <Drawer triggerLabel="Edit" triggerVariant="ghost" size="sm" title="Edit payment" description="Update amount, date, note, or remove this payment log.">
                      <div className="space-y-5">
                        <SmoothForm action={updatePaymentSmooth} className="grid grid-cols-1 gap-4">
                          <input type="hidden" name="id" value={payment.id} />
                          <input type="hidden" name="campaign_id" value={campaign.id} />
                          <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                          <Input name="amount" required type="number" min="0" step="0.01" defaultValue={Number(payment.amount)} label="Amount" hint="Cannot be negative" />
                          <Input name="payment_date" type="date" defaultValue={payment.payment_date} label="Date" />
                          <Input name="note" defaultValue={payment.note ?? ""} placeholder="Deposit, final payment, payment for Reel 1, bonus..." label="Note" />
                          <div>
                            <Button type="submit">Save payment</Button>
                          </div>
                        </SmoothForm>

                        <div className="border-t border-border-subtle pt-4">
                          <p className="mb-3 text-xs text-text-muted">Remove this payment log and recalculate the remaining balance.</p>
                          <ConfirmDialog
                            triggerLabel="Delete"
                            title="Delete payment?"
                            description="This will permanently remove this payment log and update the remaining balance."
                          >
                            <SmoothForm action={deletePaymentSmooth}>
                              <input type="hidden" name="id" value={payment.id} />
                              <input type="hidden" name="campaign_id" value={campaign.id} />
                              <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                              <Button type="submit" variant="destructive" size="sm">
                                Delete payment
                              </Button>
                            </SmoothForm>
                          </ConfirmDialog>
                        </div>
                      </div>
                    </Drawer>
                  </div>
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
        <ConfirmDialog
          triggerLabel="Delete campaign"
          title="Delete campaign?"
          description="This will permanently delete this campaign and all related deliverables and payments."
        >
          <form action={deleteCampaign}>
            <input type="hidden" name="id" value={campaign.id} />
            <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
            <Button type="submit" variant="destructive" size="sm">
              Delete campaign
            </Button>
          </form>
        </ConfirmDialog>
      </Card>

      <Card>
        <CardHeader title="Quick navigation" />
        <div className="flex flex-wrap gap-2">
          <a href="#deliverables">
            <Button variant="ghost" size="sm">Deliverables</Button>
          </a>
          <a href="#timeline">
            <Button variant="ghost" size="sm">Timeline</Button>
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
