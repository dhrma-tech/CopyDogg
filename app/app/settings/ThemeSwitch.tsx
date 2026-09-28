"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, subscribeTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Per-device appearance; stored in this browser only. */
export default function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as Theme);

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">Appearance</p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Appearance">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => applyTheme(o.value)}
            aria-pressed={theme === o.value}
            className={
              theme === o.value
                ? "rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
                : "rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        System follows your device&rsquo;s light or dark setting. Saved in this browser.
      </p>
    </section>
  );
}
