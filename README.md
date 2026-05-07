# Inflowr

Inflowr is a private campaign operations dashboard for influencer and UGC managers.

One authenticated user has one private workspace. The project currently has no orgs, no teams, no shared workspaces.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Vercel hosting

## Current App
- Public landing page at `/`
- Email/password auth pages (`/login`, `/signup`)
- Supabase session refresh middleware and protected app layout
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
- Smooth drawer forms, confirm dialogs, flash messages, and optimistic posted-state updates
- Shared business logic for campaign status, next due date, date-only handling, and currency formatting

## Key Routes
- `/` - landing page
- `/login` - sign in
- `/signup` - account creation
- `/dashboard` - campaign operations overview
- `/influencers` - influencer directory
- `/influencers/[id]` - influencer profile and linked campaigns
- `/campaigns/[id]` - campaign detail, deliverables, payments, timeline
- `/calendar` - deliverable deadline calendar

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

## Deployment
The project is hosted on Vercel. The Vercel project should use the same Supabase environment variables:

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
```
