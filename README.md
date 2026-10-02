# CopyDogg

Posts that sound like you. Not like a press release.

CopyDogg is a small, personal writing tool. You show it how you write once — pick the platforms you post on, paste a few old posts, and rewrite one boring post your way. After that you type an idea in a few words ("hot take on remote work") and get 2–3 posts that already sound like you, formatted for X, LinkedIn, Instagram, Threads, Reddit, or a newsletter.

It also handles everyday messages: reply to a text or email in your voice, rewrite a rough draft, check how something will come across before you send it, and write to specific people (your boss, a client, a friend) the way you'd actually talk to them.

It's built for **one person running their own copy**. There are no accounts, no sign-up, and no database service — you bring your own [Claude](https://platform.claude.com/settings/keys) or [Gemini](https://aistudio.google.com/apikey) API key, and your voice profile and posts stay in a single file on your machine.

## What You Can Do

- Run a working demo with no API key and no account — everything works and saves, using placeholder text instead of real AI output.
- Teach CopyDogg your voice in about five minutes, then generate real posts once you add a key.
- Write, reply, rewrite, check tone, and turn notes into a recap — all in your own voice.
- Keep more than one voice ("Work me", "Friends me"), each with its own tone and platforms.
- Save posts to a searchable library, export your data, or reset everything.
- Install it as its own app window (PWA), and optionally open it in your browser's side panel with the extension.

## Who This README Is For

This guide assumes you're comfortable installing an app and copy-pasting a few terminal commands — nothing more. If a step doesn't make sense, that's a bug in this README; open an issue.

## Setup Option 1: Try It Without an API Key

Use this if you just want to see the app working before deciding whether to bring an API key.

### Step 1: Install Node.js

```text
https://nodejs.org
```

Get the LTS version if you're unsure which one.

### Step 2: Open the Project Folder

Open a terminal in the folder you cloned CopyDogg into.

On Windows: open the folder in File Explorer, click the address bar, type `powershell`, press Enter.

### Step 3: Install the App

```bash
npm install
```

### Step 4: Start the App

```bash
npm run dev
```

### Step 5: Open It

```text
http://localhost:3000
```

The first visit walks you through setup (about five minutes). Leave both API keys unset and CopyDogg runs in **demo mode**: every screen works and saves normally, but generated posts are placeholder text and no API calls are made.

## Setup Option 2: Connect a Real API Key (Claude or Gemini)

Use this once you're ready for CopyDogg to actually write in your voice.

