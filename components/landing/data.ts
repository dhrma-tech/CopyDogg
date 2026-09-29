export type Chip = { label: string; on: boolean };

export const DEMO_TABS = ["Write", "Reply", "Rewrite", "Check"] as const;

export const DEMOS = [
  {
    tab: "Write",
    inLabel: "Your idea",
    input: "just shipped a side project and I'm proud of it",
    chips: [
      { label: "X", on: true },
      { label: "LinkedIn", on: false },
      { label: "Threads", on: false },
    ],
    outLabel: "Posts",
    outs: [
      { label: "X", text: "Shipped a side project this weekend. Small, rough, mine. That's the whole post." },
      { label: "X", text: "Built a thing. It's not perfect. It's out anyway." },
    ],
  },
  {
    tab: "Reply",
    inLabel: "The message you got",
    input: "Hey! Any chance you could cover my shift on Saturday?",
    chips: [
      { label: "say no nicely", on: true },
      { label: "follow up", on: false },
      { label: "say thanks", on: false },
    ],
    outLabel: "Replies",
    outs: [
      { label: "Text message", text: "Wish I could — I've got plans Saturday. Hope you find someone!" },
      { label: "Text message", text: "Ah, I can't this time. Ask me again next month?" },
    ],
  },
  {
    tab: "Rewrite",
    inLabel: "Your messy draft",
    input: "so basically we cant do the launch tuesday bc design isnt done and also i need to tell everyone",
    chips: [{ label: "keep my words", on: false }],
    outLabel: "Rewritten",
    outs: [
      {
        label: "Work chat",
        text: "Heads up: we're moving the launch. Design needs a few more days, so Tuesday's off. New date by Friday.",
      },
    ],
  },
  {
    tab: "Check",
    inLabel: "Before you send it",
    input: "Per my last email, please advise on the timeline.",
    chips: [{ label: "Email", on: true }],
    outLabel: "How it comes across",
    outs: [
      {
        label: "Tone",
        text: "Cold (high) · formal (high) · clear (medium)\n\nReads as annoyed. If you want the answer without the edge, try: “Any update on the timeline? Happy to jump on a call.”",
      },
    ],
  },
] satisfies {
  tab: string;
  inLabel: string;
  input: string;
  chips: Chip[];
  outLabel: string;
  outs: { label: string; text: string }[];
}[];

// [label, text, x, y, width] — positions inside a 1100×760 stage
export const BURST_CARDS: [string, string, number, number, number][] = [
  ["X", "hot take: most meetings are just emails with chairs", 40, 30, 230],
  ["Email", "Hi Sam — quick one, can we push to Thursday?", 300, 0, 220],
  ["Text message", "omw, grabbing coffee, want one?", 560, 40, 200],
  ["LinkedIn", "Three things I got wrong in my first year of freelancing.", 800, 10, 260],
  ["Work chat", "shipping this today unless someone yells", 0, 190, 230],
  ["Instagram", "sunday = long walk + too much bread", 870, 180, 220],
  ["Threads", "is it just me or is every app a chat app now", 220, 150, 240],
  ["Reddit", "Honest answer: I switched because the docs were better.", 640, 190, 250],
  ["Newsletter", "This week: one win, one mess, one link.", 70, 350, 230],
  ["Email", "Thanks for this. Short version: yes.", 830, 350, 220],
  ["Text message", "sorry, can't make it tonight — rain check?", 430, 300, 240],
];

export type FeatureBlock =
  | { kind: "input"; label: string; text: string; caret?: boolean }
  | { kind: "chips"; chips: Chip[] }
  | { kind: "bubble"; label: string; text: string }
  | { kind: "reply"; label: string; text: string }
  | { kind: "mark"; label: string; text: string }
  | { kind: "out"; label: string; text: string }
  | { kind: "bars"; label: string; bars: [string, string, string][] };

