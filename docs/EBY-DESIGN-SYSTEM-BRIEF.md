# EBY Design System Brief

> Purpose: a complete, self-contained brief to hand to a design AI (e.g. Claude
> Design) to generate the EBY design system: tokens, components, and guidelines.
> Everything needed is inline here, so it works even if the links do not resolve.
> Audience: a model or designer producing a design system for the EBY GTM CRM
> (an internal team app) and, by extension, the EBY brand surface.
> Living document; update each session.

---

## 0. TL;DR for the design AI

Build a **bright, hopeful, futuristic** design system for an internal
**GTM / CRM command center** used by a 5-person startup founding team. The brand
is EBY (Eliezer Ben Yehuda), reviving spoken Hebrew in the diaspora. The feeling:
**standing in open fields at dawn with a clear vision of a better future** —
light, spacious, calm, optimistic, precise. The product craft bar is
**Linear / Attio / Superhuman / Stripe / Vercel**: fast, keyboard-friendly,
information-dense without clutter, beautiful defaults. Deliver Tailwind-compatible
tokens (light theme primary, optional dark), a component spec, and usage guides,
in EBY's plain voice (no em-dashes, no emojis, no fluff).

---

## 1. What EBY is (context the design must express)

EBY (named after **Eliezer Ben Yehuda**, who revived spoken Hebrew from nothing
roughly a century ago) is an AI-powered platform that gets diaspora Jews
**actually speaking Hebrew**, and through it reconnects them to their Jewish
identity, to the real Israel, and to each other. Core thesis: for non-religious
Jews especially, the way into Jewish identity runs through culture, and culture
runs through language.

The mission, in one line: revive spoken Hebrew as a living, cultural,
identity-anchoring language, and use it to reconnect the next generation of Jews
worldwide to their identity, to the truth about Israel, and to one another.

**This product** is the internal **GTM CRM**: where the founding team runs
go-to-market during a validation sprint (discovery interviews with teachers,
principals, parents, learners; schools and community orgs as B2B; individual
learners as B2C; channel partners like Ulpans and Birthright). It is a "mini
startup inside the startup": a command center for finding the first real
customers. It must feel like calm, powerful mission control, not a spreadsheet.

**Founder working rules (must hold in all copy and UI):** no em-dashes, no
emojis, no fluff, build don't lecture, one clear action at a time, plain
confident language.

---

## 2. The feeling to evoke (the heart of this brief)

Bright, hopeful, futuristic, human. The founder's emotional reference:

> "Endless fields back in the days of Eliezer Ben Yehuda, where there were no
> phones, no distractions, only bright visions of building a better present so we
> will have a better future. Bright and full of hope."

Translate that into a digital surface:

- **Light and air.** Predominantly bright, open, generous whitespace. Light is
  the hero. Early morning over open fields, not a dark cockpit.
- **Hope and horizon.** A sense of distance and possibility: soft horizons,
  gentle dawn-to-sky gradients, a feeling of looking forward and outward.
- **Futuristic but timeless.** Clean geometry, precise typography, restrained
  depth. Future-facing, yet rooted in the dignity of the Hebrew-revival story.
  Not sci-fi neon; "optimistic, well-built tomorrow."
- **Focused calm.** No distractions, one action at a time. The UI should feel
  like clarity, like a quiet, wide field of view.
- **Alive, lightly game-like.** Smooth motion, a living world map, satisfying
  micro-interactions. Immersive like a finely made tool, never noisy, never
  scoreboard-y, never gamified-with-points.
- **Trustworthy and fast.** It holds real prospect data and the team lives in it
  daily. It must feel instant, reliable, and legible.

Avoid: heavy dark UI as the default, neon cyberpunk, clutter, dense legacy-CRM
dashboards, religious cliche, generic "tech" purple gradients, stocky imagery.

---

## 3. Inspiration (study these, take the spirit not the skin)

The design AI should internalize the craft of these products and translate it
into EBY's bright, hopeful direction:

- **Linear** — speed, keyboard-first, restraint, perfect spacing, calm density,
  command palette, opinionated defaults. The gold standard for "powerful but
  calm" internal tools.
- **Attio** — modern relational CRM: flexible records, linked objects, lists and
  views, clean data tables, a sense of a living data model. Closest peer.
- **Superhuman** — speed as a feeling, shortcuts, focus, satisfying transitions.
- **Stripe** — clarity, trustworthy typography, documentation-grade legibility,
  tasteful gradients and light.
- **Vercel / Geist** — crisp light UI, strong type, generous whitespace,
  black-on-white precision (we warm it up and brighten it).
