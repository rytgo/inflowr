import Link from "next/link";

import { createInfluencer } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableTh } from "@/components/ui/table";
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

  const platformBreakdown = influencers.reduce<Record<string, number>>((acc, item) => {
    acc[item.platform] = (acc[item.platform] ?? 0) + 1;
    return acc;
  }, {});

  const topPlatform = Object.entries(platformBreakdown).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Influencers"
        description="Operate your creator roster with clean records and campaign links."
        action={
          <Drawer triggerLabel="New influencer" title="Create influencer" description="Add a creator to your private workspace.">
            <form action={createInfluencer} className="grid grid-cols-1 gap-4">
              <Input name="name" required placeholder="Influencer name" label="Name" hint="Required" />
              <Input name="platform" required placeholder="Instagram, TikTok..." label="Platform" hint="Required" />
              <Input name="profile_url" placeholder="https://..." label="Profile URL" hint="Optional, must start with https://" />
              <Textarea name="notes" placeholder="Any notes about this influencer..." label="Notes" hint="Optional" />
              <div>
                <Button type="submit">Create influencer</Button>
              </div>
            </form>
          </Drawer>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="page-enter stagger-1"><StatCard label="Total influencers" value={String(influencers.length)} /></div>
        <div className="page-enter stagger-2"><StatCard label="Platforms tracked" value={String(Object.keys(platformBreakdown).length)} /></div>
        <div className="page-enter stagger-3"><StatCard label="Top platform" value={topPlatform ? `${topPlatform[0]} (${topPlatform[1]})` : "--"} /></div>
      </section>

      <Card>
        <CardHeader title="Directory" description="Open any influencer to view campaigns, balances, and timeline context." />

        {influencers.length ? (
          <Table>
            <TableHead>
              <TableTh>Name</TableTh>
              <TableTh>Platform</TableTh>
              <TableTh>Profile</TableTh>
              <TableTh className="text-right">Actions</TableTh>
            </TableHead>
            <TableBody>
              {influencers.map((influencer) => (
                <TableRow key={influencer.id}>
                  <TableCell className="font-medium text-text-primary">{influencer.name}</TableCell>
                  <TableCell>{influencer.platform}</TableCell>
                  <TableCell>
                    {influencer.profile_url ? (
                      <a href={influencer.profile_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover">
                        Open profile
                      </a>
                    ) : (
                      <span className="text-text-faint">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/influencers/${influencer.id}`}>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No influencers yet" description="Create your first influencer to start campaign operations." />
        )}
      </Card>
    </div>
  );
}
