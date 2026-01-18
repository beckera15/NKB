-- Becknology OS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENTRIES TABLE
-- ============================================
create table entries (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  content text,
  project text,
  priority text default 'medium',
  status text default 'active',
  file_url text,
  file_type text,
  keywords text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for entries
create index entries_type_idx on entries(type);
create index entries_project_idx on entries(project);
create index entries_status_idx on entries(status);
create index entries_created_at_idx on entries(created_at desc);
create index entries_keywords_idx on entries using gin(keywords);

-- ============================================
-- GOALS TABLE
-- ============================================
create table goals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  project text,
  timeframe text,
  due_date date,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  status text default 'active',
  created_at timestamptz default now()
);

-- Indexes for goals
create index goals_project_idx on goals(project);
create index goals_status_idx on goals(status);
create index goals_due_date_idx on goals(due_date);

-- ============================================
-- INSIGHTS TABLE
-- ============================================
create table insights (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  description text,
  source_entries uuid[] default '{}',
  created_at timestamptz default now()
);

-- Indexes for insights
create index insights_type_idx on insights(type);
create index insights_created_at_idx on insights(created_at desc);

-- ============================================
-- WEEKLY REPORTS TABLE
-- ============================================
create table weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null unique,
  summary text,
  metrics jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for weekly_reports
create index weekly_reports_week_start_idx on weekly_reports(week_start desc);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table entries enable row level security;
alter table goals enable row level security;
alter table insights enable row level security;
alter table weekly_reports enable row level security;

-- Policies (allow all for authenticated users)
create policy "Enable all for authenticated users" on entries
  for all using (auth.role() = 'authenticated');

create policy "Enable all for authenticated users" on goals
  for all using (auth.role() = 'authenticated');

create policy "Enable all for authenticated users" on insights
  for all using (auth.role() = 'authenticated');

create policy "Enable all for authenticated users" on weekly_reports
  for all using (auth.role() = 'authenticated');

-- Policies (allow all for anon during development - remove in production)
create policy "Enable all for anon" on entries
  for all using (true);

create policy "Enable all for anon" on goals
  for all using (true);

create policy "Enable all for anon" on insights
  for all using (true);

create policy "Enable all for anon" on weekly_reports
  for all using (true);
