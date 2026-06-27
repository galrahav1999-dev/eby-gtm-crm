# EBY Design System Brief

> Purpose: a complete, self-contained brief to hand to a design AI (e.g. Claude
> Design) to generate the EBY design system: tokens, components, and guidelines.
> Everything needed is inline here, so it works even if the links do not resolve.
> Audience: a model or designer producing a design system for the EBY GTM CRM
> (an internal team app) and, by extension, the EBY brand surface.

---

## 1. What EBY is (context the design must express)

EBY (named after **Eliezer Ben Yehuda**, who revived spoken Hebrew from nothing)
is an AI-powered platform that gets diaspora Jews **actually speaking Hebrew**,
and through it reconnects them to their Jewish identity, to the real Israel, and
to each other. Core thesis: for non-religious Jews especially, the way into
Jewish identity runs through culture, and culture runs through language.

This particular product is the **GTM CRM**: the internal workspace where the
five-person founding team runs go-to-market (discovery interviews, schools,
deals, pilots, partners, a consumer waitlist). It is a "mini startup inside the
startup." It should feel like a calm, powerful mission-control surface, not a
spreadsheet.

**Working rules of the founder (must be respected in all copy and UI):**
no em-dashes, no emojis, no fluff, build don't lecture, one clear action at a time.

---

## 2. The feeling to evoke (the heart of this brief)

Bright, hopeful, futuristic, and human. The emotional reference the founder gave:

> "Endless fields back in the days of Eliezer Ben Yehuda, where there were no
> phones, no distractions, only bright visions of building a better present so we
> will have a better future. Bright and full of hope."

Translate that into a digital surface:
- **Light and air.** Predominantly bright, open, generous whitespace. Light is
  the hero. Think early morning over open fields, not a dark cockpit.
- **Hope and horizon.** A sense of distance and possibility: soft horizons,
  gentle gradients from warm dawn tones to clear sky, a feeling of looking
  forward.
- **Futuristic but timeless.** Clean geometry, precise typography, subtle depth.
  Future-facing, yet rooted in the dignity of the Hebrew revival story. Not
  sci-fi neon; more "optimistic, well-built tomorrow."
- **Focused calm.** No distractions, one action at a time. The UI should feel
  like clarity, like a quiet field of view.
- **Alive, lightly game-like.** Smooth motion, a living world map, satisfying
  micro-interactions. Immersive like a well-made tool, never noisy or
  scoreboard-y.

Avoid: heavy dark UI, neon cyberpunk, clutter, busy dashboards, religious
cliche, stock "tech" gradients, anything that feels like a legacy CRM.

---

## 3. Brand foundations

- **Name:** EBY (Eliezer Ben Yehuda). The Hebrew letter **ע** (ayin) is a strong,
  ownable mark; treat it as a primary brand glyph.
- **Bilingual soul:** Hebrew and English coexist. Design must handle Hebrew
  (RTL-capable type, elegant Hebrew letterforms) alongside English gracefully,
  even if the CRM UI is English-first.
- **Voice:** confident, plain, forward-looking. Short sentences. No hype.
- **Values to encode:** revival, connection, identity, culture, hope, building.

---

## 4. Color direction (bright, hopeful)

Define a token set around a **light base** with a hopeful, dawn-over-fields
palette. Suggested direction (the design AI should refine into full scales 50-900
with accessible contrast):

- **Base / surface:** warm whites and the faintest sky tints
  (e.g. `#FCFCFA` paper, `#F4F7FB` mist) for backgrounds; pure white cards.
- **Ink / text:** deep but soft (e.g. near-black `#0E1726` to slate greys), never
  pure black, to keep it gentle.
- **Primary (horizon blue):** an optimistic sky/indigo blue as the action color
  (e.g. around `#2E6BFF` to `#4F46E5`), conveying future and trust.
- **Accent (dawn):** a warm sunrise gold/amber (e.g. `#F6B43C`) for highlights,
  energy, and "growth," used sparingly like sunlight.
- **Living greens (fields):** a fresh field green (e.g. `#3FB984`) for positive
  states, growth, and the "fields" motif.
- **Semantic:** success green, warning amber, danger rose, all tuned bright and
  legible on light surfaces.
