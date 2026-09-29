"use client";

import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

/**
 * Text fields: surface fill, ink-50 edge (3.3:1), 16px text so iOS doesn't
 * zoom, ink edge on hover, ink edge + soft ring on focus. Invalid gets a 2px
 * ink edge (no red) — pair it with a message below the field.
 */
const FIELD_BASE =
  "w-full rounded-lg border border-ink-50 bg-surface text-body text-ink placeholder:text-ink-50 transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:shadow-ring focus:outline-none aria-[invalid=true]:border-2 aria-[invalid=true]:border-ink";

export const FIELD = `${FIELD_BASE} px-4 py-3`;

/** Compact dropdown trigger, styled to match the pill inputs it sits next to. */
export const SELECT =
  "min-h-9 max-w-full rounded-pill border border-ink-50 bg-surface px-3.5 text-ui text-ink transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:shadow-ring focus:outline-none";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_BASE} h-12 px-4 ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD} resize-none ${className}`} />;
}

interface OptionData {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/** Reads `<option>` children the way a native select would, without rendering them. */
function readOptions(children: ReactNode): OptionData[] {
  const options: OptionData[] = [];
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child)) continue;
    const value = child.props.value != null ? String(child.props.value) : String(child.props.children ?? "");
    options.push({ value, label: child.props.children, disabled: child.props.disabled });
  }
  return options;
}

/**
 * A `<select>' look-alike. Browsers won't let CSS reach the native popup's
 * hover/selected color (it stays OS blue), which clashes with the app's
 * cream-and-ink palette — so this renders its own themed listbox instead,
 * taking the same `<option>` children a native select would.
 */
export function Select({
  value,
  onChange,
  disabled,
  variant = "pill",
  className = "",
  "aria-label": ariaLabel,
  children,
}: {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  /** `pill` matches inline dropdowns (option rows); `field` matches a full-width Input/Textarea. */
  variant?: "pill" | "field";
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = readOptions(children);
  const selected = options.find((o) => o.value === value);
  const triggerBase = variant === "field" ? `${FIELD} flex` : `${SELECT} inline-flex`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(v: string) {
    setOpen(false);
    if (v !== value) onChange({ target: { value: v } });
  }

  return (
    <div ref={rootRef} className={`relative ${variant === "field" ? "block w-full min-w-0" : "inline-flex"}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`${triggerBase} cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-press disabled:text-ink-40 ${className}`}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-ink-50" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-64 min-w-full overflow-auto rounded-md border border-border-mid bg-surface py-1 shadow-float"
        >
          {options.map((o) => (
            <li key={o.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                disabled={o.disabled}
                onClick={() => pick(o.value)}
                className={`block w-full whitespace-nowrap px-3.5 py-2 text-left text-ui transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-ink-40 ${
                  o.value === value ? "bg-surface-hover font-medium text-ink" : "text-ink"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
