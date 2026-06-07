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
  content text not null default '',
  author_hash text not null,
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now(),
  constraint posts_title_length_check
    check (title is null or char_length(title) <= 120),
  constraint posts_root_title_required_check
    check (
      parent_id is not null
      or char_length(trim(coalesce(title, ''))) > 0
    ),
  constraint posts_comment_content_required_check
    check (
      parent_id is null
      or char_length(trim(content)) > 0
    )
);

create index if not exists posts_university_created_idx on public.posts (university_id, created_at desc);
create index if not exists posts_parent_idx on public.posts (parent_id);
