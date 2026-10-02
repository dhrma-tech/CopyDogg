const APP_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const APP_URL = "http://localhost:3000/app";

async function focusOrOpen() {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => {
    try {
      return t.url && APP_ORIGINS.includes(new URL(t.url).origin);
    } catch {
      return false;
    }
  });

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

// The toolbar icon opens the side panel; Chrome handles the click itself.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "open-copydogg" && tab) {
    // Must run straight from the shortcut, before any await, to count as a user gesture.
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
  if (command === "open-copydogg-window") focusOrOpen();
});
