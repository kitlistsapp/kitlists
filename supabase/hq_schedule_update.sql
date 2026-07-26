-- HQ scheduled sends - run once in the Supabase SQL editor (safe to re-run).
-- Adds scheduling columns to outreach_invites.

alter table outreach_invites add column if not exists scheduled_for timestamptz;
alter table outreach_invites add column if not exists resend_email_id text;
alter table outreach_invites add column if not exists status text not null default 'sent';
-- status values: 'sent' (immediate), 'scheduled' (queued at Resend), 'canceled'
