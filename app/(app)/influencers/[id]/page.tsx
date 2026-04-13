import Link from "next/link";
import { notFound } from "next/navigation";

import { createCampaign, deleteInfluencer, updateInfluencer } from "@/app/(app)/actions";
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

  return (
    <div className="space-y-6">
      <Link href="/influencers" className="text-sm text-[var(--primary)]">
        Back to influencers
      </Link>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-2xl font-semibold">Influencer details</h1>
        <form action={updateInfluencer} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={influencer.id} />
          <input
            name="name"
            defaultValue={influencer.name}
            required
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="platform"
            defaultValue={influencer.platform}
            required
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="profile_url"
            defaultValue={influencer.profile_url ?? ""}
            placeholder="Profile URL"
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <textarea
            name="notes"
            defaultValue={influencer.notes ?? ""}
            placeholder="Notes"
            className="min-h-24 rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Save changes
            </button>
          </div>
        </form>

        <form action={deleteInfluencer} className="mt-3">
          <input type="hidden" name="id" value={influencer.id} />
          <button type="submit" className="text-sm text-red-600">
            Delete influencer (removes linked campaigns)
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Create campaign</h2>
        <form action={createCampaign} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="influencer_id" value={influencer.id} />
          <input
            name="name"
            required
            placeholder="Campaign name"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="total_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            placeholder="Total value"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="start_date"
            type="date"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input name="end_date" type="date" className="rounded-md border border-[var(--border)] px-3 py-2" />
          <textarea
            name="notes"
            placeholder="Campaign notes"
            className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Add campaign
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Campaigns</h2>
        {campaigns.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2 font-medium">Campaign</th>
                  <th className="py-2 font-medium">Value</th>
                  <th className="py-2 font-medium">Paid</th>
                  <th className="py-2 font-medium">Remaining</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const paid = paidByCampaign.get(campaign.id) ?? 0;
                  const remaining = Number(campaign.total_value) - paid;
                  return (
                    <tr key={campaign.id} className="border-b border-[var(--border)]">
                      <td className="py-3">{campaign.name}</td>
                      <td className="py-3">{formatCurrency(Number(campaign.total_value))}</td>
                      <td className="py-3">{formatCurrency(paid)}</td>
                      <td className="py-3">{formatCurrency(remaining)}</td>
                      <td className="py-3">
                        <Link href={`/campaigns/${campaign.id}`} className="text-[var(--primary)]">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">No campaigns yet for this influencer.</p>
        )}
      </section>
    </div>
  );
}
