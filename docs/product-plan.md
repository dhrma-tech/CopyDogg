# CopyDogg — Weekend Build Plan

**One-liner:** Teach it your voice once. Then just say what you want.

**Stack:** Next.js (App Router) + Tailwind + Claude API (or Gemini, added 2026-10-02 on request: whichever key is set), data in one local JSON file. Open source and self-hosted: each person runs their own copy with their own API key. Built with Claude Code, edited in VS Code, pushed to GitHub.

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

1. **Mode switch** (Write / Reply / Rewrite / Check), replacing the persona pill, which only ever said "Default" with v1's single persona (*2026-09-28*)
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
- ~~**Warm visual palette** … cream/terracotta/sage … soft rounded sans headline~~ *Superseded 2026-09-28:* the look is now "Highlighter" (paper, ink and one yellow highlighter; Bricolage Grotesque headlines). `docs/design-system.md` is the source of truth. Still true: no blue/purple SaaS gradients.

Landing page section order (*revised 2026-09-28: simpler, light humor that isn't forced*):
1. Hero (headline + one sentence + single CTA "Get started" + "Free while in beta.")
2. Before/after demo panel (one rough idea → two platform posts)
3. "How it works" — three one-line steps matching onboarding: pick where you post / show it how you write / say what you want
4. One dry closing joke + final CTA. No pricing table, no feature grid, no "why I built this" note.

No sign-in page: the CTA opens the app directly (setup on first visit). Hero sub-line: "Free and open source. Runs on your own Claude or Gemini API key."

---

## 4b. Everyday communication features (*added 2026-09-28*)

Added on request, after v1: CopyDogg covers daily messages, not just social posts. All of it stays on the one `/app` card, with modes swapping the input rather than adding steps, and every text result streams in.

- **Formats:** Email (subject line + body), Text message, Work chat, next to the social platforms. Picked in onboarding or Profile.
- **Modes:** Write (an idea), Reply (paste what they said, plus an optional "what do you want to say"), Rewrite (paste your draft), Check (how pasted text comes across: one-sentence verdict, trait chips, up to 3 fixes, and "Rewrite it in my voice").
- **Situation chips** (Write/Reply): say no nicely, follow up, apologize, say thanks, ask a favor, decline an invite, give feedback, set a boundary.
- **More options** (collapsed): tone/length/hook chips, "as a thread" (X/Threads) or "as a carousel" (Instagram), who it's **to** (people saved in Profile, with relationship + note), language to write **in**, and a template **shape**.
- **On each result:** Copy, Open in… (X/Threads intents, LinkedIn, Reddit, mailto:, sms:), Edit (the edit is saved and marked as a strong voice signal), Save, thumbs, one-tap tweaks (shorter / warmer / more direct / funnier), regenerate, remix.
- **Library:** Saved / Recent / Ideas tabs, search, platform filter, newest/oldest sort, unsave, delete, copy. Ideas are saved from `/app` and "Write it now" puts one back in the box.
- **Profile:** people you write to, templates, and "Retune my voice", which proposes an updated voice from 3+ liked or edited posts and saves it only if you keep it.
- **Voice** (*expanded 2026-09-29*): opt-in in Settings (browser speech recognition, privacy trade-off stated plainly; dictation language picker, since browsers can't auto-detect). Mic in the main box and in Reply's "what you want to say"; live words while speaking; keeps listening through long dictation (auto-restart); clear messages for a blocked or missing mic. Dictated text is cleaned by Claude (fillers, repeats, false starts, self-corrections). Esc stops, `m` toggles.
- **Notes mode:** meeting notes or a transcript → summary, decisions, next steps (a recap message for Email / Text / Work chat). Never invents owners or dates.
- **Keep my words** (Rewrite): tidy and format only, one version.
- **Your words** (Profile, shared by all voices): names, jargon and acronyms spelled exactly; offered automatically from hand edits.
- **Snippets** (Profile): shortcut → saved text inserted verbatim when mentioned.
- **Ruled out for a self-hosted website:** typing into other apps, recording Zoom/Meet/Teams calls, speaker names, automatic language detection, cloud sync across devices.
- **Multiple voices** ("Work me", "Friends me"...): each with its own description, sliders, platforms and rules. A new voice starts as a copy of the current one. Picker on `/app` (only shown with 2+ voices) and a switcher on Profile. Generations remember their voice, so liked examples and retune stay per voice.
- **All platforms at once:** an "All N" pill writes one version per platform of the current voice, streamed in parallel.
- **Whole-conversation replies:** in Reply, "it's a whole conversation" replies to the latest message using the earlier ones as context.
- **Who it's for:** everyday scenario chips (landlord, doctor's office, school, job application, refund request, cancel a subscription) add guidance and jump to a fitting format.
- **Keyboard shortcuts:** 1–9 copy, e edit, s save, o open, r regenerate, t then s/w/d/f tweak, / focus, ? help, Ctrl/⌘+Z undo.
- **Undo instead of "are you sure":** tweaks, regenerates, library deletes, idea deletes and unsaves show a 5-second Undo toast; deletes only happen when it expires.
- **Show changes:** Rewrite and tweak results can show a word-level before/after.
- **Backups:** a copy of the data file before the first write of each day (last 14 kept) in `data/backups/`, with restore in Settings (the current data is backed up first).
- **Dark mode:** approved dark tokens (design-system.md); follows the system, with a System/Light/Dark switch in Settings stored per browser, applied before first paint.
- **UI pass:** no demo-mode banner (Settings still explains demo mode); shared nav with the current page marked and a Write link; bottom tab bar on phones; loading placeholders between pages; only the first result card opens its tweak row (others: "tweak & more", rows never auto-collapse); visible keyboard focus; faded edge on scrolling chip rows; sticky "Unsaved changes" bar on Profile; short data paths in Settings.
- **Deferred:** installable app / share-to target (needs HTTPS).

## 8. What to Explicitly Cut from v1

To protect the "no complexity" goal, defer these to v2 even if tempting:
- ~~Multi-persona switching (ship with one default persona only)~~ (added 2026-09-28 on request; see 4b)
- ~~Browser extension~~ (side panel added 2026-10-02 on request: `extension/` frames the local app; no content scripts, nothing injected into social sites)
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
