# EBY GTM CRM — Data Capture PRD (the beautiful way to fill the database)

> The product and design spec for how data enters this CRM. Goal: the most
> beautiful, lowest-friction capture experience for a five-person founding team
> in a discovery sprint, where every screen maps exactly to the Supabase schema
> and every database column is capturable through every on-ramp. Read with
> EBY-MASTER-INDEX.md, EBY-TECH-HANDOFF.md (the field-registry framework),
> EBY-DESIGN-SYSTEM.md (implemented tokens), and EBY-STRATEGY-AND-ROADMAP.md.
> This is a planning doc. Build follows in tiers (section 16) after approval.

Author: Gal Rahav, built with Claude Code. Status: PLAN for approval. Last
updated: 2026-06-28.

Working rules honored throughout: no em-dashes, no emojis, no fluff, plain
confident language, one clear action at a time, hover help wherever meaning is
not obvious (the team is non-technical).

---

## 1. The one thing

Today the database is almost empty (2 organizations, 20 people, 1 interaction,
zero deals, pilots, partners, and cohorts). The schema and the field-registry
framework are solid. The bright design system exists but is not yet applied to
the capture screens. So the single highest-leverage work is not more schema. It
is the capture experience: turning what happens in the field (calls, notes,
lists, interviews) into clean, linked, complete records, fast and beautifully,
with the UI mapping one to one to the database.

This PRD specifies that experience end to end: four on-ramps (quick add, full
forms, the AI logger funnel, bulk import), all driven by one registry, all able
to fill every column of every object.

---

## 2. Verified system state (what is actually true today)

Confirmed by reading the live Supabase schema, the field registry, every form
component, the AI logger pipeline, and the implemented design tokens.

- **Objects (7 record tables):** organizations, people, deals, pilots, partners,
  interactions, waitlist_cohorts. Plus field_options (147 seeded values),
  audit_log, ai_ingestions. Every record has a uuid `id` and a human `display_id`
  (ORG-, PER-, DL-, PLT-, PTR-, INT-, WL-, AIN-) set by a DB trigger. Soft delete
  via `archived_at` on all record tables. RLS: any authenticated teammate
  read/writes everything.
- **Framework live for People and Organizations only.** They render entirely
  from `lib/schema/people.ts` and `organizations.ts` through `RecordForm`,
  `RecordPicker` (searchable FK with inline create), and `Combobox` (searchable
  dropdown with inline add-new written to field_options).
- **Deals, Pilots, Partners, Interactions, Waitlist are still bespoke** (`DealForm`,
  `PilotForm`, `PartnerForm`, `InteractionForm`, `CohortForm`). They use plain
  `SelectField` dropdowns (no add-new) and plain `RecordSelect` FK dropdowns (no
  search, no inline create).
- **Column coverage audit result:** the bespoke forms do currently reach all
  editable columns of their tables. There is no literal missing-field bug. The
  real gaps are consistency, widget quality, and the AI on-ramp (next point).
- **AI logger covers 4 of 7 objects and a subset of columns.** `extract.ts`
  proposes organizations, people, interactions, and deals only. It omits pilots,
  partners, and waitlist entirely, and for deals it omits the three buyer roles
  (economic_buyer_id, poc_id, champion_id), seats, acv, opportunity_start,
  expected_close, and the closed reasons. This is where "the UI cannot fill the
  DB" is genuinely true.
- **No quick-add and no bulk import.** From an empty database there is no
  one-keystroke way to add a record, and no way to paste or upload a list.
- **Design system, as built:** light "fields at dawn" theme (default) plus a
  brand cosmic dark, auto by time of day, set via `<html data-theme>`. Tokens are
  CSS variables surfaced as Tailwind semantic names (surface, card, ink, line,
  primary, accent, growth, danger, field). Reusable classes: `.card`, `.glass`,
  `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-danger`, `.chip`, `.label-eyebrow`,
  `.field-input`, `.logo-tile`, `.bg-primary-soft`, `.skeleton`, `.animate-rise`.
  Deterministic colors via `ownerColor` and `labelColor`. The home route is a
  full-screen living globe; the data dashboard is `/dashboard`. Forms, AI logger,
  and login are flagged "still plainer than Grade-A" in the design doc.
- **Critical design constraint:** never put a Tailwind opacity modifier on a
  var-backed token (`bg-card/90` etc. break). Use a solid token or
  `color-mix(...)`. This has bitten the project twice.

---

## 3. The verified UI to DB coverage audit

This is the factual basis for "every table maps exactly to all DB columns." For
each object: editable columns (excluding id, display_id, created_at, updated_at,
archived_at, which the app never writes) and whether they are reachable in the UI
today and through the AI logger.

| Object | Editable columns | In a manual form today | In the AI logger today |
|---|---|---|---|
| organizations | 13 | all 13 (registry) | 10 of 13 (no domain, owner; status as enum) |
| people | 14 | all 14 (registry) | 12 of 14 (no email mapping to picker, owner via enum) |
| deals | 24 | all 24 (bespoke) | 13 of 24 (no buyer roles, seats, acv, dates, close reasons) |
| pilots | 13 | all 13 (bespoke) | 0 (not in funnel) |
| partners | 11 | all 11 (bespoke) | 0 (not in funnel) |
| interactions | 10 | all 10 (bespoke) | 9 of 10 (no deal link) |
| waitlist_cohorts | 8 | all 8 (bespoke) | 0 (not in funnel) |

