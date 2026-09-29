/**
 * Light / dark / system appearance, per browser. The choice is applied as
 * `data-theme` on <html>; with no attribute, CSS follows the system setting.
 * THEME_SCRIPT runs in <head> before first paint, so there's no light flash.
 * Default (nothing chosen yet) is Light, not System — "System" is still
 * available as an explicit choice.
 */

export type Theme = "system" | "light" | "dark";

export const THEME_KEY = "copydogg:theme";

export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="system")document.documentElement.dataset.theme=(t==="dark"?"dark":"light")}catch(e){document.documentElement.dataset.theme="light"}`;

const listeners = new Set<() => void>();

export function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" || t === "system" ? t : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  listeners.forEach((notify) => notify());
}

export function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
