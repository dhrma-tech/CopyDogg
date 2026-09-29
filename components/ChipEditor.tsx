"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Chip, { chipClasses } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";

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
      <p className="text-ui font-medium text-ink">{label}</p>

      {suggestions && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Chip
              key={suggestion}
              size="sm"
              onClick={() => onAdd(suggestion)}
              disabled={items.includes(suggestion)}
              aria-pressed={undefined}
              aria-label={items.includes(suggestion) ? `${suggestion} (added)` : `Add: ${suggestion}`}
              className="max-w-full py-1 text-left"
            >
              + {suggestion}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1"
        />
        <Button variant="secondary" onClick={() => submit(input)} disabled={!input.trim()}>
          Add
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`${chipClasses(true, "sm")} max-w-full py-1 pr-1 text-left`}>
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remove: ${item}`}
                className="grid h-6 w-6 place-items-center rounded-pill transition-colors hover:bg-current/10"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
