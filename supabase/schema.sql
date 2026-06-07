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
