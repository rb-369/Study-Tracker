-- Migration 002: Social Hub, Safety & Moderation, Study Buddy, Break Games & XP Engine
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- SECTION 1: EXTEND PROFILES TABLE
-- ============================================================================
alter table public.profiles 
  add column if not exists handle text unique,
  add column if not exists bio text,
  add column if not exists timezone text default 'UTC',
  add column if not exists level integer default 1,
  add column if not exists xp integer default 0,
  add column if not exists privacy_mode text check (privacy_mode in ('friends_only', 'public', 'ghost')) default 'friends_only',
  add column if not exists age_verified boolean default false,
  add column if not exists active_subject_topic text,
  add column if not exists is_studying boolean default false;

-- ============================================================================
-- SECTION 2: CREATE ALL TABLES FIRST (Resolves Table Dependency Ordering)
-- ============================================================================

-- 1. Friend Requests
create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (sender_id, receiver_id)
);

-- 2. Friendships
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, friend_id)
);

-- 3. User Blocks
create table if not exists public.user_blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (blocker_id, blocked_id)
);

-- 4. Moderation Reports
create table if not exists public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_user_id uuid references public.profiles(id) on delete cascade not null,
  message_id uuid,
  reason text not null,
  details text,
  status text check (status in ('pending', 'quarantined', 'dismissed', 'actioned')) default 'pending' not null,
  is_verified_reporter boolean default false,
  appeal_status text check (appeal_status in ('none', 'requested', 'reviewed')) default 'none',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Study-Buddy 1-on-1 Sessions
create table if not exists public.buddy_sessions (
  id uuid default gen_random_uuid() primary key,
  initiator_id uuid references public.profiles(id) on delete cascade not null,
  buddy_id uuid references public.profiles(id) on delete cascade not null,
  subject_name text not null,
  topic text not null,
  duration_minutes integer default 25 not null,
  status text check (status in ('inviting', 'active', 'completed', 'declined', 'cancelled')) default 'inviting' not null,
  start_time timestamp with time zone,
  initiator_pings integer default 0,
  buddy_pings integer default 0,
  high_fives integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Study Groups
create table if not exists public.study_groups (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  invite_code text unique not null,
  is_public boolean default false not null,
  chat_mode text check (chat_mode in ('open', 'reactions_only')) default 'open' not null,
  color text default '#10b981' not null,
  icon text default 'Users' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Group Members
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.study_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (group_id, user_id)
);

-- 8. Group Messages
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.study_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  message_type text check (message_type in ('text', 'reaction', 'system')) default 'text' not null,
  is_flagged boolean default false not null,
  report_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Group Challenges
create table if not exists public.group_challenges (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.study_groups(id) on delete cascade not null,
  title text not null,
  description text,
  target_hours real default 50.0 not null,
  current_hours real default 0.0 not null,
  start_date date not null,
  end_date date not null,
  status text check (status in ('active', 'completed', 'expired')) default 'active' not null,
  reward_xp integer default 100 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Break Game Scores
create table if not exists public.break_game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_type text check (game_type in ('zen_breathwork', 'memory_matrix', 'stroop_clash', 'speed_math')) not null,
  score integer default 0 not null,
  accuracy real default 1.0 not null,
  duration_seconds integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. User XP Logs
create table if not exists public.user_xp_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  source text not null,
  local_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY & POLICIES
-- ============================================================================

-- Profiles Policy
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Authenticated users can view public profile info" on public.profiles;
create policy "Authenticated users can view public profile info" 
  on public.profiles for select 
  using (auth.uid() is not null);

-- Friend Requests Policies
alter table public.friend_requests enable row level security;

drop policy if exists "Users can view incoming and outgoing friend requests" on public.friend_requests;
create policy "Users can view incoming and outgoing friend requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Users can update received friend requests" on public.friend_requests;
create policy "Users can update received friend requests"
  on public.friend_requests for update
  using (auth.uid() = receiver_id or auth.uid() = sender_id);

-- Friendships Policies
alter table public.friendships enable row level security;

drop policy if exists "Users can view own friendships" on public.friendships;
create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can manage friendships" on public.friendships;
create policy "Users can manage friendships"
  on public.friendships for all
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- User Blocks Policies
alter table public.user_blocks enable row level security;

drop policy if exists "Users can view and manage their own blocks" on public.user_blocks;
create policy "Users can view and manage their own blocks"
  on public.user_blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- Moderation Reports Policies
alter table public.moderation_reports enable row level security;

drop policy if exists "Users can insert reports" on public.moderation_reports;
create policy "Users can insert reports"
  on public.moderation_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can view own filed reports" on public.moderation_reports;
create policy "Users can view own filed reports"
  on public.moderation_reports for select
  using (auth.uid() = reporter_id);

-- Buddy Sessions Policies
alter table public.buddy_sessions enable row level security;

drop policy if exists "Participants can view and update buddy sessions" on public.buddy_sessions;
create policy "Participants can view and update buddy sessions"
  on public.buddy_sessions for all
  using (auth.uid() = initiator_id or auth.uid() = buddy_id);

-- Study Groups Policies
alter table public.study_groups enable row level security;

drop policy if exists "Anyone can view public groups or groups they are member of" on public.study_groups;
create policy "Anyone can view public groups or groups they are member of"
  on public.study_groups for select
  using (
    is_public = true 
    or auth.uid() = creator_id 
    or exists (
      select 1 from public.group_members 
      where group_members.group_id = study_groups.id 
      and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create study groups" on public.study_groups;
create policy "Users can create study groups"
  on public.study_groups for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Group creators can update their groups" on public.study_groups;
create policy "Group creators can update their groups"
  on public.study_groups for update
  using (auth.uid() = creator_id);

-- Group Members Policies
alter table public.group_members enable row level security;

drop policy if exists "Group members can view fellow members" on public.group_members;
create policy "Group members can view fellow members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm 
      where gm.group_id = group_members.group_id 
      and gm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.study_groups sg
      where sg.id = group_members.group_id and sg.is_public = true
    )
  );

drop policy if exists "Users can join groups" on public.group_members;
create policy "Users can join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave or admins can manage members" on public.group_members;
create policy "Users can leave or admins can manage members"
  on public.group_members for delete
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.study_groups sg 
      where sg.id = group_members.group_id and sg.creator_id = auth.uid()
    )
  );

