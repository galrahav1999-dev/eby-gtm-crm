# EBY GTM CRM — Setup Guide (plain English)

This guide gets the CRM running. You do not need to be technical. It takes about
15 minutes. If anything is unclear, that is a bug in this guide; tell Gal.

The CRM has two parts:
1. **The database** (Supabase) — where all the records live, in the cloud.
2. **The app** (this code, hosted on Vercel) — the screens the team uses.

---

## Step 1: Create the Supabase project (the database)

1. Go to https://supabase.com and sign up / log in (free plan is fine).
2. Click **New project**. Name it `eby-gtm-crm`. Pick a region close to the team
   (US East is a safe default). Set a database password and save it somewhere.
3. Wait ~2 minutes for it to finish setting up.

## Step 2: Get the two keys the app needs

1. In your Supabase project, open **Project Settings** (gear icon) → **API**.
2. Copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string)
3. You will paste these into the app in Step 5.

## Step 3: Create the tables (run one SQL file)

1. In Supabase, open the **SQL Editor** (left sidebar).
2. Open the file `supabase/migrations/0001_init.sql` from this project, copy ALL
   of it, paste it into the SQL Editor, and click **Run**.
3. You should see "Success". This created the 7 tables and their links.

## Step 4: Load the team's existing contacts (optional but recommended)

1. Still in the SQL Editor, open `supabase/seed.sql`, copy all of it, paste, **Run**.
2. This loads the 20 discovery contacts the team already logged, with their IDs
   and exact notes preserved. Skip this step if you want to start empty.

## Step 5: Connect the app to the database

- **For local testing on your computer:** copy `.env.local.example` to
  `.env.local` and paste the two values from Step 2. Then run `npm install` and
  `npm run dev`, and open http://localhost:3000.
- **For the live site (Vercel):** in the Vercel project settings → Environment
  Variables, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  with the same two values, then redeploy.

## Step 6: Invite the team (login is invite-only)

1. In Supabase, open **Authentication** → **Users** → **Add user** (or
   **Invite**), and add each teammate's email:
   - Gal, Leah, Mashav, Michael.
2. In **Authentication** → **Providers** → **Email**, turn **off** public
   sign-ups so only invited teammates can log in.
3. Each teammate gets an email link to set their password and sign in.

---

## Notes

- **Who can see/edit what:** any signed-in teammate can read and edit everything.
  It is a shared workspace, by design.
- **The IDs (PER-0000001, ORG-0000001, ...):** the database creates these
  automatically. You never type them.
- **Adding a new dropdown option later:** edit `lib/enums.ts` in the app. No
  database change needed.
- **The old Google Sheet:** once the team is happy here, the Sheet can be retired.
  Nothing in the app depends on it.
