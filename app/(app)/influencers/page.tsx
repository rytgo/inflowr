import Link from "next/link";

import { createInfluencer } from "@/app/(app)/actions";
import { createClient } from "@/lib/supabase/server";

export default async function InfluencersPage() {
  const supabase = createClient();
  const { data: influencersRaw } = await supabase
    .from("influencers")
    .select("id, name, platform, profile_url, created_at")
    .order("created_at", { ascending: false });

  const influencers = (influencersRaw ?? []) as Array<{
    id: string;
    name: string;
    platform: string;
    profile_url: string | null;
    created_at: string;
  }>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-2xl font-semibold">Influencers</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add and manage influencers in your private workspace.
        </p>

        <form action={createInfluencer} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Influencer name"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="platform"
            required
            placeholder="Platform (Instagram, TikTok...)"
            className="rounded-md border border-[var(--border)] px-3 py-2"
          />
          <input
            name="profile_url"
            placeholder="Profile URL (optional)"
            className="rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            className="min-h-24 rounded-md border border-[var(--border)] px-3 py-2 md:col-span-2"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Add influencer
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Your influencers</h2>
        {influencers.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Platform</th>
                  <th className="py-2 font-medium">Profile</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((influencer) => (
                  <tr key={influencer.id} className="border-b border-[var(--border)]">
                    <td className="py-3">{influencer.name}</td>
                    <td className="py-3">{influencer.platform}</td>
                    <td className="py-3">
                      {influencer.profile_url ? (
                        <a
                          href={influencer.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--primary)]"
                        >
                          Open profile
                        </a>
                      ) : (
                        <span className="text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Link className="text-[var(--primary)]" href={`/influencers/${influencer.id}`}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">No influencers yet.</p>
        )}
      </section>
    </div>
  );
}