- **Notion** — approachable, humane, content-first, friendly empty states.
- **Folk / Clay** — relationship-CRM warmth, enrichment, people-centric views,
  pipeline as something alive.
- **Arc browser / Raycast** — playful-yet-precise motion, delightful details,
  command-driven.
- **HubSpot / Salesforce** — learn the object model and pipeline conventions
  (contacts, companies, deals, stages), but reject their visual clutter.

Synthesis: **"Linear's calm precision + Attio's relational data model + a bright,
hopeful, fields-at-dawn soul."**

---

## 4. Brand foundations

- **Name:** EBY (Eliezer Ben Yehuda). The Hebrew letter **ע** (ayin) is a strong,
  ownable mark; treat it as a primary brand glyph / logomark seed.
- **Bilingual soul:** Hebrew and English coexist. Hebrew must be first-class
  (the brand is literally about Hebrew): elegant, contemporary Hebrew letterforms,
  RTL-aware layout primitives, even if the CRM UI is English-first today.
- **Voice:** confident, plain, forward-looking. Short sentences. No hype, no
  jargon, no filler.
- **Values to encode:** revival, connection, identity, culture, hope, building,
  clarity.
- **Motifs to draw from (subtle, never literal):** dawn light, open fields and
  horizon lines, growing things, a connected globe, Hebrew letterforms as texture.

---

## 5. Color direction (bright, hopeful) — give full scales

Design a token set around a **light base** with a dawn-over-fields palette.
Produce full 50-900 scales with AA-accessible pairings. Suggested anchors (refine
freely):

- **Surface / paper:** warm near-whites and faint sky tints. e.g. `#FCFCFA`
  (paper), `#F5F8FC` (mist), pure white for raised cards.
- **Ink / text:** soft deep navy-slate rather than pure black. e.g. `#0E1726`
  primary text, mid greys `#475569`, muted `#94A3B8`.
- **Primary (horizon blue):** optimistic sky/indigo for actions and focus. e.g.
  `#2E6BFF` to `#4F46E5`. Conveys future, trust, calm.
- **Accent (dawn gold):** warm sunrise amber for energy/highlights, used sparingly
  like sunlight. e.g. `#F6B43C`.
- **Growth green (fields):** fresh field green for positive/growth states. e.g.
  `#3FB984`.
- **Semantic:** success (green), warning (amber), danger (rose `#F43F5E`), info
  (blue), each tuned bright and legible on light surfaces; define soft tinted
  backgrounds (e.g. `bg/10`) for badges and callouts.
- **Category colors:** the CRM colors many pills (segments, stages, statuses,
  owners). Provide a harmonious categorical palette (8-12 hues) that stays legible
  on light surfaces; also define a deterministic hashing approach so arbitrary,
  user-added values get a stable pleasant color.
- **Gradients:** soft dawn gradients (sky blue to warm gold to white) for hero
  moments, the globe atmosphere, and empty states. Subtle, never garish.

Provide a refined **dark mode** too (the current app is dark and the globe may
stay cosmic), but **light is the default and the brand's true expression.**

---

## 6. Typography

- **Latin UI:** a clean, modern, slightly geometric sans (e.g. Inter, General
  Sans, Geist). Confident large headings, calm readable body, tight but breathable.
- **Hebrew:** pair with a high-quality contemporary Hebrew typeface (e.g. a modern
  Frank Ruhl / Heebo / Assistant / Rubik-class face). Hebrew must look intentional
  and dignified, not a fallback. The revival of Hebrew is the brand story.
- **Mono (optional):** for IDs (PER-0000001) and numbers; tabular figures in
  tables and metrics.
- **Scale:** define a type scale (e.g. 12, 13, 14, 16, 20, 24, 30, 38). Body 14,
  comfortable line-height (1.5+), generous heading spacing. Type should feel
  spacious, like room to breathe.

---

## 7. Layout, space, depth, motion

- **Whitespace-first.** Wide margins, clear grouping, one primary action per view.
- **Grid:** a calm 12-col content grid, max content width around 1100-1200px for
  reading, full-bleed for the globe/map.
- **Cards:** soft shadows, friendly radius (e.g. 12-16px), light borders only when
  needed. Depth via light (gentle elevation, sunlight-like glows, light-glass /
  frosted surfaces), not heavy outlines.
- **Density modes:** support a comfortable default and a compact table density
  (power users live in tables).
