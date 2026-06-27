# EBY GTM CRM — Technical Handoff

> Full technical context to continue this project in a fresh session (e.g. a new
> Claude Code session). Read this top to bottom. It states the stack, hosting,
> data model, file layout, what is built, and what is next. Keep it updated.

Last updated: 2026-06-26.

---

## 1. What this is

The EBY founding team's go-to-market CRM and single source of truth: a full-stack
web app to manage People, Organizations, Deals, Pilots, Partners, Interactions,
and a B2C waitlist, plus an AI logger that turns call notes/recordings into
records. Replaces a Google Sheet. EBY itself is an AI platform for reviving spoken
Hebrew among diaspora Jews (see docs/EBY-CRM-Handoff.md and EBY-context if present).

Founder working rules: no em-dashes, no emojis, no fluff, one action at a time.

---

## 2. Stack and hosting

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- **Database + Auth + Storage:** Supabase (Postgres, Supabase Auth, Storage).
- **Hosting:** Vercel. Live URL: https://eby-gtm-crm.vercel.app
- **Repo:** github.com/galrahav1999-dev/eby-gtm-crm. Default/production branch:
  `eby-gtm-crm` (PR #1 was merged into it). Feature work was on
  `claude/eby-crm-system-design-ippsux`.
- **Error monitoring:** Sentry (optional, activates when `NEXT_PUBLIC_SENTRY_DSN`
  is set).
- **AI:** Anthropic (extraction) + OpenAI Whisper (audio transcription), both
  server-side, gated by keys.

---

## 3. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (RLS protects data) |
| `ANTHROPIC_API_KEY` | for AI logger | Claude extraction |
| `ANTHROPIC_MODEL` | optional | defaults to `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | for audio | Whisper transcription |
| `STT_MODEL` | optional | defaults to `whisper-1` |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | turns on Sentry |
| `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` | optional | source map upload |

Local dev: copy `.env.local.example` to `.env.local`, fill the two Supabase
values, then `npm install && npm run dev`.

---

## 4. Database setup (Supabase SQL editor, in order)

1. `supabase/migrations/0001_init.sql` — 7 record tables, FKs, display_id
   sequences/triggers, RLS, updated_at triggers.
2. `supabase/migrations/0002_options_and_audit.sql` — `field_options` (editable
   dropdowns, seeded with 147 values) + `audit_log`.
3. `supabase/migrations/0003_ai_ingestions.sql` — AI logger runs.
4. `supabase/migrations/0004_storage.sql` — private `recordings` storage bucket
   (Supabase-only; uses the `storage` schema).
5. `supabase/seed.sql` — the team's 20 real discovery contacts + 2 orgs + 1
   interaction (IDs and verbatim notes preserved).

Verification without a live DB: SQL is tested with PGlite
(`@electric-sql/pglite`) by applying the migrations in a throwaway in-process
Postgres. The app is verified with `npm run build` (all routes, types).

---

## 5. Architecture

- **Reads:** Server Components query Supabase directly via `lib/supabase/server.ts`
  (carries the user's session cookie, so RLS applies). Pages are
  `export const dynamic = "force-dynamic"`.
- **Writes:** Next.js **Server Actions** in each object's `actions.ts` (create/
  update/delete), which validate, write, and call the audit logger. Inline
  creation (org, dropdown option) also has **API route handlers** under `app/api/`.
- **Auth:** `middleware.ts` + `lib/supabase/middleware.ts` refresh the session and
  redirect unauthenticated users to `/login`. Invite-only (sign-ups disabled in
  Supabase). RLS policy: any authenticated user can read/write all rows (shared
  workspace); `owner` is a data field, not a security boundary.
- **Editable dropdowns:** values live in `field_options` (DB), read by
  `lib/options.ts` (with `lib/enums.ts` as seed + offline fallback). The Admin
  screen and the inline "+ Add" in comboboxes write new options via
  `app/api/options/route.ts`. No redeploy to change vocabulary.
- **Audit log:** `lib/audit.ts` writes who/what/when (+ field diff) on every
  mutation; surfaced at `/activity`.

---

## 6. File map

```
app/
  (app)/                  authenticated shell (sidebar + topbar)
    layout.tsx            auth guard + shell; shows "configure Supabase" if no env
    page.tsx              dashboard (live counts, 25-interview tracker)
    actions.ts            signOut
    organizations|people|deals|pilots|partners|interactions|waitlist/
      page.tsx            list (DataTable)
      new/page.tsx        create form
      [id]/page.tsx       detail (all fields + linked records)
      [id]/edit/page.tsx  edit form
      actions.ts          server actions (create/update/delete) + audit
    interactions          append-only (create + list + detail, no edit)
    logger/               AI logger: page (input), [id] (review), actions.ts
    activity/page.tsx     audit log feed
    admin/page.tsx        edit field_options (+ actions.ts)
    map/page.tsx          world globe (WorldMap)
  api/
    options/route.ts      POST add a field_option (auth-checked)
    organizations/route.ts POST create org inline (auth-checked)
  auth/callback/route.ts  magic-link/invite code exchange
  login/page.tsx          sign-in (password or magic link)
  global-error.tsx        Sentry-reporting crash fallback
components/crm/           UI kit: ui, form, Combobox, OrgPicker, DataTable,
                          Sidebar, Topbar, BackButton, DeleteButton, *Form, etc.
lib/
  supabase/{client,server,middleware}.ts
  enums.ts                seed/fallback dropdown lists + FALLBACK_OPTIONS map
  options.ts              read field_options (server)
  audit.ts                logAudit + computeDiff
  db-types.ts             row types per table
  format.ts               personName, fmtDate, isOverdue, str, num
  colors.ts               deterministic label/owner colors
  countries.ts            full country list (searchable picker)
  geo.ts                  place -> lat/lng for the map
  pickers.ts              org/people/deal options for FK pickers
  ai/{extract,transcribe,commit}.ts   AI logger pipeline
supabase/migrations/*.sql, supabase/seed.sql
sentry.{client,server,edge}.config.ts, instrumentation.ts
docs/                     this file + handoff/plan/setup/go-live/decisions/design brief
```

---

## 7. Data model and exact UI-to-DB mapping

Every record has internal `id` (uuid) + human `display_id` (PER-/ORG-/DL-/PLT-/
PTR-/INT-/WL-/AIN-0000001, auto-generated). All have `created_at`; most have
`updated_at`. Dropdown columns are plain text validated by the app against
`field_options`. The UI shows every column below on the detail and/or edit pages.

### organizations (ORG-)
name, domain, org_type, age_band, denomination, city, country, size,
affiliation, segment, owner, status, notes.

### people (PER-)
first_name, last_name, email, role_title, org_id (FK organizations),
country, city, segment, source, lifecycle, owner, next_step, next_step_date, notes.
(country/city added beyond the original sheet for individual B2C learners.)

### deals (DL-)
name, org_id (FK), economic_buyer_id / poc_id / champion_id (FK people),
stage, priority, has_hebrew, current_solution, current_state, pains, ideal_state,
eval_timing, decision_timeline, seats (int), acv (numeric), opportunity_start,
expected_close, owner, next_step, next_step_date, closed_won_reason,
closed_lost_reason, notes.

### pilots (PLT-)
org_id (FK), champion_id (FK people), stage, urgency, capability,
representativeness, success_metric, feedback_cadence, dpa_signed, convert_by,
owner, next_step, notes.

### partners (PTR-)
partner_org, partner_type, primary_contact_id (FK people), stage, what_they_give,
expected_reach, terms, owner, next_step, next_step_date, notes.

### interactions (INT-) — append-only
date, person_id (FK), org_id (FK), deal_id (FK), type, owner, outcome,
verbatim_quote, next_step, next_step_date.

### waitlist_cohorts (WL-)
cohort_label, segment, signups, confirmed, activated, retained_d30, paid, notes.
(Conf% and Sign->Paid% are computed in the UI, not stored.)

### field_options
field_key, value, sort_order, active. The 23 field_keys: owner, org_type,
age_band, denomination, country, person_role, lifecycle, source, segment,
org_status, b2b_stage, yes_no_unknown, eval_timing, decision_timeline,
closed_lost_reason, closed_won_reason, priority, pilot_stage, urgency,
feedback_cadence, partner_type, partner_stage, interaction_type.

### audit_log
actor_email, actor_name, action (create|update|delete), table_name, record_id,
display_id, summary, diff (jsonb).

### ai_ingestions (AIN-)
source_type (text|audio), audio_path, audio_filename, transcript, status,
proposal (jsonb), result (jsonb), error, owner.

**FK delete behavior:** all FKs are `on delete set null`, so deleting an org or
person never orphan-crashes children; links just clear. Interactions are never
edited/deleted from the UI (append-only).

---

## 8. AI logger pipeline (lib/ai)

1. Input: paste text, or upload audio (stored in the `recordings` bucket).
2. `transcribe.ts`: audio -> text via Whisper (needs `OPENAI_API_KEY`).
3. `extract.ts`: Claude with a forced tool-call whose JSON schema is built from
   the **current** `field_options` (enums), so it cannot emit an invalid value.
   Rules: never invent (null when unknown), quotes verbatim. Returns a Proposal
   (organizations, people, deals, interactions, to_chase_next).
4. Review UI (`/logger/[id]`): each proposed record has an include checkbox.
5. `commit.ts`: creates included records, de-duping orgs by name and people by
   email/full-name, resolving links by the AI's name references; interactions
   appended. Stores source + transcript + proposal + result on the ingestion.

---

## 9. Conventions

- One object per folder; server actions co-located in `actions.ts`.
- Empty form values become `null` (`str()`/`num()` in `lib/format.ts`).
- Never write `display_id` (DB trigger sets it).
- Add a new dropdown value via Admin or the inline "+ Add"; it persists in
  `field_options`. Code enums are only seed/fallback.
- Commit identity: `Claude <noreply@anthropic.com>`. Keep the model id out of
  committed artifacts.

---

## 10. Status: done

Auth + shell; full CRUD for all 7 objects; editable dropdowns + Admin; audit log
+ Activity; dashboard; world map; AI logger + audio pipeline; Sentry-ready;
searchable country picker; inline org creation; "add new" comboboxes on Org and
Person forms; Back buttons on all create/edit/detail pages. Build green; deployed.

---

## 11. Status: next / backlog

- **Globe rebuild:** the original cockpit globe (starfield, beams/arcs, richer
  visuals) is in git history (`components/GlobeView.tsx`, and
  `app/_cockpit-demo-page.tsx.bak`). Port its visuals onto EBY data (orgs/people),
  in the new BRIGHT design direction (see EBY-DESIGN-SYSTEM-BRIEF.md). Decide:
  points colored by segment vs owner; arcs diaspora->Israel; drill-down levels.
- **Roll out the new inputs everywhere:** apply `Combobox` (searchable + add-new)
  and `OrgPicker` (inline create) to the Deal/Pilot/Partner/Interaction forms too
  (currently they use plain selects/`RecordSelect`). Consider a searchable
  people-picker with inline create as well.
- **Apply the new bright design system** once generated from the brief (the app is
  currently the inherited dark "cockpit" theme).
- **Best-first-customer score** (cost x frequency x budget/authority) and a
  quote/signal bank (both noted in the original feature list).
- **HubSpot export** mapping (display_ids already make this clean).
- Optional: one-way Google Sheet mirror; duplicate detection/merge.

---

## 12. How to run / verify

- Dev: `.env.local` with Supabase keys, then `npm run dev`.
- Build/typecheck: `npm run build`.
- DB/SQL check without a server: apply `supabase/migrations/*` to PGlite in a
  small node script and assert (pattern used throughout this project).
- The app shows a friendly "configure Supabase" screen if env is missing, so it
  never hard-crashes pre-configuration.
