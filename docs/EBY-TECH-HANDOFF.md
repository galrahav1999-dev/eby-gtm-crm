# EBY GTM CRM — Technical Handoff

> Full technical context to continue this project in a fresh session (e.g. a new
> Claude Code session). Read top to bottom. States the stack, hosting, data model,
> file layout, UX principles, what is built, and what is next. Keep it updated
> every session. Author/owner: Gal. Built with Claude Code.

Last updated: 2026-06-28. See EBY-MASTER-INDEX.md for the doc set, and
EBY-DESIGN-SYSTEM.md / EBY-QA.md / EBY-DEVOPS.md for those categories.

---

## 1. What this is

The EBY founding team's go-to-market CRM and single source of truth: a full-stack
web app to manage People, Organizations, Deals, Pilots, Partners, Interactions,
and a B2C waitlist, plus an AI logger that turns call notes/recordings into
records. It replaces a Google Sheet. EBY itself is an AI platform for reviving
spoken Hebrew among diaspora Jews (broader product/strategy context lives in
docs/EBY-CRM-Handoff.md, docs/EBY-PLAN.md, docs/DECISIONS.md, and the founders
hub at eby-founders.vercel.app/context.md).

Founder working rules: no em-dashes, no emojis, no fluff, one action at a time,
plain confident language.

---