Takeaways that drive the spec:
1. Manual forms are column-complete but inconsistent (only 2 of 7 use the good
   widgets). Porting the other 5 to the registry makes every field a searchable,
   add-new, inline-create input automatically.
2. The AI logger is the biggest true gap. It must be able to propose every object
   and every column, built from the same registry so it can never drift again.
3. Detail and list views must be audited too: lists are summaries (a chosen
   subset), but the detail page must show every column so nothing is ever hidden.

---

## 4. Problem, goals, non-goals, success metrics

### Problem
Five founders are interviewing teachers, principals, parents, and learners during
a validation sprint. Everything they learn must land in the CRM as clean, linked
records. Right now capture is slow (full forms only), partial (the AI path misses
most fields and objects), inconsistent (5 of 7 objects use weaker inputs), and
visually plain. The database stays empty, so the dashboard and globe stay empty,
so the tool does not yet earn daily use.

### Goals
1. Make every database column capturable through a beautiful, consistent UI.
2. Offer the right on-ramp for every moment: instant quick-add, precise full
   forms, the AI funnel for calls and notes, and bulk paste for lists.
3. Hold a craft bar of Linear, Attio, Superhuman: fast, keyboard-first, calm
   density, satisfying motion, beautiful defaults, in the bright EBY theme.
4. Guarantee one to one UI-to-DB mapping forever by routing all capture through
   the field registry (the same source the AI schema is built from).
5. Make capture safe: validation, dedupe warnings, inline FK create, hover help,
   audit on every write, recoverable via soft delete.

### Non-goals (for this PRD)
- Reporting, analytics, and the dashboard beyond what already exists.
- Per-user AI keys and the encrypted settings table (Phase 4 of the roadmap;
  referenced where it touches the funnel, not specified here).
- The globe restyle and Higgsfield hero media (separate design backlog).
- Heavy data migration tooling (the team is mostly net-new from here; a simple
  paste/CSV import is in scope, a full HubSpot sync is not).

### Success metrics
- **Time to log a discovery call:** under 90 seconds from "open the app" to a
  saved interaction linked to a person and org (AI path), under 3 minutes manual.
- **Field completeness:** median filled fields per new record rises (target: org
  and person records average 8+ non-null fields; deals 10+).
- **Coverage:** 7 of 7 objects and 100 percent of editable columns reachable in a
  manual form and proposable by the AI logger.
- **Adoption:** records created per week per active owner; quick-add used in a
  majority of single-record creates.
- **Zero data loss:** every create/edit audited; archive (not delete) on every
  object; dedupe warnings shown before a duplicate org or person is created.

---

## 5. Users and jobs to be done

Owners: Gal, Leah, Mashav, Michael. Five-ish internal users, non-technical,
mobile and desktop, often mid-conversation or just off a call.

Jobs:
1. "I just got off a discovery call. Capture the person, their org, what they
   said in their words, and the next step, in under two minutes." (AI funnel)
2. "I have a name and a school from a referral. Add them now without losing my
   place." (quick-add)
3. "I am qualifying a school as a real opportunity. Fill the Mom Test fields
   carefully." (full deal form)
4. "Someone sent me a list of 30 Hebrew schools. Get them in so I can work them."
   (bulk import)
5. "I am updating a pilot's stage and next step from my phone between meetings."
   (fast edit, mobile)
6. "I need to find this org and add a deal to it without leaving the page."
   (inline FK create, record-as-hub)

Design implication: optimize for speed and for not losing context. Capture should
be summonable from anywhere, never a full-page detour when a small one will do.

---

## 6. Design principles for capture

Grounded in the implemented design system and the craft references.

1. **Light, air, and focus.** One primary action per view. Generous whitespace.
   Cards on warm paper. The form is calm, not a wall of inputs.
2. **The fastest correct path wins.** Keyboard-first. Quick-add from anywhere
   (global plus and a command palette). Enter to save, Escape to dismiss.
3. **Every input is the good input.** Searchable comboboxes with inline add-new,
   searchable FK pickers with inline create, full country search. No dead-end
   dropdowns. This is automatic once an object is on the registry.
4. **Show every field, hide nothing.** Lists are summaries; detail shows all
   columns; forms expose all editable columns, grouped into calm sections.
5. **Help where meaning is not obvious.** A `?` HelpTip on any field whose intent
   a non-technical teammate might miss. Verbatim-quote and Mom-Test fields get
   guidance text.
6. **Safe by default.** Validate required fields inline, warn on likely
   duplicates, coerce empties to null, audit every write, archive not delete.
7. **Motion with meaning.** Section and row entrance via `.animate-rise`, modal
   and drawer transitions on the standard `--ease`, satisfying save confirmation.
   Always respect prefers-reduced-motion.
