# CopyDogg

Personal voice-cloning tool for social media posts. One-line pitch: **teach it your voice once, then just say what you want.** User sets up a voice profile (tone sliders, rules, sample writing), then picks a platform + describes an idea in a few words, and gets 2-3 post variations that already sound like them.

Full context lives in `/docs`. Read these before writing any code:
- `docs/product-plan.md` — full feature spec, schema, screen layouts, build order
- `docs/design-system.md` — colors, type, component styles

## Non-negotiable constraints

- **Stack:** Next.js (App Router) + TypeScript + Tailwind + Supabase (auth + Postgres) + Claude API. Deploy target: Vercel.
- **One screen does the work.** The main generation screen (`/app`) must stay a single card — no multi-step wizard for the core loop. If a feature can't fit on one screen without scrolling past a phone viewport, cut it, don't paginate it.
- **No complexity creep.** Do not add features beyond what's in `docs/product-plan.md` section 8 ("What to cut from v1") unless explicitly asked in this session.
- **Voice, not vibe.** Copy (button labels, empty states, errors) must follow the tone rules in `docs/design-system.md` — plain verbs, sentence case, no corporate words ("leverage," "seamless," "unlock," "empower" are banned). Loading states get personality (e.g. "sniffing out your tone..."); everything else stays plain and direct.
- **Design tokens are law.** Every color, font, radius value used in components must come from `docs/design-system.md`. Don't introduce new hex values or fonts ad hoc — if something's missing from the token list, stop and ask rather than improvising.

## Build order (do not reorder without asking)

1. Repo skeleton: Next.js + Tailwind init, push to GitHub, empty `/app` route
2. Supabase project + schema from `docs/product-plan.md` section 2, RLS on from the start
3. Auth (magic link)
4. Core loop: generation screen UI (no AI yet) → `/api/generate` route → wire together
5. Onboarding flow (writes to `personas` table)
6. Library page + thumbs up/down feedback loop
7. Landing page (tone brief in `docs/design-system.md` section 7)
8. Polish pass + deploy

Work through these in order. After finishing a step, stop and summarize what changed before moving to the next one — don't silently chain multiple steps together in one pass.

## Definition of done for any screen/component

- Matches the design tokens exactly (no guessed colors/fonts)
- Works on mobile viewport (375px) without horizontal scroll
- Empty and loading states are implemented, not just the happy path
- No console errors
