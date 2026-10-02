# Privacy in CopyDogg

CopyDogg is built so your writing stays yours. There are no accounts, no CopyDogg servers and no analytics. Everything lives on the computer running your copy.

## What CopyDogg Stores

Everything is in one file: `data/copydogg.json` (or inside `COPYDOGG_DATA_DIR` if you set it).

| Data | Why it's kept |
|---|---|
| Voice profiles: name, description, tone dials, rules, sample posts, platforms, per-platform notes | To write in your voice |
| Generated posts, including the idea or pasted text behind each one | Your history and library |
| Likes, edits and saves on posts | They teach CopyDogg more about your voice |
| Contacts (name, relationship, a short note) | To write to specific people the way you'd talk to them |
| Templates, snippets, saved ideas, words list | Your shortcuts |
| Settings (voice input on or off, dictation language) | Your preferences |

CopyDogg also keeps **daily backups** of that file, the last 14, in `data/backups/`.

Your theme choice (light, dark or system) is stored in your browser, not in the data file.

## What Leaves Your Machine

### 1. Prompts sent to your AI provider

When CopyDogg writes, it sends a prompt to the provider whose key you set:

- **Claude**, by Anthropic, if you set `ANTHROPIC_API_KEY`
- **Gemini**, by Google, if you set `GEMINI_API_KEY`

The prompt includes:

- Your voice profile (description, tone dials, rules, notes for that platform)
- What you typed, and any text you pasted (a message you're replying to, a draft, notes)
- Up to three recent posts you liked or edited, as examples of your voice
- The contact's name and note, if you picked one
- Your words list and snippets, if you have any

That provider's own privacy terms apply to what it receives. Check them before you paste anything sensitive.

In demo mode (no key), nothing is sent anywhere.

### 2. Voice input, only if you turn it on

Voice input is **off by default**. When you turn it on in Settings, your browser does the listening, and most browsers (Chrome, Edge, Safari) send the audio to their own speech service (Google, Microsoft or Apple) to turn it into text. Settings tells you this before you switch it on.

### 3. Nothing else

- No analytics or tracking
- No telemetry or crash reporting
- No accounts, and no CopyDogg server receiving your data

## The Public Website

The public CopyDogg website runs in website mode: it only shows the landing page. It has no data file and no API key, and it can't save anything you type.

## Your Controls

All in **Settings**:

- **Export my data:** download the whole data file
- **Daily backups:** restore any of the last 14 days; your current data is backed up first
- **Reset everything:** empty the data file
- **Voice input:** turn the mic on or off

You can also open, copy or delete `data/copydogg.json` directly. It's plain JSON.

## Keeping It Private

- Don't commit `data/` or `.env.local` to git. Both are git-ignored by default.
- Keep CopyDogg on `localhost` unless you need it elsewhere. If you do, set a password and use HTTPS (see [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)).
- If you share your screen or screenshots, remember your library and profile are visible.

## Questions

Open an [issue](https://github.com/dhrma-tech/CopyDogg/issues), or for anything security-related, follow [SECURITY.md](../.github/SECURITY.md).