8. **One system, restyle once.** All capture flows through shared, registry-driven
   components, so a token or component change updates everything.

---

## 7. The capture system: information architecture

Four on-ramps, one registry, one set of components. Each suits a different moment.

```
                         ┌────────────────────────────┐
                         │   FIELD REGISTRY (lib/schema)│
                         │  one definition per object   │
                         └──────────────┬───────────────┘
            renders            builds schema for         drives
        ┌───────────────┬──────────────┼──────────────┬───────────────┐
        ▼               ▼              ▼               ▼               ▼
   Quick Add        Full Form     AI Logger        Bulk Import   Inline FK Create
  (Cmd-K / +)     (new / edit)   (funnel v2)     (paste / CSV)   (from any picker)
        │               │              │               │               │
        └───────────────┴──────────────┴───────────────┴───────────────┘
                                   ▼
                         Supabase (validated, audited, deduped)
```

1. **Quick Add** (section 9): the global plus button and the command palette.
   The fastest way to create one record. A focused drawer with the essential
   fields, "save and add another," and a link to open the full form.
2. **Full forms** (section 10): the registry-driven create and edit pages. Every
   editable column, grouped into sections, with a completeness meter and a sticky
   save bar. The precise path.
3. **AI logger funnel v2** (section 11): capture (audio or text), choose target
   (detect everyone, attach to existing, or create new), extract to the full
   registry schema, review per record with inline edit and dedupe warnings,
   commit. The fast path for calls and notes.
4. **Bulk import** (section 12): paste rows or upload a CSV, map columns to
   fields, preview with dedupe, commit. The on-ramp for existing lists.
5. **Inline FK create** (section 13): from any FK picker, create the related
   record in a modal without leaving the form. Already built generically; extend
   to all objects.

---

## 8. Universal capture primitives

These are the building blocks every on-ramp shares. Specifying them once keeps
the system consistent.

### 8.1 Widget set and the type to widget mapping

Current widgets (in `lib/schema/types.ts`): text, email, textarea, number, money,
date, select, combobox, country, fk. They cover the schema. The mapping rule:

| Postgres type / role | Widget | Notes |
|---|---|---|
| text, free | text or textarea | textarea for notes, pains, outcomes, ideal state |
| text, enumerated (field_options) | combobox (addNew) | searchable, inline add-new |
| text, country | country | full searchable country list |
| text, email | email | format hint, used for people dedupe |
| uuid FK to org/person/deal | fk (inlineCreate) | searchable picker, inline create |
| integer (seats, signups, etc.) | number | coerced via `num()`; add `integer` flag |
| numeric (acv) | money | currency display, tabular figures |
| date | date | native date input, ISO stored |
| computed (waitlist percentages) | computed (display only) | detail only, not stored |

### 8.2 FieldDef extensions needed (small, additive)

To express the remaining objects fully and beautifully, extend `FieldDef`:

- `hint?: string` — short helper text under the input (the bespoke forms use this
  heavily, for example "Controls budget, signs"; the registry has only `help`).
- `integer?: boolean` — render and validate whole numbers (seats, signups,
  confirmed, activated, retained_d30, paid).
- `showWhen?: (row) => boolean` — conditional display. Used so closed_won_reason
  shows only when stage is a closed-won stage, and closed_lost_reason only when
  closed-lost. Keeps the deal form calm until relevant.
- `group?: string` — render a set of fields on one row (the three deal buyer
  roles as a three-up group, the waitlist funnel counts as a five-up group).
- `computed?: (row) => string` and `computeLabel?` — detail-only derived values
  (waitlist Confirm percent and Signup-to-paid percent), never written to the DB.
- `colSpan?: 1 | 2` — already implicit for textarea; make it explicit.
- `defaultValue?` — for example interaction date defaults to today.

These are additive and backward compatible; People and Organizations keep working
unchanged.

### 8.3 Validation and coercion (already partly built, make universal)

- Required fields validated from the registry (`required`), shown inline at the
  field, not just at the top. Today validation throws a single error string;
  upgrade to field-level messages.
- Empty strings coerce to null (`str()`), numbers via `num()` (`lib/format.ts`).
- Enum membership is guaranteed by construction (comboboxes only emit known values
  or write a new one to field_options).
- Dates stored ISO, displayed in locale, overdue computed by `isOverdue`.

### 8.4 Dedupe (shared helper `findDuplicates`)

Before creating an org (match on name and domain) or a person (match on email,
then full name), check for likely matches and show a non-blocking warning with a
"use existing" action. Used by quick-add, full forms, the AI commit, and import.

### 8.5 Hover help and copy

Every non-obvious field carries `help`. Verbatim and Mom Test fields carry guidance
(for example pains: "Quote them verbatim. This is the real signal."). Copy stays
plain, no em-dashes, no emojis.

---

## 9. Hero flow A: Quick Add

The fastest single-record create, summonable from anywhere.

### Triggers
- A persistent **plus button** in the topbar (right of center), tooltip "New
  record (press C)".
- **Command palette** (Cmd or Ctrl K): type "new person", "new deal at Hartman",
  or just start typing a name. Also the global jump-to-record search.
