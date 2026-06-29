# EBY GTM CRM — AI Logger Funnel PRD

> Feature spec for the guided AI logger funnel: capture (up to 3 audio files or
> pasted text), a human-reviewed and editable mapping of exactly which fields the
> data lands in, explicit accept-before-save, and a clear "what just happened and
> what next" outcome with one-click navigation. Modeled on the Salesforce-style
> pipeline flow. Read with EBY-PRD-DATA-CAPTURE.md (the capture system) and
> EBY-DESIGN-SYSTEM.md (tokens). Author: Gal Rahav, built with Claude Code.

Status: PLAN being built in the same change. Last updated: 2026-06-29.

Working rules: no em-dashes, no emojis, no fluff, plain confident language, hover
help where meaning is not obvious.

---

## 1. Problem and goal

The team captures discovery calls. Today the logger transcribes and proposes
records, but the operator cannot see precisely which database field each value
will fill, cannot edit values or change dropdown choices before saving, and after
saving gets only counts with no guided next step. That breaks trust ("what did it
actually do to my data?") and stalls momentum ("what now?").

Goal: a funnel where the operator stays in control and always knows what is
happening. Capture, then a clear field-by-field preview that is fully editable,
then an explicit accept, then a confident outcome screen that shows exactly which
records were created and offers the obvious next actions.

Success looks like: an operator runs a recording, sees the parsed person and org
with every field labeled and editable, fixes one dropdown, accepts, and is taken
straight to the new person (or chooses org), with the option to start a deal or
pilot, all without confusion.

---

## 2. Users and jobs

The five founders, non-technical, right after a discovery call. Jobs:
- "Turn this call into clean records without trusting a black box."
- "Fix the one thing the AI got wrong before it saves."
- "After saving, take me to the right place and tell me what I can do next."

---

## 3. Scope

In scope:
1. Capture up to 3 audio files at once (drag-and-drop or browse) and/or pasted
   text. Files are transcribed and combined into one review.
2. A review screen that shows every proposed record as the exact destination
   fields (label plus value), all editable: free text fields editable, dropdown
   fields choosable from the live options, foreign keys shown clearly.
3. Per-record include toggle. Nothing is written until the operator clicks Accept
   and save.
4. An outcome screen that lists exactly which rows were created (with their IDs),
   and a clear next-steps panel: open the new person or organization (operator
   chooses when both exist), start a new deal or pilot prefilled with the org, or
   return to the globe (the control center).
5. Throughout, plain status so the operator always knows what just happened and
   what they can do next.

Out of scope (now): per-user AI keys (separate roadmap item), bulk CSV import,
multi-call batching beyond 3 files, editing foreign-key targets inline in review
(they resolve by name on save as today).

---

## 4. The flow (Salesforce-pipeline style, EBY-calm)

```
Capture            Review and edit                 Accept            Outcome
(audio x3 / paste) (field-by-field, editable) ----> (explicit) ----> (what happened
        |                  |                            |             + next steps)
   transcribe         change values,              writes records      open person/org,
   + extract          dropdowns, untick           (only included)     start deal/pilot,
                      records                                          or back to globe
```

### 4.1 Capture
- One panel: a drag-and-drop dropzone that accepts up to 3 audio files (shows each
  file name and size, remove any), plus a "Paste notes or transcript" text area.
  The operator can use either or both. Submit runs transcription on each file,
  concatenates the transcripts (and any pasted text), and extracts once.
- Clear progress: Uploading, Transcribing, Reading the conversation.

### 4.2 Review and edit (the trust step)
- Sections per object: Organizations, People, Deals, Interactions. Each proposed
  record is a card titled with its destination object and a row per field:
  the field label on the left, an editable control on the right.
  - Free text and notes: text inputs and text areas.
  - Dropdown fields (segment, status, stage, owner, role, lifecycle, etc.):
    a select seeded from the live options, so the operator can choose another
    value. Unknown or empty is allowed.
  - Verbatim quote and pains: text areas, preserved verbatim.
- Each card has an include checkbox (default on). Unticked records are not saved.
- A short banner states the rule plainly: "Nothing is saved until you click Accept
  and save." 
- Edits are kept in the browser and submitted as the final values, so what the
  operator sees is exactly what gets written.

### 4.3 Accept
- A single primary action, Accept and save. It writes only the included records,
  de-duping organizations by name and people by email or full name, resolving
  links by the names in this batch, and appending the interaction. The exact same
  guarantees as the manual forms (validation, audit, soft delete).

### 4.4 Outcome (what happened, what next)
- A confident summary: "Saved. Created 1 organization, 1 person, 1 deal, 1
  interaction," each as a link to the new record (with its ID).
- A next-steps panel, prominent and plain:
  - Open the person (if one was created). If both a person and an org were
    created, the operator chooses which to open.
  - Open the organization.
  - Start a new deal for this organization (opens the deal form prefilled with the
    org).
  - Start a new pilot for this organization (opens the pilot form prefilled).
  - Back to the globe (the control center).
- If nothing was created (all unticked or empty extraction), say so plainly with a
  path back to capture.

---

## 5. UX and design

- Bright theme tokens only; never an opacity modifier on a var token; use solid
  tokens or color-mix. Cards, primary and ghost buttons, selects via field styles.
- Calm density: one clear primary action per screen, generous spacing, the dawn
  background behind.
- Status is always explicit and human: progress labels, the save rule banner, the
  outcome summary, and labeled next steps. The operator is never left guessing.
- Hover help on anything not obvious. No em-dashes, no emojis.
- Keyboard and accessibility: focusable controls, visible focus, Escape-free
  (no modals required for the core flow), reduced-motion respected.

---

## 6. Data and mapping

- Capture writes one `ai_ingestions` row (source_type audio or text), storing the
  combined transcript, the proposal, and after save the result and the edited
  proposal. Up to 3 audio files are uploaded to the private recordings bucket via
  signed upload URLs (no session or size limit) and transcribed server-side.
- The review fields map one to one to the extraction proposal, which maps to the
  database columns through the same registry the manual forms use, so there is no
  drift between what the operator sees and what is written.
- Commit reuses the existing dedupe and linking, now operating on the operator's
  edited values rather than the raw proposal.
- Prefill: the new-deal and new-pilot links carry the org id as a query parameter;
  the generic create form reads query parameters to prefill fields.

---

## 7. Edge cases

- More than 3 files: blocked with a clear message.
- A non-audio file: rejected with a clear message, others kept.
- Empty extraction: outcome screen says nothing was found, offers to try again.
- Transcription or AI key missing: clear message naming the key, capture still
  stores what it can; manual entry remains available.
- Operator unticks everything: Accept is a no-op with a plain message.
- Duplicate org or person: deduped on save as today (kept, not re-created).
- Long transcription: server function runs with an extended duration.

---

## 8. Build outline

1. Multi-file capture: dropzone accepts up to 3 files; a server action issues
   signed upload URLs; a server action transcribes each, concatenates with pasted
   text, and extracts once.
2. Editable review client component: renders proposal fields as labeled, editable
   controls (text and selects from live options), include toggles, and submits the
   edited proposal to a commit action.
3. Commit-edited action: commits the operator's edited values with existing dedupe
   and audit; stores result and edited proposal.
4. Outcome view: lists created records with links and a labeled next-steps panel
   (open person or org, start deal or pilot prefilled, back to the globe).
5. Query-param prefill on the generic create form for deal and pilot.
6. QA: production build green, registry coverage check green, token-safety check,
   then ship develop to production.

---

## 9. Verification

- `npm run build` green; `npm run verify:registry` green; no opacity-on-token
  modifiers in changed files.
- Manual smoke once live (founder): upload 1 to 3 files, edit a field and a
  dropdown, untick one record, accept, confirm the created rows and that the
  next-step links land on the right records and prefill the deal or pilot form.
