# CopyDogg — Design System: Highlighter

*Adopted 2026-09-28 (direction C from the design lab), replacing the cream/teal "editorial" system.*

**Personality:** paper, ink and a highlighter pen. Grotesque headlines, crisp ink borders, and one bright yellow mark for what matters: what's selected, what's primary, what you're looking at right now. Calm everywhere else.

This file is the source of truth. Every color, font, size, radius, shadow and duration used in components comes from here, via the tokens in `app/globals.css`. Don't add values ad hoc. If something is missing, add it here first.

## Color tokens

| Token (Tailwind) | Light | Dark | Usage |
|---|---|---|---|
| `paper` | `#F5F5F1` | `#121211` | Page background |
| `card` | `#FFFFFF` | `#1C1C1A` | Cards, inputs, raised surfaces |
| `ink` | `#141413` | `#F2F2EC` | Primary text, main-card borders, offset shadows |
| `ink-soft` | `#5E5E58` | `#A3A39B` | Secondary text, placeholders, meta labels |
| `hairline` | `#E2E2DC` | `#2E2E2B` | Dividers and flat-card borders (decorative only) |
| `control` | `#8E8E86` | `#6B6B64` | Edges of inputs, secondary buttons and unselected chips; 3:1 against paper and card |
| `highlight` | `#F2D64B` | `#F2D64B` | The one bright color. **Background only, never text.** Selected chips, the active mode, text marks, the dark-mode primary button |
| `highlight-hover` | `#E8C623` | `#F7E27A` | Hover on highlight backgrounds |
| `on-highlight` | `#141413` | `#141413` | Text and icons on `highlight` (always dark, in both modes) |
| `highlight-soft` | `#FBF1BF` | `#3A3418` | Quiet tint: inserted words in diffs, liked state, hover on quiet buttons; text on it is `ink` |
| `primary` / `on-primary` | `#141413` / `#FFFFFF` | `#F2D64B` / `#141413` | Primary button fill and its text |
| `primary-hover` | `#33332F` | `#F7E27A` | Primary button hover |
| `success` | `#1F6B45` | `#7FCB9E` | Confirmations ("Saved.") |
| `danger` | `#B42318` | `#F08F84` | Errors and destructive actions only |
| `focus` | `#141413` | `#F2D64B` | Keyboard focus outline (2px, 2px offset) |

Contrast (checked): all text pairs ≥ 4.5:1 in both modes. `control` is ≥ 3:1 on `paper` and `card`, as WCAG 1.4.11 requires for input edges. `hairline` is intentionally faint and is never the only edge of something you can type into or press.

One bright color, and only as a background. No second accent, no gradients. Links are `ink` with a `highlight` underline, not a colored text link.

## Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | Bricolage Grotesque (variable, `opsz`) | 600–700 | Headlines only |
| Body | Geist | 400, 500, 600 | All UI text, buttons, inputs, paragraphs |
| Mono | Geist Mono | 400, 500 | Small meta labels only (platform, date, counts, shortcuts). Never buttons, never sentences |

Loaded with `next/font/google` in `app/layout.tsx` (self-hosted at build time; no request to Google at runtime).

Type scale (Tailwind utilities in brackets):

| Step | Size / line-height | Weight | Notes |
|---|---|---|---|
| Display (`text-display`) | clamp(42px, 8vw, 70px) / 0.98 | 700 | tracking −0.035em; landing hero only |
| Title (`text-title`) | clamp(26px, 5vw, 30px) / 1.1 | 650 | Page titles; tracking −0.02em |
| Heading (`text-heading`) | 21px / 1.2 | 600 | Section and card headings |
| Body (`text-body`) | 16px / 1.55 | 400 | Default for reading text **and every input** (16px stops iOS zooming on focus) |
| Small (`text-small`) | 14px / 1.45 | 400–500 | Supporting text, buttons in dense rows, chips |
| Label (`label` utility) | 12px / 1.3 | 500 | Geist Mono, tracking 0.02em, **not uppercase** |

