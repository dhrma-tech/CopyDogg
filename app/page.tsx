import Link from "next/link";
import { connection } from "next/server";
import { getPersona } from "@/lib/store";

const DEMO_OUTPUTS = [
  {
    platform: "X",
    text: "Shipped a side project this weekend. Small, rough, mine. That's the whole post.",
  },
  {
    platform: "LinkedIn",
    text: "I shipped a side project this weekend.\n\nNo team, no roadmap — just an idea I finally sat down and built. It's rough in places. I'm proud of it anyway.",
  },
];

const STEPS = [
  {
    title: "Pick where you post",
    body: "X, LinkedIn, Instagram, wherever you actually show up.",
  },
  {
    title: "Show it how you write",
    body: "Paste a few old posts and rewrite one boring one. About five minutes.",
  },
  {
    title: "Say what you want",
    body: "“hot take on remote work” is plenty. You get posts that sound like you.",
  },
];

const CTA_CLASSES = "rounded-full bg-ink px-6 py-3 text-sm font-bold text-card";

export default async function Home() {
  await connection(); // CTA depends on whether a voice profile exists
  const cta = (await getPersona()) ? "Open CopyDogg" : "Get started";

  return (
    <main className="flex flex-1 flex-col items-center px-6">
      <header className="flex w-full max-w-3xl items-center justify-between py-5">
        <span className="font-display text-xl font-semibold text-ink">
          Copy<span className="text-accent">Dogg</span>
        </span>
        <Link href="/app" className="text-sm font-medium text-ink-soft hover:text-ink">
          Open app
        </Link>
      </header>

      <section className="flex w-full max-w-2xl flex-col items-center pt-14 pb-14 text-center">
        <h1 className="font-display text-[clamp(38px,8vw,58px)] font-semibold leading-tight text-ink">
          Posts that sound like you.{" "}
          <em className="font-medium italic">Not like a press release.</em>
        </h1>
        <p className="mt-5 max-w-md text-base text-ink-soft">
          Show CopyDogg how you write once. After that, type an idea in a few
          words and get posts in your own voice.
        </p>
        <Link href="/app" className={`mt-8 ${CTA_CLASSES}`}>
          {cta}
        </Link>
        <p className="mt-3 text-sm text-ink-soft">
          Free and open source. Runs on your own Claude API key.
        </p>
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

      <section className="w-full max-w-3xl py-16">
        <h2 className="text-center font-display text-[28px] font-medium text-ink">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-accent">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-base font-bold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex w-full max-w-xl flex-col items-center gap-5 border-t border-hairline pt-14 pb-24 text-center">
        <p className="text-base text-ink-soft">
          It will never open with &ldquo;In today&rsquo;s fast-paced world.&rdquo;
          <br />
          Yes, the name is a dog pun. It fetches your tone.
        </p>
        <Link href="/app" className={CTA_CLASSES}>
          {cta}
        </Link>
      </section>
    </main>
  );
}
