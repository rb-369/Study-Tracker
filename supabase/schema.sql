-- StudyFlow Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  target_daily_minutes integer default 180,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'StudyFlow Learner'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Subjects Table
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#10b981' not null,
  icon text default 'BookOpen' not null,
  target_weekly_hours integer default 5 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Subjects
alter table public.subjects enable row level security;

create policy "Users can manage own subjects"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Study Sessions Table
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  topic text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  gross_duration_seconds integer default 0 not null,
  net_focus_seconds integer default 0 not null,
  status text check (status in ('active', 'completed', 'abandoned')) default 'active' not null,
  session_type text check (session_type in ('stopwatch', 'pomodoro')) default 'stopwatch' not null,
  session_notes text,
  focus_score integer default 0,
  ai_debrief jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Study Sessions
alter table public.study_sessions enable row level security;

create policy "Users can manage own study sessions"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Thoughts ("Mind Pings") Table
create table if not exists public.thoughts (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.study_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text check (category in ('phone_social', 'hunger_snack', 'random_idea', 'anxiety_stress', 'urgent_chore', 'other')) default 'random_idea' not null,
  approx_duration_minutes real default 2.0 not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Thoughts
alter table public.thoughts enable row level security;

create policy "Users can manage own thoughts"
  on public.thoughts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for lightning fast analytics
create index if not exists idx_sessions_user_time on public.study_sessions(user_id, start_time desc);
create index if not exists idx_thoughts_session on public.thoughts(session_id);
create index if not exists idx_thoughts_user on public.thoughts(user_id);
create index if not exists idx_subjects_user on public.subjects(user_id);