- Keyboard: `C` then the object's first letter (C then P for person), the Linear
  pattern.

### Behavior
- Opens a **right-side drawer** (not a full page), 420px, `.glass` over a dimmed
  backdrop, entering on `--ease`. The app stays visible behind it, so context is
  not lost.
- Shows the object's **essential fields only** (a new registry flag
  `quickAdd: true` per field, defaulting to the existing `quickCreate` set), with
  a "More fields" expander that reveals the rest inline, and a "Open full form"
  link for the precise path.
- Inline FK pickers work here too (create the org while adding the person).
- Footer actions: **Save** (primary), **Save and add another** (keeps the drawer
  open, clears the form, keeps the last owner and segment as sticky defaults), and
  **Cancel** (Escape).
- On save: a toast "Person created. PER-0000021" with an "Open" action, the new
  record appears in any open list, and (if relevant) the globe gains a point.

### Why a drawer
Quick-add must never feel like leaving what you were doing. A drawer over the
current screen is the Attio and Superhuman pattern for low-friction capture.

---

## 10. Hero flow B: Full forms (registry-driven, beautiful)

The precise path: every editable column, grouped, with completeness feedback.

### Layout (the form shell)
- A centered column, max width about 760px on `--paper`, with the dawn background
  gradient behind.
- **Header:** eyebrow ("New deal" or the display_id when editing), the record
  title as it forms (live from the title function), and a back button.
- **Completeness meter:** a thin gradient bar (sky to gold, the brand dawn
  gradient) showing how many fields are filled, with a count ("11 of 24 filled").
  Calm encouragement, never a nag, never required-only.
- **Sections as cards:** each `section` from the registry is a `.card` with a
  `.label-eyebrow` heading, fields in a responsive two-column grid (textarea and
  grouped rows span full width). Sections enter with `.animate-rise`, staggered.
- **Sticky save bar** at the bottom: primary Save, ghost Cancel, and on edit a
  "Saved" state with a subtle check after success. On desktop it docks to the
  form; on mobile it pins to the viewport bottom so Save is always one thumb away.
- **Field-level validation:** required fields show a red asterisk and, on a failed
  submit, an inline message under the offending field with focus moved to the
  first error.

### Per-object section model
Sections come straight from the registry so detail and form always agree. The
recommended sections per object are in the field maps (section 14). Examples:
- Deal: Basics, Who's who (three buyer roles, grouped), Qualification (Mom Test),
  Commercials and follow-up, If closed (conditional reasons).
- Pilot: Setup, Fit (urgency, capability, representativeness), Operating cadence,
  Tracking.
- Interaction: this is append-only; the form is create-only, no edit or delete,
  date defaults to today, and it can be pre-targeted (person, org, deal) when
  opened from a record (see 13).

### Edit vs autosave
Create uses an explicit Save (the user is composing). Edit on the detail page can
use **inline field editing** (click a value, edit, blur to save) for speed, with
optimistic UI and a quiet "Saved" pip, plus optimistic-concurrency guard on
`updated_at`. The full edit form remains available for a careful pass.

---

## 11. Hero flow C: The AI logger funnel v2

The fast path for calls and notes, and the biggest current gap to close. One
guided flow at `/logger`, four steps, that can propose every object and column.

### Step 1: Capture
Three tabs in one `.card`: **Upload audio**, **Record in browser**, **Paste or
type text**. Audio is stored in the private `recordings` bucket, transcribed
(Whisper), and the transcript is shown and editable before extraction. A clear
state when the AI key is not set, with a link to settings (Phase 4).

### Step 2: Target (the funnel)
A choice, presented as three calm cards:
1. **Detect everyone** (multi-record): the model proposes all organizations,
   people, deals, interactions it finds.
2. **Attach to existing**: search and pick a person, org, or deal; the model
   focuses on that record and always produces an interaction against it.
3. **Create new**: create a person or org now (inline) and attach the parsed
   information to it. This satisfies "from the same screen, create a new person or
   org and parse the notes into their log."

### Step 3: Extract (full coverage, built from the registry)
- The extraction tool schema is generated from the **registry plus live
  field_options**, so it always matches the current fields and can never emit an
  invalid enum. This replaces the hand-maintained schema in `extract.ts`.
- Coverage expands to **all 7 objects** and all text or enum columns. FK and
  date and numeric columns the model can infer (seats, acv, timelines, the three
  buyer roles by name reference) are proposed; anything unknown stays null.
- Rules unchanged and enforced: never invent, null when unknown, quotes verbatim,
  link by name, always produce one interaction with the sharpest quote, and list
  "to chase next" for the blanks.

### Step 4: Review and commit
- Each proposed record is a **card with an include toggle and inline edit** of
  every field using the same widgets as the forms (so a wrong enum is one click to
  fix, an FK is searchable, a new org can be created on the spot).
- **Dedupe warnings** inline ("Looks like an existing org: Hartman. Merge?") with
  a one-click "use existing".
