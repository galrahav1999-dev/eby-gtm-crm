# EBY GTM CRM — DevOps

> Branching/release flow, hosting, env, monitoring, rollback, and the live
> identifiers. The git flow is also in BRANCHING.md; this is the operational
> summary plus the concrete project facts. Keep the identifiers current.

Last updated: 2026-06-28.

---

## 1. Live identifiers

- **Repo:** `github.com/galrahav1999-dev/eby-gtm-crm`
- **Production URL:** https://eby-gtm-crm.vercel.app
- **Vercel team:** `globus2` · **project:** `eby-gtm-crm`
- **Production branch (Vercel deploys this):** `eby-gtm-crm` (protected)
- **Active design work:** branch `feature/design-system` -> PR #2 into `develop`
  (draft). Preview:
  https://eby-gtm-crm-git-feature-design-system-globus2.vercel.app
- **Supabase:** project connected; migrations 0001-0005 applied; `recordings`
  bucket created (0004); 20 real contacts seeded.

---

## 2. Branch and release flow

```
feature/x  --PR-->  develop  --PR-->  staging  --PR-->  eby-gtm-crm (production)
   build             integrate         rehearse           release
```

| Branch | Role | Protected |
|---|---|---|
| `eby-gtm-crm` | production (the live URL) | yes (PR + 1 approval) |
| `staging` | dress rehearsal, mirrors production | yes (PR) |
| `develop` | active integration | optional |
| `feature/*` | one per feature/fix | no |

Rules: always a PR, never push straight to production. Every push to a branch with
an open PR gets an automatic Vercel preview to click before promoting. Hotfix:
branch `hotfix/x` off `eby-gtm-crm`, PR back into it, then merge down into
`staging` and `develop` to keep them in sync.

---

## 3. Git operations (the conventions used here)

- Commit identity: `Claude <noreply@anthropic.com>`. Commits show "Unverified"
  because the environment has no signing key — expected, not a problem.
- Push: `git push -u origin <branch>`; retry on network errors with exponential
  backoff (2s, 4s, 8s, 16s).
- After pushing a branch, ensure a **draft** PR exists for it. If the repo has a
  PR template, mirror its headings; otherwise write a normal body.
- Never push to a branch other than the designated one without explicit
  permission. Current designated dev branch for ongoing work:
  `claude/eby-crm-system-design-ippsux` per task config, but the live design work
  is on `feature/design-system` (PR #2). Confirm the intended target before
  promoting.
- Do not put model identifiers, secrets, or env values in commits, PR bodies, or
  code comments.

---

## 4. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (RLS protects data) |
| `ANTHROPIC_API_KEY` | for AI logger | Claude extraction |
| `ANTHROPIC_MODEL` | optional | defaults to `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | for audio | Whisper transcription |
| `STT_MODEL` | optional | defaults to `whisper-1` |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | turns on Sentry (inert without it) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | optional | source-map upload |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | optional | only if a Mapbox map view is added |

Set these in Vercel (Project Settings -> Environment Variables) for Production,
Preview, and Development as needed. For local dev, copy `.env.local.example` to
`.env.local` and fill at least the two Supabase values.

NOTE (planned change): Phase 4 moves AI keys to **per-user, server-encrypted**
keys stored in a `profiles`/settings table, so individual team members use their
own key and Gal's account is not billed for everyone. The server `ANTHROPIC_API_KEY`
becomes an optional admin fallback. Not built yet.

---

## 5. Database / migrations

Run in the Supabase SQL editor in order; paste the exact file contents (not the
path):
1. `0001_init.sql` — 7 tables, FKs, `display_id` sequences + triggers, RLS,
   `updated_at` triggers.
2. `0002_options_and_audit.sql` — `field_options` (seeded) + `audit_log`.
3. `0003_ai_ingestions.sql` — AI logger runs.
4. `0004_storage.sql` — private `recordings` bucket (Supabase-only).
5. `0005_soft_delete.sql` — `archived_at` on all record tables.
6. `seed.sql` — the 20 real contacts + 2 orgs + 1 interaction.

A new migration is part of a release: run it on the database as you promote. If a
staging Supabase project is added later, run there first. See EBY-QA.md for the
PGlite verification method (skip 0004 locally; stub the `authenticated` role).

---

## 6. Hosting (Vercel)

- Production branch is `eby-gtm-crm`; every other branch/PR gets a preview URL
  automatically. No Vercel config change is needed to add branches.
- If the team hits a **Vercel login wall** before the app's own login screen,
  disable Deployment Protection (Project Settings -> Deployment Protection). The
  app is already gated by Supabase auth, so the Vercel gate is redundant.
- Chromium + Playwright are preinstalled in this agent environment
  (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); do not run `playwright install`.

---

## 7. Auth and access

- Invite-only: sign-ups are disabled in Supabase. Create team users with a
  password + Auto Confirm (invite emails are rate-limited on the free tier).
- Team: Gal, Leah, Mashav, Michael. ("Misha" maps to "Michael". Ben is not part
  of the team — do not add him.)
- RLS: any `authenticated` user can read/write all rows (shared internal
  workspace). `owner` is a data attribute, not a security boundary. `audit_log` is
  insert + read only (immutable).

---

## 8. Monitoring and rollback

- **Sentry** activates only when `NEXT_PUBLIC_SENTRY_DSN` is set; configured in
  `sentry.{client,server,edge}.config.ts` + `instrumentation.ts`, with
  `app/global-error.tsx` as the reporting crash fallback. Without a DSN it is
  fully inert and the build stays clean.
- **Audit log** (`audit_log`, surfaced at `/activity`) is the in-app record of
  who changed what and when, for KPIs and root-cause review.
- **Rollback:** Vercel -> Deployments -> select the last good production
  deployment -> Promote to Production (one click). Or revert the merge commit on
  `eby-gtm-crm` via a PR.

---

## 9. How to resume (operational)

1. `git checkout feature/design-system && git pull` (latest design), or `develop`
   for the stable line.
2. `npm install`. For local run: add `.env.local` (Supabase keys), `npm run dev`.
3. `npm run build` to verify. PGlite scripts for SQL (EBY-QA.md).
4. Work on a `feature/*` branch, PR into `develop`, review the Vercel preview,
   promote develop -> staging -> production. Never commit straight to production.
