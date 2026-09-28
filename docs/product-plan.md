# CopyDogg — Weekend Build Plan

**One-liner:** Teach it your voice once. Then just say what you want.

**Stack:** Next.js (App Router) + Tailwind + Claude API, data in one local JSON file. Open source and self-hosted: each person runs their own copy with their own API key. Built with Claude Code, edited in VS Code, pushed to GitHub.

*2026-09-28: moved from Supabase + magic-link auth to single-user self-hosting — no accounts, no sign-in, no database service. See section 2.*

---

## 0. The Product in One Paragraph

CopyDogg is not "AI writes your posts." It's a voice profile you build once — your tone, your rules, your recurring topics — that gets silently injected into every generation. The user experience should feel like: *open app → say what you want in a few words → get 2-3 posts that already sound like you.* No re-explaining yourself, ever. That's the whole pitch, and it should be the first sentence on the landing page.

---

## 1. Information Architecture (pages)

```
/                      → Landing page (marketing, Littlebird/Wispr tone)
/unlock                → Password prompt, only when COPYDOGG_PASSWORD is set
/onboarding            → 3-step voice profile setup (first-time only)
/app                   → Main generation screen (the whole product lives here)
/app/library           → Saved posts, searchable/filterable
/app/profile           → Edit voice profile, personas, rules
/app/settings          → Usage, data file location, export, reset, lock
```

Everything that matters happens on `/app`. Resist adding more pages — that's the "not any complexity" instinct paying off.

---

## 2. Data (one local JSON file)

Single user, no accounts: everything lives in `data/copydogg.json` (or `$COPYDOGG_DATA_DIR/copydogg.json`), read and written only through `lib/store.ts`. Writes are serialized and atomic (temp file + rename), and an unreadable file is never overwritten.

```ts
{
  version: 1,
  persona: {                      // null until onboarding finishes; v1 has exactly one
    id, name,                     // name is "Default"
    voiceDescription,             // freeform paragraph, AI-drafted, user-editable
    toneFormality, toneHumor, toneBluntness, toneWarmth,   // 0-100 sliders
    emojiDensity, hashtagTolerance,
    rules: string[],              // ["never use leverage", "always end with a question"]
    samplePosts: string[],        // onboarding samples + rewrites, for voice extraction
    platforms: Platform[],        // picked in onboarding; /app only shows these
    platformVoices: { [platform]: string },  // per-platform note on top of voiceDescription
    createdAt
  },
  topics: [{ id, label }],        // recurring themes, just tags really
  generations: [{
    id, platform,                 // "x" | "linkedin" | "instagram" | "threads" | "reddit" | "newsletter"
    promptInput,                  // what the user typed
    toneOverride,                 // optional one-tap override for this post only
    outputs: string[],            // the 2-3 variations returned
    chosenOutput,                 // which one they saved or liked
    feedback,                     // -1 | 0 | 1 (thumbs down / none / up)
    saved, createdAt
  }]
}
```

Access control: none by default (it's your machine). If `COPYDOGG_PASSWORD` is set, `proxy.ts` requires it once per device (the cookie holds a hash of the password) for every page and API route.

---

## 3. The Onboarding Flow (platforms → per-platform samples → results)

*Revised 2026-09-28 (replaces the original paste → sliders → rules flow).*

This is the only "setup tax" the user pays. The first visit lands here automatically (`/app` redirects to `/onboarding` until a persona exists).

**Step 1 — Where do you post?**
Multi-select platform pills. Only the picked platforms get a step below, and only they appear on `/app` afterwards.

**Step 2..n — How you sound on {platform}** (one page per picked platform)
- Up to 3 textareas: "Paste up to 3 {tweets / LinkedIn posts / captions…} you've written."
- A fixed, deliberately bland post for that platform (`onboardingPrompts` in `lib/platformRules.ts`) with a textarea: "Now rewrite this the way you'd actually say it." Fixed rather than AI-generated so it's instant, free, and every user rewrites the same thing — the diff between bland and rewrite is the strongest voice signal.
- Nudge, allow skip: "Next" needs at least one box filled; a quiet "Skip {platform}" link is always there.

On the last platform, "Read my voice" sends everything to `/api/voice-extract` (one Claude call, structured output). Loading: "sniffing out your tone...". If every platform was skipped, or the call fails and the user picks "Continue with defaults", the results screen opens with default values instead.

**Final step — Here's how you sound** (all editable)
- Voice description paragraph (one core voice, addressed to the user)
- The 5 tone sliders, pre-set by Claude, with the live preview sentence
- One short note per picked platform on how they sound there specifically

"Start writing" saves one default persona and opens `/app`. Rules and topics are not part of onboarding — they're edited on `/app/profile`, along with everything above.

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

HOW THEY SOUND ON {PLATFORM} SPECIFICALLY:
{persona.platform_voices[platform], only if set}

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
- ~~Supabase project, run schema, wire up magic-link auth~~ (replaced by the local JSON file store)
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
- ~~Deploy to Vercel, connect domain~~ (self-hosted: the README covers running it locally or on a host with a disk)

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

Landing page section order (*revised 2026-09-28: simpler, light humor that isn't forced*):
1. Hero (headline + one sentence + single CTA "Get started" + "Free while in beta.")
2. Before/after demo panel (one rough idea → two platform posts)
3. "How it works" — three one-line steps matching onboarding: pick where you post / show it how you write / say what you want
4. One dry closing joke + final CTA. No pricing table, no feature grid, no "why I built this" note.

No sign-in page: the CTA opens the app directly (setup on first visit). Hero sub-line: "Free and open source. Runs on your own Claude API key."

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
    unlock/page.tsx           # only used when COPYDOGG_PASSWORD is set
    actions.ts                # server actions: onboarding, profile, reset, unlock
    onboarding/page.tsx
    app/page.tsx              # main generation screen
    app/library/page.tsx
    app/profile/page.tsx
    api/generate/route.ts
    api/voice-extract/route.ts
  lib/
    store.ts                  # the JSON file store (server-only)
    passwordGate.ts
    claude.ts                 # API wrapper + system prompt builder
    platformRules.ts
  components/
    PersonaSelector.tsx
    PlatformPicker.tsx
    GenerateCard.tsx
    ToneSliders.tsx
  data/                       # git-ignored; created on first save
    copydogg.json
  proxy.ts                    # optional password gate
```

Keep `lib/claude.ts` as the single place the system prompt gets assembled — makes iterating on prompt quality fast without hunting through UI code.
