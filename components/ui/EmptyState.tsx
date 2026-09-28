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
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-control px-5 py-8 text-center">
      <p className="font-display text-heading text-ink">{title}</p>
      {children && <div className="max-w-sm text-small text-ink-soft">{children}</div>}
      {action}
    </div>
  );
}