Nothing smaller than 12px, and 12px is only for mono labels. Interactive text is at least 14px.

## Shape, elevation, spacing, motion

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 6px | Icon buttons, small marks |
| `rounded-md` | 10px | Buttons, inputs, flat cards |
| `rounded-lg` | 14px | Main cards, sheets |
| `rounded-chip` | 8px | Chips, pills, segmented controls (not fully round) |
| `shadow-card` | `4px 4px 0 ink` | Main card only (with a 1.5px `ink` border) |
| `shadow-raise` | `2px 2px 0 ink` (light), none (dark) | Primary buttons |
| Spacing | 4px base: 4, 8, 12, 16, 20, 24, 32, 40 | Stick to these steps |
| Content widths | App pages `max-w-2xl` (672px); forms `max-w-xl` (576px); landing `max-w-3xl` | Header aligns to the same width |
| Motion | 160ms `ease-out` for color/border/shadow; 200ms for enter/exit | Buttons press 1px down; respects reduced motion |

No soft blurry shadows. Elevation is either an ink border with an offset shadow (the main card) or a flat hairline border (everything else).

## Copy voice rules (applies to all UI text)

- Plain verbs, sentence case, no filler
- Banned words: "leverage," "seamless," "unlock," "empower," "supercharge"
- Buttons name the action exactly: "Generate posts," not "Submit" or "Go"
- Loading states get personality: e.g. "sniffing out your tone..." — this is the one place playfulness is allowed
- Empty states are an invitation to act, not an apology: e.g. "nothing saved yet — go write something worth keeping"
- Errors state what happened and how to fix it, never "oops" without a next step


## Components

All in `components/ui/`. Pages use these instead of re-writing class strings.

- **Button** (`Button`): variants `primary` (primary fill, `shadow-raise` in light), `secondary` (transparent, `control` border, hover `highlight-soft`), `quiet` (text only, `ink-soft` → `ink` + `highlight-soft` on hover), `danger` (quiet, `danger` text). Sizes `md` (44px tall) and `sm` (36px). **Disabled:** `hairline` fill, `ink-soft` text, no shadow. Never an opacity fade.
- **Field** (`Input`, `Textarea`): `card` fill, 1px `control` border, `rounded-md`, 16px text. Hover: `ink` border. Focus: `ink` border plus a 3px `highlight` ring. Invalid: `danger` border.
- **Card** (`Card`): `main` has a 1.5px `ink` border, `shadow-card`, `rounded-lg`, padding 20/24. `flat` has a `hairline` border, `rounded-md` and padding 16 (a `control` border on hover only when the whole card is clickable). Never nest a bordered box inside a card; use spacing or a dashed `hairline` divider.
- **Chip** (`Chip`): `rounded-chip`. Off: transparent with a `hairline` border and `ink-soft` text, hover `control` border and `ink` text. On: `highlight` fill, `on-highlight` text, 1px `ink` border (in dark mode the border is `highlight`). Sizes `md` (36px) and `sm` (32px).
- **Segmented control** (mode switch, tabs): a `paper` track with a `hairline` border; the selected segment is `highlight` + `on-highlight`.
- **Slider**: 4px `hairline` track with an `ink` fill; the thumb is a `card` circle with a 2px `ink` border (`highlight` border in dark mode).
- **Label**: the `label` utility (mono 12px, `ink-soft`) for platform tags, dates, counts and shortcuts.
- **Link**: `ink` text, 2px `highlight` underline, offset 3px.
- **Toast**: an `ink` pill with `paper` text; the action is a `highlight` button.
- **Empty state**: a dashed `control` border, centered heading and one action. An invitation, not an apology.
- **Loading**: the button says what's happening ("sniffing out your tone..."); cards show a blinking `ink` caret while text streams in, or pulsing `hairline` bars before the first word.
- **Focus**: every interactive element shows a 2px `focus` outline with a 2px offset on keyboard focus; fields use the highlight ring instead.
