-- =====================================================================
-- API key vault: several keys per user per provider, one active at a time.
-- Keys stored only as AES-256-GCM ciphertext (lib/crypto.ts). RLS own-row.
-- A partial unique index enforces at most one active key per (user, provider).
-- Managing keys is gated behind 2FA (aal2) in the app. See
-- docs/EBY-PRD-2FA-AND-KEY-VAULT.md.
-- =====================================================================
create table if not exists user_api_keys (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  provider   text not null check (provider in ('openai','anthropic')),
  label      text,
  key_cipher text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists user_api_keys_lookup on user_api_keys(user_id, provider, is_active);
create unique index if not exists user_api_keys_one_active on user_api_keys(user_id, provider) where is_active;

alter table user_api_keys enable row level security;
create policy uak_select on user_api_keys for select to authenticated using (user_id = auth.uid());
create policy uak_insert on user_api_keys for insert to authenticated with check (user_id = auth.uid());
create policy uak_update on user_api_keys for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy uak_delete on user_api_keys for delete to authenticated using (user_id = auth.uid());
