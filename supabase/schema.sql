create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  platform text not null,
  profile_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  name text not null,
  total_value numeric(12, 2) not null default 0,
  notes text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  due_date date,
  is_posted boolean not null default false,
  posted_at timestamptz,
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.influencers alter column user_id set default auth.uid();
alter table public.campaigns alter column user_id set default auth.uid();
alter table public.deliverables alter column user_id set default auth.uid();
alter table public.payments alter column user_id set default auth.uid();

create index if not exists idx_influencers_user_id on public.influencers (user_id);
create index if not exists idx_campaigns_user_id on public.campaigns (user_id);
create index if not exists idx_campaigns_influencer_id on public.campaigns (influencer_id);
create index if not exists idx_deliverables_user_id on public.deliverables (user_id);
create index if not exists idx_deliverables_campaign_id on public.deliverables (campaign_id);
create index if not exists idx_deliverables_due_date on public.deliverables (due_date);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_payments_campaign_id on public.payments (campaign_id);

drop trigger if exists set_influencers_updated_at on public.influencers;
create trigger set_influencers_updated_at
before update on public.influencers
for each row execute function public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_deliverables_updated_at on public.deliverables;
create trigger set_deliverables_updated_at
before update on public.deliverables
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.influencers enable row level security;
alter table public.campaigns enable row level security;
alter table public.deliverables enable row level security;
alter table public.payments enable row level security;

drop policy if exists "influencers_select_own" on public.influencers;
create policy "influencers_select_own" on public.influencers
for select using (auth.uid() = user_id);

drop policy if exists "influencers_insert_own" on public.influencers;
create policy "influencers_insert_own" on public.influencers
for insert with check (auth.uid() = user_id);

drop policy if exists "influencers_update_own" on public.influencers;
create policy "influencers_update_own" on public.influencers
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "influencers_delete_own" on public.influencers;
create policy "influencers_delete_own" on public.influencers
for delete using (auth.uid() = user_id);

drop policy if exists "campaigns_select_own" on public.campaigns;
create policy "campaigns_select_own" on public.campaigns
for select using (auth.uid() = user_id);

drop policy if exists "campaigns_insert_own" on public.campaigns;
create policy "campaigns_insert_own" on public.campaigns
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.influencers i
    where i.id = influencer_id and i.user_id = auth.uid()
  )
);

drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own" on public.campaigns
for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.influencers i
    where i.id = influencer_id and i.user_id = auth.uid()
  )
);

drop policy if exists "campaigns_delete_own" on public.campaigns;
create policy "campaigns_delete_own" on public.campaigns
for delete using (auth.uid() = user_id);

drop policy if exists "deliverables_select_own" on public.deliverables;
create policy "deliverables_select_own" on public.deliverables
for select using (auth.uid() = user_id);

drop policy if exists "deliverables_insert_own" on public.deliverables;
create policy "deliverables_insert_own" on public.deliverables
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.user_id = auth.uid()
  )
);

drop policy if exists "deliverables_update_own" on public.deliverables;
create policy "deliverables_update_own" on public.deliverables
for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.user_id = auth.uid()
  )
);

drop policy if exists "deliverables_delete_own" on public.deliverables;
create policy "deliverables_delete_own" on public.deliverables
for delete using (auth.uid() = user_id);

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
for select using (auth.uid() = user_id);

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.user_id = auth.uid()
  )
);

drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own" on public.payments
for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.user_id = auth.uid()
  )
);

drop policy if exists "payments_delete_own" on public.payments;
create policy "payments_delete_own" on public.payments
for delete using (auth.uid() = user_id);
