# EBY GTM CRM — Design System (Implemented)

> The DESIGN reference for what is actually shipped in code (not the aspirational
> brief). Read this with `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`,
> and `components/crm/*` open. The source brief that generated the tokens is
> `docs/EBY-DESIGN-SYSTEM-BRIEF.md`; this doc is the as-built truth.

Last updated: 2026-06-28.

---

## 1. The idea

"Fields at dawn." Bright, warm, hopeful, forward-looking. The app should feel like
sunrise over a field, not a dark admin tool. Light is the brand's true expression;
dark is a brand-tailored cosmic night (not a generic grey dark mode). The product
is mission control for reconnecting diaspora Jews with spoken Hebrew, so the home
screen is a living globe.

Hard rules that never change:
- No em-dashes, no emojis, no fluff in UI copy.
- Plain, confident, reassuring language.
- Hover help (`HelpTip`, a "?" tooltip) on fields and anywhere meaning is not
  obvious, because the user base is non-technical.

---

## 2. Theming model (how it works)

Theme is set on the root element as `<html data-theme="light|dark">`. There is a
third user preference, **auto**, which resolves to light between 06:00 and 18:00
and dark otherwise. CSS variables are redefined per theme; every component reads
the variables through Tailwind semantic tokens. Never hardcode hex in components;
use the tokens.

- Tokens live in `app/globals.css` under `:root[data-theme="light"]` and
  `:root[data-theme="dark"]`.
- The user toggle is `components/crm/ThemeToggle.tsx`. It cycles auto -> light ->
  dark, writes `localStorage["eby-theme"]`, and sets both `data-theme` (resolved)
  and `data-themePref` (the raw choice) on `<html>`.
- No-flash init: an inline script in `app/layout.tsx` runs before paint, reads
  `localStorage["eby-theme"]`, resolves auto by the hour, and sets `data-theme`
  so there is no light/dark flash on load.

### CRITICAL pitfall: never put a Tailwind opacity modifier on a var-backed token
Tokens are CSS variables, so `bg-card/90`, `bg-surface/80`, `text-ink/70` etc. do
NOT work (Tailwind cannot compute alpha on a `var()`), and they render wrong or
transparent. This already bit us twice. Use one of:
- a solid token (`bg-card`, `bg-surface-muted`), or
- `color-mix(in srgb, var(--x) 78%, transparent)` in CSS (see `.glass`).

If you ever need a translucent surface, add a dedicated token or a `.glass`-style
component class. Do not reach for `/opacity`.

---

## 3. Tokens (current values)

Light (`:root`, `:root[data-theme="light"]`):

| Token | Value | Use |
|---|---|---|
| `--paper` | `#fbf8f1` | app background (warm cream) |
| `--mist` | `#f4f7fb` | muted surface |
| `--card` / `--card-raised` | `#ffffff` | cards, raised surfaces |
| `--ink` | `#0c1320` | primary text |
| `--ink-soft` | `#334155` | secondary text (darkened for contrast on cream) |
| `--ink-muted` | `#5b6678` | muted text/labels (darkened for contrast) |
| `--line` / `--line-soft` | `rgba(14,23,38,.10)` / `.05` | borders |
| `--primary` | `#2e6bff` | brand blue (actions, links) |
| `--primary-strong` | `#4f46e5` | hover/indigo |
| `--accent` | `#f6b43c` | dawn gold (highlights, gradients) |
| `--growth` | `#3fb984` | positive/green |
| `--danger` | `#f43f5e` | overdue/destructive |
| `--field` | `#ffffff` | input background |

Dark (`:root[data-theme="dark"]`) — cosmic night, brand-tailored:

| Token | Value |
|---|---|
| `--paper` | `#0a0f1e` |
| `--mist` | `#0e152a` |
| `--card` / `--card-raised` | `#121a30` / `#16203a` |
| `--ink` | `#eaf0ff` |
| `--ink-soft` | `#aab7d8` |
| `--ink-muted` | `#6b789c` |
| `--primary` | `#5b86ff` |
| `--primary-strong` | `#8b9bff` |
| `--accent` | `#f6b43c` (kept warm) |
| `--growth` | `#45c98f` |
| `--danger` | `#fb7185` |
| `--field` | `#0e162c` |

Both themes also set `--shadow-card`, `--shadow-pop`, and `--ease`
(`cubic-bezier(0.22, 1, 0.36, 1)`, the standard motion easing).

Body has a fixed-attachment background gradient per theme (dawn glow top-right +
cool glow bottom-left in light; blue/violet cosmic glows in dark) — see the
`body` rules in `globals.css`.

---

## 4. Tailwind semantic tokens

`tailwind.config.ts` maps Tailwind color names to the CSS vars, so utilities like
`bg-card text-ink border-line` resolve per theme. `darkMode` is
`['class', '[data-theme="dark"]']`.

- `surface` -> `--paper`, `surface-muted` -> `--mist`, `card`/`card-raised`,
  `ink`/`ink-soft`/`ink-muted`, `line`/`line-soft`, `primary`(+`-strong`,
  `-contrast`), `accent`, `growth`, `danger`, `field`.
- Shadows: `shadow-card`, `shadow-pop`.
- Fonts: `font-sans` = `var(--font-geist-sans)`, `font-mono` =
  `var(--font-geist-mono)`, `font-hebrew` = `var(--font-heebo)`, `font-serif` =
  `var(--font-frank)`.

---

## 5. Fonts

- **Geist Sans / Geist Mono** come from the `geist` npm package, imported in
  `app/layout.tsx` as `import { GeistSans } from "geist/font/sans"` and
  `{ GeistMono } from "geist/font/mono"`. IMPORTANT: Geist is NOT in
  `next/font/google`; trying that throws "Unknown font Geist". Use the package.
