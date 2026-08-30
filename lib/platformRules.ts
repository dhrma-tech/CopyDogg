export const PLATFORMS = [
  "x",
  "linkedin",
  "instagram",
  "threads",
  "reddit",
  "newsletter",
] as const;

export type Platform = (typeof PLATFORMS)[number];

interface PlatformRule {
  label: string;
  charLimit: number | null;
  formatNotes: string;
}

export const platformRules: Record<Platform, PlatformRule> = {
  x: {
    label: "X",
    charLimit: 280,
    formatNotes:
      "Keep it under 280 characters. Short, punchy lines. Line breaks are fine. Hashtags are rare — only if truly relevant.",
  },
  linkedin: {
    label: "LinkedIn",
    charLimit: 3000,
    formatNotes:
      "Longer form is fine. Short paragraphs (1-3 sentences) with generous line breaks. No hashtag spam — 0-3 relevant ones at most, at the end.",
  },
  instagram: {
    label: "Instagram",
    charLimit: 2200,
    formatNotes:
      "Caption style, can open with a hook line. Line breaks between thoughts. Hashtags are more accepted here — group them at the end if used.",
  },
  threads: {
    label: "Threads",
    charLimit: 500,
    formatNotes:
      "Conversational and short. Similar norms to X, but a little more casual and warm.",
  },
  reddit: {
    label: "Reddit",
    charLimit: null,
    formatNotes:
      "Written for a specific subreddit's readers, not a general audience. No hashtags. Can be longer and more detailed. Straightforward, non-marketing tone.",
  },
  newsletter: {
    label: "Newsletter",
    charLimit: null,
    formatNotes:
      "Written as an email intro or section. Slightly more personal and slower-paced than social copy. No hashtags.",
  },
};
