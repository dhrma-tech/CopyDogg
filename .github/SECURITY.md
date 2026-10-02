# Security Policy

## Supported Versions

| Version | Supported | Security Updates |
|---------|-----------|------------------|
| `main` (latest) | ✅ | ✅ |
| Older commits | ❌ | ❌ |

CopyDogg is self-hosted: each person runs their own copy from this repository. Security fixes land on `main`, so pull the latest version to get them (`git pull`, then `npm install`).

## Security Model

CopyDogg is a **single-user, self-hosted** tool. There are no accounts and no database service, and all data lives in one JSON file on your machine. Most of what a typical web app's security model covers (user isolation, row-level security, sessions per user) doesn't apply. What does:

### Network Access

- **Localhost only by default.** `npm run dev` and `npm start` bind to `localhost`. With no password set, `proxy.ts` refuses any request whose `Host` isn't `localhost`, `127.0.0.1` or `[::1]`. That blocks other devices on your network and DNS-rebinding attacks from websites you visit.
- **No cross-site writes.** Any non-read request (`POST`, `PUT`, `DELETE`…) whose `Origin` doesn't match the app is rejected, so another site open in your browser can't trigger actions.
- **No framing.** The `frame-ancestors` header lets only the CopyDogg browser extension's side panel embed the app. No other site can show it inside a frame.

### Optional Password Gate

Off unless `COPYDOGG_PASSWORD` is set (`lib/passwordGate.ts`). When on:

- The cookie is an expiring (30-day) HMAC-signed token, not the password or its hash.
- The signing key is stretched with scrypt, so a stolen cookie can't be used to guess the password quickly.
- The cookie is `httpOnly`, `sameSite=strict`, and `secure` over HTTPS.
- Every server action re-checks the gate. Changing the password signs every device out.
- The unlock form is rate-limited to 5 attempts per minute.

### API Keys

- `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` are read only on the server, in `lib/llm.ts`. They're never sent to the browser.
- `.env.local` is git-ignored.

### Data

- Your voice profile, posts and settings are in `data/copydogg.json`. The `data/` folder is git-ignored.
- Backup file names are checked against a strict pattern before any file is read or restored, so there's no path traversal.

### Website Mode

The public intro site runs with `COPYDOGG_SITE_ONLY=1`. In that mode only the landing page is served: `/app`, `/onboarding`, `/unlock` and `/api` redirect to this repository, and every write request is refused. The hosted site has no data file and no API key.

## Threat Model

### High-Risk Threats

#### 1. Exposing Your Copy Without a Password

**Risk:** CopyDogg is reachable from another device, a VPS or a tunnel with no `COPYDOGG_PASSWORD` set.
**Impact:** Anyone who can reach the URL can generate posts on your API key and read your saved posts.
**Mitigation:**
- The default scripts bind to `localhost` only.
- Without a password, the app refuses non-localhost host names.
- To expose it on purpose, set `COPYDOGG_PASSWORD`, serve it over HTTPS, and start it with `npx next start -H 0.0.0.0`.

#### 2. API Key Leakage

**Risk:** Your Claude or Gemini key ends up in a commit, an issue, a screenshot or the browser.
**Impact:** Someone else spends your API credit.
**Mitigation:**
- Keys live only in `.env.local`, which is git-ignored.
- Keys are only read server-side and never sent to the browser.
- Error messages and logs show the provider's error text, never the key.

#### 3. Data File Exposure

**Risk:** `data/copydogg.json` is committed, shared or synced somewhere public.
**Impact:** Your voice profile and every post you've written are exposed.
**Mitigation:**
- `data/` is git-ignored.
- Settings shows exactly where the file lives, so you know what to protect.

### Medium-Risk Threats

#### 1. Prompt Injection

