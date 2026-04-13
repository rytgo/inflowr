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
import { deriveCampaignStatus, formatCurrency, getNextScheduledDate } from "@/lib/campaign-logic";
import { createClient } from "@/lib/supabase/server";

type CampaignDetailPageProps = {
  params: {
    id: string;
  };
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

  return (
    <div className="space-y-6">
      <Link href={`/influencers/${campaign.influencer_id}`} className="text-sm text-[var(--primary)]">
        Back to influencer
      </Link>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-2xl font-semibold">Campaign details</h1>

        <form action={updateCampaign} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={campaign.id} />
          <input
            name="name"
            defaultValue={campaign.name}
            required
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <input
            name="total_value"
            type="number"
            min="0"
            step="0.01"
            defaultValue={Number(campaign.total_value)}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="start_date"
            type="date"
            defaultValue={campaign.start_date ?? ""}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="end_date"
            type="date"
            defaultValue={campaign.end_date ?? ""}
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <textarea
            name="notes"
            defaultValue={campaign.notes ?? ""}
            className="min-h-24 rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
            placeholder="Campaign notes"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Save campaign
          </button>
        </form>

        <form action={deleteCampaign} className="mt-3">
          <input type="hidden" name="id" value={campaign.id} />
          <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
          <button type="submit" className="text-sm text-red-600">
            Delete campaign
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Status</p>
          <p className="mt-1 text-xl font-semibold">{status}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Deliverables remaining</p>
          <p className="mt-1 text-xl font-semibold">{deliverablesRemaining}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Total paid</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalPaid)}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Remaining balance</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(remaining)}</p>
        </article>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Deliverables</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Next scheduled posting date: {nextDate ?? "-"}
        </p>

        <form action={createDeliverable} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <input
            name="title"
            required
            placeholder="Deliverable title"
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <input name="due_date" type="date" className="rounded-md border border-[var(--border)] px-3 py-2" />
          <input
            name="live_url"
            placeholder="Live URL (optional)"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Add deliverable
          </button>
        </form>

        {deliverables.length ? (
          <div className="mt-5 space-y-3">
            {deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <form action={updateDeliverable} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <input type="hidden" name="id" value={deliverable.id} />
                  <input type="hidden" name="campaign_id" value={campaign.id} />
                  <input
                    name="title"
                    required
                    defaultValue={deliverable.title}
                    className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
                  />
                  <input
                    name="due_date"
                    type="date"
                    defaultValue={deliverable.due_date ?? ""}
                    className="rounded-md border border-[var(--border)] px-3 py-2"
                  />
                  <input
                    name="live_url"
                    defaultValue={deliverable.live_url ?? ""}
                    placeholder="Live URL"
                    className="rounded-md border border-[var(--border)] px-3 py-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <input
                      type="checkbox"
                      name="is_posted"
                      defaultChecked={deliverable.is_posted}
                    />
                    Mark as posted
                  </label>
                  <div className="flex items-center gap-3 md:col-span-5">
                    <button
                      type="submit"
                      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
                    >
                      Save deliverable
                    </button>
                    <span className="text-xs text-[var(--muted)]">
                      {deliverable.is_posted
                        ? `Posted ${deliverable.posted_at ? `(${deliverable.posted_at.slice(0, 10)})` : ""}`
                        : "Not posted"}
                    </span>
                  </div>
                </form>

                <form action={deleteDeliverable} className="mt-2">
                  <input type="hidden" name="id" value={deliverable.id} />
                  <input type="hidden" name="campaign_id" value={campaign.id} />
                  <button type="submit" className="text-sm text-red-600">
                    Delete deliverable
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">No deliverables yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Payments</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Log payments to keep total paid and remaining balance accurate.
        </p>

        <form action={createPayment} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
          <input
            name="amount"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="payment_date"
            type="date"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="note"
            placeholder="Payment note (optional)"
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Log payment
          </button>
        </form>

        {payments.length ? (
          <div className="mt-5 space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
                <form action={updatePayment} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input type="hidden" name="id" value={payment.id} />
                  <input type="hidden" name="campaign_id" value={campaign.id} />
                  <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                  <input
                    name="amount"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={Number(payment.amount)}
                    className="rounded-md border border-[var(--border)] px-3 py-2"
                  />
                  <input
                    name="payment_date"
                    type="date"
                    defaultValue={payment.payment_date}
                    className="rounded-md border border-[var(--border)] px-3 py-2"
                  />
                  <input
                    name="note"
                    defaultValue={payment.note ?? ""}
                    placeholder="Payment note"
                    className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
                  />
                  <div className="flex items-center gap-3 md:col-span-4">
                    <button
                      type="submit"
                      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
                    >
                      Save payment
                    </button>
                    <span className="text-xs text-[var(--muted)]">
                      Logged: {payment.payment_date} - {formatCurrency(Number(payment.amount))}
                    </span>
                  </div>
                </form>

                <form action={deletePayment} className="mt-2">
                  <input type="hidden" name="id" value={payment.id} />
                  <input type="hidden" name="campaign_id" value={campaign.id} />
                  <input type="hidden" name="influencer_id" value={campaign.influencer_id} />
                  <button type="submit" className="text-sm text-red-600">
                    Delete payment
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">No payments logged yet.</p>
        )}
      </section>
    </div>
  );
}
