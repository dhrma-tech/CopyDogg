import { useId, type ReactNode } from "react";

/** A titled group of setting rows: mono caption above one bordered list. */
export function SettingsGroup({
  title,
  note,
  children,
}: {
  title: string;
  /** Fine print under the group. */
  note?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="label px-1">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-border-soft rounded-md border border-border bg-surface">
        {children}
      </div>
      {note && <p className="mt-2 px-1 text-meta text-ink-65">{note}</p>}
    </section>
  );
}

/**
 * One setting: what it is on the left, its control on the right. Stacks on
 * phones so the control never squeezes the text.
 */
export function SettingRow({
  title,
  description,
  control,
  inline = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  control?: ReactNode;
  /** Small controls (a switch, a badge) stay beside the text on phones too. */
  inline?: boolean;
  /** Extra content under the row (confirmations, lists, messages). */
  children?: ReactNode;
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div
        className={
          inline
            ? "flex items-center justify-between gap-4 sm:gap-6"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        }
      >
        <div className="min-w-0 flex-1">
          <p className="text-ui font-medium text-ink">{title}</p>
          {description && <div className="mt-1 text-ui text-ink-65">{description}</div>}
        </div>
        {control && <div className="flex shrink-0 items-center gap-2">{control}</div>}
      </div>
      {children}
    </div>
  );
}

/** On/off switch. A real checkbox underneath, so keyboard and screen readers just work. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center has-[:disabled]:cursor-not-allowed">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="h-7 w-12 rounded-pill border border-ink-50 bg-surface-press transition-colors peer-checked:border-transparent peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
      />
      <span
        aria-hidden
        className="absolute left-1 top-1 h-5 w-5 rounded-pill bg-ink-65 transition-transform duration-200 motion-reduce:transition-none peer-checked:translate-x-5 peer-checked:bg-on-primary"
      />
    </label>
  );
}
