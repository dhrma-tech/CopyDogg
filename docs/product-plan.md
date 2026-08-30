# CopyDogg — Weekend Build Plan

**One-liner:** Teach it your voice once. Then just say what you want.

**Stack:** Next.js (App Router) + Tailwind + Supabase (auth/DB) + Claude API + Vercel. Built with Claude Code, edited in VS Code, pushed to GitHub.

---

## 0. The Product in One Paragraph

CopyDogg is not "AI writes your posts." It's a voice profile you build once — your tone, your rules, your recurring topics — that gets silently injected into every generation. The user experience should feel like: *open app → say what you want in a few words → get 2-3 posts that already sound like you.* No re-explaining yourself, ever. That's the whole pitch, and it should be the first sentence on the landing page.

---

## 1. Information Architecture (pages)

```
/                      → Landing page (marketing, Littlebird/Wispr tone)
/login                 → Magic link or Google auth (Supabase Auth)
/onboarding            → 3-step voice profile setup (first-time only)
/app                   → Main generation screen (the whole product lives here)
/app/library           → Saved posts, searchable/filterable
/app/profile           → Edit voice profile, personas, rules
/app/settings          → Account, API usage, delete data
```

Everything that matters happens on `/app`. Resist adding more pages — that's the "not any complexity" instinct paying off.

---

## 2. Database Schema (Supabase / Postgres)

```sql
-- users handled by Supabase Auth (auth.users)

create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz default now()
);

create table personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,                 -- "LinkedIn me", "Unhinged Twitter me"
  voice_description text,             -- freeform paragraph, AI-assisted
  tone_formality int default 50,      -- 0-100 sliders
  tone_humor int default 50,
  tone_bluntness int default 50,
  tone_warmth int default 50,
  emoji_density int default 20,
  hashtag_tolerance int default 20,
  rules text[],                       -- ["never use 'leverage'", "always end with a question"]
  sample_posts text[],                -- pasted examples for voice extraction
  is_default boolean default false,
  created_at timestamptz default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  label text not null                 -- recurring theme, just tags really
);

create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  persona_id uuid references personas(id),
  platform text not null,             -- "x", "linkedin", "instagram", "threads", "reddit"
  prompt_input text not null,         -- what the user typed
  tone_override text,                 -- optional one-tap override for this post only
  outputs text[] not null,            -- the 2-3 variations returned
  chosen_output text,                 -- which one they picked/saved
  feedback smallint,                  -- -1, 0, 1 (thumbs down/none/up)
  saved boolean default false,
  created_at timestamptz default now()
);
```

Row-level security: every table filtered by `user_id = auth.uid()`. Turn RLS on from day one — it's a five-minute Supabase setting and saves you from a very bad Monday.

---

## 3. The Onboarding Flow (3 steps, skippable)

This is the only "setup tax" the user pays, and it should take under 3 minutes.

**Step 1 — Paste your voice**
Textarea: "Paste a few things you've written — tweets, captions, an email, anything." Optional but strongly nudged. Claude reads it and drafts a voice_description paragraph for the user to confirm/edit ("You write in short punchy lines, you like rhetorical questions, you almost never use emoji except 🔥 occasionally").

**Step 2 — Set your sliders**
5 sliders (formality, humor, bluntness, warmth, emoji density) with a live one-line preview sentence that re-renders as they drag — this is the "wow, it gets it" moment. Cheap to build, high perceived value.

**Step 3 — Your rules & topics**
Free-text chips: "Add a rule" (e.g. "never start with 'In today's world'") and "Add a topic you post about" (indie hacking, fitness, parenting, etc). Pre-seed 5-6 common example rules as tap-to-add chips so the blank page isn't intimidating.

End state: one default persona created, ready to generate immediately.

---

## 4. The Main Screen (`/app`) — single card, no wizard

Layout top to bottom, all on one viewport if possible:

1. **Persona selector** (pill/dropdown, defaults to last used)
2. **Platform selector** (icon row: X, LinkedIn, Instagram, Threads, Reddit, Newsletter) — each carries baked-in format rules (char limit, hashtag norms, line-break style) so the user never types "keep it short"
3. **Idea input** — single large textarea, placeholder rotates through examples: *"just shipped a side project and I'm proud of it"* / *"hot take on remote work"* — accepts messy brain-dump text too
4. **One-tap overrides** (optional, collapsed by default): tone-for-this-post chips (funnier / more serious / more vulnerable), length (short/medium/long), hook style (question / bold claim / story)
5. **Generate button** → streams 2-3 variations into cards below

**Per-output card actions:**
- Copy
- Regenerate (just this one)
- Thumbs up/down (silently logged, used to bias future system prompt — even a simple "here are 3 posts the user liked before" injected into context is enough for v1)
- Save to library
- "Remix for another platform" → one click, same idea reshaped for a different platform in the same voice

---

## 5. System Prompt Structure (the actual engineering core)

Every generation call assembles a system prompt like this:

