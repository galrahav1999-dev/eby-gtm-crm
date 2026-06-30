-- =====================================================================
-- Per-user rate limiting (fixed window). Each row is one counted action by a
-- user; lib/rate-limit.ts counts recent rows in a window and blocks if over the
-- limit. RLS restricts rows to the owning user. See lib/rate-limit.ts.
-- =====================================================================
create table if not exists rate_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup on rate_events(user_id, action, created_at);

alter table rate_events enable row level security;
create policy own_rate_insert on rate_events for insert to authenticated with check (user_id = auth.uid());
create policy own_rate_select on rate_events for select to authenticated using (user_id = auth.uid());