- **Heebo** (Hebrew) and **Frank Ruhl Libre** (serif accents) come from
  `next/font/google`. Their CSS vars are `--font-heebo` and `--font-frank`.
- The logo tile (the "א") uses Heebo at weight 700.

---

## 6. Component classes (globals.css `@layer components`)

Reusable classes already defined — prefer these over re-rolling styles:
- `.card` — rounded-2xl, `var(--card)` bg, `var(--line)` border, `--shadow-card`.
- `.glass` — translucent card via `color-mix` + `backdrop-filter: blur(14px)`
  (the correct way to get a see-through surface; used on globe overlays).
- `.btn` + `.btn-primary` / `.btn-ghost` / `.btn-danger` — buttons; primary uses
  `--primary` with a soft glow shadow and `--primary-strong` on hover.
- `.chip` — small rounded status pill.
- `.label-eyebrow` — uppercase tracked micro-label (used everywhere for section
  and metric labels).
- `.bg-primary-soft` — `color-mix` primary tint (safe translucency).
- `.logo-tile` — the dawn-gradient app mark.
- `.field-input` — standard input styling with focus ring via `color-mix`.
- `.skeleton` + `shimmer` and `.animate-rise` (`rise` keyframe) for loading and
  entrance motion. All motion is disabled under `prefers-reduced-motion`.

Deterministic colors: `lib/colors.ts` -> `ownerColor(owner)` (stable per team
member) and `labelColor(text)` (stable hashed color per string). Used for owner
avatars and segment colors so the same entity is always the same hue.

---

## 7. The globe home (`components/crm/GlobeHome.tsx`)

The home route `/` (`app/(app)/page.tsx`) is a full-screen living globe — the
centerpiece. The server component fetches orgs + people that have coordinates
(geocoded via `lib/geo.ts`, jittered so co-located points separate) plus snapshot
stats, and passes them in.

Key implementation facts:
- `react-globe.gl` loaded via `next/dynamic` with `ssr: false` (it needs the DOM).
- The frame is `fixed bottom-0 left-56 right-0 top-14` (clears the 56-wide sidebar
  and 14-high topbar). A `ResizeObserver` keeps the globe sized to the frame.
- **Time-of-day scenery lives IN the backdrop, not just the page.** `currentPhase()`
  returns dawn/day/dusk/night by the hour. `PHASE[phase]` defines layered CSS:
  `base` gradient, optional `accent` radial, a starfield (`STARS` image from
  unpkg three-globe night-sky) at `stars` opacity, a center `glow`, and a
  `vignette`. The globe's own `backgroundColor` is transparent
  (`rgba(0,0,0,0)`) so the scenery shows through. Each phase also swaps the
  `globe` texture (earth-day / blue-marble / earth-night) and the
  `atmosphereColor`.
- Auto-rotation at speed 0.35 for a living feel; zoom enabled.
- Points are colored by `colorBy` (owner | segment | type) using the
  deterministic color helpers. Clicking a point routes to that record.
- Overlays: a `.glass` title card (top-left), a collapsible Snapshot card
  (top-right: interviews/people/orgs/overdue + the 25-interview gradient bar +
  "Open full dashboard"), and a bottom **control dock** (`.glass`): type segmented
  control, owner avatar filter chips, segment + country dropdowns, and a color-by
  dropdown, with a Clear button when any filter is active.

There is no separate "World Map" tab anymore; the globe IS the home. The data
dashboard is its own route at `/dashboard`.

---

## 8. Navigation and shell

- `components/crm/Sidebar.tsx` — 56-wide left rail. Groups: Overview (Globe,
  Dashboard, Activity), Records (Organizations, People, Deals, Pilots, Partners,
  Interactions, B2C waitlist), Tools (AI logger, Admin/lists). Inline SVG icon set
  (no icon dependency). Active state = `bg-primary-soft` + `ring-primary`.
- `components/crm/Topbar.tsx` — 14-high top bar, holds the `ThemeToggle`.
- `components/crm/DataTable.tsx` — the premium list table: initials `Avatar`
  (deterministic `labelColor`) on the strong column, search input with a magnifier
  icon, an "N of M" count pill, sticky header, click-row-to-open, sortable
  columns, taller rows (`py-3.5`), hover row tint + name turns primary. This is
  the styling standard new list-like surfaces should match.

---

## 9. What is Grade-A vs still plainer (honest status)

Styled to the target ("Grade A"):
- Light + brand-dark + auto theming, app-wide tokens.
- The globe home (atmospheric, time-of-day, filtered).
- The data tables (DataTable).
- The dashboard metric cards + sprint bar + people-by-owner.
- Sidebar/topbar shell.

Still plainer than Grade-A (the immediate design backlog where we stopped):
- Record **detail** and **edit** pages (functional, generic, but visually plain).
- The **AI logger** input + review screens.
- The **login** screen.
- **Higgsfield hero media** was planned (realistic dawn/field imagery for login
  and empty states) but NOT yet generated. The Higgsfield MCP tools are available
  in-session when we return to this.

When restyling these, do it through the framework/shared components so it is a
once-and-everywhere change (see the field-registry note in the tech handoff), not
per-page patching.

---

## 10. Working method for design changes

1. Change tokens in `globals.css` (and the Tailwind map only if adding a new
   semantic name). Everything that uses the token updates everywhere.
2. Never use `/opacity` on a var token (section 2). Use solid or `color-mix`.
3. The user is the rendering feedback loop: this environment cannot see the
   rendered UI, and WebFetch to the preview is login-gated (403). Ship to the
   Vercel preview, then ask the user for a screenshot. Iterate from that.
4. Keep copy free of em-dashes and emojis.
