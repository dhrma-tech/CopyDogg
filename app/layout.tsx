import type { Metadata } from "next";
import { Fraunces, Karla, JetBrains_Mono } from "next/font/google";
import { connection } from "next/server";
import { isDemoMode } from "@/lib/demoMode";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CopyDogg",
  description: "Teach it your voice once. Then just say what you want.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection(); // demo-mode banner depends on the runtime env, not the build
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${karla.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {isDemoMode && (
          <div className="bg-accent px-4 py-1.5 text-center font-mono text-xs uppercase tracking-[0.1em] text-card">
            Demo mode — no Claude API key found. Add ANTHROPIC_API_KEY to
            .env.local and restart to get real posts.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