- A **summary header**: "4 records ready: 1 org, 1 person, 1 deal, 1 interaction".
- Commit creates the included records, de-duping orgs by name and people by email
  or full name, resolving links by the AI's name references, appending the
  interaction, and storing audio, transcript, proposal, and result on the
  ingestion. The run is audited, and an **Undo** removes the records created in
  that run via the stored result ids.

### Why this matters most
The team is interviewing now. This flow turns a conversation into a complete,
linked, multi-object record set in well under two minutes, and because its schema
is the registry, it stays correct forever.

---

## 12. Hero flow D: Bulk import (lighter, since mostly net-new)

For the occasional list (referred schools, a contact export). Three steps.

1. **Paste or upload:** paste tab-separated or comma rows, or drop a CSV. The
   target object is chosen first (Organizations or People are the common cases).
2. **Map columns:** a two-column mapper (their header on the left, our field on
   the right, from the registry), with smart guesses by header name. Unmapped
   columns are ignored; required fields must be mapped. Enum values are matched to
   field_options with a "add as new option" choice for unknowns.
3. **Preview and commit:** a table preview with per-row validation and dedupe
   flags (existing org or person highlighted, with skip or merge), a count of
   "will create / will skip", then commit. Every created row is audited.

Kept deliberately simple: no scheduling, no external connectors. It exists so an
empty database can be seeded from a list in minutes.

---

## 13. Inline FK create and record-as-hub

- **Inline create from any picker** is already built generically (`RecordPicker`
  plus `/api/records/[object]`, driven by each object's `quickCreate`). Extend it
  to all objects once they are on the registry. From a deal you can create the
  org, the economic buyer, the POC, and the champion without leaving the form.
- **Record detail as a hub:** every detail page shows linked records
  (interactions, people at an org, deals at an org) and an in-context "Add"
  (add a person to this org, log a conversation about this deal). "Log
  conversation" opens the AI funnel pre-targeted to this record (step 2, attach to
  existing). This makes the detail page a capture surface, not just a read view.

---

## 14. The complete field-by-field UI to DB mapping (all 7 objects)

This is the contract: every editable column, its widget, options or FK, whether
required, whether it appears in the list summary, the section it lives in, and its
hover help. Columns the app never writes (id, display_id, created_at, updated_at,
archived_at) are omitted. People and Organizations already match this; the other
five are the porting spec.

Legend: R = required, L = shown in list summary (detail and form always show all).

### 14.1 organizations (ORG-) — live on registry

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Organization name | name | text | - | R | L | Basics | - |
| Website / domain | domain | text | - | | | Basics | Used to recognize duplicates |
| Org type | org_type | combobox+add | org_type | | L | Basics | What kind of organization |
| Segment | segment | combobox+add | segment | | L | Basics | GTM segment |
| Age / grade band | age_band | combobox+add | age_band | | | Profile | - |
| Denomination | denomination | combobox+add | denomination | | | Profile | Religious affiliation where relevant |
| City | city | text | - | | L | Location | - |
| Country | country | country | - | | L | Location | - |
| Size | size | text | - | | | Profile | Rough size, free text |
| Affiliation / network | affiliation | text | - | | | Profile | Umbrella network, e.g. Schechter |
| Owner | owner | combobox+add | owner | | L | Tracking | EBY teammate who owns this |
| Status | status | combobox+add | org_status | | L | Tracking | Where outreach stands |
| Notes | notes | textarea | - | | | Notes | - |

### 14.2 people (PER-) — live on registry

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| First name | first_name | text | - | | L | Identity | - |
| Last name | last_name | text | - | | | Identity | - |
| Email | email | email | - | | | Identity | Used to recognize duplicate people |
| Role / title | role_title | combobox+add | person_role | | L | Identity | Their role; add a new one if none fits |
| Organization | org_id | fk + create | organizations | | L | Identity | Link to a school/org, or leave blank for an individual |
| Segment | segment | combobox+add | segment | | L | Profile | GTM segment |
| City | city | text | - | | | Location | - |
| Country | country | country | - | | | Location | - |
| Source | source | combobox+add | source | | | Profile | How we found them |
| Lifecycle | lifecycle | combobox+add | lifecycle | | L | Profile | Where they are in our process |
| Owner | owner | combobox+add | owner | | | Tracking | EBY teammate who owns this contact |
| Next step | next_step | text | - | | | Tracking | - |
| Next-step date | next_step_date | date | - | | L | Tracking | Shows red on the dashboard when due or overdue |
| Notes | notes | textarea | - | | | Notes | - |

