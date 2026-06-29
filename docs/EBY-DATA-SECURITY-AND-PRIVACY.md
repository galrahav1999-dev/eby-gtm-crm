# EBY GTM CRM — Data Security and Privacy Policy

> The strict, binding policy for how this system handles secrets and personal
> data (PII) about our team, the people we talk to, and their organizations. This
> governs every feature. If a change would conflict with this policy, the policy
> wins or the policy is updated deliberately first. Read with EBY-PRD-AI-KEYS.md
> and EBY-DEVOPS.md. Author: Gal Rahav, built with Claude Code. Living document.
> Last updated: 2026-06-29.

Working rules: no em-dashes, no emojis, no fluff, plain confident language.

---

## 1. What we hold

- **Secrets:** per-user LLM/STT API keys; service keys and tokens (Supabase,
  Vercel, Sentry); the server `ENCRYPTION_KEY`.
- **PII about people:** names, emails, roles, locations, notes, and verbatim
  quotes from discovery calls.
- **PII about organizations:** names, domains, locations, notes.
- **Recordings and transcripts:** uploaded call audio and its transcript.
- **Operational data:** audit log (who changed what), AI ingestion runs.

---

## 2. Core rules (binding)

1. **Secrets are encrypted at rest and never exposed.** API keys are stored only
   as AES-256-GCM ciphertext using a server-only `ENCRYPTION_KEY`. They are
   write-only from the UI, never returned to the browser, never written to logs,
   never put in the audit log, commits, PRs, or code. If `ENCRYPTION_KEY` is
   absent, we refuse to store a key rather than store it insecurely.
2. **Least exposure.** Plaintext secrets exist only in server memory for the
   duration of a single provider call. No secret is sent to the client after
   entry.
3. **Access control by default.** Every data table has Row Level Security on.
   Only authenticated team members can read or write. `user_ai_settings` is
   restricted to the owning user's own row. The audit log is insert and read only
   (immutable).
4. **Invite-only access.** Sign-ups are disabled; only emails the admin adds can
   sign in. `owner` is a data attribute, not a permission boundary.
5. **No secrets or PII in artifacts.** Never put real keys, tokens, env values, or
   personal data into commits, PR bodies, code comments, screenshots committed to
   the repo, or model identifiers.
6. **PII is handled with care.** Personal data is collected only for the team's
   go-to-market work, kept accurate, editable, and deletable (soft delete now,
   hard delete on request), and never shared outside the team or sold.
7. **Third parties.** Transcription and extraction send the transcript (which may
   contain PII) to the provider whose key is used (OpenAI, Anthropic). This is
   disclosed here and to the team. Providers are used under their API terms; we
   do not grant training rights beyond their defaults. At scale we move to
   EBY-managed models (see EBY-PRD-AI-KEYS.md backlog).

---

## 3. Specific handling

- **API keys:** `lib/crypto.ts` (AES-256-GCM) encrypts; `user_ai_settings` stores
  ciphertext per user; the UI shows only Connected or Not connected.
- **Recordings:** stored in the private `recordings` Supabase bucket (not public);
  access via short-lived signed URLs; uploads via one-time signed upload URLs.
- **Transcripts and proposals:** stored on the `ai_ingestions` row for traceability
  and undo; subject to the same RLS and deletion rules as other data.
- **Audit log:** records who/what/when and field diffs for record changes; never
  stores secret values; never stores full PII payloads beyond what is needed to
  identify the record and the change.
- **Backups:** Supabase managed backups; treat backups as containing PII and
  protect accordingly.

---

## 4. Retention and deletion

- Soft delete (`archived_at`) is the default for records, so deletions are
  recoverable by the team.
- On a person's or organization's request, the team performs a hard delete of
  their data, including the relevant recording and transcript.
- Discarded or superseded AI ingestion runs may be purged periodically.

---

## 5. Operational duties

- Set `ENCRYPTION_KEY` (32-byte base64) only in the hosting platform's encrypted
  environment variables, never in the repo.
- Rotate any secret that may have been exposed immediately; rotating
  `ENCRYPTION_KEY` requires re-encrypting stored keys (or asking users to
  reconnect).
- Keep Sentry and logs free of secrets and avoid logging full PII payloads.
- Review this policy whenever a feature adds a new data type or a new third party.

---

## 6. Checklist for any new feature touching data

- [ ] New secrets are encrypted at rest and never returned to the client or logged.
- [ ] New tables have RLS on with the correct scope.
- [ ] New PII has a deletion path and is covered by retention rules.
- [ ] No secret or PII leaks into commits, PRs, comments, or audit values.
- [ ] Any new third-party data flow is disclosed and added to this document.
