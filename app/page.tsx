import { connection } from "next/server";
import { getActivePersona } from "@/lib/store";
import { REPO_URL, isSiteOnly } from "@/lib/siteOnly";
import { Landing } from "@/components/landing/Landing";
import "./landing.css";

export default async function Home() {
  // The public website has no data file: every "start" button goes to GitHub.
  if (isSiteOnly) return <Landing ctaHref={REPO_URL} ctaLabel="Get it on GitHub" siteOnly />;

  await connection(); // CTA depends on whether a voice profile exists
  const hasPersona = Boolean(await getActivePersona());
  const ctaHref = hasPersona ? "/app" : "/onboarding";
  const ctaLabel = hasPersona ? "Open CopyDogg" : "Get started";

  return <Landing ctaHref={ctaHref} ctaLabel={ctaLabel} />;
}
