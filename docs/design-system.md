# CopyDogg — Design System: Warm Serif

*Adopted 2026-09-29, replacing "Highlighter". Tokens come from section 2 of `uploads/smriti-design-system-from-littlebird.md`; only the visual system is borrowed, never its copy.*

**Personality:** warm paper, dark ink, one serif voice. Headlines are a single serif at weight 400 with tight negative tracking. Everything else is a quiet grotesk at 13–20px. Hierarchy comes from size and ink opacity, not weight or color. One green, used for the one thing you should press.

This file is the source of truth. Every color, font, size, radius, shadow and duration used in components comes from here, via the tokens in `app/globals.css`. Don't add values ad hoc. If something is missing, stop and ask; add it here first.

## Color tokens

Every hex/rgba below appears verbatim in the reference token list. Tailwind name = CSS variable without `--`.

### Surfaces

| Token | Value | Usage |
|---|---|---|
| `bg` | `#FFFDF5` | Page background |
| `surface` | `#FFFFFF` | Inputs, flat cards, result cards |
| `surface-cream` | `#FFFAEB` | The main card (`/app` generate card, onboarding card, unlock card) |
| `surface-warm` | `#FBF8EF` | Quiet panels inside a page: empty states, the idea preview, secondary sections |
| `surface-hover` | `#F4ECD9` | Hover on quiet buttons, chips and menu rows; the liked state |
| `surface-press` | `#F2EFE4` | Pressed state of quiet buttons and chips; segmented-control track |
| `bg-dark` | `#2A2B22` | Toast background (light mode); page background in dark mode |

### Ink