### 14.3 deals (DL-) — to port (currently bespoke, column-complete)

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Deal name | name | text | - | R | L | Basics | e.g. Hartman - K8 spoken Hebrew pilot |
| Organization | org_id | fk + create | organizations | | L | Basics | The school or org this deal is with |
| Stage | stage | combobox+add | b2b_stage | | L | Basics | Pipeline stage |
| Priority | priority | combobox+add | priority | | L | Basics | - |
| Owner | owner | combobox+add | owner | | L | Basics | EBY teammate who owns this deal |
| Economic buyer | economic_buyer_id | fk + create | people | | | Who's who (group) | Controls budget, signs |
| Point of contact | poc_id | fk + create | people | | | Who's who (group) | Day-to-day coordinator |
| Champion | champion_id | fk + create | people | | | Who's who (group) | Advocates for us inside |
| Has Hebrew program today? | has_hebrew | combobox | yes_no_unknown | | | Qualification | - |
| Current solution / curriculum | current_solution | text | - | | | Qualification | - |
| Current state | current_state | textarea | - | | | Qualification | How it is going today |
| Pains | pains | textarea (quote) | - | | | Qualification | Quote them verbatim. This is the real signal |
| Ideal state | ideal_state | textarea | - | | | Qualification | What good looks like to them |
| Eval start timing | eval_timing | combobox+add | eval_timing | | | Qualification | - |
| Decision timeline | decision_timeline | combobox+add | decision_timeline | | | Qualification | - |
| Seats (qty) | seats | number (integer) | - | | | Commercials | - |
| ACV / expected value | acv | money | - | | | Commercials | e.g. 36000 |
| Opportunity start | opportunity_start | date | - | | | Commercials | - |
| Expected close | expected_close | date | - | | | Commercials | - |
| Next step | next_step | text | - | | | Commercials | - |
| Next-step date | next_step_date | date | - | | L | Commercials | Overdue highlighted |
| Closed-won reason | closed_won_reason | combobox+add | closed_won_reason | | | If closed (showWhen won) | Fill only when won |
| Closed-lost reason | closed_lost_reason | combobox+add | closed_lost_reason | | | If closed (showWhen lost) | Fill only when lost |
| Notes | notes | textarea | - | | | Notes | - |

### 14.4 pilots (PLT-) — to port

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Organization | org_id | fk + create | organizations | | L | Setup | The org running the pilot |
| Champion | champion_id | fk + create | people | | | Setup | The internal advocate |
| Stage | stage | combobox+add | pilot_stage | | L | Setup | - |
| Urgency | urgency | combobox+add | urgency | | L | Fit | Real, burning need? |
| Capability | capability | text | - | | | Fit | Can they implement? |
| Representativeness | representativeness | text | - | | | Fit | Typical of the market? |
| Success metric | success_metric | text | - | | | Fit | The agreed measure of success |
| Feedback cadence | feedback_cadence | combobox+add | feedback_cadence | | | Operating cadence | - |
| DPA signed? | dpa_signed | combobox | yes_no_unknown | | | Operating cadence | Data processing agreement |
| Convert-by date | convert_by | date | - | | L | Operating cadence | Target date to convert to a paid deal |
| Owner | owner | combobox+add | owner | | L | Tracking | - |
| Next step | next_step | text | - | | | Tracking | - |
| Notes | notes | textarea | - | | | Notes | - |

### 14.5 partners (PTR-) — to port

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Partner organization | partner_org | text | - | R | L | Basics | The partner org name (free text; not an FK today) |
| Partner type | partner_type | combobox+add | partner_type | | L | Basics | - |
| Primary contact | primary_contact_id | fk + create | people | | | Basics | Main person at the partner |
| Stage | stage | combobox+add | partner_stage | | L | Basics | - |
| Owner | owner | combobox+add | owner | | L | Basics | - |
| Expected reach | expected_reach | text | - | | | Value | Number of end-customers, free text |
| What they give us | what_they_give | text | - | | | Value | Reach or access they provide |
| Commission / terms | terms | text | - | | | Value | - |
| Next step | next_step | text | - | | | Tracking | - |
| Next-step date | next_step_date | date | - | | L | Tracking | Overdue highlighted |
| Notes | notes | textarea | - | | | Notes | - |

Note: partner_org is free text today. A future option is to make partners point at
an organization FK; out of scope here, flagged in open questions.

### 14.6 interactions (INT-) — to port, append-only

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Date | date | date (default today) | - | | L | Basics | When the conversation happened |
| Type | type | combobox+add | interaction_type | | L | Basics | - |
| Person | person_id | fk + create | people | | L | Links | Who we spoke with |
| Organization | org_id | fk + create | organizations | | L | Links | Their org |
| Deal | deal_id | fk + create | deals | | | Links | Related deal, if any |
| Owner | owner | combobox+add | owner | | L | Basics | EBY teammate on the call |
| Outcome | outcome | textarea | - | | | Substance | What happened |
| Verbatim quote | verbatim_quote | textarea (quote) | - | | | Substance | Their exact words. This is the Mom-Test gold |
| Next step | next_step | text | - | | | Follow-up | - |
| Next-step date | next_step_date | date | - | | L | Follow-up | Overdue highlighted |

Append-only: create only, no edit or delete in the UI (the registry `appendOnly`
flag). A guarded "add correction" appends a new interaction rather than mutating
history.

### 14.7 waitlist_cohorts (WL-) — to port, with computed funnel

