# EBY GTM CRM: State of the Build (2026-07-01)

> The single most complete record of what this system is, everything built so
> far, how it is deployed, and where it is going. This supersedes the 2026-06-30
> session handoff as the entry point for any new person or agent. Read this
> first, then EBY-MASTER-INDEX.md for the full doc set. Founder: Gal Rahav.
> Built with Claude Code.

Founder working rules (binding, always): no em-dashes, no emojis, no fluff,
plain confident language, one clear action at a time. Gal is non-technical:
give exact code and exact clicks, never just a filename. Hover help wherever
meaning is not obvious. Teach while doing.

---

## 1. Vision and goal

EBY itself is an AI platform reviving spoken Hebrew among diaspora Jews. This
system is the EBY founding team's go-to-market operating system.

The vision: the pipeline funnel and collaboration workspace a go-to-market team
cannot live without. One intuitive, addicting home where SDRs, BDRs, AEs, and
SEs run the entire funnel together: capture every conversation in seconds
(voice, paste, or a keystroke), see the whole pipeline on a living globe, move
deals through stages on a board with clear exit criteria, hand off warm context
between roles instead of cold notes, and always know the one next action that
moves each deal. It consolidates CRM, activity logging, follow-up discipline,
and team visibility into a single surface, so it becomes the first tab open
every morning and the last one closed at night.

Goals, in order:
1. Consolidation: everything the team needs to collaborate lives here.
2. Speed: logging a call takes under 90 seconds; creating a record takes
   seconds from anywhere.
3. Collaboration: SDR to AE to SE handoffs carry full context (who, what was
   said verbatim, what is next, and why it matters).
4. Habit: the product is beautiful, fast, and rewarding enough that using it is
   the path of least resistance.

Today it serves the EBY founding team (4 owners: Gal, Leah, Mashav, Michael).
The long-term goal is the perfect GTM system for teams, with EBY as design
partner zero.

---

## 2. Live identifiers

- Repo: github.com/galrahav1999-dev/eby-gtm-crm
- Production: https://eby-gtm-crm.vercel.app (Vercel team `globus2`, project
  `eby-gtm-crm`, project id `prj_UQ9Bd8R4Y21ejk6qOzRO48EwWkzE`)
- Production branch: `eby-gtm-crm`. Every push to a branch gets a Vercel
  preview at `eby-gtm-crm-git-<branch>-globus2.vercel.app`.
- Supabase project ref: `rrtiofpptqjxlxkzwkwt` (org `ywwegymhzqgistwqpotu`)
- Supabase auth callback: https://rrtiofpptqjxlxkzwkwt.supabase.co/auth/v1/callback

## 3. Stack and architecture

- Next.js 14 App Router + TypeScript + Tailwind. Server components fetch,
  client components interact. Server actions for writes.
- Supabase: Postgres (RLS on everything), Auth (invite-only email + Google
  button pending provider enablement), Storage (private `recordings` bucket).
- Vercel hosting and previews. Sentry wired but inert without a DSN.
- AI: Anthropic for extraction, OpenAI Whisper for transcription. Per-user
  encrypted keys are primary; server env keys are optional admin fallback.
- The core architectural idea is the field registry (`lib/schema/*`): every
  object is defined once (fields, widgets, options, sections, help text) and
  generic components render its list, board, detail, forms, quick-add,
  pickers, and the AI extraction schema from that one definition. A change in
  the registry updates every surface. `npm run verify:registry` proves every
  editable DB column is mapped.

## 4. Design system (as built)

"Fields at dawn": bright warm light theme (default), a cosmic brand dark, and
auto by hour, set as `<html data-theme>`. Tokens are CSS variables surfaced as
Tailwind names (surface, card, ink, line, primary, accent, growth, danger,
field). Reusable classes: `.card`, `.glass`, `.btn-primary/.btn-ghost/
.btn-danger`, `.chip`, `.label-eyebrow`, `.field-input`, `.skeleton`,
`.animate-rise`. Deterministic colors: `ownerColor` (fixed per teammate) and
`labelColor` (hashed per string) in `lib/colors.ts`.

CRITICAL rule that has bitten three times: never put a Tailwind opacity
modifier on a var-backed token (`bg-card/90` breaks). Use a solid token or
`color-mix(in srgb, var(--x) N%, transparent)`. A grep gate runs before every
push (see section 12).

