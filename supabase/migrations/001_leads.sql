-- SYDKYK demo: lead capture, admin allowlist and rate limiting.
-- Run once in the Supabase SQL editor (untick "enable RLS" if the editor offers it; this script enables RLS itself).
--
-- Access model: the browser never talks to these tables. Only the Next.js server, using the
-- secret key, reads or writes them. RLS is on with no policies, so the publishable key sees nothing.

create extension if not exists pgcrypto;

-- Leads ---------------------------------------------------------------------------------------
create table if not exists public.leads (
  lead_id             uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  last_seen_at        timestamptz not null default now(),
  full_name           text not null check (char_length(full_name) between 2 and 100),
  email_normalized    text not null check (char_length(email_normalized) between 3 and 254),
  company_name        text not null check (char_length(company_name) between 2 and 150),
  employee_count_band text not null check (employee_count_band in
                        ('1-49', '50-199', '200-999', '1000-3999', '4000-9999', '10000+')),
  phone_optional      text check (phone_optional is null or char_length(phone_optional) <= 20),
  role_optional       text check (role_optional is null or char_length(role_optional) <= 100),
  interest_categories text[] not null default '{}',
  notice_version      text not null,
  marketing_opt_in    boolean not null default false,
  source_campaign     text check (source_campaign is null or char_length(source_campaign) <= 64),
  idempotency_key     uuid not null unique,
  expires_at          timestamptz not null default now() + interval '90 days'
);

-- One row per person: a repeat sign-up refreshes last_seen_at instead of duplicating.
create unique index if not exists leads_email_unique on public.leads (email_normalized);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

-- Admin allowlist (who may open /admin/leads) --------------------------------------------------
create table if not exists public.lead_admins (
  email      text primary key check (email = lower(email)),
  added_at   timestamptz not null default now()
);
alter table public.lead_admins enable row level security;
revoke all on public.lead_admins from anon, authenticated;

-- Add your admins here (lowercase), then run this statement:
-- insert into public.lead_admins (email) values ('you@yourcompany.com'), ('sales@yourcompany.com');

-- Rate limiting (sign-up and AI questions) ------------------------------------------------------
-- Keys are salted hashes built on the server; no raw IP addresses are stored.
create table if not exists public.rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (bucket, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomically counts a hit and returns true while the bucket is under its limit.
create or replace function public.hit_rate_limit(p_bucket text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  return n <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;

-- Retention -----------------------------------------------------------------------------------
-- Deletes leads 90 days after their last visit, and old rate-limit rows, every night (03:00 UTC).
create or replace function public.purge_expired_demo_data()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.leads where expires_at < now();
  delete from public.rate_limits where window_start < now() - interval '2 days';
$$;
revoke all on function public.purge_expired_demo_data() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-expired-demo-data', '0 3 * * *', $$select public.purge_expired_demo_data()$$);
