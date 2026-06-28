# EBY GTM CRM — Strategy and Roadmap

> A whole-system plan so we stop patching reactively. It defines a scalable
> architecture (one place to change things), the UX model, the AI logger design
> (per-user keys, model-agnostic, consistent parsing, a real funnel), edge cases,
> and a phased roadmap. Read with EBY-TECH-HANDOFF.md (current state) and
> EBY-DESIGN-SYSTEM-BRIEF.md (visual direction). Living doc; update each session.

Last updated: 2026-06-28. Status: APPROVED and in build. Phase 1 (field-registry
framework) is live for People + Organizations; the design system is built on
`feature/design-system` (PR #2). Next up: Phase 2 (port the remaining objects to
the framework), then Phase 3 Power UX, then Phase 4 AI logger v2. See
EBY-TECH-HANDOFF.md section 12 for the full ordered backlog and locked decisions.

---

## 1. The core problem to solve

Today each object (People, Orgs, Deals, ...) has hand-written list, detail, form,
and action files. So when you ask for "add a country dropdown," "a Back button,"
"inline create," or "show field X," it means editing many files by hand. That is
the reactive-patching pain.

**The fix is a metadata-driven architecture:** describe each object and its fields
ONCE in a central registry, and let generic components render every list, detail
page, and form from that description. After that, a change (new field, new widget,
reorder, required, show-in-list, inline-create) is a one-line edit that
propagates everywhere, automatically and consistently. This is how Attio,
Salesforce, and HubSpot scale. It is the backbone of this plan.

Guiding principles:
- One source of truth per concern (fields, options, permissions, AI pipeline).
- Generic over bespoke: build the engine, not 7 copies.
- The UI always maps 1:1 to the backend because both read the same registry.
- Safe by default: validation, audit, and dedupe are automatic, not per-form.
- Fast and calm: keyboard-first, instant, uncluttered (Linear/Attio bar).

---

## 2. Current state audit (what exists, what is inconsistent)

Built and solid: Supabase schema (7 objects + field_options + audit_log +
ai_ingestions), auth (invite-only, RLS), full CRUD for all objects, editable
dropdowns + Admin, audit log + Activity, dashboard, basic world map, AI logger
(text + audio) with review/commit, Sentry-ready, seeded real data, deployed.

Inconsistencies / gaps that cause patching:
- Forms are bespoke; Combobox/inline-create only on Org and Person so far.
- Detail pages are hand-written; field coverage is manual (risk of drift).
- No central field metadata, so "labels/order/visibility" live in many files.
- FK people-pickers are plain selects on Deal/Pilot/Partner/Interaction.
- No global search, no saved views/filters, no bulk actions, no "my work" view,
  no command palette.
- No per-user AI keys; the logger uses one server key (would spam your account).
- No `profiles`/user settings table; owners are a flat enum, not real users.
- No duplicate detection/merge; dedupe exists only inside the AI commit.

---

## 3. Scalable backbone: the field-registry framework

### 3.1 Define each object once
`lib/schema/<object>.ts` exports an ObjectDef:
```
ObjectDef = {
  key: "people",
  label: "People", singular: "Person",
  idPrefix: "PER",
  table: "people",
  titleField | titleFn,           // how to title a record
  sections: [                     // detail/form grouping
    { label: "Identity", fields: ["first_name","last_name","email",...] },
    ...
  ],
  fields: FieldDef[],
  listColumns: ["display_id","name","role_title","org","owner","next_step_date"],
  defaultSort, searchFields,
  linked: [{ object:"interactions", fk:"person_id", label:"Interactions" }, ...],
}
FieldDef = {
  name: "country",
  label: "Country",
  widget: "text|textarea|number|money|date|select|combobox|fk|country|email",
  optionsKey?: "segment",         // for select/combobox -> field_options
  addNew?: true,                  // combobox can add a new option
  fkTo?: "organizations",         // for fk widget
  inlineCreate?: true,            // fk picker can create the related record
  required?, showInList?, showInDetail?, section?, help?, format?,
  readOnly?, appendOnly?,         // e.g. interactions
}
```