## 5. Data model

Seven record objects, each with uuid `id`, human `display_id` set by a DB
trigger (ORG-, PER-, DL-, PLT-, PTR-, INT-, WL-), timestamps, and soft delete
via `archived_at`:
- organizations (13 editable columns), people (14), deals (24, Mom Test
  qualification fields), pilots (13), partners (11), interactions (10,
  append-only: create only, corrections append), waitlist_cohorts (8, B2C is
  cohort aggregates, never per-person rows).
Support tables: `field_options` (editable dropdown values, seeded from
`lib/enums.ts`), `audit_log` (immutable, every write logged), `ai_ingestions`
(logger runs with transcript, proposal, result ids for undo), plus
`user_ai_settings` (legacy single key), `rate_events` (rate limiting), and
`user_api_keys` (vault, on PR #32).
Stages: B2B deals use `1 Discovery` to `6 Closed Won / 6 Closed Lost`; pilots
`Identified` to `Converted/Churned`; partners `Identified` to `Productive/
Dropped`. Exit criteria per stage live in `lib/schema/stage-guide.ts` and show
on board column headers.
RLS: any authenticated teammate reads and writes everything; key tables are
own-row only. `owner` is a data attribute, not a permission boundary.
Live data is still small (about 2 orgs, 20 people); the build is capture-first
to fill it.

## 6. Everything shipped to production, by area

Foundation and capture (previous sessions, PRs #2 to #34):
- Design system + globe home + premium DataTable (PRs #2, #4).
- All 7 objects on the field registry with searchable comboboxes, add-new
  options, FK pickers with inline create; bespoke forms deleted (#5, #6).
- List tables show all DB columns 1:1, horizontally scrollable (#7, #8).
- AI logger funnel: up to 3 audio files and/or pasted text; audio uploads go
  browser-direct to Storage via a server-issued signed upload URL (Vercel body
  limit bypass); Whisper transcription; editable field-mapped review (every
  destination field, dropdowns from live options, per-record include); commit
  with links to created records; outcome screen with next steps (#9 to #16).
- Per-user AI keys, AES-256-GCM encrypted with server `ENCRYPTION_KEY`,
  Settings page; logger resolves the signed-in user's key (#19 to #21).
- Confirmation modal on destructive actions; logger "Connected: Claude"
  signal (#22, #23).
- Rate limiting: AI logger 12/min/user, inline-create API 60/min/user
  (#24, #25).
- Google sign-in button on login (#26, #27, #33, #34). Provider enablement in
  Supabase still pending (section 8).
- 15-minute idle session timeout with re-login dialog (#30, #31).
- Globe v1: neon beams to Jerusalem, country territory funnel, day/night/auto
  backdrop toggle, sunrise and sunset views (#17, #18, #28, #29, #33, #34).

This session (2026-06-30 to 07-01, PRs #37 to #42, all in production):
- #37 Deals Board (Kanban): Table/Board switch on deals, pilots, partners;
  drag a card to change stage (narrow audited `setStage` action); owner-colored
  cards with org, value, priority, overdue dot; per-column count and total;
  stage exit criteria on hover. Plus globe country polygons v1.
- #38 Dashboard rebuilt: owner scope filter recomputes everything; KPI tiles;
  B2B deal-stage funnel (count, value, stage-to-stage conversion, won/lost
  tiles); B2C waitlist funnel (Signups, Confirmed, Activated, Retained D30,
  Paid with conversion rates); compact deals-by-stage strip on the globe.
- #39 Cmd-K command palette: global search across all 7 objects
  (`/api/search`), keyboard navigation, "New X" actions.
- #40 Quick-add drawer: the palette's "New X" opens a right drawer with the
  object's essential fields (same registry widgets, inline FK create), Save,
  Save and add another (owner and segment stick), full-form link, toast with
  Open. Backed by `/api/form-bundle/[object]` and `quickCreateAction`.
- #41 Record dossier: detail pages are identity-left (monogram tile, chips,
  location, actions) and data-right, with a linked-records hub; each linked
  section has "Add X" opening the quick-add drawer prefilled with the link
  back. Registry-driven for all objects.
- #42 Globe v2: world-atlas country polygons with hover highlight and click to
  drill; World to Country to City drill with camera flights; right-side drill
  panel (cities, then records); Back button and Esc; auto-rotate locks on
  drill; clicking a record flies down then opens its card; animated flying
  beams to Jerusalem restored; owner-colored dots with pulsing rings; owner
  legend and "book" filter. Plus the Follow-up autopilot: a topbar Follow-ups
  button with a due-count badge opens a drawer of people and deals whose
  next_step_date is due, each with a drafted message the owner can Edit, Veto,
  or Log as an append-only Email interaction. Nothing is ever sent.

## 7. In progress right now

- PR #43 (draft, preview): country lock-in (the drilled country stays rendered,
  lifted, highlighted; polygon hover/click disabled while locked; closer zoom)
  and beacon-dot markers with a two-layer sonar pulse instead of pillars. Also
  the zoom-on-click fix: camera flights fire imperatively from the click
  handler and polygon dataset swaps no longer tween (the tween between
  different polygon sets can throw and freeze the scene). Awaiting Gal's visual
  check on the preview, then promote.
- PR #32 `feature/2fa-key-vault` (draft, preview, from the previous session):
  TOTP 2FA enroll/verify/turn-off via Supabase MFA + API key vault
  (`user_api_keys`, several keys per provider, one active, managed behind
  aal2). Key resolution: active vault key, then legacy `user_ai_settings`,
  then env. Awaiting Gal's test on its preview, then promote.

## 8. Queued next (agreed order)

1. Gal verifies PR #32 preview; promote 2FA + vault to production.
2. Preview-first (both can lock people out): require 2FA at first login
   (enforce enrollment + aal2 in shell/middleware); delete-account gated by
   2FA (needs a service-role edge function for auth-user deletion).
3. Finish Google OAuth: in Supabase Auth -> Providers -> Google, enable with a
   real OAuth Client ID (`...apps.googleusercontent.com`) + secret, and add the
   redirect URI (section 2) in Google Cloud. The button is live but errors
   until then.
4. Remaining parity/roadmap items in docs/EBY-PARITY-BACKLOG.md: owner's book
   toggle inside the dossier, AI logger pre-targeting from "Log conversation",
   LLM-drafted follow-ups (replace the templates), bulk paste import,
   territory scope on the dashboard, my-work view. Deliberately skipped for
   now, documented with reasons: overlaps detection, 2D map, ambient sound,
   "Connected to CRM" chip.

## 9. Environment variables (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: set.
- `ENCRYPTION_KEY` (32-byte base64): REQUIRED for per-user AI keys and the
  vault. Set in Vercel, never in the repo.
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`: optional admin fallback only.
  `ANTHROPIC_MODEL` defaults to `claude-sonnet-4-6`; `STT_MODEL` to `whisper-1`.
- `NEXT_PUBLIC_SENTRY_DSN`: optional.

## 10. Database migrations

`supabase/migrations/`: 0001 to 0005 (core objects, field_options, audit,
storage bucket, soft delete), 0006 `user_ai_settings`, 0007 `rate_events`,
0008 `user_api_keys`. All applied to the live project. The Supabase MCP
`apply_migration`/`execute_sql` tool sometimes drops its stream; retry, and
apply idempotently.

## 11. Key files map

- Registry: `lib/schema/{types,registry,organizations,people,deals,pilots,partners,interactions,waitlist_cohorts,stage-guide}.ts`
- Generic routes: `app/(app)/[object]/{page,new/page,[id]/page,[id]/edit/page}.tsx`
  (list+board, create, dossier detail, edit)
- Generic CRUD: `lib/crud.ts`, `lib/record-actions.ts` (incl. `quickCreateAction`),
  `lib/record-data.ts`, `app/(app)/board-actions.ts` (`setStage`)
- Capture UX: `components/crm/{CommandPalette,QuickAddDrawer,QuickAddButton,Board,DataTable,RecordForm,RecordPicker,Combobox,form,ConfirmModal}.tsx`
- Follow-ups: `components/crm/FollowUps.tsx`, `app/api/followups/route.ts`
- Dashboard: `app/(app)/dashboard/page.tsx`, `components/crm/DashboardView.tsx`
- Globe: `components/crm/GlobeHome.tsx`, fed by `app/(app)/page.tsx`;
  geocoding in `lib/geo.ts` (city/country lookup + jitter)
- AI logger: `app/(app)/logger/*`, `lib/ai/{extract,transcribe,commit,keys}.ts`
- Security: `lib/crypto.ts` (AES-256-GCM), `lib/rate-limit.ts`,
  `components/crm/IdleLogout.tsx`, `app/(app)/settings/*`
- APIs: `app/api/{search,followups,options,organizations}/route.ts`,
  `app/api/records/[object]/route.ts`, `app/api/form-bundle/[object]/route.ts`
- Shell: `app/(app)/layout.tsx`, `components/crm/{Sidebar,Topbar,ThemeToggle,ui}.tsx`
- Reference only, NOT mounted: the original Cockpit demo at root `components/*`,
  `lib/{data,store,metrics,useFiltered}.ts`, `data/companies.json`,
  `app/_cockpit-demo-page.tsx.bak`. It is the visual/UX reference for the
  globe, board, metrics, dossier, and approvals. Never import its fake schema
  or sample data.

## 12. Release flow and QA gates

- Branch flow: work on a feature branch, PR, Vercel preview, merge to the
  production branch `eby-gtm-crm`. The production approval rule is OFF; the
  assistant merges once gates pass. Auth-sensitive or centerpiece-visual
  changes go preview-first for Gal's eyes before promoting.
- Gates before every push (exact commands):
  1. `npm run build` (primary gate)
  2. `npm run verify:registry` (every DB column mapped)
  3. token-safety grep: no `/<number>` opacity modifier on var-backed tokens
     in changed files
- Gal is the visual QA via the preview URL; the build environment cannot see
  rendered UI, so ask him for screenshots.
- Every PR gets a body with What/Mapping/Verification; docs are updated at
  session end.

## 13. Security and privacy (binding summary)

Full policy: docs/EBY-DATA-SECURITY-AND-PRIVACY.md. Core rules: secrets are
AES-256-GCM encrypted at rest with a server-only `ENCRYPTION_KEY`, write-only
from the UI, never logged or audited in plaintext, refuse to store if the key
is absent. RLS on every table. Invite-only sign-in. No secrets or PII in
commits, PRs, comments, or screenshots. Interactions are append-only.
Transcription/extraction sends transcripts to the provider whose key is used;
disclosed to the team. Soft delete by default; hard delete on request.

## 14. Gotchas (hard-won, do not relearn)

1. No Tailwind opacity modifiers on var-backed tokens. Grep before push.
2. Audio must NOT pass through a Next/Vercel server action (body limit); use a
   server-issued signed upload URL and upload from the browser.
3. Supabase MFA: verify/elevate against a VERIFIED factor; stale unverified
   factors cause "Invalid TOTP code".
4. Supabase MCP migration tool drops its stream sometimes; retry.
5. react-globe.gl: do NOT add custom three.js objects via a direct
   `import * as THREE` next to react-globe.gl; a second three instance can
   blank the whole canvas (it did). Use native layers (points, arcs, rings,
   polygons). Do NOT tween polygon or point layers between differently-shaped
   datasets (`*TransitionDuration={0}` on swap); the tween can throw and
   freeze the scene. Avoid every-frame HTML-overlay occlusion checks.
6. Geist fonts come from the `geist` npm package, not next/font/google.
7. Fire globe camera flights imperatively from click handlers, not effects.

## 15. Doc index

Start here, then: EBY-MASTER-INDEX.md (map of all docs), EBY-PRD-DATA-CAPTURE.md
(capture system + field maps), EBY-PRD-AI-LOGGER-FUNNEL.md, EBY-PRD-AI-KEYS.md,
EBY-PRD-2FA-AND-KEY-VAULT.md (on the PR #32 branch), EBY-DATA-SECURITY-AND-
PRIVACY.md, EBY-DESIGN-SYSTEM.md, EBY-TECH-HANDOFF.md, EBY-QA.md, EBY-DEVOPS.md,
EBY-STRATEGY-AND-ROADMAP.md, EBY-PARITY-BACKLOG.md (Cockpit parity: done,
deferred, next), EBY-AGENT-ORG-PROMPT.md (the agent organization charter).
