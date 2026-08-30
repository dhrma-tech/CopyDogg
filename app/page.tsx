import Link from "next/link";

const DEMO_OUTPUTS = [
  {
    platform: "X",
    text: "Shipped a side project this weekend. Small, rough, mine. That's the whole post.",
  },
  {
    platform: "LinkedIn",
    text: "I shipped a side project this weekend.\n\nNo funding, no team, no roadmap — just an idea I finally sat down and built.\n\nIt's small. It's rough in places. I'm proud of it anyway.",
  },
  {
    platform: "Instagram",
    text: "built a whole thing this weekend 🛠️\nnobody asked me to. i just wanted to see it exist.\nsmall win, but it's mine.",
  },
];

const FEATURES = [
  {
    title: "Your voice, saved once",
    body: "Set your tone, your rules, a few samples. It remembers, so you never re-explain yourself again.",
  },
  {
    title: "One idea, every platform",
    body: "Remix the same idea for X, LinkedIn, or Instagram — same voice, right format, one click.",
  },
  {
    title: "A library that's actually yours",
    body: "Every post you save lives in one searchable place, not scattered across your notes app.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6">
      <section className="flex w-full max-w-2xl flex-col items-center pt-20 pb-16 text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Teach it once. Sound like you <em className="italic">every time</em>.
        </h1>
        <p className="mt-4 max-w-md text-base text-ink-soft">
          CopyDogg remembers how you sound, so you don&rsquo;t have to
          re-teach it every time you post.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-bold text-card"
        >
          Try it free
        </Link>
      </section>

      <section className="w-full max-w-3xl rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
              What you type
            </p>
            <p className="mt-3 text-sm text-ink">
              just shipped a side project and I&rsquo;m proud of it
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
              What you get
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {DEMO_OUTPUTS.map((demo) => (
                <div
                  key={demo.platform}
                  className="rounded-md border border-hairline bg-paper p-3"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                    {demo.platform}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {demo.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid w-full max-w-3xl gap-6 py-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title}>
            <h2 className="font-display text-lg font-semibold text-ink">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="w-full max-w-xl border-t border-hairline py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Why I built this
        </p>
        <p className="mt-3 text-base text-ink-soft">
          I got tired of re-explaining my tone to a chat window every time I
          wanted to post something. So I built a tool that learns it once and
          writes like me from then on. This is that tool.
        </p>
      </section>

      <section className="flex w-full max-w-xl flex-col items-center gap-4 pb-24 text-center">
        <p className="text-sm text-ink-soft">Free while in beta.</p>
        <Link
          href="/login"
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-card"
        >
          Try it free
        </Link>
      </section>
    </main>
  );
}
