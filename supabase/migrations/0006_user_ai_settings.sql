-- =====================================================================
-- Per-user AI keys. Each team member connects their own OpenAI (STT) and
-- Anthropic (extraction) keys. Keys are stored only as AES-256-GCM ciphertext
-- (encrypted by the app with a server-only ENCRYPTION_KEY) and are write-only
-- from the UI. RLS restricts every row to its owning user. See
-- docs/EBY-PRD-AI-KEYS.md and docs/EBY-DATA-SECURITY-AND-PRIVACY.md.
-- =====================================================================
create table if not exists user_ai_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  openai_key_cipher    text,
  anthropic_key_cipher text,
  anthropic_model      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table user_ai_settings enable row level security;

-- A user can read and write only their own row.
create policy own_select on user_ai_settings for select to authenticated using (user_id = auth.uid());
create policy own_insert on user_ai_settings for insert to authenticated with check (user_id = auth.uid());
create policy own_update on user_ai_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_delete on user_ai_settings for delete to authenticated using (user_id = auth.uid());

create trigger user_ai_settings_touch before update on user_ai_settings
  for each row execute function set_updated_at();
