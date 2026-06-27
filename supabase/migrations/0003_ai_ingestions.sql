-- =====================================================================
-- EBY GTM CRM — AI logger ingestions
--
-- Stores each AI-logging run: the pasted notes or uploaded recording, its
-- transcript, the AI's proposed records (for human review), and what was
-- committed. Keeps the source for future reference, as requested.
-- =====================================================================

create sequence if not exists ingestion_display_seq;

create table ai_ingestions (
  id              uuid primary key default gen_random_uuid(),
  display_id      text unique,
  source_type     text not null default 'text',   -- 'text' | 'audio'
  audio_path      text,                            -- path in the 'recordings' storage bucket
  audio_filename  text,
  transcript      text,                            -- pasted notes, or speech-to-text output
  status          text not null default 'new',     -- new|transcribing|transcribed|extracting|proposed|committed|error
  proposal        jsonb,                           -- AI-extracted draft records, for review
  result          jsonb,                           -- ids of records actually created on commit
  error           text,
  owner           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger ingestion_display before insert on ai_ingestions
  for each row execute function assign_display_id('AIN', 'ingestion_display_seq');
create trigger ingestion_touch before update on ai_ingestions
  for each row execute function set_updated_at();

alter table ai_ingestions enable row level security;
create policy ai_ingestions_all on ai_ingestions
  for all to authenticated using (true) with check (true);
