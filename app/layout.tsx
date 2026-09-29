import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Warm Serif type (docs/design-system.md). Variable fonts, self-hosted by
// next/font at build time; Newsreader keeps its optical-size axis.
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

export const metadata: Metadata = {
  title: "CopyDogg",
  description: "Teach it your voice once. Then just say what you want.",
  // Installed (standalone) look on iOS home screen; Android/desktop read this from manifest.ts.
  appleWebApp: {
    capable: true,
    title: "CopyDogg",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFDF5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      // The theme script sets data-theme before React loads.
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved Light/Dark choice before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
