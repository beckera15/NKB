-- Becknology OS Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- ENTRIES TABLE
-- ============================================
create table entries (
  id uuid primary key default gen_random_uuid(),
  type text,
  title text,
  content text,
  project text,
  priority text default 'medium',
  status text default 'inbox',
  file_url text,
  file_type text,
  keywords text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- GOALS TABLE
-- ============================================
create table goals (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  project text,
  timeframe text,
  due_date date,
  progress integer default 0,
  status text default 'active',
  created_at timestamptz default now()
);

-- ============================================
-- INSIGHTS TABLE
-- ============================================
create table insights (
  id uuid primary key default gen_random_uuid(),
  type text,
  title text,
  description text,
  source_entries uuid[],
  created_at timestamptz default now()
);

-- ============================================
-- WEEKLY REPORTS TABLE
-- ============================================
create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date,
  summary text,
  metrics jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table entries enable row level security;
alter table goals enable row level security;
alter table insights enable row level security;
alter table weekly_reports enable row level security;

-- Allow all operations for now
create policy "Allow all" on entries for all using (true) with check (true);
create policy "Allow all" on goals for all using (true) with check (true);
create policy "Allow all" on insights for all using (true) with check (true);
create policy "Allow all" on weekly_reports for all using (true) with check (true);
