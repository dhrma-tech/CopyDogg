# Contributing to CopyDogg

Thanks for your interest in contributing to CopyDogg! This guide covers how to set up the project, the rules every change follows, and how to send a pull request.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Local Development Setup](#local-development-setup)
- [Branch Naming and Git Workflow](#branch-naming-and-git-workflow)
- [Project Rules](#project-rules)
- [Code Quality and Standards](#code-quality-and-standards)
- [Testing Guidelines](#testing-guidelines)
- [Security Guidelines](#security-guidelines)
- [Documentation Requirements](#documentation-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/CopyDogg.git
cd CopyDogg

# Add the original repository as upstream
git remote add upstream https://github.com/dhrma-tech/CopyDogg.git
```

### 2. Create a Branch

```bash
# Sync with main
git checkout main
git pull upstream main

# Create a branch for your change
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make and Check Your Changes

- Make your changes
- Run the checks below
- Test by hand in the browser (see [Testing Guidelines](#testing-guidelines))
- Commit with clear messages

### 4. Open a Pull Request

- Push to your fork
- Open a pull request against `main`
- Wait for review

## Local Development Setup

### Prerequisites

- Node.js 20.9 or newer
- npm
- Git
- A Claude or Gemini API key is **optional**: without one, CopyDogg runs in demo mode with placeholder posts, which is enough for most UI work.

### Setup Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment (optional)**

   ```bash
   cp .env.example .env.local      # Windows: copy .env.example .env.local
   ```

   Add `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` only if you're working on generation. Leave both empty for demo mode.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. The first visit walks you through voice setup.

4. **Run the checks** (the same ones CI runs on every pull request)

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

### Available Scripts

- `npm run dev`: start the development server (localhost only)
- `npm run build`: build for production
- `npm start`: run the production build (localhost only)
- `npm run lint`: run ESLint
- `npx tsc --noEmit`: type-check

## Branch Naming and Git Workflow

### Branch Naming Convention

- `feature/feature-name`: new features
- `fix/bug-description`: bug fixes
- `docs/documentation-update`: documentation changes
- `refactor/code-refactoring`: refactoring
- `security/security-fix`: security fixes

### Commit Message Format

```
type(scope): description

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `security`, `chore`

**Examples:**

```
feat(generate): add a "shorter" tweak to result cards
fix(settings): keep dictation language when voice input is toggled
docs(readme): explain Gemini setup
```

## Project Rules

CopyDogg has a few non-negotiable constraints. Pull requests that break them won't be merged, however good the code is. The full list is in [CLAUDE.md](./CLAUDE.md).

- **Self-hosted, single user.** No accounts, no sign-in, no multi-tenant code. All data lives in one JSON file through `lib/store.ts`.
- **No new services.** Setup must stay "clone, `npm install`, add a key, `npm run dev`". Don't add anything that needs another account, database or hosted service.
- **Your data stays on the machine.** The only thing that leaves it is the prompt text sent to the chosen AI provider (plus opt-in voice input). Don't add analytics, telemetry or other outside calls.
- **One screen does the work.** The writing screen (`/app`) stays a single card, with no multi-step wizard for the core loop.
- **No complexity creep.** Check `docs/product-plan.md` before adding a feature. If it's on the "cut" list, open an issue to discuss it first.
- **Design tokens are law.** Every color, font, radius and shadow comes from [`docs/design-system.md`](./docs/design-system.md). Don't add new hex values or fonts. If something is missing, raise it in your pull request.
- **Copy voice.** Button labels, empty states and errors use plain verbs and sentence case. Banned words: "leverage," "seamless," "unlock," "empower," "supercharge." Loading states can be playful ("sniffing out your tone..."); everything else stays plain.

## Code Quality and Standards

### Code Style

- TypeScript for all new code
- Follow the patterns already in the file you're editing
- Use the components in `components/ui/` rather than re-writing class strings
- Keep functions small and focused
- Comment the *why* of anything non-obvious

### Where Things Go

- Prompts: `lib/claude.ts` is the one place prompts are built
- Calls to an AI provider: `lib/llm.ts` only
- Reading and writing data: `lib/store.ts` only (server-side)
- Styles: tokens from `app/globals.css`, documented in `docs/design-system.md`

### Error Handling

- Errors say what happened and how to fix it ("Paste the message you're replying to.")
- Never show raw stack traces or API responses to the user
- Never log or display API keys

### Next.js Version

This project uses Next.js 16, which has breaking changes from older versions (for example `proxy.ts` instead of `middleware.ts`). Check `node_modules/next/dist/docs/` before relying on older patterns.

## Testing Guidelines

There's no automated test suite yet, so every change is checked by hand. Before opening a pull request:

- **Run the checks:** lint, type-check and build all pass.
- **Try the happy path** of what you changed in the browser.
- **Check the empty and loading states**, not just the happy path.
- **Check a phone width (375px):** no horizontal scroll.
- **Check light and dark mode.**
- **Check the browser console:** no errors.
- **For generation changes:** try demo mode, and a real key if you have one.

Adding automated tests is welcome. Open an issue first so we can agree on the setup.

## Security Guidelines

### Critical Rules

1. **Never commit secrets**
   - `.env.local` and `data/` are git-ignored. Keep it that way.
   - Never paste an API key into an issue, pull request or commit.

2. **Keep API keys server-side**
   - Keys are read only in `lib/llm.ts`.
   - Never prefix a secret with `NEXT_PUBLIC_`, and never send one to the browser.

3. **Treat pasted text as content, not instructions**
   - Text a user pastes (messages, drafts, notes) is fenced in the prompt. Keep new prompt inputs fenced the same way (`quoted()` in `lib/claude.ts`).

4. **Don't weaken the local-only defaults**
   - The localhost host check, cross-origin write check and password gate live in `proxy.ts`. Changes there need a clear explanation in the pull request.

### Reporting Security Issues

If you find a vulnerability, **do not open a public issue**. Follow [SECURITY.md](./SECURITY.md) instead.

## Documentation Requirements

- Update [README.md](./README.md) when you change setup, environment variables or features.
- Update `.env.example` when you add or change an environment variable.
- Update [`docs/design-system.md`](./docs/design-system.md) before using a token that isn't documented yet.
- Update [`docs/product-plan.md`](./docs/product-plan.md) when a feature is added or removed.

## Pull Request Process

### Before Submitting

1. Run the checks:

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

2. Test by hand (see [Testing Guidelines](#testing-guidelines)).
3. Update the docs your change affects.

### In Your Pull Request

Use the pull request template and include:

- What changed and why
- How you tested it
- Screenshots for any UI change (desktop and phone width)
- Anything that touches security, the data file or the AI provider

### Review

1. CI (lint, type-check, build) must pass.
2. A maintainer reviews the code and the project rules above.
3. Changes to `proxy.ts`, `lib/passwordGate.ts`, `lib/llm.ts` or `lib/store.ts` get an extra security look.

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- What happened and what you expected
- Steps to reproduce
- Your OS, browser and Node version
- Whether you're in demo mode, or using Claude or Gemini
- Screenshots or server-terminal errors (with any API key removed)

### Feature Requests

Use the feature request template and include:

- The problem it solves
- What you'd like to happen
- Alternatives you've considered

Check the [project rules](#project-rules) first: requests that need accounts, hosted services or a multi-step core flow are unlikely to be accepted.

## Getting Help

- [README.md](./README.md): setup and how CopyDogg works
- [SETUP.md](./SETUP.md): step-by-step setup and troubleshooting
- [ROADMAP.md](./ROADMAP.md): what's planned, and what's out of scope
- [SECURITY.md](./SECURITY.md): security model and reporting
- [docs/product-plan.md](./docs/product-plan.md): the full feature spec
- [docs/design-system.md](./docs/design-system.md): colors, type and components
- GitHub Issues: bugs and feature requests

### Code of Conduct

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md) in all interactions.

Thank you for contributing to CopyDogg!