## 2. Stack and hosting

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- **DB + Auth + Storage:** Supabase (Postgres, Supabase Auth, Supabase Storage).
- **Hosting:** Vercel. Live URL: https://eby-gtm-crm.vercel.app
- **Repo:** github.com/galrahav1999-dev/eby-gtm-crm
- **Branches:** production/default = `eby-gtm-crm` (Vercel deploys this). Earlier
  feature work was on `claude/eby-crm-system-design-ippsux` (merged via PR #1).
  Going forward, commit to `eby-gtm-crm` (or PR into it) so Vercel redeploys.
- **Error monitoring:** Sentry, optional, activates when `NEXT_PUBLIC_SENTRY_DSN`
  is set (inert otherwise; builds stay clean).
- **AI:** Anthropic (extraction) + OpenAI Whisper (audio), server-side, key-gated.
- **State of design:** the bright "fields at dawn" design system is BUILT and wired
  app-wide (light + brand-dark + auto-by-hour theming via CSS vars + `data-theme`),
  with a full-screen time-of-day globe home and a separate `/dashboard`. Full detail
  in EBY-DESIGN-SYSTEM.md. It lives on `feature/design-system` (PR #2 into develop),
  not yet promoted to production. Some inner pages (record detail/edit, AI logger,
  login) are still plainer than the Grade-A target; that is the design backlog.

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
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | optional | source-map upload |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | optional | only if a Mapbox map view is added |

Local dev: copy `.env.local.example` to `.env.local`, fill the two Supabase
values, then `npm install && npm run dev` (http://localhost:3000).

---

## 4. Database setup (Supabase SQL editor, run in order)

1. `supabase/migrations/0001_init.sql` — 7 record tables, FKs, display_id
   sequences + triggers, RLS, updated_at triggers.
2. `supabase/migrations/0002_options_and_audit.sql` — `field_options` (editable
   dropdowns, seeded with 147 values) + `audit_log`.
3. `supabase/migrations/0003_ai_ingestions.sql` — AI logger runs.
4. `supabase/migrations/0004_storage.sql` — private `recordings` storage bucket
   (Supabase-only; uses the `storage` schema, so it is not run in local test PG).
5. `supabase/migrations/0005_soft_delete.sql` — `archived_at` on all record
   tables (soft delete).
6. `supabase/seed.sql` — the team's 20 real discovery contacts + 2 orgs + 1
   interaction (IDs and verbatim notes preserved; "Misha" mapped to "Michael").

Verification without a live DB: SQL is tested with PGlite
(`@electric-sql/pglite`) by applying the migrations to a throwaway in-process
Postgres in a node script and asserting. The whole app is verified with
`npm run build` (compiles + typechecks all routes).

---

## 5. UX and functionality principles (the current focus)

Direction from the founder: prioritize **functionality and team UX**, and make
sure the UI **maps perfectly to the backend**. Design polish comes after the
design system is ready. Take inspiration from the best CRM / GTM command centers
(Linear, Attio, Superhuman, Folk, Clay, HubSpot, Salesforce) for patterns, not
visuals.

Principles to uphold and extend:

- **One object per page, linked by ID.** Lists are summaries; the record detail
  and edit pages expose every database field. Never hide a field from the user.
- **Every dropdown is editable** (field_options) and addable inline ("+ Add"),
  because EBY is in discovery and vocabulary changes weekly. No redeploy to change
  a list.
- **Foreign keys are real and easy:** searchable pickers, with inline create
  (e.g. create a new Organization from inside the Person form). Extend this to all
  FK fields (people pickers on deals/pilots/partners/interactions).
- **Capture is frictionless:** the AI logger (paste/upload) is the fast path;
  manual forms are the precise path. Both must map to the same schema.
- **The pipeline is the point:** stages, owners, next steps, and overdue
  follow-ups must be obvious at a glance (dashboard + per-owner views).
- **Nothing is lost:** interactions are append-only; deletes null out links
  rather than cascade; the audit log records every change.
- **Speed and clarity:** fast pages, keyboard-friendly, calm density. Aim toward
  a global command palette and saved/filtered views (backlog).

Functionality backlog that maps to backend (high value, design-agnostic):
global search across records; per-owner "my work" view (next steps due);
saved filters / views per object; bulk select + bulk edit (owner, stage,
segment); duplicate detection/merge for people and orgs; CSV import/export;
best-first-customer score (cost x frequency x budget/authority); a quote/signal
bank aggregating verbatim quotes; stage-exit-criteria hints on deals.

---

## 6. Architecture

- **Reads:** Server Components query Supabase via `lib/supabase/server.ts` (carries
  the user's session cookie, so RLS applies). Pages are `dynamic = "force-dynamic"`.
- **Writes:** Next.js **Server Actions** in each object's `actions.ts`
  (create/update/delete): validate, write, then `logAudit`. Inline creation also
  has **API route handlers** under `app/api/` (`/api/options`, `/api/organizations`).
- **Auth:** `middleware.ts` + `lib/supabase/middleware.ts` refresh the session and
  redirect unauthenticated users to `/login`. Invite-only (sign-ups disabled in
  Supabase). If Supabase env is absent, auth is skipped and the app shows a
  "configure me" screen instead of crashing.
- **RLS:** every table has `enable row level security` + a policy allowing any
  `authenticated` user to read/write all rows (shared internal workspace).
  `audit_log` is read+insert only (immutable). `owner` is a data attribute, not a
  security boundary.
- **Editable dropdowns:** values live in `field_options` (DB), read by
  `lib/options.ts` (with `lib/enums.ts` as seed + offline fallback). Admin screen
  and inline "+ Add" write via `/api/options`.
- **Audit log:** `lib/audit.ts` writes who/what/when (+ field diff) on every
  mutation; surfaced at `/activity`.

Data flow (write): form (client) -> Server Action (server, validates + nulls
empties) -> Supabase insert/update (RLS) -> logAudit -> revalidatePath -> redirect.

### Field-registry framework (Phase 1, live for People + Organizations)
The big architectural backbone (see docs/EBY-STRATEGY-AND-ROADMAP.md). Each object
is described ONCE in `lib/schema/<object>.ts` (an `ObjectDef` with `FieldDef[]`:
name, label, widget, optionsKey, addNew, fkTo, inlineCreate, required, section,
help, showInList/Detail). Generic components render everything from it:
- Dynamic routes `app/(app)/[object]/{page,new,[id],[id]/edit}` (list/create/
  detail/edit) for any registered object. Static object folders (deals, pilots,
  partners, interactions, waitlist) still exist and take precedence until ported;
  the registry `FRAMEWORK_OBJECTS` controls which keys the `[object]` route serves.
- `components/crm/RecordForm` + `FieldInput` choose the widget automatically
  (text/email/textarea/number/money/date/select/combobox(+add-new)/country/fk).
- `components/crm/RecordPicker`: searchable FK with inline create of ANY object
  via `/api/records/[object]` (quickCreate fields from the target's def).
- `lib/crud.ts`: generic create/update/archive with validation + audit, driven by
  the def. `lib/record-actions.ts`: generic server actions bound by object key.
  `lib/record-data.ts`: list rows, FK label resolution, form bundle, linked records.

**To add or change a field now:** edit the object's `FieldDef` in `lib/schema/*`
(+ a column migration if it is new). It appears in list, detail, form, search,
and validation automatically. Hover help = set `help` on the field. No bespoke
edits. This is what stops reactive patching.

**Hover help:** `HelpTip` (a "?" tooltip) is threaded through every field label
(form.tsx Wrap, Combobox, RecordPicker), driven by `FieldDef.help`.

**Soft delete:** all record tables have `archived_at` (migration 0005). Delete in
the UI = Archive (recoverable); lists filter `archived_at is null`. Generic
`archiveRecord` sets the timestamp and audits it.

---

## 7. File map

```
app/
  (app)/                  authenticated shell (sidebar + topbar)
    layout.tsx            auth guard + shell; "configure Supabase" if no env
    page.tsx              HOME = full-screen time-of-day globe (GlobeHome)
    dashboard/page.tsx    data dashboard (live counts, 25-interview tracker)
    actions.ts            signOut
    organizations|people|deals|pilots|partners|interactions|waitlist/
      page.tsx            list (DataTable)
      new/page.tsx        create form
      [id]/page.tsx       detail (all fields + linked records)
      [id]/edit/page.tsx  edit form
      actions.ts          server actions (create/update/delete) + audit
    interactions          append-only (create + list + detail, no edit/delete)
    logger/               AI logger: page (input), [id] (review), actions.ts
    activity/page.tsx     audit log feed
    admin/page.tsx        edit field_options (+ actions.ts)
    (the old map/ "World Map" tab was removed; the globe is now the home page)
  api/
    options/route.ts      POST add a field_option (auth-checked)
    organizations/route.ts POST create org inline (auth-checked)
  auth/callback/route.ts  magic-link / invite code exchange
  login/page.tsx          sign-in (password or magic link)
  global-error.tsx        Sentry-reporting crash fallback
components/crm/           ui, form, Combobox, OrgPicker, DataTable, Sidebar,
                          Topbar, BackButton, DeleteButton, ComingSoon, *Form,
                          GlobeHome (full-screen time-of-day globe), ThemeToggle
app/globals.css           design tokens (light/dark) + component classes
tailwind.config.ts        semantic token map; darkMode via [data-theme="dark"]
app/layout.tsx            fonts (geist pkg + Heebo/Frank) + no-flash theme init
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
  schema/{types,registry,organizations,people}.ts   field-registry (the def per object)
  crud.ts                 generic create/update/archive + validation + audit
  record-actions.ts       generic server actions (bound by object key)
  record-data.ts          list rows, FK label resolution, form bundle, linked
  countries.ts            full country list for the country widget
app/(app)/[object]/{page,new,[id],[id]/edit}   generic routes for registry objects
app/api/records/[object]/route.ts   generic inline quick-create
components/crm/{RecordForm,RecordPicker,Combobox,BackButton}.tsx   framework UI
supabase/migrations/0005_soft_delete.sql   archived_at on all tables
supabase/migrations/*.sql, supabase/seed.sql
sentry.{client,server,edge}.config.ts, instrumentation.ts
docs/                     handoff, plan, setup, go-live, decisions, design brief,
                          this tech handoff
app/_cockpit-demo-page.tsx.bak   original cockpit demo (globe reference, not routed)
components/{GlobeView,MapView,...}.tsx   original cockpit components (globe source)
```

---

## 8. Data model and exact UI-to-DB mapping

Every record has internal `id` (uuid) + human `display_id` (auto-generated,
zero-padded): organizations ORG-, people PER-, deals DL-, pilots PLT-, partners
PTR-, interactions INT-, waitlist WL-, ai_ingestions AIN-. All have `created_at`;
most have `updated_at`. Dropdown columns are plain text validated by the app
against `field_options`. The UI shows every column below on detail and/or edit.

### organizations (ORG-)  [= HubSpot Companies, dedupe by domain/name]
name (req), domain, org_type, age_band, denomination, city, country, size,
affiliation, segment, owner, status, notes.

### people (PER-)  [= HubSpot Contacts, dedupe by email]
first_name, last_name, email, role_title, org_id (FK organizations),
country, city, segment, source, lifecycle, owner, next_step, next_step_date, notes.
(country/city were added beyond the original sheet for individual B2C learners.)

### deals (DL-)  [= HubSpot Deals]
name (req), org_id (FK), economic_buyer_id / poc_id / champion_id (FK people),
stage, priority, has_hebrew, current_solution, current_state, pains, ideal_state,
eval_timing, decision_timeline, seats (int), acv (numeric), opportunity_start,
expected_close, owner, next_step, next_step_date, closed_won_reason,
closed_lost_reason, notes.

### pilots (PLT-)
org_id (FK), champion_id (FK people), stage, urgency, capability,
representativeness, success_metric, feedback_cadence, dpa_signed, convert_by,
owner, next_step, notes.

### partners (PTR-)
partner_org (req), partner_type, primary_contact_id (FK people), stage,
what_they_give, expected_reach, terms, owner, next_step, next_step_date, notes.

### interactions (INT-)  [append-only]
date, person_id (FK), org_id (FK), deal_id (FK), type, owner, outcome,
verbatim_quote, next_step, next_step_date.

### waitlist_cohorts (WL-)
cohort_label (req), segment, signups, confirmed, activated, retained_d30, paid,
notes. (Conf% and Sign->Paid% are computed in the UI, not stored.)

### field_options
field_key, value, sort_order, active. 23 field_keys: owner, org_type, age_band,
denomination, country, person_role, lifecycle, source, segment, org_status,
b2b_stage, yes_no_unknown, eval_timing, decision_timeline, closed_lost_reason,
closed_won_reason, priority, pilot_stage, urgency, feedback_cadence, partner_type,
partner_stage, interaction_type.

### audit_log
actor_email, actor_name, action (create|update|delete), table_name, record_id,
display_id, summary, diff (jsonb).

### ai_ingestions (AIN-)
source_type (text|audio), audio_path, audio_filename, transcript, status
(new|transcribing|transcribed|extracting|proposed|committed|error|discarded),
proposal (jsonb), result (jsonb), error, owner.

**FK delete behavior:** all FKs are `on delete set null`. Deleting an org or
person never orphan-crashes children; links just clear. Interactions are never
edited/deleted from the UI.

### Dropdown values (current seed; editable at runtime)
- owner: Gal, Leah, Mashav, Michael
- org_type: Day school; Supplementary / Hebrew school; Kindergarten / preschool;
  Synagogue; JCC / community center; Adult-ed program; Ulpan / online program;
  University Hillel/Chabad; Youth movement / camp; Other
- age_band: Preschool / kindergarten; Elementary (K-5); Middle (6-8);
  High school (9-12); K-12 (full); Adult; Mixed / all ages
- denomination: Secular / cultural; Reform; Conservative; Modern Orthodox;
  Haredi / Orthodox; Community / pluralistic; N/A (consumer)
- person_role: Principal / head of school; Curriculum coordinator; Hebrew teacher;
  Program director; Parent; Student; Partner contact; Investor;
  Consumer power-user; Other
- lifecycle: Discovery; Prospect; Opportunity; Customer; Disqualified; Dormant
- source: Excel / Birthright network; Personal network; LinkedIn outreach;
  Referral / intro; Inbound / waitlist; Community event; Cold outreach
- segment: B2B - non-Orthodox school; B2B - supplementary/community;
  B2B - synagogue/JCC; B2B - kindergarten; Partner - Ulpan;
  Partner - Birthright/Excel; B2C - Aliyah mover; B2C - olim in Ulpan;
  B2C - Israeli family/partner; B2C - identity reconnector; B2C - teacher self-buy
- org_status: To contact; Outreach sent; Replied; Scheduled; Interviewed; Active;
  No - dropped
- b2b_stage: 1 Discovery; 2 Qualified; 3 Demo/Validated; 4 Pilot/LOI; 5 Proposal;
  6 Closed Won; 6 Closed Lost
- yes_no_unknown: Y; N; Unknown
- eval_timing: Now / this term; Next term; Next school year; Budget cycle TBD;
  No timeline
- decision_timeline: This term / immediate; Within 3 months; This budget cycle;
  Next budget cycle; Next school year; 6-12 months; Unknown
- closed_lost_reason: No budget; No urgency / weak pain; Wrong buyer / no authority;
  Chose competitor; Chose status quo; No Hebrew program at all; Bad timing;
  Unresponsive
- closed_won_reason: Strong pain + urgency; Champion drove it; Pilot proved ROI;
  Budget available now; Relationship / trust; Better than incumbent
- priority / urgency: High; Medium; Low
- pilot_stage: Identified; Agreed (DPA); Onboarding; Active; Converted; Churned
- feedback_cadence: Weekly; Biweekly; Monthly; Ad hoc; None yet
- partner_type: Reseller; Referral; Co-marketing; Distribution / list access
- partner_stage: Identified; Pitched; Agreement; Enabled; Productive; Dropped
- interaction_type: Discovery interview; Intro call; Demo; Pilot check-in; Email;
  Meeting; Partner call

---

## 9. AI logger pipeline (lib/ai)

1. Input: paste text, or upload audio (stored in the `recordings` bucket).
2. `transcribe.ts`: audio -> text via Whisper (needs `OPENAI_API_KEY`).
3. `extract.ts`: Claude with a forced tool-call whose JSON schema is built from
   the **current** `field_options`, so it cannot emit an invalid enum value.
   Rules: never invent (null when unknown), quotes verbatim. Returns a Proposal
   { organizations, people, deals, interactions, to_chase_next }.
4. Review UI (`/logger/[id]`): each proposed record has an include checkbox.
5. `commit.ts`: creates included records, de-duping orgs by name and people by
   email/full-name, resolving links by the AI's name references; interactions
   appended. Stores source audio + transcript + proposal + result on the ingestion
   for future reference.

Default model: `claude-sonnet-4-6` (override with `ANTHROPIC_MODEL`). Keep model
ids out of committed artifacts other than this config note.

---

## 10. Conventions

- One object per folder; server actions in `actions.ts`.
- Empty form values become `null` (`str()`/`num()` in `lib/format.ts`).
- Never write `display_id` (DB trigger sets it).
- Add dropdown values via Admin or inline "+ Add"; persists in `field_options`.
  Code enums in `lib/enums.ts` are only seed + offline fallback.
- Searchable inputs: `Combobox` (string options + optional inline add via
  `fieldKey`) and `OrgPicker` (FK + inline create). `lib/countries.ts` powers the
  country picker.
- Back navigation: `PageHeader back` renders the BackButton (top-left).
- Git identity for commits: `Claude <noreply@anthropic.com>`.

---

## 11. Status: done

Auth + shell; full CRUD for all 7 objects; editable dropdowns + Admin; audit log
+ Activity; dashboard (+25-interview tracker); world map (basic); AI logger +
audio pipeline; Sentry-ready; searchable full-country picker; inline org creation;
Back buttons on all create/edit/detail pages. Seeded with real data. Deployed.

**Phase 1 framework DONE (live for People + Organizations):** field registry +
generic routes/form/detail/CRUD, searchable FK with inline create of any object,
hover help on every field, soft delete (archive). People and Organizations now
render entirely from `lib/schema/*`. Build green; verified on real Postgres.

**Design system DONE (on `feature/design-system`, PR #2, not yet promoted):**
bright "fields at dawn" tokens, light/brand-dark/auto-by-hour theming, geist +
Heebo + Frank fonts, full-screen time-of-day globe home, separate `/dashboard`,
premium DataTable, the old World Map tab removed. Full detail in
EBY-DESIGN-SYSTEM.md. Remaining design polish (record detail/edit, AI logger,
login, Higgsfield hero media) is the immediate backlog.

---

## 12. Status: next / backlog (per the approved roadmap order)

Approved order: framework (1) -> port all (2) -> Power UX (3) -> AI v2 (4) ->
identity/integrity (5) -> design system (6). Decisions locked: per-user AI keys
(server-encrypted, your key optional admin fallback); default models Claude
(Sonnet) + Whisper, overridable; soft delete; hover help everywhere.

- **Phase 2 (next): port the remaining objects to the framework.** Write
  `lib/schema/{deals,pilots,partners,interactions,waitlist_cohorts}.ts`, add them
  to the registry, delete the bespoke static folders. Needs: `appendOnly` support
  in the generic detail/routes (interactions = no edit/delete) and a custom list
  renderer for waitlist (computed funnel %). Then every object has searchable FK +
  inline create + hover help + soft delete for free.
- **Phase 3 Power UX:** global search, command palette (Cmd-K), saved views /
  filters per object, "my work" home (next steps due per owner), bulk edit,
  deals kanban.
- **Phase 4 AI logger v2:** per-user keys + Settings page (encrypted), provider-
  agnostic pipeline (same prompt/schema/parsing), the funnel (audio/text +
  target-or-create), dedupe-on-commit, golden tests, cost/usage logging.
- **Phase 5 identity + integrity:** `profiles`/users + roles, dedupe on manual
  create, optimistic concurrency, archive/restore UI.
- **Phase 6 design system:** apply the bright EBY tokens across the shared
  framework components (restyle once), then the globe rebuild.
- **Phase 7 growth:** HubSpot export, Sheet mirror, custom-fields-from-UI,
  best-first-customer score, quote/signal bank.

---

## 13. How to run / verify / troubleshoot

- Dev: `.env.local` with Supabase keys, then `npm run dev`.
- Build / typecheck: `npm run build`.
- DB/SQL check without a server: apply `supabase/migrations/*` to PGlite in a
  small node script and assert (pattern used throughout this project). Note PGlite
  has no `storage`/`auth` schema, so test 0001-0003 (skip 0004) and create a stub
  `authenticated` role before applying RLS.
- App shows a friendly "configure Supabase" screen if env is missing (no crash).
- Common gotchas: invite emails are rate-limited on Supabase free tier (create
  users with a password + Auto Confirm instead); if the team hits a Vercel login
  wall before the app's own login, disable Vercel Deployment Protection (the app
  is already gated by Supabase auth).
