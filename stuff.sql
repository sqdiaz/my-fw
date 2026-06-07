-- Some SQL stuf I ran while configuring the db

-- First one

create extension if not exists pgcrypto;

create table if not exists public.universities (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  university_id bigint not null references public.universities (id) on delete cascade,
  parent_id uuid references public.posts (id) on delete cascade,
  title text,
  content text not null check (char_length(trim(content)) > 0),
  author_hash text not null,
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists posts_university_created_idx on public.posts (university_id, created_at desc);
create index if not exists posts_parent_idx on public.posts (parent_id);

insert into public.universities (slug, name)
values
  ('dlsu', 'De La Salle University'),
  ('upd', 'University of the Philippines Diliman'),
  ('ust', 'University of Santo Tomas'),
  ('admu', 'Ateneo de Manila University')
on conflict (slug) do update
set
  name = excluded.name;

-- Second one

-- Ensure anon/authenticated can access schema/tables
 grant usage on schema public to anon, authenticated;
 grant select on table public.universities to anon, authenticated;
 grant select on table public.posts to anon, authenticated;
 
 -- RLS policies for public reads (needed for channel tabs/pages)
 alter table public.universities enable row level security;
 alter table public.posts enable row level security;
 
 create policy "universities are publicly readable"
 on public.universities
 for select
 to anon, authenticated
 using (true);
 
 create policy "posts are publicly readable"
 on public.posts
 for select
 to anon, authenticated
 using (true);

-- Third one

alter table public.posts
   alter column content set default '';
 
 alter table public.posts
   drop constraint if exists posts_content_check,
   drop constraint if exists posts_title_length_check,
   drop constraint if exists posts_root_title_required_check,
   drop constraint if exists posts_comment_content_required_check;
 
 alter table public.posts
   add constraint posts_title_length_check
     check (title is null or char_length(title) <= 120),
   add constraint posts_root_title_required_check
     check (parent_id is not null or char_length(trim(coalesce(title, ''))) > 0),
   add constraint posts_comment_content_required_check
     check (parent_id is null or char_length(trim(content)) > 0);
