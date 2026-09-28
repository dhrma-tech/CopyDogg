export const PLATFORMS = [
  "x",
  "linkedin",
  "instagram",
  "threads",
  "reddit",
  "newsletter",
  "email",
  "text",
  "workchat",
] as const;

export type Platform = (typeof PLATFORMS)[number];

/** Multi-part formats: an X/Threads thread, or Instagram carousel slides. */
export type Structure = "thread" | "carousel";

interface PlatformRule {
  label: string;
  /** "social" = a public post; "message" = written to a specific person or group. */
  kind: "social" | "message";
  charLimit: number | null;
  formatNotes: string;
  structure?: Structure;
}

export const platformRules: Record<Platform, PlatformRule> = {
  x: {
    label: "X",
    kind: "social",
    charLimit: 280,
    formatNotes:
      "Keep it under 280 characters. Short, punchy lines. Line breaks are fine. Hashtags are rare — only if truly relevant.",
    structure: "thread",
  },
  linkedin: {
    label: "LinkedIn",
    kind: "social",
    charLimit: 3000,
    formatNotes:
      "Longer form is fine. Short paragraphs (1-3 sentences) with generous line breaks. No hashtag spam — 0-3 relevant ones at most, at the end.",
  },
  instagram: {
    label: "Instagram",
    kind: "social",
    charLimit: 2200,
    formatNotes:
      "Caption style, can open with a hook line. Line breaks between thoughts. Hashtags are more accepted here — group them at the end if used.",
    structure: "carousel",
  },
  threads: {
    label: "Threads",
    kind: "social",
    charLimit: 500,
    formatNotes:
      "Conversational and short. Similar norms to X, but a little more casual and warm.",
    structure: "thread",
  },
  reddit: {
    label: "Reddit",
    kind: "social",
    charLimit: null,
    formatNotes:
      "Written for a specific subreddit's readers, not a general audience. No hashtags. Can be longer and more detailed. Straightforward, non-marketing tone.",
  },
  newsletter: {
    label: "Newsletter",
    kind: "social",
    charLimit: null,
    formatNotes:
      "Written as an email intro or section. Slightly more personal and slower-paced than social copy. No hashtags.",
  },
  email: {
    label: "Email",
    kind: "message",
    charLimit: null,
    formatNotes:
      'An email. Start with a line "Subject: ..." then a blank line, then the body. Greeting and sign-off in their style (skip them if they would). Short paragraphs. No hashtags or emoji unless their voice uses them.',
  },
  text: {
    label: "Text message",
    kind: "message",
    charLimit: 600,
    formatNotes:
      "A text or WhatsApp message to someone they know. Short and natural, like they'd actually type it. No greeting line or sign-off unless it fits. No hashtags.",
  },
  workchat: {
    label: "Work chat",
    kind: "message",
    charLimit: 1500,
    formatNotes:
      "A Slack or Teams message to coworkers. Get to the point in the first line. Friendly but professional, no corporate filler. Bullets only if there are several items. No hashtags.",
  },
};

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}

/**
 * Where "Open in ..." sends a finished post. Platforms without a way to
 * prefill text (Instagram, work chat, newsletter) return null — Copy covers them.
 */
export function sendLink(platform: Platform, text: string): string | null {
  const q = encodeURIComponent;
  switch (platform) {
    case "x":
      return `https://x.com/intent/post?text=${q(text)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${q(text)}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&text=${q(text)}`;
    case "reddit":
      return `https://www.reddit.com/submit?selftext=true&text=${q(text)}`;
    case "email": {
      const match = text.match(/^Subject:\s*(.+)\n+/i);
      const subject = match ? match[1].trim() : "";
      const body = match ? text.slice(match[0].length) : text;
      return `mailto:?subject=${q(subject)}&body=${q(body)}`;
    }
    case "text":
      return `sms:?&body=${q(text)}`;
    default:
      return null;
  }
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
  email: {
    sampleNoun: "emails",
    blandPost:
      "Dear team, I hope this email finds you well. I wanted to follow up regarding the document I sent last week. Please let me know if you have had a chance to review it. Kind regards.",
  },
  text: {
    sampleNoun: "texts",
    blandPost:
      "Hello. I am running approximately fifteen minutes late. I apologize for the inconvenience. I will see you soon.",
  },
  workchat: {
    sampleNoun: "Slack or Teams messages",
    blandPost:
      "Hi all, just a quick update. The report has been completed and is available for review. Please let me know if there are any questions or concerns.",
  },
};
