# EBY GTM CRM — Session Handoff (2026-06-30)

> Full context to continue in a fresh Claude Code session. Read this first, then
> EBY-MASTER-INDEX.md and the PRDs referenced below. Founder: Gal Rahav.

Working rules (always): no em-dashes, no emojis, no fluff, plain confident
language, one clear action at a time. Gal is non-technical: give exact code and
exact clicks, never just a filename. Hover help wherever meaning is not obvious.

---

## 1. Live identifiers

- Repo: `github.com/galrahav1999-dev/eby-gtm-crm`
- Production URL: https://eby-gtm-crm.vercel.app (Vercel team `globus2`, project
  `eby-gtm-crm`)
- Supabase project ref: `rrtiofpptqjxlxkzwkwt` (org `ywwegymhzqgistwqpotu`)
- Supabase auth callback: `https://rrtiofpptqjxlxkzwkwt.supabase.co/auth/v1/callback`

## 2. Branching and release (current working style)

- Flow: `feature/*` -> PR -> `develop` -> PR -> `eby-gtm-crm` (production).
- The production branch-protection approval rule was DROPPED by Gal, so the
  assistant merges feature->develop and develop->production directly after the
  build is green. Gal wants features pushed to production after QA.
- "QA" the assistant can do without seeing the UI: `npm run build` (primary gate),
  `npm run verify:registry` (column coverage), and a token-safety grep (no
  `/<number>` opacity modifier on CSS-var tokens). Gal is the visual QA via the
  Vercel preview; ask for screenshots.
- Auth-sensitive work ships to the develop/branch preview FIRST for Gal to test,
  then promote. (2FA is currently in that state.)
- MCP note: the Supabase `apply_migration`/`execute_sql` tool intermittently drops
  the permission stream; just retry. Migrations here were applied idempotently via
  `execute_sql`.

## 3. Stack

Next.js 14 (App Router) + TypeScript + Tailwind; Supabase (Postgres + Auth +
Storage); Vercel; Sentry-ready (inert without DSN). AI: Anthropic (extraction),
OpenAI Whisper (audio). Bright "fields at dawn" design system (light default +
cosmic dark + auto), tokens are CSS variables surfaced as Tailwind names.
CRITICAL: never use a Tailwind opacity modifier on a var-backed token
(`bg-card/90`, `text-ink/70` break). Use a solid token or `color-mix(...)`.

## 4. What shipped to PRODUCTION this session