### 3.2 Generic renderers (build once, use everywhere)
- `<RecordTable def>` — list with search, sort, density, row click, later bulk +
  saved views. Columns from `listColumns`.
- `<RecordDetail def record>` — header (title, ID, status pills, actions),
  field grid by section, linked-record panels, activity timeline. Shows every
  field flagged showInDetail (guarantees 1:1 mapping).
- `<RecordForm def record?>` — renders inputs from `fields`, choosing the widget
  automatically; handles enum add-new, FK pickers with inline create, country,
  dates, money. One form component for all objects.
- `<FieldRenderer def field value>` — single source for how each widget looks and
  behaves (value display + edit). Add a widget once, every object gets it.

### 3.3 Generic data layer
- `createRecord(def, formData)`, `updateRecord(def, id, formData)`,
  `deleteRecord(def, id)` in `lib/crud.ts`: whitelist columns from the registry,
  coerce empties to null and numbers via metadata, write, and audit automatically.
- One set of API route handlers / server actions, parameterized by object key.
- Validation derived from FieldDef (required, type, option membership), shown
  inline. Zod schema generated from the registry.

### 3.4 What this buys us
- Add a field: add one FieldDef + one DB column (a migration). It instantly shows
  in list/detail/form/search/AI schema. No bespoke edits.
- Change a label, order, visibility, or widget: one line.
- New widget behavior (e.g. a phone field, a multi-select, a rich link): build the
  widget once; available to all objects.
- The AI logger reads the same registry to build its extraction schema, so AI
  output always matches the live fields and options. True 1:1, forever.

Migration approach: introduce the registry alongside the current pages, port one
object (People) to prove it, then the rest, then delete the bespoke files. No big
bang; each port is a small, safe slice.

---

## 4. UX / information architecture at scale

Patterns to adopt (from Linear/Attio/Superhuman), all backend-mapped:

- **Global command palette (Cmd/Ctrl-K):** jump to any record, run actions
  (new person, log conversation), search. The single fastest surface.
- **Global search:** Postgres full-text (or trigram) across names, emails, orgs,
  notes, quotes. One search box, all objects.
- **Saved views / filters per object:** filter by owner, segment, stage, status,
  country, overdue; save named views (a `views` table). Replaces ad-hoc patching
  of "can I see X."
- **"My work" home:** per-signed-in-user, next steps due/overdue across people +
  deals + partners, plus interviews logged. The daily driver.
- **Bulk actions:** multi-select rows -> set owner/stage/segment, delete. Backed
  by a single bulk endpoint.
- **Record detail = hub:** every linked record (interactions, deals at an org,
  people at an org) visible and addable in context; "Log conversation" button that
  pre-targets this record (ties into the AI funnel, section 5).
- **Keyboard + speed:** focus states, shortcuts, optimistic UI where safe.
- **Consistent chrome:** Back, breadcrumbs, page header, empty states, toasts,
  all from shared components (already started).
- **Kanban for deals/pipeline:** drag across stages (the cockpit board pattern
  repurposed), reading/writing `stage`.

---

## 5. AI logger: architecture and the funnel

### 5.1 Goals you set
- Each team member uses their OWN API key (so your account is not spammed).
- The pipeline is consistent no matter the model/provider, with consistent
  context and perfect, consistent parsing.
- A funnel: upload audio for STT, OR paste/type text; and from the same UI,
  create a new person/org (or target an existing one) and parse the info into
  that specific record's log.

### 5.2 Per-user keys (BYO key), secure
- New table `user_ai_settings` (one row per auth user, RLS so a user sees only
  their own): `provider` (anthropic|openai|...), `model`, `api_key_ciphertext`,
  `created_at`. Keys are **encrypted at rest** (AES-256-GCM with a server-only
  `ENCRYPTION_KEY`, or Supabase Vault/pgsodium). The key is **write-only** from
  the UI: you can set/replace it and see "key set", never read it back.
