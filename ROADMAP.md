# CopyDogg Roadmap

CopyDogg's goal is to stay small: teach it your voice once, then just say what you want. This roadmap follows that goal. Anything that adds accounts, hosted services or a multi-step core flow is out of scope. See the [project rules](./CONTRIBUTING.md#project-rules).

## Current Release: v0.1

**Status: Stable for single-user, self-hosted use**

### Done

- Voice setup from your own posts, with tone dials, hard rules and per-platform notes
- Write, Reply, Rewrite, Notes and Check modes
- Formats for X, LinkedIn, Instagram, Threads, Reddit, newsletters, email, text messages and work chat
- Threads and Instagram carousels
- Quick tweaks and remixing for another platform
- Multiple voices, contacts, templates, snippets and a words list
- Saved-post library with search
- Optional voice input with dictation cleanup
- Claude and Gemini as AI providers
- Light and dark mode
- Daily backups, export and reset
- Optional password gate for copies reachable beyond `localhost`
- Installable app window and browser side-panel extension
- Public intro website (website mode)

## Next: Quality

- [ ] Automated tests for prompt building and data normalization
- [ ] API route tests for generation and voice setup
- [ ] Security tests for the localhost check and password gate
- [ ] End-to-end tests for setup and writing

## Later: Ideas Under Consideration

These need discussion before anyone builds them. Open an issue to share a use case.

- [ ] Share to CopyDogg from other apps on your phone (needs HTTPS)
- [ ] More AI providers behind the same `lib/llm.ts` layer
- [ ] More platform formats

## Out Of Scope

To keep CopyDogg simple, these are deliberately not planned:

- Accounts, sign-in, teams or sharing
- Hosted or multi-user versions
- Payments or pricing
- Long-form repurposing (for example blog post to thread)
- Song or mood suggestions

## Suggesting Something

Open a [feature request](https://github.com/dhrma-tech/CopyDogg/issues/new/choose). Explain the problem it solves, and check it fits the [project rules](./CONTRIBUTING.md#project-rules).
