# CopyDogg — Design Tokens

Reference `copydogg-design-system.html` for a live rendered preview of these tokens in use (buttons, sliders, cards, full screen mock). This file is the precise source of truth for values — use these exact hex codes, not approximations.

## Color tokens

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#F7F2E3` | Base page background, everywhere |
| `--card` | `#FFFEFB` | Cards, inputs, raised surfaces |
| `--ink` | `#171614` | Primary text — near-black, never pure `#000` |
| `--ink-soft` | `#6E6A62` | Secondary/muted text, placeholders, meta labels |
| `--accent` | `#1E5C4B` | The one confident color — active states, primary buttons, selected pills, links |
| `--accent-soft` | `#DCE9E3` | Accent tint for backgrounds (e.g. selected pill background) |
| `--hairline` | `#E6DFCC` | Borders, dividers, input outlines |
| `--danger` | `#8B3A4A` | Errors, destructive actions only |

### Dark mode tokens (*added 2026-09-28, approved*)

Same token names, dark values. Paper and ink are the light palette's ink and paper swapped; the rest are lighter/darker versions of the same colors so contrast holds. Applied via `prefers-color-scheme`, or `data-theme="light" | "dark"` on `<html>` when the user picks one in Settings.

| Token | Dark hex |
|---|---|
| `--paper` | `#171614` |
| `--card` | `#211F1C` |
| `--ink` | `#F7F2E3` |
| `--ink-soft` | `#A8A298` |
| `--accent` | `#7FBFA8` |
| `--accent-soft` | `#1F3A32` |
| `--hairline` | `#37332D` |
| `--danger` | `#D98A99` |

Do not add additional accent colors. This is a two-neutral + one-accent system — the discipline is the point. Third-party icons (Gmail red, Slack colors, etc. if ever shown) are the only exception, since those are borrowed brand colors, not part of this palette.

## Typography

| Role | Font | Weight(s) | Usage |
|---|---|---|---|
| Display | Fraunces | 500, 600 (+ italic 500) | Headlines only. Never body text. |
| Body | Karla | 400, 500, 700 | All UI text, buttons, inputs, paragraphs |
| Utility | JetBrains Mono | 400, 500 | Small meta labels only (platform tags, timestamps, tone %) — never full sentences |

Load via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,400..600&family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap
```

Type scale:
- Hero headline: 38–58px (clamp), Fraunces 600
- Section heading: 28–30px, Fraunces 500
- Body: 15–17px, Karla 400
- Small/meta: 11–13px, JetBrains Mono, uppercase, letter-spacing 0.1em

## Shape & spacing

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Small controls (icon buttons) |
| `--radius-md` | 14px | Inputs, output cards, pills' inner corners where not fully round |
| `--radius-lg` | 20px | Main container cards, the screen shell |
| Pills | fully round (999px) | Persona/platform/tone selectors — always pill-shaped, never rectangular |

Card elevation: subtle only. `box-shadow: 0 12px 32px -18px rgba(23, 22, 20, 0.25)` on the main generation card. No shadow on flat pills or inline elements.

## Copy voice rules (applies to all UI text)

- Plain verbs, sentence case, no filler
- Banned words: "leverage," "seamless," "unlock," "empower," "supercharge"
- Buttons name the action exactly: "Generate posts," not "Submit" or "Go"
- Loading states get personality: e.g. "sniffing out your tone..." — this is the one place playfulness is allowed
- Empty states are an invitation to act, not an apology: e.g. "nothing saved yet — go write something worth keeping"
- Errors state what happened and how to fix it, never "oops" without a next step

## Component notes

- **Pills** (persona, platform, tone chips): inactive = transparent bg + `--hairline` border + `--ink-soft` text. Active = `--accent-soft` bg + `--accent` text, no border.
- **Primary button**: `--ink` background, `--card` text, fully round, bold Karla 700.
- **Sliders**: track in `--hairline`, fill in `--accent`, thumb is a white circle with `--accent` border — not a filled accent circle (keeps it light-touch, not heavy).
- **Output cards**: `--card` background, `--hairline` 1px border, `--radius-md`, dashed `--hairline` divider above the action row (copy/regenerate/save).
