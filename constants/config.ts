// Supabase Configuration
// Add these to your .env file:
// EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://fenzcpsruyskwtrvoonz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'Sb_publishable_OYQL9_V_-xPwijZAJfRFPQ_jylMCb6S';

export const APP_NAME = 'Kais Chat';

// Message sending config for slow networks
export const MESSAGE_RETRY_ATTEMPTS = 3;
export const MESSAGE_RETRY_DELAY = 1000; // ms
export const REALTIME_RECONNECT_INTERVAL = 3000; // ms

/*
====== SUPABASE SQL SETUP ======
Run this in your Supabase SQL editor:

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  email text,
  about text default 'Hey there! I am using Kais Chat.',
  last_seen timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Conversations table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Conversation participants
create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(conversation_id, user_id)
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade,
  sender_id uuid references public.profiles on delete cascade,
  content text not null,
  status text default 'sent' check (status in ('sending', 'sent', 'delivered', 'read', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at);
create index conversation_participants_user_id_idx on public.conversation_participants(user_id);

-- Auto-update conversation updated_at when new message
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure update_conversation_timestamp();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view conversations they are in" on public.conversations
  for select using (
    id in (select conversation_id from public.conversation_participants where user_id = auth.uid())
  );

create policy "Users can create conversations" on public.conversations for insert with check (true);

create policy "Users can view participants" on public.conversation_participants for select using (true);
create policy "Users can join conversations" on public.conversation_participants for insert with check (true);

create policy "Users can view messages in their conversations" on public.messages
  for select using (
    conversation_id in (
      select conversation_id from public.conversation_participants where user_id = auth.uid()
    )
  );

create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can update own messages" on public.messages
  for update using (auth.uid() = sender_id);

-- Function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

*/