export const FEATURES: {
  mode: string;
  title: string;
  lead: string;
  noteLabel: string;
  note: string;
  cta: string;
  blocks: FeatureBlock[];
}[] = [
  {
    mode: "Write",
    title: "Type an idea. Get posts that sound like you.",
    lead: "A few words is plenty. CopyDogg writes 2–3 versions for X, LinkedIn, Instagram, Threads, Reddit or a newsletter, already formatted for each.",
    noteLabel: "You type",
    note: "hot take on remote work",
    cta: "Try Write",
    blocks: [
      { kind: "input", label: "Your idea", text: "hot take on remote work", caret: true },
      {
        kind: "chips",
        chips: [
          { label: "X", on: false },
          { label: "LinkedIn", on: true },
          { label: "Threads", on: false },
        ],
      },
      { kind: "out", label: "LinkedIn", text: "Remote work didn't make me less productive. It made my bad meetings more obvious." },
      { kind: "out", label: "LinkedIn", text: "Hot take: the office was never where the work happened. It's where the interruptions happened." },
    ],
  },
  {
    mode: "Reply",
    title: "Reply the way you’d actually reply",
    lead: "Paste the message you got, say what you want to say back, and get replies in your voice. Texts, emails, work chat, even whole conversations.",
    noteLabel: "One tap",
    note: "say no nicely · follow up · apologize · say thanks · ask a favor",
    cta: "Try Reply",
    blocks: [
      { kind: "bubble", label: "From Jess", text: "Hey! Any chance you could cover my shift on Saturday?" },
      {
        kind: "chips",
        chips: [
          { label: "say no nicely", on: true },
          { label: "follow up", on: false },
          { label: "say thanks", on: false },
        ],
      },
      { kind: "reply", label: "Your reply", text: "Wish I could — I've got plans Saturday. Hope you find someone!" },
    ],
  },
  {
    mode: "Tweak",
    title: "Tweak it until it’s right",
    lead: "Shorter, warmer, more direct, funnier. Or edit it by hand — CopyDogg learns from your edits and the posts you like.",
    noteLabel: "Keyboard",
    note: "t then s makes it shorter. 1–9 copies a version. Undo is always there.",
    cta: "Try a tweak",
    blocks: [
      {
        kind: "out",
        label: "Before",
        text: "I shipped a side project this weekend. No team, no roadmap — just an idea I finally sat down and built. It's rough in places. I'm proud of it anyway.",
      },
      {
        kind: "chips",
        chips: [
          { label: "shorter", on: true },
          { label: "warmer", on: false },
          { label: "more direct", on: false },
          { label: "funnier", on: false },
        ],
      },
      { kind: "mark", label: "Made it shorter", text: "Shipped a side project. Rough in places. Proud of it anyway." },
    ],
  },
  {
    mode: "Check",
    title: "Check how it comes across before you send it",
    lead: "Paste something you wrote and see if it reads cold, too formal, or just right. One tap rewrites it.",
    noteLabel: "Before you hit send",
    note: "“Per my last email, please advise.”",
    cta: "Try Check",
    blocks: [
      { kind: "input", label: "Your draft", text: "Per my last email, please advise on the timeline." },
      {
        kind: "bars",
        label: "How it comes across",
        bars: [
          ["clear", "high", "85%"],
          ["formal", "medium", "55%"],
          ["warm", "low", "18%"],
        ],
      },
      { kind: "chips", chips: [{ label: "rewrite it warmer", on: true }] },
    ],
  },
];

// [icon, chip, sub, title, body]
export const PRIVACY: [string, string, string, string, string][] = [
  ["FileJson", "One file", "data/copydogg.json", "Your data is one file", "Voice profile, rules and posts live in plain JSON on your machine. Copy it to back it up."],
  ["KeyRound", "Your key", "Claude API", "You bring the API key", "Posts are written with your own Claude key and billed to your account. No middleman."],
  ["UserX", "No accounts", "Single user", "Nothing to sign up for", "Clone it, add a key, run it. There’s no login and no database service."],
  ["MicOff", "Voice input", "Off by default", "The mic stays off", "Dictation is opt-in, with a plain warning that your browser’s speech service hears it."],
];

// [label, icon]
export const PLATFORMS: [string, string][] = [
  ["X", "X"],
  ["LinkedIn", "Briefcase"],
  ["Instagram", "Camera"],
  ["Threads", "MessagesSquare"],
  ["Reddit", "Users"],
  ["Newsletter", "Mail"],
  ["Email", "AtSign"],
  ["Text message", "MessageCircle"],
  ["Work chat", "Hash"],
];

// [typed, platform, icon, out]
export const EXAMPLES: [string, string, string, string][] = [
  ["ask my manager for Friday off", "Work chat", "Hash", "Hey Priya, would it be okay if I took Friday off? I'll have the report wrapped up Thursday."],
  ["tell my landlord the sink is leaking again", "Text message", "MessageCircle", "Hi Mark, the kitchen sink is leaking again — same spot as last month. Could someone come by this week?"],
  ["something that surprised me this week", "Threads", "MessagesSquare", "surprised by how much faster I work with my phone in another room. rude, honestly."],
  ["thank the beta testers", "Newsletter", "Mail", "Before anything else: thank you. Twelve of you tried a broken thing and told me exactly how it broke. It’s less broken now."],
  ["hot take on remote work", "LinkedIn", "Briefcase", "Remote work didn't make me less productive.\n\nIt made my bad meetings more obvious."],
  ["say no nicely to a new project", "Email", "AtSign", "Thanks for thinking of me. I can't take this one on right now, but I'd love to hear how it goes."],
];

export const TRUST: [string, string][] = [
  ["Laptop", "Runs on your machine"],
  ["KeyRound", "Your own Claude key"],
  ["Github", "Open source, MIT"],
  ["UserX", "No account needed"],
];

export const NAV_LINKS: [string, string][] = [
  ["How it works", "#learn"],
  ["Modes", "#modes"],
  ["Privacy", "#privacy"],
  ["FAQ", "#faq"],
];

export const FOOTER_COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["How it works", "#learn"],
      ["Modes", "#modes"],
      ["Examples", "#examples"],
      ["FAQ", "#faq"],
    ],
  },
];

export const FAQS: [string, string][] = [
  ["Does it cost anything?", "CopyDogg is free and open source. You pay Anthropic for your own Claude API usage, billed to your account."],
  [
    "What leaves my machine?",
    "Only what’s needed to write: your voice profile, your idea or pasted text, and a few posts you liked, sent to the Claude API. If you turn on voice input, your browser’s speech service hears what you dictate.",
  ],
  ["How long does setup take?", "About five minutes. Pick your platforms, paste a few old posts, and rewrite one boring post your way."],
  ["Can I have more than one voice?", "Yes. Make a “Work me” and a “Friends me”, each with its own tone and platforms."],
  ["Can I try it without an API key?", "Leave the key empty and it runs in demo mode: everything works and saves, but posts are placeholders."],
  ["Where can I run it?", "Anywhere with a normal disk: your laptop, a home server, a small VPS. Not serverless hosts like Vercel — the data file would disappear."],
];
