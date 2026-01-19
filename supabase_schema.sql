-- 1. Create the tasks table
-- Matches the local SQLite AppSchema
create table public.tasks (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  
  title text,
  type text,
  content text,
  
  -- Timestamps stored as BigInt (Unix Epoch milliseconds) to match local schema
  due_date bigint,
  created_at bigint,
  updated_at bigint,
  completed_at bigint,
  
  -- Booleans stored as 0/1 Integers to match local schema
  completed integer default 0,
  is_recurring_instance integer default 0,
  
  order_key bigint,
  
  recurrence text,
  recurring_parent_id text
);

-- 2. Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 3. Create Security Policies (User Isolation)
-- Only allow users to access their own data
create policy "Users can select their own tasks"
  on public.tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tasks"
  on public.tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using ( auth.uid() = user_id );

-- 4. Create Publication for PowerSync
-- This tells Supabase to send realtime updates for this table
drop publication if exists powersync;
create publication powersync for table public.tasks;

-- 5. Add Indexes for Performance
-- These match the local SQLite indexes to ensure consistent performance
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_completed_at_idx on public.tasks(completed_at);
create index if not exists tasks_completed_idx on public.tasks(completed);
