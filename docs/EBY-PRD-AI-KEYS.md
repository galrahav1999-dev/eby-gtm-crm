# EBY GTM CRM — Per-user AI Keys PRD

> Feature spec: each team member connects their own LLM/STT API key so the AI
> logger works under their own account, with keys stored encrypted at rest and
> remembered. Our prompt, schema, and all post-extraction parsing stay ours, so
> output is consistent no matter whose key is used. Read with
> EBY-PRD-AI-LOGGER-FUNNEL.md, EBY-DATA-SECURITY-AND-PRIVACY.md, and
> EBY-STRATEGY-AND-ROADMAP.md (section 5). Author: Gal Rahav, built with Claude
> Code. Status: building. Last updated: 2026-06-29.

Working rules: no em-dashes, no emojis, no fluff, plain confident language.

---

## 1. Problem and goal

The AI logger needs an OpenAI key (Whisper transcription) and an Anthropic key
(extraction). Today these are single server env vars, so either one person is
billed for everyone or the logger is off (the error "OPENAI_API_KEY is not set").
For the closed founding team, each member should connect their own keys once and
have them remembered, securely.

Goal: a Settings page where each user pastes their own keys, they are encrypted at
rest, never shown again, and used automatically for that user's logger runs.

---

## 2. Consistency principle (important)

The user's key is used only to call the provider API (transcription and the
extraction LLM call). Everything that determines the shape and quality of the
result is ours and identical for every user:
- the system prompt and the "never invent, quote verbatim" rules,
- the extraction tool schema, built from our field registry plus live
  field_options (so output can never contain invalid values),
- temperature 0 (deterministic),
- and all post-extraction parsing: validation, dedupe, link resolution, and the
  commit into the database.

So switching whose key is used changes who is billed, not how the system behaves.
The "parsing after extraction" is entirely ours.

---

## 3. Scope (this version: closed team, BYO key)

In scope:
1. A `user_ai_settings` table, one row per auth user, RLS so a user can read and
   write only their own row.
2. Fields: `openai_key_cipher`, `anthropic_key_cipher` (encrypted), plus
   `anthropic_model` (optional override), `openai_set` / `anthropic_set` booleans
   for display, timestamps. Keys are write-only from the UI: you can set or
   replace a key and see "connected", never read it back.
3. Encryption at rest: AES-256-GCM with a server-only `ENCRYPTION_KEY` (32 bytes,
   base64). Plaintext keys never touch the browser after entry and never appear in
   logs or audit.
4. A Settings page (`/settings`): connect or replace each key (validated with a
   cheap test call), see connection status and last used, remove a key.
5. The logger uses the signed-in user's keys at call time (decrypt server-side).
   Fallback order: the user's key, then the optional server env key (admin
   fallback), then a clear error linking to Settings.
6. Clear, friendly errors: missing or invalid key names the provider and links to
   Settings.

Out of scope now: org-shared keys, usage/cost metering per user (logged later),
provider choice beyond OpenAI (STT) and Anthropic (extraction).

---

## 4. UX

- `/settings` in the sidebar (Tools group). Two cards: Transcription (OpenAI) and
  Extraction (Anthropic). Each shows status (Connected / Not connected), a masked
  field to paste a new key, Save, and Remove. A short line explains keys are
  encrypted and never shown again.
- On save, a quick validation call confirms the key works before storing; a clear
  success or failure message.
- The logger capture screen, when a needed key is missing, shows a calm inline
  note with a link to Settings instead of a raw error.
- Hover help on what each key is for and where to get it.

---

## 5. Security

Governed by EBY-DATA-SECURITY-AND-PRIVACY.md. Summary:
- Keys encrypted at rest (AES-256-GCM, server-only `ENCRYPTION_KEY`).
- Write-only from the UI; never returned to the client; never logged or audited
  in plaintext; the audit log records only "key connected/removed", never values.
- RLS: a user can access only their own settings row.
- If `ENCRYPTION_KEY` is absent, the Settings page refuses to store keys and says
  so plainly (no insecure storage).

---

## 6. Build outline

1. Migration: `user_ai_settings` table + RLS (own-row only) + updated_at trigger.
2. `lib/crypto.ts`: AES-256-GCM encrypt/decrypt with `ENCRYPTION_KEY`.
3. `lib/ai/keys.ts`: read the current user's decrypted key for a provider, with
   env fallback.
4. Wire `transcribe.ts` and `extract.ts` to accept a key resolved per request.
5. `/settings` page + server actions (set, validate, remove). Write-only display.
6. Logger: friendly missing-key note linking to Settings.
7. QA: build, coverage, token checks; migration verified on Supabase; ship.

Environment: add `ENCRYPTION_KEY` (32-byte base64) in Vercel for Production,
Preview, and Development. Server env `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
become optional admin fallbacks.

---

## 7. Backlog (future, at scale beyond the closed team)

- Replace bring-your-own-key with EBY-managed models: the platform calls its own
  provider accounts, users do not connect keys at all. BYO-key is an interim
  measure for the closed founding team only.
- Per-user usage and cost metering (tokens, model, runs) and budgets.
- Optional org-shared key with admin control.
- Provider choice and model selection per user; provider-agnostic adapters behind
  one interface (the prompt, schema, and parsing remain ours and identical).
- Move encryption from a server `ENCRYPTION_KEY` to Supabase Vault / pgsodium.

---

## 8. Verification

- `npm run build` green; migration applied and RLS confirmed (a user sees only
  their row); a key can be set, shows Connected, is used by the logger, and is
  never returned to the client; removing a key reverts to fallback or a clear
  Settings prompt.
