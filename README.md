# CopyDogg

Posts that sound like you. Not like a press release.

CopyDogg is a small, personal writing tool. You show it how you write once: pick the platforms you post on, paste a few old posts, and rewrite one boring post your way. After that you type an idea in a few words ("hot take on remote work") and get 2–3 posts that already sound like you, formatted for X, LinkedIn, Instagram, Threads, Reddit or a newsletter.

It also handles everyday messages: reply to a text or email in your voice, rewrite a rough draft, check how something will come across before you send it, and write to specific people (your boss, a client, a friend) the way you'd actually talk to them.

It's built for **one person running their own copy**. There are no accounts, no sign-up and no database service. You bring your own Claude API key, and your voice profile and posts stay in a single file on your machine.

## Run it

You need [Node.js](https://nodejs.org) 20.9 or newer and a [Claude API key](https://platform.claude.com/settings/keys).

```bash
git clone <this repo> copydogg
cd copydogg
npm install
cp .env.example .env.local     # then paste your key into ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. The first visit walks you through setup (about five minutes).

For everyday use, run the faster production build instead:

```bash
npm run build
npm start
```

**No key yet?** Leave `ANTHROPIC_API_KEY` empty and CopyDogg runs in demo mode: everything works and saves normally, but posts are placeholders and no API calls are made.

## What you can do

- **Write**: type an idea in a few words and get 2–3 versions for X, LinkedIn, Instagram, Threads, Reddit, a newsletter, an email, a text or a work chat. Output streams in as it's written.
- **Reply**: paste a message you got, optionally say what you want to say back, and get replies.
- **Rewrite**: paste your own messy draft and get it back clearer, still sounding like you.
- **Check**: paste something before sending it and see how it comes across.
- **One-tap situations**: say no nicely, follow up, apologize, say thanks, ask a favor, and more.
- **Tweak any result**: shorter, warmer, more direct, funnier. Or edit it by hand, and CopyDogg learns from your edits.
- **Open it where it goes**: post on X or Threads, or open your email or messages app with the text filled in.
- **Library**: saved posts, everything you've written recently, and ideas saved for later.
- **People, templates, languages, threads and carousels**, under "more options".
- **Retune**: refresh your voice profile from the posts you've liked and edited.
- **More than one voice**: "Work me", "Friends me", each with its own tone and platforms.
- **All platforms at once**: one idea, one version for every platform you use.
- **Whole conversations**: paste a chat thread and reply to the latest message with context.
- **Who it's for**: landlord, doctor's office, school, job application, refund request, cancelling a subscription.
- **Show changes**: see exactly what a rewrite changed.
- **Undo**: tweaks and deletes can be undone for a few seconds, so there are no "are you sure?" pop-ups.
- **Dark mode**: follows your system, or pick Light or Dark in Settings.
- **Voice** (optional, Chrome/Edge/Safari): talk instead of typing, in any mode. Words appear as you speak, it keeps listening through long notes, and "um"s, repeats and do-overs ("5… actually 6pm") are cleaned up before CopyDogg writes. Off by default, because your browser sends the audio to its speech service (Google, Microsoft or Apple) to transcribe it. Pick your dictation language in Settings.
- **Notes**: paste or dictate meeting notes and get a summary, decisions and next steps, or a recap email or work-chat update.
- **Keep my words**: in Rewrite, just tidy punctuation, paragraphs and lists without changing your wording.
- **Your words**: names, jargon and acronyms CopyDogg should spell exactly. It fixes misheard dictation and offers to learn new names from your edits.
- **Snippets**: say or type a shortcut ("…and add my calendar link") and your saved text goes in word for word.

Keyboard: **Ctrl/⌘ + Enter** writes. On results, **1–9** copies a version, **e** edits, **s** saves, **t** then **s/w/d/f** tweaks, and **?** lists the rest. Your half-typed idea survives a refresh.

## Settings (`.env.local`)

| Variable | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | For real posts | Your Claude API key. Usage is billed to your Anthropic account. |
| `COPYDOGG_PASSWORD` | No | Asks for this password once per device. Set it if anyone else can reach your copy (see below). |
| `COPYDOGG_DATA_DIR` | No | Where the data file lives. Defaults to `./data`. |

Restart the app after changing any of these.

## Your data

Everything (voice profile, rules, topics, generated and saved posts) is stored in `data/copydogg.json`. It's plain JSON, so you can read it, back it up by copying it, or move it to another machine. The `data/` folder is git-ignored, so it never ends up in a commit.

CopyDogg also keeps a daily backup (the last 14) in `data/backups/`. Restore one from Settings; your current data is backed up first.

Settings → **Export my data** downloads a copy, and **Reset everything** empties the file.

The only thing that leaves your machine is what's needed to write: your voice profile, your idea or pasted text, and a few posts you liked or edited, sent to the Claude API. If you turn on voice input, your browser's speech service also hears what you dictate.

## Running it somewhere other than your laptop

CopyDogg needs a machine with a normal, persistent disk, because it writes to a file. That covers a home server, a small VPS, a Raspberry Pi, or any container host with a mounted volume (point `COPYDOGG_DATA_DIR` at the volume).

It is **not** suited to serverless hosts like Vercel or Netlify Functions. Their file system resets between requests, so your data would disappear.

**If anyone other than you can reach it, set `COPYDOGG_PASSWORD`.** Without it, anyone who finds the URL can generate posts on your API key and read your saved posts. Serve it over HTTPS if it's on the public internet.

## How it's built

Next.js (App Router) + TypeScript + Tailwind, and the Claude API through the official `@anthropic-ai/sdk`.

- `lib/claude.ts` is the one place prompts are built: post generation, and reading your voice during setup.
- `lib/platformRules.ts` holds each platform's format rules and the setup prompts.
- `lib/store.ts` is the JSON file store.
- `docs/product-plan.md` and `docs/design-system.md` describe the product and the design tokens.