- At call time the server decrypts the current user's key and uses it. Keys never
  reach the browser after entry and never appear in logs.
- **Fallback policy (your choice):** default to "each user must set their own
  key" (your account untouched). Optionally allow a shared org key (env) as a
  fallback, toggleable in Admin. Recommended: require own key, with your key as an
  optional admin-only fallback.
- A **Settings** page: set provider, model, paste key (validated with a cheap
  test call), see usage/last-used. Per-user, self-serve.

### 5.3 Model-agnostic, consistent pipeline
- One `LLMProvider` interface: `extract(transcript, schema) -> Proposal`. Adapters
  for Anthropic and OpenAI (and future) implement it. The **prompt, the tool/JSON
  schema (built from live field_options + the registry), temperature 0, and all
  post-processing (validation, dedupe, linking) are identical** regardless of
  provider. The model is the only swappable part.
- **Consistency safeguards:** schema-constrained output (cannot emit invalid
  enums), strict "never invent" rules, deterministic settings, and a **golden
  test set** (sample transcripts -> expected records) run in CI so prompt/model
  changes never silently regress parsing. Versioned prompt (`prompt_version` saved
  on each ingestion) for traceability.
- Quality note to set expectations: weaker models may extract less, but the
  *contract* (valid schema, no hallucinated fields) is always enforced; we
  recommend a strong default model and let power users opt into others.

### 5.4 The funnel (single guided flow at /logger)
1. **Capture** (tabs): Upload audio | Record in browser | Paste/type text.
   Audio is stored, transcribed (STT), transcript shown and editable.
2. **Target** (optional): "Let AI detect everyone" (multi-record), or
   "Attach to existing" (search a person/org/deal), or "Create new" (make a new
   person/org now and attach the parsed info to it). This satisfies "from the same
   UI create a new person/org and parse the STT into their specific log."
3. **Extract**: model proposes records mapped to live fields; if targeted, it
   focuses on that record and always produces the interaction log against it.
4. **Review & commit**: per-record include + inline edit; dedupe warnings
   ("looks like an existing org, merge?"); save creates linked records and the
   interaction, storing audio + transcript + proposal + result.

### 5.5 STT
- Provider behind the same settings (default OpenAI Whisper; pluggable). Handles
  Hebrew + English. Per-user key applies to STT too where the provider matches.
- Large files: enforce a size limit and chunk if needed; show progress; keep audio
  in the private `recordings` bucket.

### 5.6 AI edge cases (must handle)
Missing/invalid/expired key (clear message + link to Settings); quota/rate limit
(graceful retry/backoff, friendly error); empty/again result; multi-person calls;
ambiguous org names (dedupe + confirm); enum drift (schema from live options);
partial/garbled transcript (editable before extract); non-English; cost surfaced
per run; every AI commit audited; undo (delete records created in a run via the
stored result ids).

---

## 6. System-wide data integrity and edge cases

- **Dedupe everywhere:** on manual create too (warn on matching email/domain/name),
  not just in AI commit. A shared `findDuplicates` helper.
- **Referential safety:** FKs already `on delete set null`; add UI affordances
  ("this org has 3 people") before delete.
- **Concurrency:** last-write-wins today; add `updated_at` checks / optimistic
  concurrency on edit to avoid silent overwrites for shared editing.
- **Append-only interactions:** keep; add a guarded "correct entry" that appends a
  correction rather than mutating history.
- **Validation:** centralized via the registry (required, types, option
  membership), consistent messages.
- **Time zones / dates:** store ISO dates; display in the team's locale; "overdue"
  computed consistently (already in `lib/format.ts`).
- **Soft delete (optional):** consider `archived_at` instead of hard delete for
  recoverability.

---

## 7. Security, permissions, observability