-- Group Messages Policies
alter table public.group_messages enable row level security;

drop policy if exists "Members can view unflagged group messages" on public.group_messages;
create policy "Members can view unflagged group messages"
  on public.group_messages for select
  using (
    (is_flagged = false or auth.uid() = user_id)
    and exists (
      select 1 from public.group_members 
      where group_members.group_id = group_messages.group_id 
      and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can send group messages" on public.group_messages;
create policy "Members can send group messages"
  on public.group_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members 
      where group_members.group_id = group_messages.group_id 
      and group_members.user_id = auth.uid()
    )
  );

-- Group Challenges Policies
alter table public.group_challenges enable row level security;

drop policy if exists "Members can view and manage group challenges" on public.group_challenges;
create policy "Members can view and manage group challenges"
  on public.group_challenges for all
  using (
    exists (
      select 1 from public.group_members 
      where group_members.group_id = group_challenges.group_id 
      and group_members.user_id = auth.uid()
    )
  );

-- Break Game Scores Policies
alter table public.break_game_scores enable row level security;

drop policy if exists "Users can manage own game scores" on public.break_game_scores;
create policy "Users can manage own game scores"
  on public.break_game_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User XP Logs Policies
alter table public.user_xp_logs enable row level security;

drop policy if exists "Users can view own xp logs" on public.user_xp_logs;
create policy "Users can view own xp logs"
  on public.user_xp_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own xp logs" on public.user_xp_logs;
create policy "Users can insert own xp logs"
  on public.user_xp_logs for insert
  with check (auth.uid() = user_id);

-- ============================================================================
-- SECTION 4: SPEED INDEXES
-- ============================================================================
create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_messages_group on public.group_messages(group_id, created_at asc);
create index if not exists idx_xp_logs_user_date on public.user_xp_logs(user_id, local_date);

-- ============================================================================
-- SECTION 5: REALTIME REPLICATION (For live study buddy and chat sync)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'buddy_sessions') then
    alter publication supabase_realtime add table public.buddy_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'group_messages') then
    alter publication supabase_realtime add table public.group_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'friend_requests') then
    alter publication supabase_realtime add table public.friend_requests;
  end if;
end $$;
