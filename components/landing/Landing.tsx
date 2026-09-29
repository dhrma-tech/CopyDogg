"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";
import {
  BURST_CARDS,
  DEMOS,
  EXAMPLES,
  FAQS,
  FEATURES,
  FOOTER_COLUMNS,
  NAV_LINKS,
  PLATFORMS,
  PRIVACY,
  TRUST,
} from "./data";

const INK = "#1B1C14";
const CREAM = "#FFFDF5";
const ACCENT = "#00674F";

const STAGE_W = 1100;
const STAGE_H = 760;
const STAGE_CENTER_X = STAGE_W / 2;
const STAGE_CENTER_Y = 300; // where the cards fly out from (behind the heading)

const serifFont = { fontFamily: "var(--font-newsreader), Georgia, serif" };
const monoFont = { fontFamily: "var(--font-jbmono), ui-monospace, monospace" };

function Caret() {
  return (
    <span
      aria-hidden
      className="landing-caret"
      style={{ display: "inline-block", width: 2, height: 14, marginLeft: 2, background: "currentColor", verticalAlign: "-1px" }}
    />
  );
}

export function Landing({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  const [navShown, setNavShown] = useState(false);
  const [navDark, setNavDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const [demoIndex, setDemoIndex] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);
  const [typed, setTyped] = useState(() => DEMOS[0].input);
  const [outsVisible, setOutsVisible] = useState(true);

  const [featIndex, setFeatIndex] = useState(0);
  const [featPaused, setFeatPaused] = useState(false);

  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const clipRef = useRef<HTMLDivElement>(null);
  const demoPausedRef = useRef(demoPaused);

  useEffect(() => {
    demoPausedRef.current = demoPaused;
  }, [demoPaused]);

  const burst = useMemo(
    () =>
      BURST_CARDS.map(([label, text, x, y, w]) => ({
        label,
        text,
        x,
        y,
        w,
        dx: Math.round(STAGE_CENTER_X - (x + w / 2)),
        dy: Math.round(STAGE_CENTER_Y - (y + 45)),
      })),
    [],
  );

  // One rAF-throttled scroll loop driving the nav state, the privacy
  // section's clip-path reveal, and the burst cards' scroll-in.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);

    let raf = 0;
    let lastShown = false;
    let lastDark = false;

    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;

      const shown = y > 60;
      if (shown !== lastShown) {
        lastShown = shown;
        setNavShown(shown);
      }

      let dark = false;
      document.querySelectorAll("[data-nav-dark]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < 62 && r.bottom > 31) dark = true;
      });
      if (dark !== lastDark) {
        lastDark = dark;
        setNavDark(dark);
      }

      // Reduced motion: the privacy card shows full width, no scroll reveal.
      const clip = clipRef.current;
      if (clip) {
        const q = mq.matches ? 1 : Math.min(1, Math.max(0, (vh - clip.getBoundingClientRect().top) / (0.7 * vh)));
        const k = 1 - q;
        const extraRadius = window.innerWidth >= 1280 ? 24 * q : 0;
        clip.style.clipPath = `inset(${10 * k}% ${14 * k}% round ${Math.round(40 * k + extraRadius)}px)`;
      }

      if (mq.matches) return;

      const stage = stageRef.current;
      if (stage) {
        const raw = (0.92 * vh - stage.getBoundingClientRect().top) / (0.74 * vh);
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const b = burst[i];
          const t = Math.min(1, Math.max(0, (raw - i * 0.022) / 0.78));
          const e = 1 - Math.pow(1 - t, 3);
          card.style.transform = `translate(${b.dx * (1 - e)}px, ${b.dy * (1 - e)}px) scale(${0.45 + 0.55 * e})`;
          card.style.opacity = String(Math.min(1, t * 1.3));
        });
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [burst]);

  // Hero demo: typing effect + auto-cycle. Reduced-motion just renders the
  // full string directly below, so this effect has nothing to do then.
  useEffect(() => {
    if (reduced) return;
    const full = DEMOS[demoIndex].input;
    let n = 0;
    let typer: ReturnType<typeof setInterval> | undefined;
    const raf = requestAnimationFrame(() => {
      setOutsVisible(false);
      setTyped("");
      typer = setInterval(() => {
        n += 1;
        setTyped(full.slice(0, n));
        if (n >= full.length) {
          clearInterval(typer);
          setTimeout(() => setOutsVisible(true), 250);
        }
      }, 32);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(typer);
    };
  }, [demoIndex, reduced]);

  useEffect(() => {
    if (reduced) return;
    const cycle = setInterval(() => {
      if (!demoPausedRef.current) setDemoIndex((i) => (i + 1) % DEMOS.length);
    }, 6500);
    return () => clearInterval(cycle);
  }, [reduced]);

  // Features auto-advance when the active item's 7s progress bar finishes
  // (see onAnimationEnd below), so hover-pause and clicks keep bar and timer
  // in sync. Reduced motion disables the animation, so nothing advances.

  const copyInstall = () => {
    try {
      navigator.clipboard?.writeText("npm install && npm run dev");
    } catch {
      // clipboard access can fail silently (permissions, insecure context)
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const demo = DEMOS[demoIndex];
  const feature = FEATURES[featIndex];

  const navInk = navDark ? CREAM : "var(--ink)";
  const navLink = navDark ? "rgba(255,253,245,.78)" : "var(--ink-60)";
  const navDivider = navDark ? "rgba(255,253,245,.10)" : "var(--border-mid)";
  const navCtaBg = navDark ? "#FFFAEB" : INK;
  const navCtaColor = navDark ? INK : "#FFFFFF";

  return (
    <div className="landing" style={{ minHeight: "100vh", overflowX: "clip" }}>
      {/* Progressive blur behind the fixed nav */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-24" style={{ zIndex: 999 }}>
        <i
          className="absolute inset-0"
          style={{
            WebkitMaskImage: "linear-gradient(#000 0,#000 35%,transparent 80%)",
            maskImage: "linear-gradient(#000 0,#000 35%,transparent 80%)",
            backdropFilter: navShown || navDark ? "blur(6px)" : "blur(0px)",
            transition: "backdrop-filter 400ms ease",
          }}
        />
        <i
          className="absolute inset-0"
          style={{
            WebkitMaskImage: "linear-gradient(#000 0,#000 30%,transparent 85%)",
            maskImage: "linear-gradient(#000 0,#000 30%,transparent 85%)",
            opacity: navShown || navDark ? 1 : 0,
            background: navDark
              ? "linear-gradient(rgba(42,43,34,.72),rgba(42,43,34,0))"
              : "linear-gradient(rgba(255,253,245,.6),rgba(255,253,245,0))",
            transition: "opacity 400ms ease, background 350ms ease",
          }}
        />
      </div>

      <header
        className="fixed inset-x-0 top-0 z-[1000] mx-auto flex h-[62px] max-w-[1148px] items-center justify-between px-4 sm:px-6"
        style={{ transition: "color 200ms ease" }}
      >
        <a href="#top" style={{ ...serifFont, fontSize: 24, lineHeight: "32px", letterSpacing: "-0.5px", color: navInk, transition: "color 200ms ease" }}>
          CopyDogg
        </a>
        <nav aria-label="Sections" className="l-wide absolute left-1/2 -translate-x-1/2 items-center gap-5 px-6 py-4">
          {NAV_LINKS.map(([label, href], i) => (
            <span key={href} className="flex items-center gap-5">
              {i > 0 && <span aria-hidden style={{ width: 1, height: 12, background: navDivider, transition: "background-color 200ms ease" }} />}
              <a
                href={href}
                className="text-[14px] leading-5 no-underline"
                style={{ color: navLink, transition: "color 200ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = navInk)}
                onMouseLeave={(e) => (e.currentTarget.style.color = navLink)}
              >
                {label}
              </a>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] leading-5 font-semibold no-underline"
            style={{ background: navCtaBg, color: navCtaColor, transition: "background-color 200ms ease, color 200ms ease" }}
          >
            {ctaLabel}
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="l-narrow grid h-11 w-11 place-content-center gap-[5px] rounded-full border-0 bg-transparent"
          >
            <span
              className="block h-[2px] w-[22px] rounded-full"
              style={{ background: navInk, transition: "transform 200ms ease", transform: menuOpen ? "translateY(3.5px) rotate(45deg)" : "none" }}
            />
            <span
              className="block h-[2px] w-[22px] rounded-full"
              style={{ background: navInk, transition: "transform 200ms ease", transform: menuOpen ? "translateY(-3.5px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav
          aria-label="Sections"
          className="l-narrow fixed left-3 right-3 top-[66px] z-[1001] flex flex-col rounded-[20px] p-2"
          style={{ background: "var(--surface-cream)", border: "1px solid var(--border-strong)", boxShadow: "var(--sh-float)" }}
        >
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-[10px] px-4 py-3 text-[16px] leading-6 no-underline hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--ink)", transition: "background-color 140ms ease" }}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      <main id="top">
        {/* Hero */}
        <section className="l-hero relative flex flex-col items-center overflow-hidden text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[1100px] w-[1400px] -translate-x-1/2"
            style={{ background: "radial-gradient(60% 55% at 50% 38%, var(--surface-hover) 0%, var(--surface-cream) 45%, var(--bg) 75%)" }}
          />
          <div className="relative flex max-w-[770px] flex-col items-center">
            <h1
              className="l-display max-w-[796px] text-balance leading-[1.1]"
              style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: 0 }}
            >
              Posts that sound like you. Not like a press release.
            </h1>
            <p className="l-lead mt-6 max-w-[510px] text-pretty" style={{ color: "var(--ink-60)" }}>
              Show CopyDogg how you write once. Then type an idea in a few words and get posts, replies and emails in your own voice.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link
                href={ctaHref}
                className="inline-flex min-h-11 items-center gap-3 whitespace-nowrap rounded-full px-5 py-[10px] text-[16px] leading-6 font-medium no-underline hover:brightness-[1.15]"
                style={{ background: "var(--accent)", color: "var(--on-dark)", boxShadow: "var(--sh-btn-inset)", transition: "filter 150ms ease" }}
              >
                {ctaLabel}
              </Link>
              <a
                href="#learn"
                className="inline-flex min-h-11 items-center gap-[10px] whitespace-nowrap rounded-full px-[19px] py-[9px] text-[16px] leading-6 font-semibold no-underline hover:border-[var(--border-strong)] hover:bg-[rgba(27,28,20,.04)]"
                style={{ border: "1px solid var(--border)", color: "var(--ink)", transition: "border-color 150ms ease, background-color 150ms ease" }}
              >
                See how it works
              </a>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-3">
              {TRUST.map(([icon, label]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-[7px] text-[13px] leading-[18px] hover:text-[var(--ink-80)]"
                  style={{ color: "var(--ink-65)", transition: "color 150ms ease" }}
                >
                  <Icon name={icon} size={14} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="l-hero-demo relative flex w-full max-w-[1100px] flex-col items-center gap-5"
            onMouseEnter={() => setDemoPaused(true)}
            onMouseLeave={() => setDemoPaused(false)}
          >
            <div
              role="tablist"
              aria-label="Modes"
              className="flex gap-1 rounded-full p-1"
              style={{ background: "var(--surface-press)", border: "1px solid var(--border-mid)" }}
            >
              {DEMOS.map((d, i) => {
                const on = i === demoIndex;
                return (
                  <button
                    key={d.tab}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setDemoIndex(i)}
                    className="l-demo-tab h-9 whitespace-nowrap rounded-full border-0 text-[14px] leading-5"
                    style={{
                      background: on ? ACCENT : "transparent",
                      color: on ? CREAM : "var(--ink-65)",
                      fontWeight: on ? 500 : 400,
                      transition: "background-color 200ms ease, color 200ms ease",
                    }}
                  >
                    {d.tab}
                  </button>
                );
              })}
            </div>

            <div
              className="l-mock grid w-full gap-6 rounded-[24px] text-left"
              style={{ background: "var(--surface-cream)", border: "1px solid var(--border-strong)", boxShadow: "var(--sh-float)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
            >
              <div className="flex flex-col gap-3">
                <p style={{ ...monoFont, margin: 0, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>
                  {demo.inLabel}
                </p>
                <div
                  className="min-h-[132px] whitespace-pre-wrap rounded-[14px] px-4 py-3 text-[16px] leading-6"
                  style={{ background: "var(--surface)", border: "1px solid var(--ink)", boxShadow: "var(--ring)", color: "var(--ink)" }}
                >
                  {reduced ? demo.input : typed}
                  <Caret />
                </div>
                <div className="flex flex-wrap gap-2">
                  {demo.chips.map((c) => (
                    <span
                      key={c.label}
                      className="inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-[14px]"
                      style={{
                        border: `1px solid ${c.on ? INK : "var(--ink-50)"}`,
                        background: c.on ? INK : "transparent",
                        color: c.on ? CREAM : "var(--ink)",
                      }}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="flex min-h-[240px] flex-col gap-3"
                style={{
                  opacity: reduced || outsVisible ? 1 : 0,
                  transform: reduced || outsVisible ? "none" : "translateY(8px)",
                  transition: "opacity 350ms cubic-bezier(.22,.61,.36,1), transform 350ms cubic-bezier(.22,.61,.36,1)",
                }}
              >
                <p style={{ ...monoFont, margin: 0, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>
                  {demo.outLabel}
                </p>
                {demo.outs.map((o, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <p style={{ ...monoFont, margin: 0, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>
                      {o.label}
                    </p>
                    <p className="whitespace-pre-wrap text-pretty text-[16px] leading-6" style={{ margin: "6px 0 0", color: "var(--ink)" }}>
                      {o.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Learns your voice — burst */}
        <section id="learn" className="l-burst overflow-hidden">
          <div ref={stageRef} className="l-burst-stage relative mx-auto w-full max-w-[1440px]">
            <div
              className="l-burst-scale absolute left-1/2 top-0 origin-top"
              style={{ width: STAGE_W, height: STAGE_H, marginLeft: -STAGE_W / 2 }}
            >
              <div
                aria-hidden
                className="absolute rounded-full"
                style={{
                  left: 550,
                  top: 300,
                  width: 900,
                  height: 900,
                  margin: "-450px 0 0 -450px",
                  background: "radial-gradient(circle closest-side, var(--surface-hover) 0%, rgba(244,236,217,.5) 55%, rgba(255,253,245,0) 100%)",
                }}
              />
              {burst.map((b, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="landing-burst-card absolute rounded-xl px-[14px] py-3"
                  style={{
                    left: b.x,
                    top: b.y,
                    width: b.w,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--sh-hover-sm)",
                    willChange: "transform, opacity",
                    transform: reduced ? "none" : `translate(${b.dx}px, ${b.dy}px) scale(0.45)`,
                    opacity: reduced ? 1 : 0,
                  }}
                >
                  <p style={{ ...monoFont, margin: 0, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>
                    {b.label}
                  </p>
                  <p className="text-[14.82px] leading-[21.59px] tracking-[-0.154px]" style={{ margin: "6px 0 0", color: "var(--ink)" }}>
                    {b.text}
                  </p>
                </div>
              ))}
              <div
                className="l-burst-inner absolute left-1/2 w-[620px] -translate-x-1/2 text-center"
                style={{ top: 470 }}
              >
                <Reveal pop>
                  <h2
                    className="text-balance text-[52px] leading-[1.1] tracking-[-3px]"
                    style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: 0 }}
                  >
                    It learns from what you&rsquo;ve already written
                  </h2>
                  <p className="mx-auto mt-5 max-w-[520px] text-[20px] leading-[30px]" style={{ color: "var(--ink-60)" }}>
                    Paste a few old posts and rewrite one boring one. CopyDogg picks up your rhythm, your jokes and the words you&rsquo;d never use.
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
          <div className="l-burst-below mx-auto max-w-[620px] px-4 text-center">
            <h2 className="l-h2 text-balance leading-[1.1]" style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              It learns from what you&rsquo;ve already written
            </h2>
            <p className="l-lead mx-auto mt-4" style={{ color: "var(--ink-60)" }}>
              Paste a few old posts and rewrite one boring one. CopyDogg picks up your rhythm, your jokes and the words you&rsquo;d never use.
            </p>
          </div>
        </section>

        {/* Modes / features */}
        <section
          id="modes"
          className="l-feat flex justify-center"
          onMouseEnter={() => setFeatPaused(true)}
          onMouseLeave={() => setFeatPaused(false)}
        >
          <Reveal className="l-feat-row flex w-full max-w-[1100px] items-center justify-between">
            <div className="l-feat-text flex w-full flex-col gap-8">
              <h2 className="l-feature text-balance leading-[1.1]" style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                One box. Four ways to use it.
              </h2>
              <div role="tablist" aria-label="Modes" className="flex flex-col">
                {FEATURES.map((f, i) => {
                  const active = i === featIndex;
                  return (
                    <div key={f.mode} className="relative" style={{ borderTop: "1px solid var(--border-mid)" }}>
                      {active && (
                        <span
                          key={featIndex}
                          aria-hidden
                          className={`landing-grow absolute left-0 top-[-1px] h-[2px] ${featPaused ? "is-paused" : ""}`}
                          style={{ background: "var(--ink)" }}
                          onAnimationEnd={() => setFeatIndex((n) => (n + 1) % FEATURES.length)}
                        />
                      )}
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setFeatIndex(i)}
                        className="flex w-full items-baseline gap-4 border-0 bg-transparent py-3 pt-5 text-left hover:opacity-80"
                      >
                        <span style={{ ...monoFont, flexShrink: 0, width: 56, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>
                          {f.mode}
                        </span>
                        <span
                          className="text-[24px] leading-8 tracking-[-0.5px]"
                          style={{ ...serifFont, color: active ? "var(--ink)" : "var(--ink-60)", transition: "color 200ms ease" }}
                        >
                          {f.title}
                        </span>
                      </button>
                      <div className="grid overflow-hidden" style={{ transition: "grid-template-rows 350ms ease", gridTemplateRows: active ? "1fr" : "0fr" }}>
                        <div className="overflow-hidden">
                          <div className="flex flex-col items-start gap-3 pb-5 pl-[72px]">
                            <p className="text-pretty text-[16px] leading-6" style={{ margin: 0, color: "var(--ink-65)" }}>
                              {f.lead}
                            </p>
                            <p className="text-[14px] leading-5" style={{ margin: 0, color: "var(--ink)" }}>
                              <span style={{ ...monoFont, fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>{f.noteLabel}</span> {f.note}
                            </p>
                            <Link
                              href={f.href}
                              className="inline-flex items-center gap-[10px] whitespace-nowrap rounded-full px-[15px] py-[7px] text-[14px] leading-5 font-semibold no-underline hover:border-[var(--border-strong)] hover:bg-[rgba(27,28,20,.04)]"
                              style={{ border: "1px solid var(--border)", color: "var(--ink)", transition: "border-color 150ms ease, background-color 150ms ease" }}
                            >
                              {f.cta}
                              <Icon name="ArrowRight" size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className="l-feat-vis flex w-full flex-col justify-center gap-3 overflow-hidden rounded-3xl"
              style={{ background: "var(--surface-warm)" }}
            >
              {feature.blocks.map((bl, i) => {
                if (bl.kind === "chips") {
                  return (
                    <div key={i} className="flex flex-wrap gap-2">
                      {bl.chips.map((c) => (
                        <span
                          key={c.label}
                          className="inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-[14px]"
                          style={{ border: `1px solid ${c.on ? INK : "var(--ink-50)"}`, background: c.on ? INK : "transparent", color: c.on ? CREAM : "var(--ink)" }}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  );
                }
                if (bl.kind === "bars") {
                  return (
                    <div key={i} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <p style={{ ...monoFont, margin: "0 0 6px", fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>{bl.label}</p>
                      <div className="flex flex-col gap-[10px]">
                        {bl.bars.map(([label, level, w]) => (
                          <div key={label} className="grid items-center gap-3 text-[14px] leading-5" style={{ gridTemplateColumns: "72px 1fr 60px" }}>
                            <span style={{ color: "var(--ink)" }}>{label}</span>
                            <span className="h-1 overflow-hidden rounded-full" style={{ background: "var(--border-input)" }}>
                              <span className="block h-full rounded-full" style={{ background: "var(--ink)", width: w }} />
                            </span>
                            <span style={{ ...monoFont, fontSize: 12, fontWeight: 500, color: "var(--ink-65)", textAlign: "right" }}>{level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                const align = bl.kind === "bubble" ? "flex-start" : bl.kind === "reply" ? "flex-end" : "stretch";
                const maxW = bl.kind === "bubble" ? "80%" : bl.kind === "reply" ? "86%" : "100%";
                const bg = bl.kind === "bubble" ? "var(--surface-cream)" : bl.kind === "mark" ? "var(--accent-10)" : "var(--surface)";
                const edge = bl.kind === "input" ? INK : bl.kind === "bubble" ? "var(--border-strong)" : bl.kind === "mark" ? "transparent" : "var(--border)";
                const radius = bl.kind === "input" ? 14 : bl.kind === "bubble" || bl.kind === "reply" ? 20 : 12;
                const shadow = bl.kind === "input" ? "var(--ring)" : bl.kind === "reply" ? "var(--sh-float)" : "none";
                const size = bl.kind === "out" || bl.kind === "mark" ? 15 : 16;
                return (
                  <div key={i} style={{ alignSelf: align, maxWidth: maxW, background: bg, border: `1px solid ${edge}`, borderRadius: radius, padding: "14px 16px", boxShadow: shadow }}>
                    <p style={{ ...monoFont, margin: "0 0 6px", fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>{bl.label}</p>
                    <p className="whitespace-pre-wrap text-pretty" style={{ margin: 0, fontSize: size, lineHeight: 1.5, color: "var(--ink)" }}>
                      {bl.text}
                      {bl.kind === "input" && bl.caret && <Caret />}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* Privacy (dark) */}
        <section id="privacy" data-nav-dark="1" className="l-privacy">
          <div
            ref={clipRef}
            className="l-privacy-pad flex flex-col items-center"
            style={{ background: "#2A2B22", color: CREAM, clipPath: "inset(10% 14% round 40px)", willChange: "clip-path" }}
          >
            <div aria-hidden className="grid h-[88px] w-[88px] place-items-center rounded-3xl" style={{ background: "rgba(255,253,245,.07)", color: CREAM }}>
              <Icon name="LockKeyhole" size={36} />
            </div>
            <h2
              className="l-dark max-w-[760px] text-balance text-center leading-[1.08]"
              style={{ ...serifFont, fontWeight: 400, color: CREAM, margin: "40px 0 0" }}
            >
              Your voice stays on your machine
            </h2>
            <p className="l-lead mt-5 max-w-[560px] text-center" style={{ color: "rgba(255,253,245,.78)" }}>
              CopyDogg is built for one person running their own copy. No accounts, no database service, nothing to sign up for.
            </p>
            <div className="l-privacy-grid mt-16 grid w-full max-w-[1100px]">
              {PRIVACY.map(([icon, chip, sub, title, body]) => (
                <div key={title} className="flex flex-col gap-[18px]">
                  <div className="l-privacy-chip flex items-center gap-[10px] rounded-[14px] p-[10px]" style={{ background: "rgba(255,253,245,.07)" }}>
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px]" style={{ background: "rgba(255,253,245,.10)", color: CREAM }}>
                      <Icon name={icon} size={18} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] font-semibold leading-[1.3]" style={{ color: CREAM }}>{chip}</span>
                      <span className="text-[12px] leading-[1.3]" style={{ color: "rgba(255,253,245,.55)" }}>{sub}</span>
                    </span>
                  </div>
                  <h3 className="text-[24px] leading-8 tracking-[-0.5px]" style={{ ...serifFont, fontWeight: 400, color: CREAM, margin: 0 }}>{title}</h3>
                  <p className="text-[16px] leading-6" style={{ margin: 0, color: "rgba(255,253,245,.78)" }}>{body}</p>
                </div>
              ))}
            </div>
            <Link
              href={ctaHref}
              className="mt-16 inline-flex items-center gap-3 whitespace-nowrap rounded-full px-6 py-3 text-[18px] leading-6 font-semibold no-underline hover:bg-white"
              style={{ background: "#FFFAEB", color: INK, transition: "background-color 200ms ease" }}
            >
              Set up your copy
            </Link>
            <p className="mt-6 max-w-[560px] text-center text-[12px] leading-[1.5]" style={{ color: "rgba(255,253,245,.62)" }}>
              The only thing that leaves your machine is what&rsquo;s needed to write: your voice profile and your idea, sent to the Claude API.
            </p>
          </div>
        </section>

        {/* Platforms marquee */}
        <section className="overflow-hidden py-16">
          <p className="mb-8 text-center text-[17px] leading-[1.4] tracking-[-0.01em]" style={{ color: "var(--ink-65)" }}>
            Formatted for wherever you&rsquo;re posting
          </p>
          <div style={{ WebkitMaskImage: "linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)", maskImage: "linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)" }}>
            <div className="landing-marquee-track l-marquee flex w-max">
              {[...PLATFORMS, ...PLATFORMS].map(([label, icon], i) => (
                <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap text-[32px] leading-[1.2] tracking-[-0.5px]" style={{ ...serifFont, color: "var(--ink-50)" }}>
                  <Icon name={icon} size={24} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Examples */}
        <section id="examples" className="flex flex-col items-center gap-12 py-20" style={{ paddingInline: "clamp(16px,4vw,24px)" }}>
          <Reveal className="w-full">
            <h2 className="l-xl mx-auto max-w-[760px] text-balance text-center leading-[0.98]" style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: "0 auto" }}>
              A few words in. Your voice out.
            </h2>
          </Reveal>
          <div className="l-examples w-full max-w-[1100px] [column-gap:17px]">
            {EXAMPLES.map(([typedText, platform, icon, out], i) => (
              <article
                key={i}
                className="mb-[17px] flex flex-col gap-[14px] rounded-3xl p-5"
                style={{ breakInside: "avoid", background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex flex-col gap-1">
                  <span style={{ ...monoFont, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>You typed</span>
                  <span className="text-[14.82px] leading-[21.59px] tracking-[-0.154px] font-semibold" style={{ color: "var(--ink)" }}>{typedText}</span>
                </div>
                <p className="whitespace-pre-wrap text-pretty text-[14.82px] leading-[21.59px] tracking-[-0.154px]" style={{ margin: 0, color: "var(--ink)" }}>
                  {out}
                </p>
                <div className="flex items-center justify-between gap-[14px] pt-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <span style={{ ...monoFont, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>{platform}</span>
                  <Icon name={icon} size={16} className="opacity-65" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="flex flex-col items-center py-24" style={{ paddingInline: "clamp(16px,4vw,24px)" }}>
          <Reveal>
            <h2 className="l-h2 text-center leading-[1.1]" style={{ ...serifFont, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              Questions, answered plainly
            </h2>
          </Reveal>
          <div className="mt-12 flex w-full max-w-[750px] flex-col gap-3">
            {FAQS.map(([q, a], i) => {
              const open = faqOpen === i;
              return (
                <div key={q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex w-full items-center justify-between gap-8 border-0 bg-transparent py-[10px] text-left text-[16px] leading-[1.4] font-medium hover:opacity-70"
                    style={{ color: "rgba(0,0,0,.9)" }}
                  >
                    {q}
                    <span aria-hidden className="flex flex-shrink-0 opacity-60" style={{ transition: "transform 300ms ease", transform: open ? "rotate(45deg)" : "none" }}>
                      <Icon name="Plus" size={16} />
                    </span>
                  </button>
                  <div className="grid overflow-hidden" style={{ transition: "grid-template-rows 350ms ease", gridTemplateRows: open ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="text-[16px] leading-6" style={{ margin: 0, padding: "4px 48px 16px 0", color: "var(--ink-65)" }}>{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section data-nav-dark="1" className="py-10" style={{ paddingInline: "clamp(16px,4vw,24px)" }}>
          <Reveal>
            <div className="l-cta-box relative mx-auto max-w-[1100px] overflow-hidden" style={{ background: "#2A2B22" }}>
              <div
                aria-hidden
                className="pointer-events-none absolute whitespace-nowrap"
                style={{ right: "-8%", bottom: "-40%", ...serifFont, fontSize: 420, lineHeight: 1, letterSpacing: "-12px", color: "rgba(255,253,245,.07)" }}
              >
                woof
              </div>
              <div className="relative flex max-w-[520px] flex-col gap-8">
                <div>
                  <h2 className="l-cta leading-[1.1]" style={{ ...serifFont, fontWeight: 400, color: CREAM, margin: 0 }}>
                    Teach it your voice once
                  </h2>
                  <p className="mt-4 max-w-[420px] text-[18px] leading-[26px]" style={{ color: "rgba(255,253,245,.78)" }}>
                    Then just say what you want. Setup takes about five minutes.
                  </p>
                </div>
                <div className="flex min-h-[52px] items-center gap-2 rounded-[14px] py-[6px] pl-4 pr-[6px]" style={{ background: "rgba(255,253,245,.07)", border: "1px solid rgba(255,253,245,.10)" }}>
                  <code
                    className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-[14px] leading-5"
                    style={{ ...monoFont, color: CREAM, scrollbarWidth: "none" }}
                  >
                    npm install &amp;&amp; npm run dev
                  </code>
                  <button
                    type="button"
                    onClick={copyInstall}
                    className="inline-flex h-10 flex-shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[10px] border-0 px-[14px] text-[14px] font-medium hover:bg-[rgba(255,253,245,.16)]"
                    style={{ background: "rgba(255,253,245,.10)", color: CREAM }}
                  >
                    <Icon name={copied ? "Check" : "Copy"} size={14} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex flex-col items-start gap-3">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center gap-3 whitespace-nowrap rounded-full px-6 py-3 text-[18px] leading-6 font-semibold no-underline hover:bg-white"
                    style={{ background: "#FFFAEB", color: INK, transition: "background-color 200ms ease" }}
                  >
                    {ctaLabel}
                  </Link>
                  <p className="text-[13px] leading-[18px]" style={{ margin: 0, color: "rgba(255,253,245,.62)" }}>
                    Needs Node.js 20.9+ and a Claude API key. No key yet? Demo mode works too.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="flex flex-col gap-14 overflow-hidden pt-10" style={{ paddingInline: "clamp(16px,4vw,24px)" }}>
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap justify-between gap-10">
          <div className="flex max-w-[320px] flex-col gap-3">
            <span className="text-[24px] leading-8 tracking-[-0.5px]" style={{ ...serifFont, color: "var(--ink)" }}>CopyDogg</span>
            <p className="text-[15px] leading-[1.4]" style={{ margin: 0, color: "var(--ink-65)" }}>
              Posts that sound like you. Free, open source, and yours to run.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-14 gap-y-7">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <span style={{ ...monoFont, fontSize: 12, lineHeight: 1.3, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-65)" }}>{col.title}</span>
                <div className="flex flex-col gap-[10px]">
                  {col.links.map(([label, href]) =>
                    href.startsWith("/") ? (
                      <Link key={href} href={href} className="text-[15px] leading-[1.4] no-underline hover:underline" style={{ color: "var(--ink)" }}>
                        {label}
                      </Link>
                    ) : (
                      <a key={href} href={href} className="text-[15px] leading-[1.4] no-underline hover:underline" style={{ color: "var(--ink)" }}>
                        {label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap justify-between gap-x-6 gap-y-3 text-[14px] leading-[1.4]" style={{ color: "var(--ink-65)" }}>
          <span>MIT license. Built for one person running their own copy.</span>
          <span>Yes, the name is a dog pun. It fetches your tone.</span>
        </div>
        <div
          aria-hidden
          className="l-wordmark whitespace-nowrap text-center"
          style={{ ...serifFont, lineHeight: 0.8, color: "var(--border-soft)", marginBottom: "-0.12em" }}
        >
          CopyDogg
        </div>
      </footer>
    </div>
  );
}
