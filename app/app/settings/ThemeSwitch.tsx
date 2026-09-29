"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { SEGMENT_TRACK, segmentClasses } from "@/components/ui/Segmented";

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
      <p className="label">Appearance</p>
      <div className={`mt-3 max-w-xs ${SEGMENT_TRACK}`} role="group" aria-label="Appearance">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => applyTheme(o.value)}
            aria-pressed={theme === o.value}
            className={segmentClasses(theme === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-ui text-ink-65">
        System follows your device&rsquo;s light or dark setting. Saved in this browser.
      </p>
    </section>
  );
}
