# CopyDogg browser extension

Opens your local CopyDogg in the browser's side panel, so you can write next
to X, LinkedIn or wherever you're posting. It doesn't run the app —
`npm run dev` still needs to be running in the background. Chrome or Edge,
version 116 or newer.

## Install (Chrome or Edge)

1. Run CopyDogg (`npm run dev`) so it's listening on `localhost:3000`.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this `extension/` folder.

If you had the older "CopyDogg Launcher" loaded, click **Reload** on it.

## Use it

- Click the CopyDogg icon in the toolbar, or
- Press **Ctrl+Shift+X** (**Cmd+Shift+X** on Mac).

Either one opens the side panel. Generate, copy a post, paste it into the
page. If CopyDogg isn't running, the panel says so and lets you try again.

Prefer a separate window? Assign a key to "Open CopyDogg in its own window"
at `chrome://extensions/shortcuts`.

## How the panel is allowed in

The app refuses to be shown inside other pages. It makes one exception: the
`frame-ancestors` header in `next.config.ts` allows this extension's ID,
which the `key` in `manifest.json` keeps the same on every install. If you
remove or change that key, update the ID in `next.config.ts` to match, or the
panel will show a blank page.
