-- HQ admin panel setup — run once in the Supabase SQL editor.
-- Tracks outreach emails sent to people (including those with no KitLists account).

create table if not exists outreach_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  template text not null,          -- 'invite' | 'reengage'
  sent_by text,                    -- admin email who sent it
  sent_at timestamptz not null default now()
);

create index if not exists outreach_invites_email_idx on outreach_invites (email);

-- Lock the table down: RLS on, no policies.
-- Only the service role key (used server-side by /hq) can read or write it.
alter table outreach_invites enable row level security;
