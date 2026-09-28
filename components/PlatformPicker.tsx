import {
  AtSign,
  Briefcase,
  Camera,
  Hash,
  Layers,
  Mail,
  MessageCircle,
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
  email: AtSign,
  text: MessageCircle,
  workchat: Hash,
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
  /** Adds an "All" pill (write one version for every platform) when given. */
  allSelected?: boolean;
  onSelectAll?: () => void;
}

export default function PlatformPicker({
  value,
  onChange,
  options = PLATFORMS,
  allSelected = false,
  onSelectAll,
}: PlatformPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((platform) => (
        <PlatformPill
          key={platform}
          platform={platform}
          active={!allSelected && platform === value}
          onClick={() => onChange(platform)}
        />
      ))}
      {onSelectAll && options.length > 1 && (
        <button
          type="button"
          onClick={onSelectAll}
          aria-pressed={allSelected}
          className={allSelected ? ACTIVE_PILL : INACTIVE_PILL}
        >
          <Layers size={14} strokeWidth={2} />
          All {options.length}
        </button>
      )}
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