1. Design system + Tier 0 registry foundation (PRs #2, #4).
2. Tier 1: all 7 objects on the field registry (deals, pilots, partners,
   interactions, waitlist now use the generic searchable forms; interactions are
   append-only). Bespoke folders deleted. (#5, #6)
3. List tables now show ALL DB columns per object (1:1), horizontally scrollable,
   long text truncated with hover title. (#7, #8)
4. AI logger funnel: capture up to 3 audio files and/or pasted text; editable
   field-by-field review (every destination field + db column, dropdowns from live
   options, per-record include); explicit Accept and save; outcome screen with
   links to created records and next steps (open person/org, start deal/pilot
   prefilled with org via `?org_id=`, back to globe). Generic create form prefills
   from query params. (#15, #16)
5. Audio upload fixed: browser uploads directly to Supabase Storage via a
   server-issued signed upload URL (bypasses the Vercel/Next body-size limit and
   storage RLS). Server transcribes from storage. Drag-and-drop with up to 3
   files. (#9..#14)
6. Per-user AI keys (legacy single-key): `user_ai_settings`, AES-256-GCM via
   server `ENCRYPTION_KEY`, Settings page; logger uses the signed-in user's key.
   (#19, #20, #21)
7. Spinner/loader during transcription+extraction. (#19)
8. Confirmation modal (`components/crm/ConfirmModal.tsx`) on archive/discard/
   remove; logger "Connected: Claude" signal + dismissible message + Manage keys
   link; Settings clarity (Whisper is OpenAI; Claude alone runs the text
   pipeline). (#22, #23)
9. Rate limiting: `rate_events` table + `lib/rate-limit.ts`; AI logger 12/min/user,
   inline-create API 60/min/user. (#24, #25)
10. Google sign-in button on login (now BELOW the email form). (#26, #27, #33, #34)
11. Globe: neon beams from every diaspora point to Jerusalem + pulsing ring; the
    country territory funnel (click a country label to lock on, see its
    orgs/people, open or create there); icon-only backdrop toggle (auto/day/
    night); dedicated sunrise and sunset views (one hour around each). (#17, #18,
    #28, #29, #33, #34)
12. 15-minute idle session timeout with a "Session timed out" dialog +
    re-login CTA (`components/crm/IdleLogout.tsx`, in the app shell). (#30, #31)

## 5. IN PROGRESS / pending

- PR #32 `feature/2fa-key-vault` (DRAFT, on preview, NOT merged): TOTP 2FA enroll/
  verify/turn-off (Supabase MFA) + API key vault (`user_api_keys`: several keys
  per provider, one active; manage gated behind aal2). Key resolution prefers the
  active vault key, then legacy `user_ai_settings`, then env. Latest fixes:
  verify against the verified factor, clear stale unverified factors on enroll,
  surface already-connected legacy keys. Preview:
  https://eby-gtm-crm-git-feature-2fa-key-vault-globus2.vercel.app/settings
  ACTION: Gal verifies enroll + key management on the preview, then promote to
  production.
- Follow-up slices Gal wants (build only AFTER 2FA verified, preview-first; both
  can lock people out): (a) REQUIRE 2FA at first login (enforce enrollment + aal2
  in the app shell/middleware); (b) DELETE ACCOUNT gated by 2FA (needs a
  service-role edge function for auth-user deletion). Tracked in
  docs/EBY-PRD-2FA-AND-KEY-VAULT.md.
- Google OAuth: provider must be ENABLED in Supabase (Auth -> Providers -> Google)
  with a real OAuth Client ID (`...apps.googleusercontent.com`) + secret, and the
  redirect URI `https://rrtiofpptqjxlxkzwkwt.supabase.co/auth/v1/callback` added in
  Google Cloud. The button is live but errors until this is done. (Gal in progress.)

## 6. Environment variables (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set).
- `ENCRYPTION_KEY` (32-byte base64) — REQUIRED to store AI keys / vault. Gal was
  given a value to set in Vercel (Production). Do not commit it.
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` — now OPTIONAL admin fallback only
  (per-user keys are primary). `ANTHROPIC_MODEL` defaults to `claude-sonnet-4-6`.
  `STT_MODEL` defaults to `whisper-1`.
- `NEXT_PUBLIC_SENTRY_DSN` optional.

## 7. Database (Supabase) — tables added this session

Migrations in `supabase/migrations/`: `0006_user_ai_settings.sql`,
`0007_rate_events.sql`, `0008_user_api_keys.sql`. All applied to the live project.
- `user_ai_settings` (legacy single key per provider, RLS own-row).
- `rate_events` (per-user fixed-window rate limiting, RLS own-row).
- `user_api_keys` (vault: many keys, one active per provider, partial unique index
  `user_api_keys_one_active`, RLS own-row). Used by PR #32.
Prior tables: 7 record objects + `field_options` + `audit_log` + `ai_ingestions`.
Live data is small (about 2 orgs, 20 people, 1 interaction); the point of the
build is frictionless capture to fill it.

## 8. Key files

- Registry: `lib/schema/{types,registry,organizations,people,deals,pilots,partners,
  interactions,waitlist_cohorts}.ts`. Generic routes: `app/(app)/[object]/...`.
  Generic CRUD: `lib/crud.ts`, `lib/record-actions.ts`, `lib/record-data.ts`.
  Coverage guard: `scripts/verify-registry-coverage.mjs` (`npm run verify:registry`).
- AI logger: `app/(app)/logger/{page,AudioUploader,ReviewProposal,KeyStatus,[id]/page,actions}.tsx/ts`,
  `lib/ai/{extract,transcribe,commit,keys}.ts`.
- Keys/security: `lib/crypto.ts` (AES-256-GCM), `lib/ai/keys.ts` (resolveKey),
  `app/(app)/settings/*` (KeyCard legacy on prod; TwoFactor + KeyVault +
  vault-actions on PR #32).
- Globe: `components/crm/GlobeHome.tsx`. Shell: `app/(app)/layout.tsx` (+ IdleLogout).
  Confirm modal: `components/crm/ConfirmModal.tsx`. Rate limit: `lib/rate-limit.ts`.

## 9. PRDs and docs to read

- docs/EBY-PRD-DATA-CAPTURE.md (the capture system + full field maps).
- docs/EBY-PRD-AI-LOGGER-FUNNEL.md (the funnel).
- docs/EBY-PRD-AI-KEYS.md (per-user keys; backlog: EBY-managed models at scale).
- docs/EBY-PRD-2FA-AND-KEY-VAULT.md (2FA + vault, slices).
- docs/EBY-DATA-SECURITY-AND-PRIVACY.md (binding policy for secrets + PII).
- docs/EBY-MASTER-INDEX.md, EBY-TECH-HANDOFF.md, EBY-DESIGN-SYSTEM.md, EBY-QA.md,
  EBY-DEVOPS.md, EBY-STRATEGY-AND-ROADMAP.md (older but foundational).

## 10. Gotchas learned this session

- No opacity modifier on var-backed tokens (use solid token or color-mix). There
  is a token-safety grep used before each push.
- Audio must NOT go through a Next/Vercel server action (body-size limit); use a
  signed upload URL and upload from the browser.
- Storage policies are for `authenticated`; the browser client may lack a session,
  so the signed upload URL path is what works.
- Supabase MFA: verify/elevate against a VERIFIED factor; stale unverified factors
  cause "Invalid TOTP code".
- The PR-activity webhooks fire often; merging to develop then production is the
  norm. Each push gets a Vercel preview; production deploys on merge to
  `eby-gtm-crm`.

## 11. Suggested next steps

1. Gal verifies PR #32 on preview; assistant promotes 2FA + vault to production.
2. Build (preview-first): require 2FA at first login; delete-account gated by 2FA.
3. Finish Google OAuth enablement (Gal) and confirm sign-in works end to end.
4. Continue the data-capture roadmap: quick-add command palette (Cmd-K), global
   search, "my work" view, bulk paste import, deals kanban (see
   EBY-PRD-DATA-CAPTURE.md tiers).
5. Higgsfield hero imagery for login/empty states (tools available in-session).