**Risk:** Pasted text (a message you're replying to, a draft, meeting notes) contains instructions aimed at the AI.
**Impact:** Odd or unwanted output. It can't reach your files or other data: the AI only returns text.
**Mitigation:**
- Pasted text is fenced in the prompt and labeled as content, never instructions.
- This isn't a hard guarantee. Read output before you post it.

#### 2. Automated Abuse

**Risk:** A stray script or brute-force attempt hammers the app.
**Impact:** Wasted API credit, or password guessing.
**Mitigation:**
- In-memory rate limits: unlock 5/min, generate 20/min, tone check 20/min, voice setup and retune 10/min.
- Per client IP only when `COPYDOGG_TRUST_PROXY=1` behind a proxy you control; otherwise one shared bucket.

## Known Security Limitations

1. **Rate limits are in-memory and per process.** They reset on restart and don't hold across multiple server instances. Fine for one person on one server; not a substitute for a real gateway.
2. **Prompt injection fencing isn't a hard guarantee** (see above).
3. **No automated security tests yet.** Changes are reviewed by hand, type-checked and linted.
4. **Voice input is opt-in and leaves your machine.** Your browser's speech service (Google, Microsoft or Apple) hears what you dictate. Settings says so before you turn it on.

## What Leaves Your Machine

- **The prompt sent to your AI provider** (Claude or Gemini): your voice profile, your idea or pasted text, and a few posts you liked or edited.
- **Your voice, if you turn on voice input**: audio goes to your browser's speech service.
- **Nothing else.** There's no analytics, telemetry or crash reporting.

## Running It Beyond Your Laptop

Before making your copy reachable from anywhere other than `localhost`:

- [ ] `COPYDOGG_PASSWORD` is set to a strong password
- [ ] It's served over HTTPS
- [ ] `COPYDOGG_TRUST_PROXY=1` is set only if a reverse proxy you control sits in front
- [ ] `COPYDOGG_DATA_DIR` points at a persistent disk you back up
- [ ] It's not on a serverless host (Vercel, Netlify Functions): their filesystem resets, so your data would be lost

## Vulnerability Reporting

### Reporting Process

1. **Do not** open a public issue.
2. **Do not** share vulnerability details publicly.
3. **Report it privately** through GitHub: [Report a vulnerability](https://github.com/dhrma-tech/CopyDogg/security/advisories/new) (Security tab → "Report a vulnerability").
4. **Include** in your report:
   - What the vulnerability is
   - Steps to reproduce
   - What an attacker could do with it
   - A suggested fix, if you have one

Never include a real API key or someone's data file in a report.

### Response Timeline

CopyDogg is maintained by one person, so these are best-effort:

- **First response:** within 7 days
- **Assessment:** within 14 days
- **Fix:** depends on severity; critical issues first
- **Public disclosure:** after a fix is on `main`

### Severity Classification

- **Critical:** remote access to someone's copy, data file or API key
- **High:** bypassing the password gate or the localhost-only check
- **Medium:** limited data exposure, or abuse of someone's API credit
- **Low:** minor information disclosure

## Disclosure Policy

We follow coordinated disclosure:

- We work with you to understand and confirm the issue.
- We agree on a timeline for the fix.
- We credit you in the security advisory, unless you'd rather stay anonymous.
- Details are published after the fix is on `main`.

## Security Best Practices

### For People Running CopyDogg

- Keep `.env.local` and `data/` private, and never commit them.
- Keep it on `localhost` unless you need it elsewhere, and set a password if you do.
- Pull updates regularly to get security fixes.
- Use an API key with a spending limit, set in your Claude or Google account.

### For Contributors

- Follow the security rules in [CONTRIBUTING.md](./CONTRIBUTING.md#security-guidelines).
- Changes to `proxy.ts`, `lib/passwordGate.ts`, `lib/llm.ts` or `lib/store.ts` need a clear explanation in the pull request.

## Additional Resources

- [README.md](../README.md): setup and the security model summary
- [PRODUCTION_CHECKLIST.md](../docs/PRODUCTION_CHECKLIST.md): checklist for running it beyond your laptop
- [docs/PRIVACY.md](../docs/PRIVACY.md): what's stored and what leaves your machine
- [CONTRIBUTING.md](./CONTRIBUTING.md): contributor guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md): community standards
