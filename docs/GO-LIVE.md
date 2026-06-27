# EBY GTM CRM — Go-Live Checklist (step by step, non-technical)

Follow these in order. Total time about 30 minutes. Each step says exactly what
to click. When you finish, the team has a live, shared CRM.

You will create accounts on three free services: Supabase (database), Vercel
(hosting), and optionally Sentry (error alerts) + AI keys (the AI logger).

---

## Part A — The database (Supabase)

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**. Name it `eby-gtm-crm`, pick a region near the team
   (US East is fine), set a database password, and save that password somewhere.
3. Wait about 2 minutes for it to finish.
4. In the left sidebar open **SQL Editor**. You will run 5 files from this repo,
   in this exact order. For each: open the file on GitHub, copy everything,
   paste into the SQL Editor, click **Run**, wait for "Success", then do the next.
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_options_and_audit.sql`
   - `supabase/migrations/0003_ai_ingestions.sql`
   - `supabase/migrations/0004_storage.sql`
   - `supabase/seed.sql`  (loads the team's 20 real contacts; optional)
5. Get your two keys: **Project Settings** (gear) → **API**. Copy:
   - **Project URL** (like `https://abcd.supabase.co`)
   - the **anon public** key (a long string)
   Keep these two for Part B.

---

## Part B — The hosting (Vercel)

1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New… → Project**, then **Import** the `eby-gtm-crm` repository.
   - If you don't see it, click "Adjust GitHub App Permissions" and give Vercel
     access to the repo.
3. Before clicking Deploy, open **Environment Variables** and add these two
   (paste the values from Part A, step 5):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
4. Set the **Production Branch** to `claude/eby-crm-system-design-ippsux` for now
   (Settings → Git), or merge the pull request into the main branch first and
   deploy that. Either works.
5. Click **Deploy**. After about a minute you get a live URL. Open it.
6. You will see a login screen (that is correct — the app is invite-only).

---

## Part C — Invite the team (login)

1. Back in Supabase: **Authentication → Users → Add user**, and add each
   teammate's email: Gal, Leah, Mashav, Michael.
2. **Authentication → Providers → Email**: turn **off** "Allow new users to sign
   up" so only invited teammates can log in.
3. Each teammate gets an email to set a password, then can sign in at your URL.

You now have a live CRM. Everything below is optional.

---

## Part D — Turn on the AI logger (optional)

The AI logger turns notes or a call recording into clean draft records.
In Vercel → your project → **Settings → Environment Variables**, add:
- `ANTHROPIC_API_KEY` (from https://console.anthropic.com) — enables AI extraction.
- `OPENAI_API_KEY` (from https://platform.openai.com) — only needed to transcribe
  uploaded audio.
Then **Redeploy** (Deployments → … → Redeploy).

## Part E — Turn on error alerts (optional, Sentry)

1. Go to https://sentry.io, sign up, create a project (platform: Next.js).
2. Copy the **DSN** it gives you.
3. In Vercel env vars add `NEXT_PUBLIC_SENTRY_DSN` = that DSN, then **Redeploy**.
   You'll now get alerts and stack traces for any errors.

---

## What to tell me once you've done Part A and B
Send me the live Vercel URL (and confirm login works). Then I'll do a live pass
with you, deploy any fixes, and we iterate on the AI logger with a real transcript.

## If something doesn't work
- Login page loads but you can't sign in → make sure you added your email in
  Supabase (Part C) and used the password from the email link.
- A page shows a database error → re-check that all migration files ran in order.
- The map is empty → that's fine until records have a city/country.
