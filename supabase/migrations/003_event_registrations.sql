-- Event registrations (e.g. sydkyk.ai/compliance-workshop) in the same leads table.
-- Run once in the Supabase SQL editor, after 002_unified_leads.sql.
--
-- Rows use source = 'event' and source_campaign = the event's id (e.g. 'compliance-workshop-2026-11-12'),
-- so the same person can register for several events and still have a website or demo lead.

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check check (source in ('experience', 'website', 'event'));

-- An event registration must name its event.
alter table public.leads drop constraint if exists leads_event_campaign_check;
alter table public.leads
  add constraint leads_event_campaign_check check (source <> 'event' or source_campaign is not null);

-- One row per person per source per campaign. Existing rows have no campaign, so nothing changes for them.
drop index if exists public.leads_email_source_unique;
create unique index if not exists leads_email_source_campaign_unique
  on public.leads (email_normalized, source, coalesce(source_campaign, ''));
create index if not exists leads_campaign_created_idx on public.leads (source_campaign, created_at desc)
  where source_campaign is not null;
