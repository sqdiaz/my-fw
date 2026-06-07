# Campus Wall PH

Anonymous freedom-wall style forum for Philippine universities.

## Channels (initial seed)

- `/dlsu/`
- `/upd/`
- `/ust/`
- `/admu/`

## Tech

- Next.js App Router
- Supabase (Postgres)
- Vercel

## Database setup

Run `supabase/schema.sql` in your Supabase SQL editor.

It creates:

1. `universities` table
2. `posts` table with self-referencing `parent_id`
3. Seed rows for DLSU, UPD, UST, and ADMU

## Anonymous identity behavior

When posting:

- app reads the request IP (`x-forwarded-for`)
- app builds a Manila-local date key (`YYYY-MM-DD`)
- app hashes `ip + day + threadRootId + HASH_SALT`

Result: same person gets a stable anon hash inside the same thread for that day, without signing up.

Set `HASH_SALT` in your environment for production.