1. Get a key: Claude at [platform.claude.com/settings/keys](https://platform.claude.com/settings/keys) (paid API credit), or Gemini at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (has a free tier).
2. Copy the env file:
   ```bash
   cp .env.example .env.local      # Windows: copy .env.example .env.local
   ```
3. Paste it into `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in `.env.local`. If you set both, Claude is used unless `AI_PROVIDER=gemini`.
4. Restart the app (`npm run dev`).

For everyday use, run the faster production build instead:

```bash
npm run build
npm start
```

## Features

- **Write**: type an idea and get 2–3 versions for X, LinkedIn, Instagram, Threads, Reddit, a newsletter, an email, a text, or a work chat. Output streams in as it's written.
- **Reply**: paste a message you got and get replies in your voice.
- **Rewrite**: paste your own messy draft and get it back clearer, still sounding like you. "Keep my words" tidies punctuation and structure only, without changing your wording.
- **Check**: paste something before sending it and see how it comes across.
- **Notes**: paste or dictate meeting notes and get a summary, decisions, and next steps.
- **Tweak any result**: shorter, warmer, more direct, funnier — or edit it by hand, and CopyDogg learns from your edits.
- **Retune**: refresh your voice profile from the posts you've liked and edited.
- **People, templates, snippets, and languages**, under "more options" on the writing screen.
- **Voice input** (optional, Chrome/Edge/Safari): dictate instead of type. Off by default — your browser sends the audio to its own speech service to transcribe it.
- **Library**: saved posts, everything you've written recently, and ideas saved for later.
- **Dark mode**: Light by default; pick Dark or System in Settings.
- **Installable**: add it to your taskbar/dock as its own window (PWA), or open it in the browser side panel with the optional [extension](extension/README.md).

Keyboard: **Ctrl/⌘ + Enter** writes. On results, **1–9** copies a version, **e** edits, **s** saves, **t** then **s/w/d/f** tweaks, and **?** lists the rest.

## How It Works

1. You teach CopyDogg your voice once, in onboarding: platforms, sample posts, and one rewrite.
2. The AI reads those samples and drafts a voice profile — tone dials, hard rules, and per-platform notes.
3. On `/app`, you type an idea (or paste something to reply to, rewrite, or check).
4. CopyDogg builds a prompt from your voice profile plus what you typed, and streams 2–3 versions back from Claude or Gemini.
5. You save, edit, or tweak a version. Edits and likes feed back into "Retune" later.
6. Everything — profile, rules, and every generated post — is written to one local JSON file.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Claude API via the official `@anthropic-ai/sdk`, or Gemini via its REST API (`lib/llm.ts`)
- No database, no ORM — a single JSON file, read and written through `lib/store.ts`

## Common Commands

```bash
npm install
npm run dev      # local dev server (localhost:3000, this machine only)
npm run lint
npx tsc --noEmit # type-check
npm run build
npm start         # production server, after a build (also this machine only)
```

## Environment Variables

Only needed once you want real (non-demo) output.

```bash
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

| Variable | Required | What It Does |
|---|---|---|
| `ANTHROPIC_API_KEY` | One key for real posts | Your Claude API key. Usage is billed to your Anthropic account. |
| `GEMINI_API_KEY` | One key for real posts | Your Gemini API key from Google AI Studio. Leave both keys empty for demo mode. |
| `AI_PROVIDER` | No | `claude` or `gemini`. Only needed when both keys are set; Claude wins otherwise. |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to `gemini-flash-latest`. |
| `COPYDOGG_PASSWORD` | No | Asks for this password once per device. Set it if anyone else can reach your copy — see [Security](#security-model-summary). |
| `COPYDOGG_TRUST_PROXY` | No | Set to `1` only behind a reverse proxy you control, so rate limits use the real client IP. Leave it off otherwise. |
| `COPYDOGG_DATA_DIR` | No | Where the data file lives. Defaults to `./data`. |

Restart the app after changing any of these.

## Project Status

**Current status: personal tool, stable for single-user local/self-hosted use.**

CopyDogg is actively developed and is suitable for:
- Running your own copy locally or on a home server/VPS you control
- Personal, single-user use — it was never designed for multiple accounts

**Not suitable for:**
- Multi-user or multi-tenant use of any kind — there is exactly one voice profile store per install, with no accounts or user separation
- Serverless hosts (Vercel, Netlify Functions) — their filesystem resets between requests, so your data would disappear. See [Running it somewhere other than your laptop](#running-it-somewhere-other-than-your-laptop).

## Known Limitations

- **Testing**: no automated test suite yet — changes are verified by hand, type-checking, and linting.
- **Rate limiting**: the built-in limits on `/unlock` and the AI-calling API routes are in-memory and per-process — they reset on restart and don't hold up across multiple server instances. Fine for one person on one server; not a substitute for a real gateway if you ever change that.
- **Prompt injection**: user text sent to the AI is fenced and labeled as content, not instructions, but this isn't a hard guarantee — acceptable for a single-user personal tool, not for anything handling untrusted third-party input.
- **Voice input** depends on the browser's own speech recognition; Firefox doesn't support it.
- **Offline**: no offline support — it's a normal server-backed web app, not a static/offline-first PWA (the install support just gives it its own window).

## Security Model Summary

CopyDogg has no accounts and no database service, so most of what a typical web app's "security model" covers doesn't apply. What's actually there:

- **Localhost only by default**: `npm run dev` and `npm start` bind to `localhost`, and with no password set the app refuses any request whose `Host` isn't `localhost` / `127.0.0.1`. That blocks other devices on your network and DNS-rebinding attacks from websites you visit. Writes from another origin are rejected too.
- **Optional password gate** (`COPYDOGG_PASSWORD`, `lib/passwordGate.ts`): off by default. When set, the cookie is an expiring (30 days) HMAC-signed token with a scrypt-stretched key, `httpOnly` + `sameSite=strict` + `secure` on HTTPS. Every server action re-checks it. Rate-limited to 5 attempts/minute.
- **Rate limiting** (`lib/rateLimit.ts`): a simple in-memory limit (per client IP only when `COPYDOGG_TRUST_PROXY=1`, otherwise one shared bucket) on `/unlock` and every route that calls the AI provider, so a stray script or brute-force attempt can't run unattended.
- **API key**: only ever read server-side (`lib/llm.ts`); never sent to the browser.
- **Data file path**: backup filenames are validated against a strict pattern before touching the filesystem — no path traversal.

**Want it reachable from your phone, a VPS or a tunnel?** Set `COPYDOGG_PASSWORD`, serve it over HTTPS, and start it with `npx next start -H 0.0.0.0` (the default scripts bind to localhost). Without a password, anyone who can reach the URL could generate posts on your API key and read your saved posts.

## Your Data & Privacy

Everything (voice profile, rules, topics, generated and saved posts) is stored in `data/copydogg.json` — plain JSON, so you can read it, back it up by copying it, or move it to another machine. The `data/` folder is git-ignored, so it never ends up in a commit. CopyDogg also keeps a daily backup (the last 14) in `data/backups/`; restore one from Settings, where your current data is backed up first automatically.

Settings → **Export my data** downloads a copy, and **Reset everything** empties the file.

The only thing that leaves your machine is what's needed to write: your voice profile, your idea or pasted text, and a few posts you liked or edited, sent to the AI provider you picked (Claude or Gemini). If you turn on voice input, your browser's speech service also hears what you dictate.

## Running It Somewhere Other Than Your Laptop

CopyDogg needs a machine with a normal, persistent disk, because it writes to a file. That covers a home server, a small VPS, a Raspberry Pi, or any container host with a mounted volume (point `COPYDOGG_DATA_DIR` at it).

It is **not** suited to serverless hosts like Vercel or Netlify Functions — their filesystem resets between requests, so your data would disappear.

## Folder Structure

```
CopyDogg/
├── app/                    # Next.js App Router: pages, API routes, layout
│   ├── api/                # Server routes (generate, voice-extract, tone-check, ...)
│   ├── app/                 # The main product: writing screen, library, profile, settings
│   ├── onboarding/          # First-run voice setup
│   ├── unlock/               # Password gate screen
│   ├── manifest.ts, icon.tsx # PWA manifest and generated app icons
│   └── page.tsx, layout.tsx  # Landing page and root layout
├── components/              # Reusable UI (Button, Card, Field, ...) and the landing page
│   └── ui/                  # Design-system primitives
├── lib/                     # Server logic: Claude prompts, the JSON store, rate limiting, etc.
├── docs/                    # Product plan and design-system tokens (source of truth for both)
├── extension/                # Optional side-panel browser extension (see its own README)
├── proxy.ts                  # Next.js 16's proxy/middleware file: the password gate
└── .env.example               # Environment variable template
```

## Project Files To Know

| File/Folder | Purpose |
|---|---|
| `lib/claude.ts` | The one place prompts are built: post generation and reading your voice during setup |
| `lib/llm.ts` | Sends those prompts to Claude or Gemini, whichever key is set |
| `lib/store.ts` | The JSON file store — the single source of truth for all your data |
| `lib/platformRules.ts` | Each platform's format rules and onboarding prompts |
| `lib/rateLimit.ts` / `lib/passwordGate.ts` | The two pieces of the security model described above |
| `docs/product-plan.md` | The full feature spec and build order |
| `docs/design-system.md` | Colors, type, and component tokens — the source of truth for every style in the app |
| `.env.example` | Every environment variable, documented |

## Contributing

This started as a personal weekend build, so there's no formal contribution process yet — issues and pull requests are welcome. Keep changes in the spirit of `CLAUDE.md`'s constraints: single self-hosted JSON file, no new accounts or external services, one working screen for the core loop.

## License

MIT. See [LICENSE](LICENSE).

## Author

Made by **Dharmaraj Aparadh** ([@dhrma-tech](https://github.com/dhrma-tech)).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/signature-cream.svg">
  <img src="docs/assets/signature-ink.svg" alt="Signature of Dharmaraj Aparadh" width="260">
</picture>
