import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";

interface PlatformPickerProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

export default function PlatformPicker({ value, onChange }: PlatformPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => {
        const active = platform === value;
        return (
          <button
            key={platform}
            type="button"
            onClick={() => onChange(platform)}
            className={
              active
                ? "rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
                : "rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
            }
          >
            {platformRules[platform].label}
          </button>
        );
      })}
    </div>
  );
}
