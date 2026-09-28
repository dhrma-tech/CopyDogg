# CopyDogg

Personal voice-cloning tool for social media posts. One-line pitch: **teach it your voice once, then just say what you want.** User sets up a voice profile (tone sliders, rules, sample writing), then picks a platform + describes an idea in a few words, and gets 2-3 post variations that already sound like them.

Full context lives in `/docs`. Read these before writing any code:
- `docs/product-plan.md` — full feature spec, schema, screen layouts, build order
- `docs/design-system.md` — colors, type, component styles

## Non-negotiable constraints

- **Stack:** Next.js (App Router) + TypeScript + Tailwind + Claude API. No database service: all data lives in one JSON file via `lib/store.ts` (server-side only).
- **Open source, self-hosted, single user.** Each person clones the repo, adds their own `ANTHROPIC_API_KEY`, and runs their own copy. No accounts, no sign-in, no multi-tenant code. The only gate is the optional `COPYDOGG_PASSWORD` (`proxy.ts`). Setup must stay "clone → `npm install` → add key → `npm run dev`"; don't add anything that needs another service or account. User data never leaves the machine except the prompt text sent to Claude. Target hosts: local machine or any host with a persistent disk — not serverless (Vercel/Netlify).
- **One screen does the work.** The main generation screen (`/app`) must stay a single card — no multi-step wizard for the core loop. If a feature can't fit on one screen without scrolling past a phone viewport, cut it, don't paginate it.
- **No complexity creep.** Do not add features beyond what's in `docs/product-plan.md` section 8 ("What to cut from v1") unless explicitly asked in this session.
- **Voice, not vibe.** Copy (button labels, empty states, errors) must follow the tone rules in `docs/design-system.md` — plain verbs, sentence case, no corporate words ("leverage," "seamless," "unlock," "empower" are banned). Loading states get personality (e.g. "sniffing out your tone..."); everything else stays plain and direct.
- **Design tokens are law.** Every color, font, radius value used in components must come from `docs/design-system.md`. Don't introduce new hex values or fonts ad hoc — if something's missing from the token list, stop and ask rather than improvising.

## Build order

The original v1 build order (skeleton → schema → auth → core loop → onboarding → library → landing → polish) is complete. On 2026-09-28 the app moved from Supabase + magic-link auth to self-hosted single-user with a local JSON file; Supabase, auth and `/login` were removed.

Remaining: open-source release prep (license, repo publish). For any new work, stop and summarize what changed after each step — don't silently chain multiple steps together in one pass.

## Definition of done for any screen/component

- Matches the design tokens exactly (no guessed colors/fonts)
- Works on mobile viewport (375px) without horizontal scroll
- Empty and loading states are implemented, not just the happy path
- No console errors

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
