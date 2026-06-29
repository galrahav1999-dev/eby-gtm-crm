# EBY GTM CRM — Master Index (START HERE)

> Entry point for any new session. Read this first, then the doc you need. All
> docs live in `docs/`. Keep them updated at the end of each session.

Last updated: 2026-06-28.

## What this project is
The EBY founding team's go-to-market CRM and single source of truth: a full-stack
Next.js + Supabase web app to manage People, Organizations, Deals, Pilots,
Partners, Interactions, and a B2C waitlist, plus an AI logger (notes/recordings
to records) and an immersive globe home. EBY itself is an AI platform reviving
spoken Hebrew among diaspora Jews. Founder: Gal Rahav. Built with Claude Code.

Founder working rules (always): no em-dashes, no emojis, no fluff, one clear
action at a time, plain confident language. When giving Gal setup steps, paste
exact code/clicks (he is non-technical), never just a filename.

## The doc set (by category)
- **EBY-MASTER-INDEX.md** (this) — start here; current snapshot + pointers.
- **EBY-TECH-HANDOFF.md** — TECHNICAL. Stack, architecture, data model, file map,
  the field-registry framework, env vars, conventions, how to run/verify.
- **EBY-DESIGN-SYSTEM.md** — DESIGN. Implemented tokens, theming (light/brand-dark/
  auto), fonts, components, the globe home, what is and isn't styled yet.
- **EBY-STRATEGY-AND-ROADMAP.md** — PRODUCT. The whole-system plan, phases,
  decisions, what's next and why (the approved build order).
- **EBY-QA.md** — QA. How we verify (PGlite + build + preview), edge cases
  covered, known issues/gotchas, a test checklist.
- **EBY-DEVOPS.md** — DEVOPS. Branching/release flow, Vercel, Supabase, env,
  monitoring, rollback, the live URLs and project identifiers.
- Supporting: **EBY-DESIGN-SYSTEM-BRIEF.md** (the brief we fed Claude Design;
  source of the tokens), **EBY-CRM-Handoff.md** + **EBY-PLAN.md** (original
  spec), **DECISIONS.md**, **SETUP.md** (DB setup), **GO-LIVE.md** (Vercel + invite
  steps), **BRANCHING.md** (the git flow, also summarized in EBY-DEVOPS.md).

## Current snapshot (2026-06-28, end of design session)
- **Live (production):** https://eby-gtm-crm.vercel.app (Vercel team `globus2`,
  project `eby-gtm-crm`). Production branch `eby-gtm-crm` (protected).
- **Active work:** branch `feature/design-system` -> **PR #2 into `develop`**
  (draft). Preview:
  https://eby-gtm-crm-git-feature-design-system-globus2.vercel.app
  This branch holds the entire design system + globe home; NOT yet promoted to
  production. Promote develop -> staging -> eby-gtm-crm when approved.
- **Branches:** `eby-gtm-crm` (production), `staging`, `develop`, `feature/*`.
  Flow: feature -> PR -> develop -> PR -> staging -> PR -> production. See DEVOPS.
- **Supabase:** project connected; migrations 0001-0005 run; storage bucket
  (0004) + soft-delete (0005) applied. Seeded with 20 real contacts.
- **Built:** 7-object CRM with full CRUD; editable dropdowns + Admin; audit log +
  Activity; AI logger (text+audio, key-gated); field-registry framework live for
  People + Organizations; soft delete; hover help; design system (bright + brand
  dark + auto theme) applied app-wide; full-screen time-of-day globe home;
  dedicated /dashboard; premium data tables. Sentry-ready (needs DSN).
- **Immediate next (design polish, this is where we stopped):** record detail/
  edit pages + AI logger + dashboard cards + login still look plainer than
  Grade-A; Higgsfield hero media not yet generated. Then continue the roadmap
  (Phase 2 port remaining objects to the framework, Phase 3 Power UX, Phase 4 AI
  logger v2). See STRATEGY + DESIGN for the full list.

## How to resume fast
1. `git checkout feature/design-system && git pull` (latest design work), or
   `develop` for the stable integration line.
2. `npm install`; for local run add `.env.local` (Supabase keys) then `npm run dev`.
3. `npm run build` to verify; PGlite scripts to verify SQL (see QA doc).
4. Work on a `feature/*` branch, open a PR into `develop`, review the Vercel
   preview, promote up. Never commit straight to production.
