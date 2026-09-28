import Link from "next/link";
import { connection } from "next/server";
import { getActivePersona } from "@/lib/store";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

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

export default async function Home() {
  await connection(); // CTA depends on whether a voice profile exists
  const cta = (await getActivePersona()) ? "Open CopyDogg" : "Get started";

  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6">
      <header className="flex w-full max-w-3xl items-center justify-between py-5">
        <Logo />
        <Link href="/app" className={buttonClasses({ variant: "quiet", size: "sm" })}>
          Open app
        </Link>
      </header>

      <section className="flex w-full max-w-2xl flex-col items-center pt-12 pb-14 text-center sm:pt-16">
        <h1 className="font-display text-display text-ink">
          Posts that sound like you. <span className="marker">Not like a press release.</span>
        </h1>
        <p className="mt-6 max-w-md text-body text-ink-soft">
          Show CopyDogg how you write once. After that, type an idea in a few
          words and get posts in your own voice.
        </p>
        <Link href="/app" className={`mt-8 ${buttonClasses({ variant: "primary" })}`}>
          {cta}
        </Link>
        <p className="mt-3 text-small text-ink-soft">
          Free and open source. Runs on your own Claude API key.
        </p>
      </section>

      <Card variant="main" className="w-full max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="label">What you type</p>
            <p className="mt-3 text-body text-ink">
              just shipped a side project and I&rsquo;m proud of it
            </p>
          </div>
          <div>
            <p className="label">What you get</p>
            <div className="mt-3 flex flex-col divide-y divide-dashed divide-hairline">
              {DEMO_OUTPUTS.map((demo) => (
                <div key={demo.platform} className="py-3 first:pt-0 last:pb-0">
                  <p className="label">{demo.platform}</p>
                  <p className="mt-1 whitespace-pre-wrap text-body text-ink">{demo.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <section className="w-full max-w-3xl py-16">
        <h2 className="text-center font-display text-title text-ink">How it works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <p className="label">
                <span className="rounded-sm bg-highlight px-1.5 py-0.5 text-on-highlight">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </p>
              <h3 className="mt-3 font-display text-heading text-ink">{step.title}</h3>
              <p className="mt-1 text-body text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex w-full max-w-xl flex-col items-center gap-6 border-t border-dashed border-control pt-14 pb-24 text-center">
        <p className="text-body text-ink-soft">
          It will never open with &ldquo;In today&rsquo;s fast-paced world.&rdquo;
          <br />
          Yes, the name is a dog pun. It fetches your tone.
        </p>
        <Link href="/app" className={buttonClasses({ variant: "primary" })}>
          {cta}
        </Link>
      </section>
    </main>
  );
}