- **Motion:** smooth, eased, purposeful (e.g. 150-350ms, cubic-bezier(0.22,1,
  0.36,1)). Subtle fade/slide on enter, satisfying hover/selection, a living
  globe. Always respect prefers-reduced-motion. Nothing flashy.
- **Iconography:** thin, precise line icons, consistent stroke width, calm.

---

## 8. The world map / globe (signature element)

A 3D globe is a signature, immersive surface showing the EBY GTM universe:

- A quiet **starfield** backdrop (hopeful night-to-dawn sky), a softly glowing
  **atmosphere**, and points for organizations and people by location.
- Optional gentle **arcs** from diaspora locations to Israel, expressing the
  reconnection mission and the network effect made visible.
- Interactive: hover to reveal a card, click to open a record; optional drill-down
  (globe to country to city to record).
- It should feel like "looking out over the world with hope," consistent with the
  fields-at-dawn metaphor. The team will decide whether it stays cosmic-dark or
  shifts bright once the system exists.

---

## 9. Component inventory the system must define

App shell (left sidebar nav + top bar), global search / command palette, data
tables (searchable, sortable, density, row hover, click-through, optional bulk
select), saved views / filters, record detail layout (header with title + ID +
status pills + actions, two-column field grid, linked-records sections, activity
timeline), forms (text, textarea, number, date, **searchable combobox with
inline add**, **foreign-key picker with inline create**, file upload), buttons
(primary / ghost / danger / icon), badges/pills (categorical, with the hashing
rule), avatars (owner initials), tabs, modals/drawers, toasts/inline alerts,
empty states (warm, hopeful, with a clear CTA), the dashboard stat cards +
progress bars, the activity/audit feed, the AI logger review UI, and the globe.

For each: define tokens used, all states (default/hover/focus/active/disabled/
loading/selected/error), spacing, and accessibility behavior.

---

## 10. Accessibility and quality bar

- WCAG AA contrast minimum on the light theme (and dark).
- Visible focus rings, full keyboard operability (this is a power tool), logical
  tab order, ESC to close overlays.
- prefers-reduced-motion honored.
- Localization-ready: English + Hebrew, RTL-aware components and mirroring.
- One spacing scale, one radius scale, one type scale, one color system, applied
  everywhere. Consistency over cleverness.

---

## 11. Deliverables requested from the design AI

1. A token set as **Tailwind theme + CSS variables** for the bright theme (and
   optional dark): color scales, typography, spacing, radius, shadow, motion,
   z-index. (This app already uses Next.js 14 + Tailwind, so prefer
   Tailwind-native tokens and a `tailwind.config` snippet plus a `globals.css`
   `@layer` of component classes.)
2. Component specs/examples matching section 9 (ideally as React + Tailwind
   snippets, since the app is React).
3. A short usage guideline (do / don't), in EBY's plain voice.
4. A categorical color function (deterministic hashing) so user-added dropdown
   values get stable, pleasant colors.

---

## 12. Concrete starting point (optional, to anchor tokens)

Example CSS variables the design AI can refine (illustrative, not final):

```css
:root {
  --paper: #FCFCFA;
  --mist: #F5F8FC;
  --card: #FFFFFF;
  --ink: #0E1726;
  --ink-soft: #475569;
  --ink-muted: #94A3B8;
  --primary: #2E6BFF;       /* horizon blue */
  --primary-strong: #4F46E5;
  --accent: #F6B43C;        /* dawn gold */
  --growth: #3FB984;        /* fields green */
  --danger: #F43F5E;
  --radius: 14px;
  --shadow-card: 0 1px 2px rgba(16,23,38,.04), 0 12px 32px -12px rgba(16,23,38,.12);
  --ease: cubic-bezier(.22,1,.36,1);
}
```

---

## 13. Reference links (context; may or may not resolve)

- Founders hub (human-readable): https://eby-founders.vercel.app/
- Canonical context (raw markdown): https://eby-founders.vercel.app/context.md
- Research brief: https://eby-founders.vercel.app/eby-research.html
- Discovery playbook: https://eby-founders.vercel.app/eby-discovery.html
- Discovery questionnaire: https://eby-founders.vercel.app/eby-questionnaire.html

If these do not load, this brief already contains the full context needed.

---

## 14. One-paragraph anchor

EBY revived a language and, through it, a people's connection to itself. The
design should feel like that revival: bright, hopeful, and forward-looking, like
standing in open fields at dawn with a clear vision of a better future. Clean,
spacious, futuristic, and calm, with the craft of Linear and Attio, Hebrew and
English side by side, a living world map of the people we are reconnecting, and
not a single wasted pixel.
