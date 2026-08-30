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

interface PlatformPickerProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

export default function PlatformPicker({ value, onChange }: PlatformPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => {
        const active = platform === value;
        const Icon = PLATFORM_ICONS[platform];
        return (
          <button
            key={platform}
            type="button"
            onClick={() => onChange(platform)}
            className={
              active
                ? "flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
                : "flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
            }
          >
            <Icon size={14} strokeWidth={2} />
            {platformRules[platform].label}
          </button>
        );
      })}
    </div>
  );
}
