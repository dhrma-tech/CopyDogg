import type { ReactNode } from "react";

/** An invitation to act, not an apology: heading, one line, one action. */
export default function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md bg-surface-warm p-8 text-center">
      <p className="font-display text-h3 text-ink">{title}</p>
      {children && <div className="max-w-sm text-ui text-ink-65">{children}</div>}
      {action}
    </div>
  );
}
