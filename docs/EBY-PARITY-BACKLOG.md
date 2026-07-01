# EBY GTM CRM — Cockpit Parity Backlog

> Tracks the "Cockpit" pipeline-app feature spec against the EBY CRM: what we
> built, what we deferred, and the decisions behind each. Read with
> EBY-SESSION-HANDOFF-2026-06-30.md and EBY-STRATEGY-AND-ROADMAP.md. The original
> Cockpit demo source still lives in the repo (root `components/*`, `lib/data.ts`,
> `lib/store.ts`, `lib/metrics.ts`, `lib/useFiltered.ts`, `data/companies.json`,
> `app/_cockpit-demo-page.tsx.bak`) as the reference implementation. It is not
> mounted on any route. Do not import its fake schema or sample data.

Working rules: no em-dashes, no emojis, no fluff, plain confident language.
Last updated: 2026-06-30.

---

## 1. Done this session

- **Deals Board (Kanban).** `components/crm/Board.tsx` plus a Table/Board switch
  on every object that has a `stage` field (deals, pilots, partners). Drag a card
  to change its stage (`app/(app)/board-actions.ts` `setStage`, narrow single
  column update, audited). Owner-colored cards, per-column count and value total,
  overdue follow-up dot, and stage exit-criteria on hover from
  `lib/schema/stage-guide.ts`.
- **Globe territories reworked.** Real country shapes (world-atlas 110m, fetched
  in the browser) that extrude in 3D on hover and are colored from the beam
  palette (cyan rising to violet). Hovering pops the shape and shows the country
  name plus whether it has records; clicking a country opens the existing
  territory funnel. Auto-rotation locks while a territory is open. Replaced the
  old centroid text labels.
- **Central metrics and funnels (parity section 6, priority).** `/dashboard` is
  now a client view (`components/crm/DashboardView.tsx`) with an owner scope
  filter that recomputes every number, a scope indicator, KPI tiles, a B2B
  deal-stage funnel (count, value, stage-to-stage conversion, plus won/lost
  outcome tiles), and a B2C waitlist cohort funnel (Signups, Confirmed,
  Activated, Retained D30, Paid with conversion percents and confirm /
  signup-to-paid rates). The globe Snapshot card also shows a compact deals-by-
  stage strip. Real Supabase queries; the leftover demo `lib/metrics.ts` is no
  longer referenced by the app.

---

## 2. Deferred, with decisions (Gal's calls)

- **Overlaps (parity section 7): SKIP for now, documented here.** EBY orgs carry a
  single `owner`, so the demo's "same account worked by more than one owner" does
  not map cleanly. If revisited, compute overlap as one Organization whose linked
  deals, pilots, or people have differing owners, and surface it as an amber badge
  on board cards plus a header count. Low value while the team is small.
- **2D Map view (parity section 2): SKIP for now, documented here.** The globe
  already owns geography. If revisited, reuse the same selection state so a record
  picked on the map highlights on the globe and in the list and board.
- **Ambient sound toggle (parity section 0): SKIP.** `lib/ambientAudio.ts` exists.
  Keep it off by default and never autoplay if it is ever wired up.
- **"Connected to: CRM" cosmetic chip (parity section 0): SKIP.** Purely visual
  HubSpot/Salesforce signaling, no user value now.

---

## 3. Still planned (next slices, not yet built)

In the agreed build order after the auth work (PR #32 promotion, require 2FA at
first login, delete-account gated by 2FA, Google OAuth):

- **Territory scope on the dashboard.** The owner scope filter is live; a
  territory (country) filter that also recomputes the numbers is still open. Deals
  carry owner directly but not country, so territory needs a deal-to-org-to-country
  join. Defer until needed.
- **Command palette and global search: DONE.** `components/crm/CommandPalette.tsx`
  in the topbar, opened by Cmd/Ctrl+K or the "Search or add" button. Debounced
  cross-object search via `app/api/search/route.ts` (queries every object's
  search fields), keyboard navigation, and "New X" quick-add actions for every
  object.
- **Quick-add drawer: DONE.** `components/crm/QuickAddDrawer.tsx`. The palette's
  "New X" actions open a right-side drawer with the object's quickCreate fields
  (same registry widgets, inline FK create included), Save, Save and add another
  (keeps the drawer open, clears the form, carries owner and segment forward),
  a link to the full form, and a toast with an Open link. Data-capture Tier 2 is
  complete. Backlog: a persistent global plus button in the topbar (the palette
  covers create for now).
- **Record dossier upgrade: DONE (core).** The generic detail page is now an
  identity-left, data-right dossier: a monogram tile, title, id, owner and status
  chips, and location on the left with Edit / Log conversation / Archive; the data
  sections and the linked-records hub on the right. Each linked section has an
  in-context "Add X" that opens the quick-add drawer with the link back
  prefilled. Follow-ups: an owner-book toggle inside the card, and "Log
  conversation" deep-linking into the AI funnel's attach-to-existing step (today
  it links to /logger; the funnel does not yet take a pre-target param).
- **Globe drill and bloom beams: DONE (core), preview-first.** GlobeHome rebuilt
  to match the Cockpit reference: vertical neon beams with an additive bloom tip
  colored by owner, beam height by record count, flattening to dots when drilled
  in. World to Country to City drill with camera flights, a right-side drill panel
  (cities, then records), a top-center Back button with Esc, and auto-rotate that
  locks on drill. Country-polygon hover highlights and click drills in. Clicking a
  record opens its detail dossier. Backdrop (day/night/sunrise/sunset) unchanged.
  Gal replaced the Jerusalem-arc beams with these vertical value beams.
  Remaining (the account dossier overlay): an in-globe full-screen dossier with a
  This-city / Owner's-book browse rail and a "Draft follow-up for approval"
  button, plus the follow-up approvals drawer. Tracked next.
- **Follow-up autopilot queue: DONE (scoped).** `components/crm/FollowUps.tsx` in
  the topbar with a due-count badge, backed by `app/api/followups/route.ts`. Lists
  people and deals whose `next_step_date` is today or past, each with a drafted
  follow-up (built from the record, no LLM call). The owner can Edit, Veto, or Log
  as an interaction (appends an Email interaction; never sends). Banner makes the
  "nothing is sent in your name" rule explicit. Follow-up: swap the templated
  draft for an LLM draft once per-user keys make that cheap.

---

## 4. Conflicts on record (resolved)

- **Globe metaphor.** Keep EBY's beams-to-Jerusalem as the signature. The Cockpit
  four-level drill and polygon hover are additive layers, not replacements. The
  polygon hover is now built; the drill remains optional in section 3.
- **Owners are four** (Gal, Leah, Mashav, Michael), not the spec's five. Ben is no
  longer on the project. Owner colors live in `lib/colors.ts`.
- **Interactions stay append-only; B2C stays cohort/funnel, not per-person rows.**
