# EBY GTM CRM — 2FA and API Key Vault PRD

> Feature spec: two-factor authentication (authenticator app / TOTP) and a
> per-user API key vault (several keys per provider, one active). 2FA is required
> at first login, to manage keys, and to delete an account. Read with
> EBY-PRD-AI-KEYS.md and EBY-DATA-SECURITY-AND-PRIVACY.md. Author: Gal Rahav,
> built with Claude Code. Status: building, preview-first. Last updated:
> 2026-06-29.

Working rules: no em-dashes, no emojis, no fluff, plain confident language.

---

## 1. Goals

- Protect access with TOTP 2FA (Google Authenticator, 1Password, Authy).
- Let each user keep several API keys per provider and switch which one is active,
  behind a 2FA check so secrets are never exposed casually.
- Require 2FA at first login, before managing keys, and before deleting an account.

Because a mis-set auth flow can lock people out, every slice ships to the develop
preview for hands-on testing before production. Recovery: an admin can remove a
user's MFA factor in Supabase if they lose their device.

---

## 2. Slices (each verified on preview before prod)

1. **Key vault + 2FA enrollment + manage-keys gate (this slice).**
   - `user_api_keys` table: many rows per user, `provider`, `label`,
     `key_cipher`, `is_active` (one active per provider), RLS own-row.
   - Settings: a Security card to enroll/verify a TOTP factor (QR + code) and see
     status; a Keys vault to add, activate, and remove keys per provider.
   - Managing keys requires an elevated (aal2) session: if the user has a factor
     but the session is not aal2, prompt for a 6-digit code first.
   - Key resolution reads the active key for the provider (legacy single-key and
     server env remain fallbacks).
2. **Require 2FA at first login (next).** After sign-in, if the user has no factor,
   they must enroll before using the app; if they have one, the session must be
   elevated to aal2. Enforced in the app shell. Highest lockout risk, so tested in
   isolation on preview.
3. **Delete account, 2FA-gated (next).** A guarded action that, after an aal2
   check, archives the user's data and removes the account (auth-user deletion via
   a service-role edge function). Specced separately because it needs the service
   role.

---

## 3. Security

Per EBY-DATA-SECURITY-AND-PRIVACY.md: keys encrypted at rest (AES-256-GCM,
server-only ENCRYPTION_KEY), write-only from the UI, never returned to the client
or logged. TOTP secrets are held by Supabase Auth (MFA), not by us. RLS restricts
every key row to its owner. The audit log records "key added/activated/removed"
and "2FA enrolled", never secret values or TOTP secrets.

---

## 4. UX

- Settings → Security: "Two-factor authentication" with Enroll (shows a QR and a
  manual secret), then a code field to verify. Once enrolled: "On" with an option
  to add a backup or remove (remove itself requires a code).
- Settings → API keys: per provider (Claude, OpenAI), a list of saved keys with
  label, Active marker, Make active, and Remove. Add new key with a label. The
  whole section is covered by a "Verify it's you" code prompt when the session is
  not elevated.
- Plain copy, hover help, confirmation modals on remove/activate where useful.

---

## 5. Verification

- `npm run build` green; migration applied; RLS confirmed (own rows only).
- On the preview: enroll a TOTP factor with a real authenticator, verify, then add
  two keys for a provider, switch active, remove one; confirm the logger uses the
  active key; confirm a non-elevated session is prompted for a code before keys
  are shown. Only after this, promote to production.
