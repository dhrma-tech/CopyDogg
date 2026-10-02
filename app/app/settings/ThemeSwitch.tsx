"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { SEGMENT_TRACK, segmentClasses } from "@/components/ui/Segmented";
import { SettingRow } from "./SettingsLayout";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Per-device appearance; stored in this browser only. */
export default function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);

  return (
    <SettingRow
      title="Theme"
      description="Saved in this browser. System follows your device."
      control={
        <div className={`w-full sm:w-60 ${SEGMENT_TRACK}`} role="group" aria-label="Theme">
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
      }
    />
  );
}