- **Gradients:** soft dawn gradients (sky blue to warm gold to white) for hero
  moments and the globe atmosphere; keep them subtle, never garish.

Provide both a light theme (primary) and an optional refined dark mode, but
**light is the default and the brand's true expression.**

---

## 5. Typography

- **Latin:** a clean, modern, slightly geometric sans for clarity and a futuristic
  feel (e.g. Inter, General Sans, or similar). Large, confident headings; calm,
  readable body.
- **Hebrew:** pair with a high-quality Hebrew typeface that feels contemporary and
  dignified (the revival of Hebrew is the brand story, so Hebrew type must be
  first-class, not an afterthought).
- **Hierarchy:** generous heading sizes, strong weight contrast, comfortable line
  length, airy line-height. Type should feel spacious, like room to breathe.
- **Numerals:** tabular figures for the CRM's tables and metrics.

---

## 6. Layout, space, motion

- **Whitespace-first.** Wide margins, clear grouping, one primary action per view.
- **Cards** with soft shadows and rounded corners (a friendly, modern radius).
- **Depth via light**, not heavy borders: gentle elevation, soft glows like
  sunlight, frosted/light-glass surfaces.
- **Motion:** smooth, eased, purposeful. Subtle fade/slide on enter, satisfying
  hover and selection states, a living globe. Respect reduced-motion. Nothing
  flashy or distracting.
- **Iconography:** thin, precise line icons; consistent stroke; calm.

---

## 7. The world map / globe (signature element)

A 3D globe is a signature, immersive surface showing the EBY GTM universe:
- A **starfield** backdrop (quiet, hopeful night-to-dawn sky), a softly glowing
  **atmosphere**, and points for organizations and people by location.
- Optional gentle **arcs** connecting the diaspora to Israel, expressing the
  mission of reconnection (network effect made visible).
- Interactive: hover to reveal, click to open a record. Cool but uncluttered.
- It should feel like "looking out over the world with hope," consistent with the
  fields metaphor, in the bright brand palette (not a dark gamer aesthetic).

---

## 8. Components the design system must define

For the CRM specifically: app shell (sidebar + topbar), navigation, data tables
(searchable, sortable), record detail pages, forms (text, searchable select /
combobox, date, number, foreign-key picker with inline-create, file upload),
buttons (primary/ghost/danger), badges/pills (colored by category), avatars,
empty states, modals, toasts, the dashboard stat cards and progress bars, the
activity feed, and the globe. Define tokens (color, type, space, radius, shadow,
motion), states (hover/focus/active/disabled/loading), and accessibility
(WCAG AA contrast, focus rings, keyboard support).

---

## 9. Accessibility and quality bar

- WCAG AA contrast minimum on the light theme.
- Visible focus states, full keyboard operability, reduced-motion support.
- Localization-ready (English + Hebrew, RTL aware).
- Consistency: one spacing scale, one radius scale, one type scale, one color
  system, applied everywhere.

---

## 10. Deliverables requested from the design AI

1. A token set (CSS variables / Tailwind theme) for the bright theme (and optional
   dark), covering color scales, typography, spacing, radius, shadow, motion.
2. Component specs/examples matching section 8.
3. A short usage guideline doc (do/don't), in EBY's plain voice.
4. Output that can be wired into a Next.js + Tailwind app (this CRM already uses
   Next.js 14 + Tailwind), so prefer Tailwind-compatible tokens.

---

## 11. Reference links (context; may or may not resolve)

- Founders hub (human-readable): https://eby-founders.vercel.app/
- Canonical context (raw markdown): https://eby-founders.vercel.app/context.md
- Research brief: https://eby-founders.vercel.app/eby-research.html
- Discovery playbook: https://eby-founders.vercel.app/eby-discovery.html

If these do not load, this brief already contains the full context needed.

---

## 12. One-paragraph summary to anchor the design

EBY revived a language and, through it, a people's connection to itself. The
design should feel like that revival: bright, hopeful, and forward-looking, like
standing in open fields at dawn with a clear vision of a better future. Clean,
spacious, futuristic, and calm, with Hebrew and English side by side, a living
world map of the people we are reconnecting, and not a single wasted pixel.
