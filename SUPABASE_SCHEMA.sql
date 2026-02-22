-- Supabase schema for Sistema ATS
-- Source: _vscode/PLANO_DEFINITIVO_SISTEMA_ATS.md + _vscode/REGRAS_DE_NEGOCIO.md
-- Safe to re-run (idempotent where possible)

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Resumes table
create table if not exists public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  template_id text not null,
  data jsonb not null,
  file_name text,
  file_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Compatibility migration: ensure new column exists for older local versions
alter table public.resumes
  add column if not exists file_name text;

-- Indexes
create index if not exists resumes_user_id_idx on public.resumes(user_id);
create index if not exists resumes_created_at_idx on public.resumes(created_at desc);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;

-- Policies: profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policies: resumes
drop policy if exists "Users can view own resumes" on public.resumes;
create policy "Users can view own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own resumes" on public.resumes;
create policy "Users can insert own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own resumes" on public.resumes;
create policy "Users can update own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own resumes" on public.resumes;
create policy "Users can delete own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists handle_resumes_updated_at on public.resumes;
create trigger handle_resumes_updated_at
  before update on public.resumes
  for each row
  execute procedure public.handle_updated_at();

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Users can upload own resumes" on storage.objects;
create policy "Users can upload own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can view own resumes" on storage.objects;
create policy "Users can view own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