| Field | Column | Widget | Options / FK | R | L | Section | Help |
|---|---|---|---|---|---|---|---|
| Cohort | cohort_label | text | - | R | L | Basics | Month plus source, e.g. 2026-06 Excel referral |
| Segment | segment | combobox+add | segment | | L | Basics | - |
| Signups | signups | number (integer) | - | | L | Funnel (group) | - |
| Confirmed | confirmed | number (integer) | - | | | Funnel (group) | - |
| Activated | activated | number (integer) | - | | | Funnel (group) | - |
| Retained (D30) | retained_d30 | number (integer) | - | | | Funnel (group) | Still active at 30 days |
| Paid | paid | number (integer) | - | | L | Funnel (group) | - |
| Confirm percent | (computed) | computed | - | | | Funnel | confirmed / signups, display only |
| Signup to paid percent | (computed) | computed | - | | | Funnel | paid / signups, display only |
| Notes | notes | textarea | - | | | Notes | - |

The two percentages are computed in the UI (detail and list), never stored, as
today. The list view for waitlist shows the funnel inline.

---

## 15. Registry and pipeline changes this requires

Concrete, additive, and safe (each verifiable with build plus PGlite).

1. **Add five ObjectDefs** to `lib/schema/`: `deals.ts`, `pilots.ts`,
   `partners.ts`, `interactions.ts`, `waitlist_cohorts.ts`, each exactly per the
   maps in section 14, and register them in `registry.ts` so the generic
   `[object]` routes serve them. Then delete the bespoke folders and `*Form`
   components once parity is confirmed.
2. **Extend FieldDef** with `hint`, `integer`, `showWhen`, `group`, `computed`,
   `defaultValue`, `colSpan` (section 8.2). Update `RecordForm`/`FieldInput` to
   render groups on a single row, conditional fields, and integer inputs, and the
   detail renderer to show computed values.
3. **appendOnly support** in the generic detail and routes (interactions: no edit
   or delete; create-only form; "add correction").
4. **Custom waitlist list renderer** for the computed funnel percentages (a small
   override the registry already anticipates).
5. **Field-level validation**: change `validate()` to return per-field messages
   and surface them inline in `RecordForm`.
6. **Quick Add**: a `QuickAdd` drawer component plus a `quickAdd` field flag
   (defaulting to `quickCreate`), wired to the topbar plus and the command palette.
7. **Command palette**: a Cmd-K overlay for jump-to-record and run-action (new X),
   backed by global search (Postgres trigram or full-text across names, emails,
   org names, notes, quotes).
8. **AI logger v2**: build the extraction schema from the registry plus live
   field_options (replace the hand-written schema in `extract.ts`); expand
   `commit.ts` to all 7 objects and the added columns; add the target step, inline
   edit in review, dedupe warnings, and undo.
9. **Bulk import**: an import route with paste/CSV parse, a registry-driven column
   mapper, dedupe preview, and a batched, audited commit endpoint.
10. **Shared `findDuplicates`** helper used by quick-add, forms, AI commit, import.
11. **Restyle through shared components only** so the bright theme applies once
    everywhere (this also closes the design doc's "forms and logger still plainer"
    item). No new schema columns are required for any of this.

---

## 16. Build tiers (each shippable and verified)

Sequenced so value lands fast and risk stays low. Each tier: build, `npm run
build`, PGlite for any SQL, push to a feature branch, PR into develop, preview,
screenshot review, promote.

- **Tier 0 (foundation, half a slice):** extend FieldDef (hint, integer,
  showWhen, group, computed, defaultValue) and field-level validation. No visible
  change yet; unblocks everything.
- **Tier 1 (port the five objects):** add the five ObjectDefs, appendOnly, the
  waitlist custom list. Outcome: all 7 objects on the framework, every column on a
  searchable, add-new, inline-create form. Delete bespoke files. This alone makes
  the whole app consistent and column-complete.
- **Tier 2 (Quick Add plus command palette):** the drawer, the topbar plus, Cmd-K,
  global search. Outcome: create any record in seconds from anywhere.
- **Tier 3 (AI logger v2):** registry-built schema, all-object coverage, the
  target step, inline review edit, dedupe, undo. Outcome: a call becomes a full
  linked record set in under two minutes.
- **Tier 4 (bulk import):** paste/CSV, mapper, dedupe preview, batched commit.
  Outcome: seed from a list in minutes.
- **Tier 5 (capture polish):** completeness meter, sticky save bar, inline detail
  editing with concurrency guard, record-as-hub "Add" and "Log conversation"
  pre-targeting, empty states, motion pass, full hover-help sweep.

Tiers 0 and 1 are the backbone and should ship first. Tier 3 is the highest user
value during the sprint and can be pulled forward right after Tier 1 if desired
(it depends on Tier 0 and the registry, not on Tier 2).

---

## 17. Visual and interaction detail (so build matches intent)

- **Form shell:** centered 760px, `.card` sections, `.label-eyebrow` headings,
  two-column grid (`md:grid-cols-2`), textarea and groups full width. Section
  entrance staggered with `.animate-rise`.
- **Inputs:** `.field-input` everywhere, focus ring via `color-mix` (never an
  opacity modifier on a token), comboboxes and pickers as already built, restyled
  to the bright tokens (replace the dark `bg-ink-800` classes still in
  `form.tsx`, `Combobox.tsx`, `RecordPicker.tsx` with semantic tokens).
