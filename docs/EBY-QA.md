# EBY GTM CRM — QA

> How we verify this project, the known gotchas, and a pre-ship checklist. The
> environment cannot see rendered UI, so the verification stack is build +
> typecheck + SQL-in-PGlite + the Vercel preview + the founder's screenshots.

Last updated: 2026-06-28.

---

## 1. The verification stack

1. **`npm run build`** — compiles and typechecks every route. This is the primary
   gate. A green build means all App Router pages, server actions, and the
   field-registry generic routes typecheck and bundle. Run it before every push.
2. **PGlite SQL check** — SQL migrations are verified by applying them to a
   throwaway in-process Postgres (`@electric-sql/pglite`) in a small node script
   and asserting. PGlite has no `storage` or `auth` schema, so:
   - Create a stub role first: `create role authenticated;` before applying RLS.
   - Apply `0001`, `0002`, `0003`, `0005`. **Skip `0004`** (storage bucket; uses
     the `storage` schema that does not exist in PGlite). 0004 is verified on
     Supabase itself.
3. **Vercel preview** — every push to a `feature/*` branch with an open PR builds
   a preview deploy. This is where rendered behavior is checked.
4. **Founder screenshots** — the human-in-the-loop visual QA. The agent cannot
   see the UI; WebFetch to the preview returns 403 (login-gated + egress). Ask
   for screenshots; iterate from them. Gal can upload up to 5 photos at a time.

---

## 2. Edge cases already covered (do not regress)

- **Missing Supabase env** — the app shows a friendly "configure Supabase" screen
  instead of crashing; auth is skipped when env is absent.
- **Empty form values** — `str()` / `num()` in `lib/format.ts` coerce empty
  strings to `null` so we never write `""` into typed columns.
- **`display_id` is never written by the app** — a DB trigger sets it. Writing it
  manually would fight the sequence.
- **FK deletes** — every FK is `on delete set null`; deleting an org or person
  clears links on children rather than cascading or crashing.
- **Soft delete** — delete in the UI = archive (`archived_at` timestamp, migration
  0005). Every list filters `archived_at is null`. Records are recoverable.
- **Interactions are append-only** — no edit/delete from the UI; the audit trail
  stays intact.
- **AI cannot emit invalid enums** — the extraction tool schema is built from the
  live `field_options`, so a proposal can never contain an out-of-vocabulary
  dropdown value. The AI is also instructed to null unknowns and quote verbatim
  (never invent).
- **Dropdown vocabulary changes without redeploy** — values live in
  `field_options`; `lib/enums.ts` is only seed + offline fallback.
- **Sentry is inert without a DSN** — no DSN means no init, and the build stays
  clean. Setting `NEXT_PUBLIC_SENTRY_DSN` turns it on.

---

## 3. Known gotchas (these have bitten us — check them)

- **Opacity modifier on a CSS-var token breaks rendering.** `bg-card/90`,
  `bg-surface/80`, `text-ink/70`, etc. do not work because the tokens are
  `var()`. Use a solid token or `color-mix(...)`. See EBY-DESIGN-SYSTEM.md section
  2. Grep for `/[0-9]` opacity suffixes on `bg-card`, `bg-surface`, `text-ink`,
  `border-line` before shipping a style change.
- **Geist font import.** Geist is NOT in `next/font/google` (throws "Unknown font
  Geist"). It comes from the `geist` npm package
  (`geist/font/sans`, `geist/font/mono`).
- **People need country/city.** The original sheet did not have them; they were
  added for individual B2C learners and for the globe. If you reset the schema,
  keep those columns on `people`.
- **Pasting the wrong thing into the Supabase SQL editor.** A filename is not SQL.
  When guiding Gal, paste the exact SQL block to run, not the path to a file.
- **Supabase invite emails are rate-limited** on the free tier. Create users with
  a password + Auto Confirm instead of relying on invite emails.
- **Vercel Deployment Protection** can put a Vercel login wall in front of the
  app's own login. Disable it; the app is already gated by Supabase auth.
- **Commit "Unverified" warning** — commits are not signed (the env has no signing
  key). This is environmental and expected; not a code problem.

---

## 4. Pre-ship checklist (run before every push to a feature branch)

- [ ] `npm run build` is green (no type errors, all routes compile).
- [ ] No `/opacity` modifiers on var-backed tokens in changed files.
- [ ] If a migration changed: applied to PGlite (0001-0003, 0005) and asserts pass;
      0004 sanity-checked on Supabase.
- [ ] New/changed fields go through the field registry (`lib/schema/*`), not a
      bespoke page, so list/detail/form/search/validation all update together.
- [ ] New dropdown values seeded in `lib/enums.ts` AND available at runtime via
      `field_options` (Admin or inline "+ Add").
- [ ] Copy has no em-dashes, no emojis, no fluff.
- [ ] Hover help (`help` on the `FieldDef`) added where meaning is not obvious.
- [ ] Pushed to the `feature/*` branch; PR open into `develop`; preview deployed;
      asked Gal for a screenshot if anything visual changed.

---

## 5. Manual smoke test (when a live DB is available)

For each object (Organizations, People, and the rest as they are ported): create
a record, confirm the `display_id` appears, edit a field, archive it and confirm
it leaves the list, check the change shows in `/activity`. For FKs: create a child
record and inline-create its parent from the picker. For the AI logger: paste a
note, confirm the proposal only contains valid enums, include a subset, commit,
and confirm dedupe (same org/person not duplicated). For the globe: confirm points
appear, filters narrow them, and clicking a point opens the record.
