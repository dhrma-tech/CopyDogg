"use client";

import { useState, type KeyboardEvent } from "react";

interface ChipEditorProps {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  suggestions?: string[];
}

export default function ChipEditor({
  label,
  items,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: ChipEditorProps) {
  const [input, setInput] = useState("");

  function submit(value: string) {
    const trimmed = value.trim();
    if (trimmed) onAdd(trimmed);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink">{label}</p>

      {suggestions && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onAdd(suggestion)}
              disabled={items.includes(suggestion)}
              className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink-soft disabled:opacity-40"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-hairline bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => submit(input)}
          className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
        >
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remove: ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