```
You are writing a social media post as this specific person. Never sound like a generic AI assistant.

VOICE:
{persona.voice_description}

TONE DIALS (0-100): formality {formality}, humor {humor}, bluntness {bluntness}, warmth {warmth}, emoji density {emoji_density}, hashtag tolerance {hashtag_tolerance}

HARD RULES (never break these):
{persona.rules joined by newline}

PLATFORM: {platform}
{platform-specific formatting rules: char limits, line break conventions, hashtag norms}

RECENT LIKED EXAMPLES (match this energy, don't copy):
{last 2-3 thumbs-up outputs, if any}

TASK: Write {n} distinct variations of a post about: "{user_prompt}"
{if tone_override present: "For this post specifically: {tone_override}"}

Return ONLY the post text for each variation, separated by "---". No preamble, no explanation.
```

Keep platform format rules in a small static config object (`lib/platformRules.ts`) rather than hardcoding into every prompt — easy to extend later.

---

## 6. Weekend Build Order (realistic sequencing)

**Saturday morning — skeleton**
- `npx create-next-app`, Tailwind, push empty repo to GitHub
- Supabase project, run schema, wire up magic-link auth
- Basic `/app` shell with persona/platform selectors (no AI yet, just UI)

**Saturday afternoon — the core loop**
- Claude API route (`/api/generate`) with the system prompt above
- Wire generate button → API → render 2-3 outputs
- Copy button, save-to-library button
- Get the *one thing that matters* working end to end before touching onboarding

**Saturday evening — onboarding**
- 3-step onboarding flow, writes to `personas` table
- Voice-description auto-draft from pasted samples (one more Claude call)

**Sunday morning — polish loop**
- Thumbs up/down wired to bias future prompts
- Regenerate single output
- Remix-for-another-platform button
- Library page: list, filter by platform, search

**Sunday afternoon — the skin**
- Landing page (see tone brief below)
- Empty states, loading copy, error states — all with personality
- Mobile responsive pass
- Deploy to Vercel, connect domain

**Sunday evening — buffer**
- Bug bash, cut anything half-broken rather than shipping it broken
- Post the "I built this for myself" launch tweet/post (using CopyDogg to write it, obviously)

---

## 7. Landing Page — Tone Brief (based on littlebird.ai / wisprflow.ai)

What both sites do well, and how to translate it:

- **Headline pattern:** short declarative sentence, sometimes split with an italicized second clause for rhythm. e.g. *"Say it once. Sound like you every time."* or *"Stop explaining yourself to AI."*
- **One calm sentence under the headline**, not a paragraph. e.g. "CopyDogg remembers how you sound, so you don't have to re-teach it every time you post."
- **Show, don't tell:** a before/after demo is worth more than a feature list. Mirror Wispr's "messy input → clean output" panel: show a rough 5-word idea on the left, three polished platform-specific posts on the right.
- **No corporate words.** No "leverage," "seamless," "unlock," "empower." Read every sentence out loud — if it sounds like it belongs on a SaaS pricing page, cut it.
- **Personality in the small copy.** Loading states, button labels, empty states — this is where "personal, warm, funny" actually shows up, more than in the hero section. e.g. loading: "sniffing out your tone..." / empty library: "nothing saved yet — go write something worth keeping."
- **Testimonial-shaped social proof is optional for v1** — skip it, you don't have users yet. Replace that section with a short "why I built this" note in your own voice. That's more authentic for a solo weekend launch anyway, and matches the "I had this problem, built the fix, sharing it" origin story you mentioned.
- **Warm visual palette**, not the blue/purple SaaS gradient both reference sites still lean on somewhat — go further toward cream/terracotta/sage per your original brief, with a soft rounded sans headline font instead of a tech-grotesk.

Landing page section order:
1. Hero (headline + one sentence + single CTA "Try it free")
2. Before/after demo panel
3. Three feature call-outs, each with a one-sentence value prop (voice profile / one-click platform switch / library)
4. Short personal "why I built this" note
5. Final CTA, no pricing table for v1 (or a single simple "free while in beta" line)

---

## 8. What to Explicitly Cut from v1

To protect the "no complexity" goal, defer these to v2 even if tempting:
- Multi-persona switching (ship with one default persona only)
- Browser extension
- Song/mood suggestions
- Long-form repurposing (blog → thread)
- Team/sharing features
- Payment/pricing infrastructure

If Saturday goes well and you have slack time Sunday, multi-persona is the highest-value v1.5 add — the schema above already supports it.

---

## 9. Repo Structure (Claude Code friendly)

```
copydogg/
  app/
    page.tsx                 # landing
    login/page.tsx
    onboarding/page.tsx
    app/page.tsx              # main generation screen
    app/library/page.tsx
    app/profile/page.tsx
    api/generate/route.ts
    api/voice-extract/route.ts
  lib/
    supabase.ts
    claude.ts                 # API wrapper + system prompt builder
    platformRules.ts
  components/
    PersonaSelector.tsx
    PlatformPicker.tsx
    GenerateCard.tsx
    ToneSliders.tsx
  supabase/
    schema.sql
```

Keep `lib/claude.ts` as the single place the system prompt gets assembled — makes iterating on prompt quality fast without hunting through UI code.
