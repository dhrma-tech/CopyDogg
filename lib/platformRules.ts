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

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}

interface OnboardingPrompt {
  /** What to call the user's own writing on this platform, e.g. "tweets". */
  sampleNoun: string;
  /** A deliberately bland post the user rewrites in their own words. */
  blandPost: string;
}

// Kept fixed (not AI-generated) so every user rewrites the same thing —
// the difference between this and their rewrite is the signal.
export const onboardingPrompts: Record<Platform, OnboardingPrompt> = {
  x: {
    sampleNoun: "tweets",
    blandPost:
      "We are pleased to share that our new project is now live. We hope you will check it out and share your feedback.",
  },
  linkedin: {
    sampleNoun: "LinkedIn posts",
    blandPost:
      "I am happy to announce that I have completed a new project. It was a valuable learning experience and I am grateful to everyone who supported me along the way.",
  },
  instagram: {
    sampleNoun: "captions",
    blandPost:
      "Had a nice weekend. Went outside, ate some good food, and spent time with friends. Hope everyone had a good weekend too.",
  },
  threads: {
    sampleNoun: "threads",
    blandPost:
      "Working from home has advantages and disadvantages. Some days are productive and some days are not. What do you think?",
  },
  reddit: {
    sampleNoun: "Reddit posts or comments",
    blandPost:
      "Hello everyone. I have a question about learning to cook. What are some good beginner recipes? Any advice would be appreciated. Thank you.",
  },
  newsletter: {
    sampleNoun: "newsletter intros or emails",
    blandPost:
      "Hello subscribers. This month has been busy. Below you will find an update on what I have been working on, along with some links I found interesting.",
  },
};
