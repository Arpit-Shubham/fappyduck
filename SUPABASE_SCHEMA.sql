-- ============================================================
-- StreamVault — Supabase SQL Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. PROFILES (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. VIDEOS
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stream_url text not null,
  thumbnail_url text,
  language text default 'English',
  category text default 'Amateur',
  tags text[] default '{}',
  published boolean default false,
  view_count bigint default 0,
  like_count bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. LIKES
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, video_id)
);

-- 4. HISTORY
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  watched_at timestamptz default now(),
  unique(user_id, video_id)
);

-- 5. COMMENTS
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ── Indexes for speed ────────────────────────────────────────
create index if not exists videos_view_count_idx on videos(view_count desc);
create index if not exists videos_created_at_idx on videos(created_at desc);
create index if not exists videos_published_idx on videos(published);
create index if not exists likes_user_video_idx on likes(user_id, video_id);
create index if not exists history_user_idx on history(user_id);
create index if not exists comments_video_idx on comments(video_id);

-- ── RPC: increment/decrement view & like counts ──────────────
create or replace function increment_view(video_id uuid)
returns void language sql as $$
  update videos set view_count = view_count + 1 where id = video_id;
$$;

create or replace function increment_like(video_id uuid)
returns void language sql as $$
  update videos set like_count = like_count + 1 where id = video_id;
$$;

create or replace function decrement_like(video_id uuid)
returns void language sql as $$
  update videos set like_count = greatest(like_count - 1, 0) where id = video_id;
$$;

-- ── Row Level Security ───────────────────────────────────────
alter table profiles enable row level security;
alter table videos enable row level security;
alter table likes enable row level security;
alter table history enable row level security;
alter table comments enable row level security;

-- Profiles: users manage their own
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Videos: anyone can read published, no user can write (admin uses service key)
create policy "Anyone can read published videos" on videos for select using (published = true);

-- Likes: authenticated users only
create policy "Users can view all likes" on likes for select using (true);
create policy "Users can insert own likes" on likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on likes for delete using (auth.uid() = user_id);

-- History: users only see their own
create policy "Users can view own history" on history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on history for insert with check (auth.uid() = user_id);
create policy "Users can upsert own history" on history for update using (auth.uid() = user_id);

-- Comments: read all, write own
create policy "Anyone can read comments" on comments for select using (true);
create policy "Users can insert own comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- ── Storage bucket for thumbnails ────────────────────────────
-- Run this separately in SQL editor:
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict do nothing;

create policy "Anyone can view thumbnails" on storage.objects
  for select using (bucket_id = 'thumbnails');

create policy "Service role can upload thumbnails" on storage.objects
  for insert with check (bucket_id = 'thumbnails');

-- ============================================================
-- Done! Your database is ready.
-- ============================================================
