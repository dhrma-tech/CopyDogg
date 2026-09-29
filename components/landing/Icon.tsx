import type { LucideProps } from "lucide-react";
import {
  AtSign,
  Briefcase,
  Camera,
  Check,
  Code2,
  Copy,
  FileJson,
  Hash,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  MessageCircle,
  MessagesSquare,
  MicOff,
  Plus,
  Users,
  UserX,
  X,
  ArrowRight,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  AtSign,
  Briefcase,
  Camera,
  Check,
  Code2,
  Copy,
  FileJson,
  Github: Code2,
  Hash,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  MessageCircle,
  MessagesSquare,
  MicOff,
  Plus,
  Users,
  UserX,
  X,
  ArrowRight,
};

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Cmp = ICONS[name];
  if (!Cmp) {
    return <span aria-hidden style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }} />;
  }
  return (
    <Cmp
      aria-hidden
      size={size}
      strokeWidth={2}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
