import { connection } from "next/server";
import { getActivePersona } from "@/lib/store";
import { Landing } from "@/components/landing/Landing";
import "./landing.css";

export default async function Home() {
  await connection(); // CTA depends on whether a voice profile exists
  const hasPersona = Boolean(await getActivePersona());
  const ctaHref = hasPersona ? "/app" : "/onboarding";
  const ctaLabel = hasPersona ? "Open CopyDogg" : "Get started";

  return <Landing ctaHref={ctaHref} ctaLabel={ctaLabel} />;
}
