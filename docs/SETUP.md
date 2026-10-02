# CopyDogg Setup Guide

This is the slow, step-by-step version of the setup in the [README](../README.md). If you can copy and paste, you can do this.

## Table of Contents

- [What You Need](#what-you-need)
- [Part 1: Run The Demo](#part-1-run-the-demo)
- [Part 2: Set Up Your Voice](#part-2-set-up-your-voice)
- [Part 3: Connect An AI Provider](#part-3-connect-an-ai-provider)
- [Part 4: Everyday Use](#part-4-everyday-use)
- [Optional: Browser Extension](#optional-browser-extension)
- [Optional: Use It From Your Phone Or Another Computer](#optional-use-it-from-your-phone-or-another-computer)
- [Optional: Public Intro Website](#optional-public-intro-website)
- [Troubleshooting](#troubleshooting)

## What You Need

- A computer running Windows, macOS or Linux
- About 15 minutes
- **Optional:** a Claude or Gemini API key, for real posts instead of placeholders

## Part 1: Run The Demo

### 1. Install Node.js

Go to https://nodejs.org and install the **LTS** version. CopyDogg needs Node.js 20.9 or newer.

To check it worked, open a terminal and run:

```bash
node -v
```

You should see a version number like `v22.11.0`.

### 2. Get CopyDogg

If you have Git:

```bash
git clone https://github.com/dhrma-tech/CopyDogg.git
cd CopyDogg
```

If you don't: on the GitHub page, click **Code → Download ZIP**, unzip it, and open a terminal in that folder.

**Opening a terminal in a folder on Windows:** open the folder in File Explorer, click the address bar, type `powershell`, and press Enter.

### 3. Install

```bash
npm install
```

This downloads what CopyDogg needs. It takes a minute or two the first time.

### 4. Start

```bash
npm run dev
```

Wait until you see `Ready`. Keep this terminal open: closing it stops CopyDogg.

### 5. Open It

Go to http://localhost:3000 in your browser. You'll see the landing page. Click **Get started**.

## Part 2: Set Up Your Voice

The first time, CopyDogg asks a few questions to learn how you write. It takes about five minutes.

1. **Where do you post?** Pick every platform you want CopyDogg to write for.
2. **Paste a few posts.** For each platform, paste 2–3 things you've actually written there. More is better; skip any platform you don't have posts for.
3. **Rewrite a boring post.** CopyDogg shows a deliberately bland post. Rewrite it the way you'd say it. This is the strongest signal of your voice.
4. **Review your voice.** CopyDogg drafts a voice description, tone dials and per-platform notes. Change anything that doesn't sound like you.

In demo mode, step 4 fills in placeholder values. You can redo it later from **Profile → Retune my voice** once you add a key.

## Part 3: Connect An AI Provider

Pick **one** provider.

| | Claude | Gemini |
|---|---|---|
| Get a key | https://platform.claude.com/settings/keys | https://aistudio.google.com/apikey |
| Cost | Paid API credit (separate from a Claude.ai subscription) | Free tier with per-minute and daily limits |
| Key starts with | `sk-ant-` | Usually `AIza` |

### 1. Create your settings file

In the CopyDogg folder:

Windows:

```bash
copy .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

### 2. Add your key

Open `.env.local` in any text editor and fill in **one** line:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

or

```bash
GEMINI_API_KEY=AIza...
```

No spaces around `=`.

### 3. Save the file

Press **Ctrl+S** (**Cmd+S** on Mac). In VS Code, a dot on the tab means it isn't saved yet.

### 4. Restart CopyDogg

In the terminal running CopyDogg, press **Ctrl+C**, then run `npm run dev` again.

### 5. Check it worked

Open **Settings**. Under **Writing**, the **AI provider** row shows **Claude** or **Gemini** instead of **Demo mode**.

## Part 4: Everyday Use

### Starting CopyDogg

Open a terminal in the CopyDogg folder and run `npm run dev`. Then go to http://localhost:3000/app.

For a faster version:

```bash
npm run build
npm start
```

Run `npm run build` again after you update CopyDogg.

### Updating CopyDogg

```bash
git pull
npm install
```

Your data isn't affected: it lives in the `data/` folder, which updates never touch.

### Your data

Everything is in `data/copydogg.json`. CopyDogg also keeps a daily backup (the last 14) in `data/backups/`. You can restore one, export your data or reset everything from **Settings**.

### Install it as an app

In Chrome or Edge, open CopyDogg and choose **Install** in the address bar (or the browser menu). It then opens in its own window, like a desktop app.

## Optional: Browser Extension

The extension opens CopyDogg in your browser's side panel, next to X, LinkedIn or wherever you're posting. It works in Chrome and Edge, version 116 or newer.

1. Make sure CopyDogg is running (`npm run dev`).
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `extension/` folder.
5. Click the CopyDogg icon, or press **Ctrl+Shift+X** (**Cmd+Shift+X** on Mac).

More detail in [extension/README.md](../extension/README.md).

## Optional: Use It From Your Phone Or Another Computer

By default, CopyDogg only answers on the computer it runs on. To reach it from elsewhere (your phone on home Wi-Fi, a VPS, a tunnel):

1. Add a password to `.env.local`:

   ```bash
   COPYDOGG_PASSWORD=a-long-password-you-dont-use-anywhere-else
   ```

2. Serve it over HTTPS (a reverse proxy like Caddy, or a tunnel service).
3. Build and start it so it listens on your network:

   ```bash
   npm run build
   npx next start -H 0.0.0.0
   ```

4. Read [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) and [SECURITY.md](../.github/SECURITY.md) first.

CopyDogg needs a computer with a normal disk, because it saves to a file. Serverless hosts like Vercel or Netlify Functions won't keep your data.

## Optional: Public Intro Website

The CopyDogg website is this same project with `COPYDOGG_SITE_ONLY=1` set. In that mode only the landing page is served: the app, setup and API redirect to GitHub, and nothing can be saved. It needs no API key and no data file, so it runs on Vercel.

To host your own: import the repository on Vercel, add the environment variable `COPYDOGG_SITE_ONLY` = `1`, and deploy. Don't add an API key there.

**Never set `COPYDOGG_SITE_ONLY` on a copy you actually use.**

## Troubleshooting

### `npm` or `node` isn't recognized

Node.js isn't installed, or the terminal was open before you installed it. Install it from https://nodejs.org, then close and reopen the terminal.

### "Port 3000 is in use"

CopyDogg (or another app) is already running. Either use the copy that's running at http://localhost:3000, or close the other terminal first. Next.js may also start on port 3001 instead; use the address it prints.

### Still in demo mode after adding a key

- Check you edited `.env.local`, not `.env.example`.
- Check the file is **saved**.
- Check there are no spaces or quotes problems around `=`.
- Restart CopyDogg: it only reads `.env.local` when it starts.

### "Your Claude account is out of credit or quota"

Your key works, but the account has no API credit. Add credit at https://platform.claude.com/settings/billing. A Claude.ai Pro or Max subscription doesn't include API credit.

### "You've hit Gemini's usage limit"

The free tier allows only a few requests a minute. Wait a minute and try again. If it keeps happening, the day's free quota is used up.

### "Gemini is busy or down right now"

Google's servers are overloaded for a moment. CopyDogg already retries once with a lighter model; if it still fails, try again in a minute.

### "Your API key was rejected"

The key is wrong, revoked or copied incompletely. Create a new one and paste it again.

### The mic button doesn't appear

Voice input is off by default. Turn it on in **Settings → Voice input**. It works in Chrome, Edge and Safari; Firefox doesn't support speech recognition.

### Something else

Check the terminal running CopyDogg: errors are printed there. Then [open an issue](https://github.com/dhrma-tech/CopyDogg/issues/new/choose) with what you tried. Remove any API key before pasting logs.
