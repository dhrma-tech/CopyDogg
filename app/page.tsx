import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { connection } from "next/server";
import { getActivePersona } from "@/lib/store";
import { Landing } from "@/components/landing/Landing";
import "./landing.css";

// Warm Serif type (docs/design-system.md), scoped to the landing page only —
// see the design doc's "Migration status" note.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export default async function Home() {
  await connection(); // CTA depends on whether a voice profile exists
  const hasPersona = Boolean(await getActivePersona());
  const ctaHref = hasPersona ? "/app" : "/onboarding";
  const ctaLabel = hasPersona ? "Open CopyDogg" : "Get started";

  return (
    <div className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`} style={{ fontFamily: "var(--font-inter), Inter, Arial, sans-serif" }}>
      <Landing ctaHref={ctaHref} ctaLabel={ctaLabel} />
    </div>
  );
}
