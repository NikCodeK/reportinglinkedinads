-- Supabase schema for LinkedIn Ads Dashboard MVP
-- Run these statements in Supabase SQL editor or through migrations

create extension if not exists "uuid-ossp";

create table if not exists fact_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  campaign_id text not null,
  creative_id text,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  cost numeric(12,2) not null default 0,
  leads bigint not null default 0,
  ctr numeric(9,6) not null default 0,
  cpc numeric(12,4) not null default 0,
  cpm numeric(12,4) not null default 0,
  cvr numeric(9,6) not null default 0,
  cpl numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creative_key text generated always as (coalesce(creative_id, '')) stored,
  unique (date, campaign_id, creative_key)
);

create table if not exists weekly_briefings (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  insights jsonb not null default '[]'::jsonb,
  kpi_comparisons jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  raw_payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_start)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('budget_change', 'bid_change', 'creative_rotation', 'note')) not null,
  campaign_id text,
  description text not null,
  value numeric(12,2),
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists fact_daily_date_idx on fact_daily(date desc);
create index if not exists fact_daily_campaign_idx on fact_daily(campaign_id);
create index if not exists weekly_briefings_status_idx on weekly_briefings(status);
