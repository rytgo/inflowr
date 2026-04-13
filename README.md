# Inflowr

Inflowr is a private campaign operations dashboard for influencer / UGC managers.

Core rule: one authenticated user has one private workspace. No orgs, no teams, no shared workspaces.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS

## Implemented Foundation
- Email/password auth pages (`/login`, `/signup`)
- Protected app structure with authenticated layout
- Base app shell + navigation (`/dashboard`, `/influencers`, `/calendar`)
- Supabase schema for `influencers`, `campaigns`, `deliverables`, `payments`
- Row-level security policies for strict per-user ownership
- Influencer CRUD (list, create, edit, delete)
- Campaign CRUD (create from influencer page, edit/delete on campaign page)
- Deliverables CRUD on campaign detail (create, edit, mark posted, delete)
- Payments CRUD on campaign detail (log, edit, delete)
- Dashboard table wired to real campaign data with derived status and balances
- Calendar page connected to deliverable due dates (overdue, upcoming, completed)
- Dashboard filters/search/sort (query, status, due soon, outstanding, ordering)
- Business-logic hardening pass (date-only consistency, mutation validation, revalidation consistency)

## Local Setup
1. Install deps:
```bash
npm install
```
2. Keep `.env.local` populated with:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
```
3. Apply database schema in Supabase SQL editor:
- Run `supabase/schema.sql`
4. Start app:
```bash
npm run dev
```

## Next MVP Steps
1. Future UI revamp (non-blocking, logic layer is already modular)
