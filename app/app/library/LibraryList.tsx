"use client";

import { useState } from "react";
import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";

interface SavedGeneration {
  id: string;
  platform: string;
  prompt_input: string;
  outputs: string[];
  chosen_output: string | null;
  created_at: string;
}

interface LibraryListProps {
  generations: SavedGeneration[];
}

export default function LibraryList({ generations }: LibraryListProps) {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");

  const filtered = generations.filter((g) => {
    if (platformFilter !== "all" && g.platform !== platformFilter) return false;
    if (!query.trim()) return true;
    const text = `${g.prompt_input} ${g.chosen_output ?? g.outputs[0] ?? ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <div className="w-full max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Library</h1>

      <div className="mt-4 flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your saved posts"
          className="rounded-md border border-hairline bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPlatformFilter("all")}
            className={
              platformFilter === "all"
                ? "rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
                : "rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
            }
          >
            All
          </button>
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setPlatformFilter(platform)}
              className={
                platformFilter === platform
                  ? "rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
                  : "rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
              }
            >
              {platformRules[platform].label}
            </button>
          ))}
        </div>
      </div>

      {generations.length === 0 ? (
        <p className="mt-8 rounded-md border border-hairline bg-card px-4 py-6 text-center text-sm text-ink-soft">
          nothing saved yet — go write something worth keeping
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 rounded-md border border-hairline bg-card px-4 py-6 text-center text-sm text-ink-soft">
          nothing matches that search
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {filtered.map((g) => (
            <div key={g.id} className="rounded-md border border-hairline bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                  {platformRules[g.platform as Platform]?.label ?? g.platform}
                </p>
                <p className="font-mono text-xs text-ink-soft">
                  {new Date(g.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-2 text-xs text-ink-soft">{g.prompt_input}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                {g.chosen_output ?? g.outputs[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
