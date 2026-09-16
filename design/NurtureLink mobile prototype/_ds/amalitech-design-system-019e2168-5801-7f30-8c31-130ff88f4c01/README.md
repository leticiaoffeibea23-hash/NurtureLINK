# AmaliTech — Unified Experience Design System

A design system for **AmaliTech**, a tech-services and training company building digital products for Africa, Europe, and the United States. AmaliTech serves business leaders, SMEs, non-profits, and governmental organisations through internal tools (employee dashboards, leave management) and outward-facing products (the AmaliBlog content platform).

This system is the file-based companion to AmaliTech's Figma "Unified Experience Design System" library — Tailwind-aligned tokens, the AmaliTech brand identity (Dark Blue + Orange wordmark), Inter / Poppins typography, and a full UI kit built from the Figma sources.

---

## Source files

This system was built by reading AmaliTech's Figma file:

- **Figma**: *Unified Experience Design System.fig* (mounted virtually as a 74-page file).
- Key pages used: `Introduction`, `Tone-of-Voice-Microcopy`, `Colors` (Colors & Colors2 — final hex values), `Typography-Variants`, `Spacing`, `Shadows-Borders`, `Logos`, `Buttons`, `Forms`, `Navbar`, `Sidebar`, `ARMS-Dashboard-Redesign`, `Leave-Management-System`, `AmaliBlog-Redesign`.
- The Figma file enumerates two parallel palettes — an **Orange-primary** and a **Dark Blue-primary**. **Dark Blue (`#08283B`) is the canonical primary** in this system; orange is reserved for the wordmark and the brand pulse.

No external codebase was attached — UI kits in this system reconstruct the Figma frames pixel-faithfully without inventing new patterns.

---

## Content fundamentals — tone, voice & microcopy

AmaliTech's writing is, in its own words, "confident, inclusive, and driven by purpose." Five characteristics define every piece of copy:

| Trait | What it sounds like |
|---|---|
| **Professional yet approachable** | Confident, human-centred, transparent. No corporate stiffness; no chumminess either. |
| **Optimistic & inspiring** | Energised. We talk about *potential*, *growth*, *transformation*. We say "you can" before we say "you can't". |
| **Clear & direct** | Plain English. Break complex tech down. No jargon unless the audience demanded it. |
| **Collaborative & supportive** | We are partners, not vendors. "Together", "we", "with you". |
| **Forward-thinking & solutions-oriented** | Future-tense and action-tense. "Build the future" not "Solving today's problems". |

### Voice in practice

**Casing**: Sentence case for almost everything — buttons (`Add new incident`, not `Add New Incident`), nav items (`Help & support`), modal titles, table headers. Title Case is reserved for **proper nouns** (AmaliBlog, ARMS), display headings on marketing surfaces, and section titles inside the product (`My Annual Leave`, `Tools & Certifications` — these are domain headers, treated as titles). The Figma uses both consistently — match what surrounds your copy.

**First / second person**: Write *to* the user — "You can submit your leave request below." Use "we" sparingly, only when speaking on behalf of AmaliTech ("We've been working on something…"). Avoid "I" entirely; user-owned objects use possessives ("My Annual Leave", "My Incidents", "My Articles").

**Numbers & dates**: Numerals always (`18`, not "eighteen"). Dates in `5th Dec, 2025` style (day, month abbrev., year) as shipped in ARMS. Time as `11:01 am` lowercase.

**Punctuation**: Em-dashes (—) for natural pauses. Curly quotes ("it's", not "it's") to match the Figma. No exclamation marks in product UI — keep them for marketing surfaces and toast confirmations ("Welcome back!").

