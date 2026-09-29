# CopyDogg Launcher

A tiny browser extension: click the toolbar icon or press a shortcut to open
CopyDogg in its own window. It doesn't run the app — `npm run dev` still
needs to be running in the background.

## Install (Chrome or Edge)

1. Run CopyDogg (`npm run dev`) so it's listening on `localhost:3000`.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this `extension/` folder.

## Use it

- Click the CopyDogg icon in the toolbar, or
- Press **Ctrl+Shift+X** (**Cmd+Shift+X** on Mac).

If CopyDogg is already open in a tab or window, this focuses it instead of
opening a second one. Change the shortcut at `chrome://extensions/shortcuts`.
