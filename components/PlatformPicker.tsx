import {
  Briefcase,
  Camera,
  Mail,
  MessagesSquare,
  Users,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";
import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";

const PLATFORM_ICONS: Record<Platform, LucideIcon> = {
  x: XIcon,
  linkedin: Briefcase,
  instagram: Camera,
  threads: MessagesSquare,
  reddit: Users,
  newsletter: Mail,
};

const ACTIVE_PILL =
  "flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent";
const INACTIVE_PILL =
  "flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft";

function PlatformPill({
  platform,
  active,
  onClick,
}: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = PLATFORM_ICONS[platform];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={active ? ACTIVE_PILL : INACTIVE_PILL}
    >
      <Icon size={14} strokeWidth={2} />
      {platformRules[platform].label}
    </button>
  );
}

interface PlatformPickerProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  /** Platforms to show; defaults to all of them. */
  options?: readonly Platform[];
}

export default function PlatformPicker({
  value,
  onChange,
  options = PLATFORMS,
}: PlatformPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((platform) => (
        <PlatformPill
          key={platform}
          platform={platform}
          active={platform === value}
          onClick={() => onChange(platform)}
        />
      ))}
    </div>
  );
}

interface PlatformMultiPickerProps {
  value: Platform[];
  onChange: (platforms: Platform[]) => void;
}

/** Pick several platforms; keeps them in PLATFORMS order. */
export function PlatformMultiPicker({ value, onChange }: PlatformMultiPickerProps) {
  function toggle(platform: Platform) {
    const next = value.includes(platform)
      ? value.filter((p) => p !== platform)
      : [...value, platform];
    onChange(PLATFORMS.filter((p) => next.includes(p)));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => (
        <PlatformPill
          key={platform}
          platform={platform}
          active={value.includes(platform)}
          onClick={() => toggle(platform)}
        />
      ))}
    </div>
  );
}