- **Auth/roles:** today every authenticated teammate can do everything. Introduce
  a real `profiles` table (maps auth user -> name/owner/role) so owners are users,
  not a flat enum, and so we can later add roles (admin vs member) if needed.
- **Secrets:** AI keys encrypted at rest, server-only; never in client or logs.
  Supabase service-role key (if ever used) stays server-side.
- **Observability:** Sentry for errors/traces (ready); audit_log for business
  KPIs and RCA; consider a lightweight usage log for AI runs (tokens, cost, model,
  user). Dashboards for pipeline KPIs.
- **Backups:** Supabase point-in-time/backup plan; periodic export.

---

## 8. Scalability and the future

- **Custom fields without code:** because fields are metadata, we can later let
  admins add fields from the UI (write to a `field_defs` table + a JSONB
  `custom` column or dynamic columns). The registry already anticipates this.
- **HubSpot migration:** display_ids + clean object model make export
  straightforward when the time comes.
- **Optional Google Sheet mirror:** one-way push for spreadsheet lovers.
- **Multi-team / B2C scale:** the model supports growth; RLS can evolve to
  team-scoping if EBY ever runs multiple GTM pods.

---

## 9. Phased roadmap (proposed build order)

Each phase is shippable and verified (build + PGlite + manual). We build to this
instead of reacting.

- **Phase 1 - Foundation framework (highest leverage).** Field registry +
  generic RecordForm/RecordDetail/RecordTable + generic CRUD/audit/validation.
  Port People and Organizations onto it (prove parity), keep others working.
  Outcome: future field/label/widget changes are one-line.
- **Phase 2 - Port the rest + consistent inputs.** Move Deals, Pilots, Partners,
  Interactions, Waitlist onto the framework; every FK becomes a searchable picker
  with inline create; every enum gets add-new; delete bespoke files.
- **Phase 3 - Power UX.** Global search, command palette, saved views/filters,
  "my work" home, bulk actions, deals kanban.
- **Phase 4 - AI logger v2.** Per-user keys + Settings page (encrypted),
  provider-agnostic pipeline, the full funnel (audio/text + target/create),
  dedupe-on-commit prompts, golden tests, cost/usage logging.
- **Phase 5 - Identity + integrity.** `profiles`/users, optional roles, dedupe on
  manual create, optimistic concurrency, soft delete.
- **Phase 6 - Design system.** Apply the bright EBY system across the framework
  components (one place to restyle everything), then the globe rebuild.
- **Phase 7 - Growth.** HubSpot export, Sheet mirror, custom-fields-from-UI,
  best-first-customer score, quote/signal bank.

Design note: because Phase 1 centralizes rendering, Phase 6 (the new design
system) restyles the whole app by editing the shared components/tokens once.

---

## 10. Decisions needed from you (with my recommendations)

1. **Adopt the field-registry framework (Phase 1) before more features?**
   Recommend: yes. It is the thing that stops reactive patching.
2. **AI keys:** require each user's own key, with your key as an optional
   admin-only fallback? Recommend: yes (protects your account).
3. **Key storage:** encrypt-at-rest in Postgres with a server `ENCRYPTION_KEY`
   (simple, portable) vs Supabase Vault (more setup). Recommend: server-encrypted
   now, revisit Vault later.
4. **Default models:** Claude (e.g. a strong Sonnet) for extraction, Whisper for
   STT, both overridable per user. OK?
5. **Roadmap order:** framework (1-2) -> power UX (3) -> AI v2 (4). Or pull AI v2
   earlier since the team is interviewing now? Recommend: do a thin slice of
   Phase 1 for People/Orgs, then jump to AI v2 (Phase 4) because discovery volume
   is the immediate need, then return to Phase 2-3.
6. **Soft delete vs hard delete?** Recommend: soft delete (archive) for safety.

Tell me your calls (or "go with recommendations") and I will build to this plan,
phase by phase, with no more one-off patching.
