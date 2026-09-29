const APP_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const APP_URL = "http://localhost:3000/app";

async function focusOrOpen() {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => t.url && APP_ORIGINS.some((origin) => t.url.startsWith(origin)));

  if (existing) {
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.update(existing.id, { active: true });
    return;
  }

  await chrome.windows.create({
    url: APP_URL,
    type: "popup",
    width: 900,
    height: 860,
  });
}

chrome.action.onClicked.addListener(focusOrOpen);
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-copydogg") focusOrOpen();
});