**Emoji**: Used sparingly and *only* in friendly headings or empty-state copy in the documentation surfaces (the Figma's Introduction page uses `👋 Welcome…` and `🕹 Component properties`). **Not used in production UI** — never in buttons, labels, or notifications. Default to text + an icon glyph instead.

**Vibe**: Warm but capable. Like a senior engineer who explains things well. Never breathless, never preachy.

### Specific examples from the brand

**Customer support — empathetic, supportive**:
> "Thank you for reaching out! We're here to help you. Let's get this sorted together so you can continue focusing on growing your business."

**Product description — clear, benefit-focused**:
> "Our cloud-based platform makes managing your business operations faster, smarter, and more cost-effective."

**Social — dynamic, conversational**:
> "Technology has the power to change everything. At AmaliTech, we're working every day to bring accessible, smart solutions to help your business succeed in the digital age."

**Empty state — friendly, gently directive**:
> "You're all caught up. Tasks that need attention appear here."

### Words to use vs. avoid

**Use** — *empower, transform, innovate, unlock potential, build the future, collaboration, smart solutions, growth, efficiency, scalability.*

**Avoid** — overly-technical jargon, *failure*, *difficult*, *impossible*, anything that frames the user as the problem. Never say "you can't" when "you can, once…" works.

### Microcopy guardrails

Five rules from the Figma: **clarity, conciseness, action, consistency, empathy**. A button label should be a *verb the user is committing to* — `Book a leave`, `Add new incident`, `Generate report`. A confirmation should name the *thing* that happened — `Leave request submitted`, not `Success`.

---

## Visual foundations

The AmaliTech visual language is **calm, capable, and confident**. Generous whitespace, a single very-dark blue carrying almost all UI weight, orange used surgically. It reads as enterprise-trustworthy without being cold.

### Colors

- **Primary — Dark Blue `#08283B`** (`darkblue-500`). Used for primary buttons, link text, headings, sidebar backgrounds, top-of-page bars. Almost the only non-neutral colour you'll see in product UI.
- **Accent — Orange `#FF5A00`** (`orange-500`). Reserved for the wordmark's `=`, brand pulse moments, focus rings, and the occasional badge / accent dot. **Not a primary CTA colour** in AmaliTech's preferred system.
- **Neutrals — Gray scale** plus near-white `#FDFDFD`. Almost everything in the UI — text, dividers, surfaces, form fields — is gray.
- **Support colours** — Light Blue, Ultramarine — used as background tints / hero washes.
- **Semantic** — Red (destructive / error), Yellow (warning), Green `#057A55` (success), Teal / Indigo / Purple / Pink available as accent / chart palettes.

Each colour ships as a **50–900 ten-step scale**. Backgrounds use 50/100, hovers use 600, pressed states use 700.

See `colors_and_type.css` and the rendered swatches in the Design System tab.

### Typography

Two type families do almost all the work, with one mono:

- **Poppins** (Bold) — display headings & hero titles. Geometric, modern, friendly. Bold weight dominates; Medium/SemiBold for sub-headings.
- **Inter** — body, UI labels, every screen-internal text. Regular for body, Medium for emphasis, SemiBold for buttons and labels, Bold for in-content headings.
- **JetBrains Mono** — code, kbd keys, technical labels, tabular numerics (substitute for Roboto Mono used in a few Figma frames — close metric match; flagged).

Tailwind-style scale: `display-2xl` (72) through `text-xs` (12); see `colors_and_type.css`. Line-heights are slightly generous (1.5 body, 1.25 display) which the Figma confirms.

### Spacing

A 4 px base scale (`--space-1` = 4 px, `--space-2` = 8 px, …, `--space-24` = 96 px). Inputs and buttons use `padding: 8px 16px` (`md`) by default; cards use 24 / 32 px padding. Generous breathing room is part of the brand.

### Backgrounds

- **Off-white / near-white surfaces** dominate (`#FDFDFD` and `#F9FAFB`).
- **Dark mode** uses the `darkblue-600`/`700`/`800` greys — *not* pure black. The ARMS Dashboard has explicit dark variants.
- **Marketing / brand surfaces** use a flat `darkblue-500` field with a subtle topographic-line pattern overlay on the *Tone of Voice* covers — call this the "AmaliTech wash". When you need a hero, the wash + the orange accent + the wordmark is the canonical recipe.
- **No gradients in product UI.** Marketing covers use a subtle two-tone but never the purple/blue gradient cliché.
- **No repeating textures or grain.** Imagery is photographic — warm, human, mostly photo-real.

### Imagery vibe

- Photography is **warm, candid, human**: people at desks, in training rooms, looking at screens together. Diverse — Africa-anchored but global. Natural light, slight saturation, never moody.
- Tech imagery — robots, AI cubes, datacenter shots — is **cooler-toned** (blues / black) and used for editorial features on the AmaliBlog. The product UI itself does not lean tech-bro neon.
- B&W is **not** used.

### Hover & press states

- **Buttons**: hover = colour darkens one step (e.g. `darkblue-500` → `darkblue-600`). Press = darkens two steps + `transform: translateY(1px)` is acceptable but not standard.
- **Links**: hover = underline + colour swap to `orange-600`.
- **Cards / list rows**: hover = `background: gray-50/lightblue-50` tint. No lift / shadow change.
- **Icon buttons**: hover = `background: gray-100` (square or rounded same as the icon's hit area).
- All transitions: `120-200 ms` using `cubic-bezier(0.16, 1, 0.30, 1)` (`--ease-out`).

### Focus states

Light-blue ring — `0 0 0 3px #B4DAFB` (`lightblue-200`). Visible on keyboard focus only (`:focus-visible`). The pale-blue halo reads clearly against the canonical dark-blue button without competing for visual weight — it's the brand's "you're being heard" signal.

### Borders

- Default `1px solid #E5E7EB` (`--color-border`). Stronger `#D1D5DB` for inputs. Subtle `#F0F1F3` for dividers inside cards.
- Border widths available: `.border` (1), `.border-2`, `.border-4`, `.border-8`.
- Styles: solid (default) and dashed (for dropzones / placeholders).

### Radii

- **Default radius for cards, inputs, modals: `8px` (`--radius-lg`)**.
- Buttons: semi-rounded (`6px`/`--radius-md`) or fully-rounded (pill, `--radius-full`) — both are first-class in the Figma. *Sharp* (0) exists for chip-like utilitarian elements.
- Avatars / dots: `--radius-full`.
- Modals / large overlays: `12-16px`.

### Shadows

A 5-step Tailwind ladder: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`. The Figma also defines coloured shadows (`.shadow-green-500/50` etc.) for accent emphasis — these are sparingly used (toasts, success callouts).

- **Cards** ship with `--shadow-sm` (subtle 1-line shadow + 1 px border).
- **Modals**: `--shadow-xl`.
- **Floating menus / popovers**: `--shadow-lg`.

Cards always *also* have a 1 px border — the brand never relies on shadow alone for separation.

### Layout

- 12-column grid, max content width ~1280 px on dashboards, ~1440-1920 px on marketing/blog (the Figma ships both).
- Sidebar nav at 240-280 px wide; the brand wordmark sits top-left.
- Top nav: 64 px tall on dashboards, 80 px on marketing.

### Transparency & blur

Used minimally. The only consistent use is the dark-blue overlay over hero imagery on marketing covers (`rgba(8,40,59, 0.7)`). No frosted-glass / `backdrop-filter` chrome.

### Animation

Restrained. Things ease in (≈ 200 ms, `--ease-out`). Nothing bounces. Spinners are simple rotation. Skeletons shimmer left-to-right. Carousels slide.

---

## Iconography

AmaliTech's icons are **outline by default, single-weight, 1.5-2 px stroke**. The Figma `/Icons` page exposes hundreds of icons used as instances throughout. The four most-used in the source file are `plus`, `arrow-right`, `arrow-left`, and `x` — utilitarian, consistent.

- **In this system we use Lucide** (https://lucide.dev) loaded from CDN. Lucide matches AmaliTech's stroke weight (2 px), corner style (rounded line joins), and visual rhythm almost exactly. **Flag**: this is a substitution — the original Figma uses a bespoke set extracted from the binary. If you need the AmaliTech-original icons, they live inside `/Icons/components/` in the Figma and would need to be exported individually.
- Icons are **never coloured** by themselves — they take `currentColor` from their parent text.
- **No emoji in production UI.** Emoji is reserved for documentation surfaces (`👋 Welcome…`) only.
- **No unicode icon chars** (✓ ✗ → ←) — always use the SVG icon component.
- The **AmaliTech wordmark** is delivered as a set of official SVGs in `assets/logos/`:
  - `wordmark-default-{25,50,75,100}.svg` — dark-blue text + orange three-bar E (the "default" lockup; use on light surfaces).
  - `wordmark-white-{25,50,75,100}.svg` — white text + orange bars (for dark / photographic surfaces).
  - `mark-only-{25,50,75,100}.svg` — the orange three-bar mark alone (favicons, app icons, compact uses).
  - For convenience, `assets/logo-wordmark-default.svg`, `assets/logo-wordmark-white.svg`, and `assets/logomark.svg` are aliases of the 100% scale.

---

## File index

| File | Purpose |
|---|---|
| `README.md` | This file. Brand context, content & visual foundations, manifest. |
| `SKILL.md` | Cross-compatible Agent Skill manifest — drop this whole folder into Claude Code as a Skill. |
| `colors_and_type.css` | All design tokens — colour scales, type scale, spacing, radii, shadows, motion. |
| `assets/` | Logos (wordmark, logomark, default + white variants) and supporting brand assets. |
| `preview/` | Tile-sized HTML specimens that populate the Design System tab — one card per token group / component cluster. |
| `ui_kits/arms_dashboard/` | UI kit for the **ARMS** employee dashboard (light + dark). |
| `ui_kits/leave_management/` | UI kit for the **Leave Management System** (dashboard + drawers + tables). |
| `ui_kits/amaliblog/` | UI kit for the **AmaliBlog** content platform (feed, write, article). |

### Products covered by the UI kits

1. **ARMS Dashboard** — an internal employee tools dashboard (apps grid, leave, clock-in, loan request, celebrations, public holidays). Light + dark modes.
2. **Leave Management System** — a leave / incident / certification dashboard with deep sidebar nav.
3. **AmaliBlog** — AmaliTech's internal blog / content platform: feed (For you / Featured), article view, write screen, bookmarks.

Each kit's `index.html` is a click-through hi-fi rebuild of the canonical screen for that product, using JSX components factored out into sibling files.

---

## Using this system

1. Drop `colors_and_type.css` into your `<head>`:
   ```html
   <link rel="stylesheet" href="colors_and_type.css">
   ```
2. Use `var(--color-primary)` / `var(--font-sans)` / `var(--space-4)` style tokens throughout your CSS.
3. Apply `.display-md`, `.text-md`, `.eyebrow`, etc. for semantic typography.
4. Borrow components from the `ui_kits/<product>/` folders — they import the same tokens and demonstrate the canonical patterns.

---

## Caveats

- **Icon set is substituted** (Lucide instead of the bespoke Figma icons). Same stroke and metric, but if pixel fidelity to the Figma is required, exporting the originals from `/Icons/components/` is needed.
- **Roboto Mono → JetBrains Mono** substitution for code. Roboto Mono is also a free Google Font if you'd prefer to swap back — change the `@import` line in `colors_and_type.css`.
- The Figma exposes both an **Orange-primary** and a **Dark Blue-primary** palette. Per the brief, this system commits to Dark Blue. If a future surface needs the orange variant, all hex values are already defined as `--color-orange-*` tokens.
- The AmaliBlog and ARMS UI kits are **visual recreations**, not full clones — the depth of inner flows that the Figma documents far exceeds what one kit comfortably holds.
