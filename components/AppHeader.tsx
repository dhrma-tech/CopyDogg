"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, PenLine, Settings, UserRound, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Write", icon: PenLine },
  { href: "/app/library", label: "Library", icon: BookMarked },
  { href: "/app/profile", label: "Profile", icon: UserRound },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

/**
 * Top bar with page links on wider screens; on phones the links move to a
 * bottom tab bar, within thumb reach. The current page is marked in both.
 */
export default function AppHeader() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <>
      {/* Same width as app content (max-w-2xl), so the logo lines up with the page. */}
      <header className="w-full px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
        <Link href="/app" aria-label="CopyDogg, writing screen">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-small font-medium sm:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={
                isCurrent(href)
                  ? "rounded-chip bg-highlight px-3 py-1.5 font-semibold text-on-highlight"
                  : "rounded-chip px-3 py-1.5 text-ink-soft transition-colors hover:bg-highlight-soft hover:text-ink"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent(href) ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-label font-medium ${
                  isCurrent(href) ? "text-ink" : "text-ink-soft"
                }`}
              >
                <span
                  className={`rounded-chip px-4 py-1 transition-colors ${
                    isCurrent(href) ? "bg-highlight text-on-highlight" : ""
                  }`}
                >
                  <Icon size={20} strokeWidth={isCurrent(href) ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