- **Completeness meter:** a 4px bar with the dawn gradient (sky to gold), label
  "N of M filled" in `.label-eyebrow`. Encouraging, not blocking.
- **Save bar:** sticky, `.glass`, primary Save plus ghost Cancel; success shows a
  check and "Saved" then settles. Disabled and "Saving..." states from
  `useFormStatus` (already used).
- **Quick-add drawer:** 420px, `.glass`, right side, backdrop dim, `--ease`
  transition, Escape closes, Enter saves, "Save and add another" keeps it open.
- **Toasts:** bottom-right, `.card`, with the new display_id and an "Open" action.
- **Dedupe warning:** an amber `.chip`-led inline callout (amber via token-safe
  `color-mix`), with "Use existing" and "Create anyway".
- **Empty states (the database is empty now):** each list and the globe get a
  warm, hopeful empty state with one clear CTA ("Add your first organization",
  "Log your first conversation"), in EBY's voice. This is the first thing the team
  sees, so it must feel like dawn, not a blank table.
- **Motion and a11y:** all transitions on `--ease`; everything disabled under
  prefers-reduced-motion; visible focus rings; full keyboard operation; logical
  tab order; Escape closes overlays; RTL-aware (Hebrew is first-class to the
  brand even though the CRM is English-first today).

---

## 18. Edge cases and rules

- **Dedupe:** warn (do not block) on matching org name/domain and person
  email/full name, in every on-ramp.
- **Append-only interactions:** never edit or delete; corrections append.
- **Conditional deal close reasons:** only the matching reason shows, via
  `showWhen` on stage.
- **Computed waitlist percentages:** display only, never written.
- **FK deletes:** all FKs are `on delete set null`; deleting an org or person
  clears links on children, never cascades or crashes. Show "this org has 3
  people and 1 deal" before archive.
- **Empty values:** coerce to null; never write empty strings to typed columns.
- **display_id:** never written by the app (DB trigger sets it).
- **Concurrency:** guard inline edits on `updated_at` to avoid silent overwrites
  in a shared workspace.
- **AI safety:** schema-constrained enums, never invent, null unknowns, verbatim
  quotes, per-run audit, undo via stored result ids.
- **Missing AI or STT key:** clear message and a link to settings; manual paths
  still work fully.
- **Mobile:** drawer and save bar are thumb-reachable; forms reflow to one column.

---

## 19. Verification and QA

Per EBY-QA.md. For every tier:
- `npm run build` green (the primary gate; all routes and server actions
  typecheck and bundle).
- Any SQL applied to PGlite (0001-0003, 0005; skip 0004) with asserts. This PRD
  needs no new columns, so most tiers are app-only.
- No `/opacity` modifiers on var-backed tokens in changed files (grep before
  push).
- New or changed fields go through the registry, never a bespoke page.
- New dropdown values seeded in `lib/enums.ts` and available at runtime via
  field_options.
- Copy has no em-dashes, no emojis; hover help present where meaning is not
  obvious.
- Pushed to a feature branch, PR into develop, Vercel preview, screenshot review
  with Gal (the environment cannot see rendered UI).
- Manual smoke per object: create, see the display_id, edit, archive (leaves the
  list), confirm in /activity; FK inline create; AI funnel proposes only valid
  enums, includes a subset, commits, dedupes; quick-add and import happy paths.

---

## 20. Open questions for Gal

1. **Partners as an FK to organizations?** Today `partner_org` is free text. Make
   partners point at an organization record (so a partner that is also a school is
   one entity), or keep free text? Recommend: keep free text now, revisit later;
   it is a schema change, out of this PRD's scope.
2. **Quick-add essential fields per object:** confirm the `quickAdd` set per
   object, or default it to the existing `quickCreate` lists? Recommend: default
   to `quickCreate`, refine after first use.
3. **Inline detail editing vs explicit edit only:** add click-to-edit on detail
   pages (faster, needs the concurrency guard), or keep the separate edit form?
   Recommend: add inline editing in Tier 5.
4. **Bulk import priority:** since you are mostly net-new, is import a Tier 4
   convenience as specified, or lower? Recommend: keep at Tier 4.
5. **Where to build:** the bright design system is on `feature/design-system`
   (PR #2 into develop, not yet in production). To make capture beautiful by
   default it should build on top of that work. Recommend: merge PR #2 into
   develop first, then branch capture work from develop; otherwise capture would
   inherit the old dark form styles. Your call on sequencing.
6. **Files to share:** you mentioned having files. If any contain target lists or
   real field vocabulary, share them before Tier 1 so the seeded field_options and
   the import mapper match reality. Nothing is blocking without them.

---

## 21. One-paragraph anchor

The database is empty and the team is in the field. This PRD makes filling it feel
like sunrise, not data entry: a plus button and a command palette to add anything
in seconds, calm beautiful forms that expose every column grouped and helped, an
AI funnel that turns a call into a complete linked record set in under two
minutes, and a simple paste to seed a list. All of it flows through one registry,
so the UI maps one to one to Supabase forever, every column reachable, nothing
hidden, nothing wasted, in EBY's bright and hopeful theme.
