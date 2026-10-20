-- One table for every lead: demo sign-ups (/experience) and website demo requests (sydkyk.ai).
-- Run once in the Supabase SQL editor, after 001_leads.sql.

-- Where the lead came from.
alter table public.leads
  add column if not exists source text not null default 'experience'
  check (source in ('experience', 'website'));

-- Website demo requests carry a human-readable reference (DEMO-XXXXXXXXXXXX), a fingerprint of the
-- submitted fields (so a retried submission can't silently change), and when the sales email went out.
alter table public.leads add column if not exists reference text unique;
alter table public.leads add column if not exists fingerprint text;
alter table public.leads add column if not exists notified_at timestamptz;

-- One row per person per source: a website request and a demo sign-up from the same email are both kept.
drop index if exists public.leads_email_unique;
create unique index if not exists leads_email_source_unique on public.leads (email_normalized, source);
create index if not exists leads_source_created_idx on public.leads (source, created_at desc);

-- Website requests follow the website privacy notice: the owner manages retention, so they have no
-- automatic expiry. Demo sign-ups keep their 90-day expiry. The nightly purge skips NULL expiries.
alter table public.leads alter column expires_at drop not null;
