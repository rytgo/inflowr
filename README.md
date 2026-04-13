# Inflowr

Inflowr is a private campaign operations dashboard for influencer / UGC managers.

It is built for solo operators who need one place to manage creators, campaign deliverables, payment tracking, and posting deadlines without spreadsheets.

## Purpose
- Replace fragmented campaign tracking workflows
- Make deadlines and status easy to scan
- Keep payment visibility clear with automatic remaining balance logic
- Keep each user’s workspace private and isolated

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- Supabase

## MVP Scope
- Authentication (Supabase Auth)
- Dashboard overview
- Influencer and campaign management
- Deliverables tracking
- Payment logging
- Calendar view for deadlines

## Product Rules
- No organizations
- No teams
- No shared workspaces
- Each user only sees their own data (`user_id` ownership + RLS)
