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

- **Central metrics and funnels (parity section 6, priority).** Pipeline-by-stage
  distribution, the B2B deal-stage funnel, the B2C waitlist cohort funnel
  (Signups, Confirmed, Activated, Retained D30, Paid with conversion percents), a
  scope indicator that recomputes as owner and territory filters change. Compact
  on the globe, full on `/dashboard`. Real Supabase queries, no demo data. Replace
  the leftover demo `lib/metrics.ts` (it reads `data/companies.json`).
- **Quick add, Cmd-K command palette, global search (parity section 0, data-capture
  Tier 2).** Create any record in seconds from anywhere; jump-to-record search.
- **Record dossier upgrade (parity section 4).** Full-screen identity-left,
  data-right detail; linked records as a hub; owner-book toggle; "log conversation"
  pre-targeted into the AI funnel.
- **Four-level globe drill (parity section 1).** Optional World, Country, City,
  Company camera flights layered on top of the current beam globe, without
  changing the Jerusalem-beam metaphor. The Cockpit `GlobeView.tsx` is the
  reference for the camera and beam-height-by-value behavior.
- **Follow-ups-due queue (parity section 5, scoped).** A drawer of records whose
  `next_step_date` is today or past, with an AI-drafted follow-up the owner can
  Edit, Veto, or Log as an interaction. No real sending, to stay inside the
  data-security policy and append-only interactions.

---

## 4. Conflicts on record (resolved)

- **Globe metaphor.** Keep EBY's beams-to-Jerusalem as the signature. The Cockpit
  four-level drill and polygon hover are additive layers, not replacements. The
  polygon hover is now built; the drill remains optional in section 3.
- **Owners are four** (Gal, Leah, Mashav, Michael), not the spec's five. Ben is no
  longer on the project. Owner colors live in `lib/colors.ts`.
- **Interactions stay append-only; B2C stays cohort/funnel, not per-person rows.**