| Token | Value | Usage |
|---|---|---|
| `ink` | `#1B1C14` | Primary text, primary button fill, selected chip fill, slider fill |
| `ink-80` | `rgba(27,28,20,.80)` | Long reading text in results (optional softening) |
| `ink-65` | `rgba(27,28,20,.65)` | **Secondary text** (meta, help text, lead paragraphs on `surface-*`). 5.3:1 on `bg` |
| `ink-60` | `rgba(27,28,20,.60)` | Lead text and nav links on `bg` only (4.5:1 exactly — don't use on `surface-warm`/`surface-hover`) |
| `ink-50` | `rgba(27,28,20,.50)` | **Control edges** (inputs, unselected chips, secondary buttons: 3.3:1, passes WCAG 1.4.11). Placeholder text. Not for reading text |
| `ink-40` | `rgba(27,28,20,.40)` | Disabled text and icons |
| `on-dark` | `#FFFDF5` | Text on `ink`, `bg-dark` and `accent` fills |
| `on-dark-78` | `rgba(255,253,245,.78)` | Secondary text in dark mode |
| `on-dark-62` | `rgba(255,253,245,.62)` | Toast meta; lead text in dark mode |
| `on-dark-55` | `rgba(255,253,245,.55)` | Control edges and placeholders in dark mode (5.5:1 on `bg-dark`) |
| `on-dark-fill-07` | `rgba(255,253,245,.07)` | Card and input fill in dark mode |
| `on-dark-fill-10` | `rgba(255,253,245,.10)` | Borders, hover fill and focus ring in dark mode |

### Lines

| Token | Value | Usage |
|---|---|---|
| `border` | `rgba(0,0,0,.10)` | Default decorative border: flat cards, result cards, ghost buttons |
| `border-soft` | `rgba(27,28,20,.08)` | Dividers inside a card, header hairline |
| `border-mid` | `rgba(27,28,20,.12)` | Segmented-control track edge, chip hover edge |
| `border-strong` | `rgba(27,28,20,.16)` | Main card edge; hover edge on ghost buttons and clickable cards |
| `border-input` | `rgba(27,28,20,.28)` | Slider track (unfilled). Not an input edge (only 1.8:1 — inputs use `ink-50`) |

Decorative borders (`border*`) are never the only edge of something you can type into or press.

### Accent — sparingly

| Token | Value | Usage |
|---|---|---|
| `accent` | `#00674F` | **One per screen**: the main action ("Write posts" on `/app`, the landing CTA, "Next" in onboarding, "Unlock"). Also the active mode tab in the `/app` segmented control. `on-dark` text on it is 6.9:1; as text on `bg` it's 6.7:1 |
| `accent-10` | `rgba(0,103,79,.10)` | Inserted words in "Show changes" diffs; text-mark behind a few words |
| `accent-16` | `rgba(0,103,79,.16)` | Hover on `accent-10` surfaces |

No gradients, no second accent. Green never decorates: no green icons, borders or headings. Links are `ink` with an `ink-50` underline.

### Status

| Token | Value | Usage |
|---|---|---|
| `success` | `accent` | Confirmations ("Saved."). Light mode only as text; in dark mode "Saved." is `on-dark` text (green text fails on `bg-dark`) |

**No red.** The reference has no error color, so there isn't one:
- Errors are `ink` text that says what happened and how to fix it, placed right under the thing that failed.
- An invalid field gets a 2px `ink` edge (instead of 1px `ink-50`) plus that message.
- Destructive actions use a `primary` (ink) button whose label names the loss exactly ("Yes, reset everything"). The undo toast stays the main safety net.

### Dark mode

Built from the reference's dark-section treatment. Same token names, swapped values; set in the `prefers-color-scheme: dark` and `[data-theme="dark"]` blocks of `globals.css`. Light / Dark / System in Settings stays.

| Token | Dark value |
|---|---|
| `bg` | `#2A2B22` |
| `surface`, `surface-cream`, `surface-warm` | `on-dark-fill-07` over `bg` |
| `surface-hover`, `surface-press` | `on-dark-fill-10` over `bg` |
| `ink` (text) | `#FFFDF5` |
| `ink-65`, `ink-60` (secondary text) | `on-dark-78`, `on-dark-62` |
| `ink-50` (control edges, placeholder) | `on-dark-55` |
| `ink-40` (disabled) | `on-dark-55` |
| `border`, `border-soft`, `border-mid`, `border-strong`, `border-input` | `on-dark-fill-10` |
| `ring` | `0 0 0 4px rgba(255,253,245,.10)` |
| Header tint | `rgba(42,43,34,.72)` + 14px blur |

Inverted fills in dark mode (the reference's "CTA inverts to cream" rule):
- `primary` button, selected chip, selected segment (non-accent), slider fill: `surface-cream` `#FFFAEB` fill, `ink` `#1B1C14` text. Hover `surface` `#FFFFFF`.
- Toast: `surface-cream` pill, `ink` text; its action is an `ink` pill with `on-dark` text.
- `sh-float` and `sh-hover-sm` are dropped (invisible on dark); edges do the work.

**Green in dark mode is a fill only**: `accent` button and the active `/app` mode tab keep `#00674F` with `on-dark` text (6.9:1). Never green text or green lines on `bg-dark` (2.1:1). Diff inserts and the mark use `accent-16`.

## Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | **Newsreader** (variable, `opsz`) | 400 only | Every heading. Never bold, never uppercase |
| Sans | **Inter** | 400, 500, 600 | All UI text, buttons, inputs, paragraphs |
| Mono | **JetBrains Mono** | 400, 500 | Meta labels only (platform, date, counts, shortcuts). Never buttons, never sentences |

Loaded with `next/font/google` in `app/layout.tsx` (self-hosted at build time, no runtime request, no licence). Newsreader at `opsz` 72 for display sizes, auto below 32px.

### Type scale

| Step (Tailwind) | Font | Size / line-height / tracking | Usage |
|---|---|---|---|
| `text-display` | serif 400 | 68px / 1.1 / −3px | Landing hero H1 and closing CTA only |
| `text-h2` | serif 400 | 52px / 1.1 / −3px | Landing section headings; onboarding step title |
| `text-h3` | serif 400 | 24px / 32px / −0.5px | Page titles under `/app`, card titles, empty-state headings, unlock title |
| `text-lead` | sans 400 | 20px / 30px | Landing sub-headline, onboarding intro (`ink-60` on `bg`) |
| `text-btn-lg` | sans 600 | 18px / 24px | Landing CTA button only |
| `text-body` | sans 400 | 16px / 24px | Default reading text **and every input** (16px stops iOS zoom) |
| `text-ui` | sans 400–500 | 14px / 20px | Buttons in dense rows, chips, nav, help text |
| `text-meta` | sans 400 | 13px / 18px | Trust strip, fine print, char counts |
| `text-micro` | sans 500 | 12px / 1.3 | Labels only (platform, date). Nothing smaller than 12px |

Interactive text is at least 14px.

### Responsive headings (from the reference breakpoint table)

Headings shrink much more slowly than the viewport, so type stays big and editorial.

| Step | ≥992 | ≤991 | ≤767 | ≤479 |
|---|---|---|---|---|
| `text-display` | 68 / −3px | 60 / −3px | 54 / −1px, `text-wrap: balance` | 50 / −1px |
| `text-h2` | 52 / −3px | 52 / −3px | 50 / −2px | 34 / −1px |
| `text-lead` | 20 / 30 | 18 / 26 | 18 / 26 | 16 / 22 |
| `text-h3`, body, UI | unchanged | | | |

## Spacing, width, radii, depth, motion

### Spacing
4px base, from the reference scale: **4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 120, 160**. App screens stay in 4–48; 64–160 is landing section rhythm only. Page side margin (`gutter`) 16px on phones, 24px from ≤991 up.

### Content widths
Unchanged from before: everything under `/app` `max-w-2xl` (672px), header included; onboarding `max-w-xl`, unlock `max-w-sm`. Landing text container 1100px (`container`), hero column max 770px, lead max 510px.

### Radii

| Token | Value | Usage |
|---|---|---|
| `r-xs` | 8px | Icon buttons, small marks, mono tags |
| `r-md` | 12px | Flat cards, result cards, empty states, dropdown menus |
| `r-lg` | 14px | Inputs and textareas (reference input spec) |
| `r-2xl` | 20px | Main card |
| `r-3xl` | 24px | Landing product mock |
| `r-pill` | 999px | All buttons, chips, segmented control and its segments, toast |

### Depth

| Token | Value | Usage |
|---|---|---|
| `sh-float` | `0 4px 32px rgba(27,28,21,.10)` | Main card only (with `border-strong`) |
| `sh-hover-sm` | `0 10px 30px rgba(27,28,21,.06)` | Clickable flat cards on hover (library rows) |
| `sh-btn-inset` | `inset 0 1px 1px rgba(0,0,0,.2)` | Primary and accent buttons |
| `ring` | `0 0 0 4px rgba(27,28,20,.08)` | Field focus |

The offset ink shadows of Highlighter are gone. Elevation is soft and rare: one floating card per screen, everything else flat with a `border`.

### Motion

| Token | Value | Usage |
|---|---|---|
| `ease` | `ease` | All hovers and color changes |
| `ease-out-soft` | `cubic-bezier(.22,.61,.36,1)` | Enter/reveal |
| `d-fast` | 150ms | Hover color/border/bg |
| `d-base` | 200ms | Menus, toast in/out |
| `d-med` | 250ms | Clickable-card lift |
| `d-slow` | 350ms | Accordion height ("more options") |
| `d-reveal` | 900ms | Landing reveal (one IntersectionObserver, once) |

Buttons don't move on press (no translate). Everything respects `prefers-reduced-motion` (reveal renders static, caret stops blinking).

## Copy voice rules (applies to all UI text)

Unchanged.

- Plain verbs, sentence case, no filler
- Banned words: "leverage," "seamless," "unlock," "empower," "supercharge"
- Buttons name the action exactly: "Generate posts," not "Submit" or "Go"
- Loading states get personality: e.g. "sniffing out your tone..." — this is the one place playfulness is allowed
- Empty states are an invitation to act, not an apology: e.g. "nothing saved yet — go write something worth keeping"
- Errors state what happened and how to fix it, never "oops" without a next step

## Components

All in `components/ui/`. Pages use these instead of re-writing class strings. Inventory unchanged; skins re-specced.

- **Button** (`Button`) — every variant is a pill (`r-pill`), sans, `gap 8px` icon + label. Sizes `md` (44px, `padding 10px 20px`, `text-body`) and `sm` (36px, `padding 8px 16px`, `text-ui`).
  - `accent` *(new variant name for the one main action)*: `accent` fill, `on-dark` text, weight 500, `sh-btn-inset`. Hover `filter: brightness(1.15)`. One per screen.
  - `primary`: `ink` fill, `on-dark` text, weight 400, `sh-btn-inset`. Hover `filter: brightness(1.3)`. For strong-but-not-main actions (e.g. "Save" in a dialog).
  - `secondary` (reference "ghost"): transparent, 1px `ink-50` edge, `ink` text, weight 600. Hover: `ink` edge + `surface-hover` fill.
  - `quiet`: text only, `ink-65` → `ink` with `surface-hover` fill on hover. Weight 500.
  - `danger`: same skin as `quiet`, `ink` text; the label carries the meaning ("Delete"). Kept as a variant name so call sites don't change.
  - `destructive`: same skin as `primary`. Only for the final confirm of an irreversible action.
  - **Disabled** (all): `surface-press` fill, `ink-40` text, no shadow, no filter. Never an opacity fade.
- **Field** (`Input`, `Textarea`) — `surface` fill, 1px `ink-50` edge, `r-lg`, 16px `text-body`, `padding 0 16px` (inputs 48px tall; textareas `padding 12px 16px`). Placeholder `ink-50`. Hover: `ink` edge. Focus: `ink` edge + `ring`. Invalid: 2px `ink` edge + message below.
- **Card** (`Card`)
  - `main`: `surface-cream` fill, 1px `border-strong`, `r-2xl`, `sh-float`, padding 16 on phones / 24 from `sm`.
  - `flat`: `surface` fill, 1px `border`, `r-md`, padding 16. When the whole card is clickable: hover `border-strong`, `translateY(-2px)`, `sh-hover-sm`, 250ms.
  - Never nest a bordered box in a card; use spacing or a `border-soft` divider.
- **Chip** (`Chip`) — `r-pill`, `text-ui`. Off: transparent, 1px `ink-50` edge, `ink` text; hover `surface-hover` fill. On: `ink` fill, `on-dark` text, `ink` edge. Sizes `md` (36px, `padding 0 14px`) and `sm` (32px, `padding 0 12px`).
- **Segmented control** (mode switch, tabs) — `surface-press` track, 1px `border-mid`, `r-pill`, 4px inner padding. Unselected: `ink-65` text, hover `ink`. Selected: `accent` fill + `on-dark` text on the `/app` mode switch (the reference "active tab pill"); `ink` fill + `on-dark` everywhere else, so the green stays one-per-screen.
- **Slider** (`ToneSliders`) — 4px `border-input` track with an `ink` fill; thumb 20px `surface` circle with a 2px `ink` edge. Focus: `ring` on the thumb.
- **Label** — JetBrains Mono 12px / 1.3, weight 500, tracking 0.02em, `ink-65`. Not uppercase.
- **Link** — `ink` text, 1px `ink-50` underline, offset 3px; hover underline `ink`.
- **Mark** (was the highlighter `marker`) — `accent-10` band behind a few words, `ink` text. Landing only, at most once.
- **Diff** ("Show changes") — inserted words `accent-10` fill; removed words `ink-50` with strikethrough.
- **Toast** (`UndoToast`) — `bg-dark` pill, `on-dark` text, `on-dark-62` meta; the action is a `surface-cream` pill button with `ink` text (reference cream-on-dark), hover `surface`.
- **Empty state** (`EmptyState`) — `surface-warm` fill, no border, `r-md`, padding 32, centered `text-h3` serif heading, one `ink-65` line, one `secondary` action. An invitation, not an apology.
- **Loading** — the button keeps its size and says what's happening ("sniffing out your tone..."). Cards show a blinking 2×14px `ink` caret (1s `step-end`) while text streams, or pulsing `surface-press` bars (`r-xs`) before the first word.
- **Focus** — every interactive element: 2px `ink` outline, 2px offset on `:focus-visible`. Fields use `ring` instead.
- **Header** (`AppHeader`) — `bg` at 75% opacity (`rgba(255,253,245,.75)`) with `backdrop-filter: blur(14px)` and a `border-soft` bottom hairline, sticky. Logo left, `text-ui` `ink-60` nav links with 1×12px `border-mid` dividers.

## Migration status

Adopted 2026-09-29 for the **landing page only** (`app/page.tsx` / `components/landing/`), which defines its own scoped tokens in `app/landing.css` under a `.landing` root class so the rest of the app is untouched. `components/ui/*` and the `/app`, `/onboarding`, `/unlock`, `/app/library`, `/app/settings` screens still run on the previous "Highlighter" tokens in `app/globals.css` pending a follow-up migration — don't assume `bg-ink`/`bg-highlight`/etc. utilities in those files already mean Warm Serif.
