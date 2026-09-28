# CopyDogg

Posts that sound like you. Not like a press release.

CopyDogg is a small, personal writing tool. You show it how you write once: pick the platforms you post on, paste a few old posts, and rewrite one boring post your way. After that you type an idea in a few words ("hot take on remote work") and get 2–3 posts that already sound like you, formatted for X, LinkedIn, Instagram, Threads, Reddit or a newsletter.

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

## Settings (`.env.local`)

| Variable | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | For real posts | Your Claude API key. Usage is billed to your Anthropic account. |
| `COPYDOGG_PASSWORD` | No | Asks for this password once per device. Set it if anyone else can reach your copy (see below). |
| `COPYDOGG_DATA_DIR` | No | Where the data file lives. Defaults to `./data`. |

Restart the app after changing any of these.

## Your data

Everything (voice profile, rules, topics, generated and saved posts) is stored in `data/copydogg.json`. It's plain JSON, so you can read it, back it up by copying it, or move it to another machine. The `data/` folder is git-ignored, so it never ends up in a commit.

Settings → **Export my data** downloads a copy, and **Reset everything** empties the file.

The only thing that leaves your machine is what's needed to write a post: your voice profile, your idea, and a few posts you liked, sent to the Claude API.

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
