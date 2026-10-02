# Checklist: Running CopyDogg Beyond Your Laptop

CopyDogg is safe by default on your own computer: it only answers on `localhost`. Use this checklist before making your copy reachable from anywhere else, such as your phone on home Wi-Fi, a home server, a VPS or a tunnel.

Remember: CopyDogg is **single-user**. This checklist is for reaching **your own** copy from more places, not for hosting it for other people.

## Before You Start

- [ ] Read [SECURITY.md](./SECURITY.md)
- [ ] You're running the latest version (`git pull`, then `npm install`)

## Access

- [ ] `COPYDOGG_PASSWORD` is set in `.env.local`
- [ ] The password is long and not used anywhere else
- [ ] It's served over **HTTPS** (reverse proxy such as Caddy or nginx, or a tunnel service)
- [ ] It's started with `npm run build` then `npx next start -H 0.0.0.0`, not `npm run dev`
- [ ] `COPYDOGG_TRUST_PROXY=1` is set **only** if a reverse proxy you control sits in front of it

## API Key

- [ ] Only one key is set (`ANTHROPIC_API_KEY` or `GEMINI_API_KEY`), unless you set `AI_PROVIDER`
- [ ] The key has a spending limit, set in your Claude or Google account
- [ ] The key is only in `.env.local` on the server, never in git, screenshots or chat

## Data

- [ ] It runs on a machine with a **persistent disk** (not Vercel or Netlify Functions)
- [ ] `COPYDOGG_DATA_DIR` points at a folder you back up, if not the default `./data`
- [ ] You've tested restoring a backup from **Settings → Daily backups**
- [ ] `data/` and `.env.local` aren't in any public folder or synced share

## After It's Running

- [ ] Visiting the address from another device asks for the password
- [ ] The address uses `https://`
- [ ] **Settings** shows the right AI provider
- [ ] **Settings → Password → Lock now** works and asks for the password again

## Keeping It Healthy

- [ ] Pull updates regularly to get security fixes
- [ ] Rebuild after updating (`npm install`, `npm run build`)
- [ ] Check your API usage occasionally in your Claude or Google account
- [ ] Change the password if you think it leaked: every device is signed out

## Public Intro Website Only

If you're hosting the **landing page** (website mode), the checklist is much shorter:

- [ ] `COPYDOGG_SITE_ONLY=1` is set
- [ ] No API key is set on that host
- [ ] `/app` on the live site redirects to GitHub
