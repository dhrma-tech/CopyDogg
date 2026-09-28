"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, PenLine, Settings, UserRound, type LucideIcon } from "lucide-react";

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
      <header className="flex w-full items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/app" className="font-display text-xl font-semibold text-ink">
          Copy<span className="text-accent">Dogg</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium sm:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={
                isCurrent(href)
                  ? "rounded-full bg-accent-soft px-3 py-1.5 text-accent"
                  : "rounded-full px-3 py-1.5 text-ink-soft hover:text-ink"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
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
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                  isCurrent(href) ? "text-accent" : "text-ink-soft"
                }`}
              >
                <Icon size={20} strokeWidth={isCurrent(href) ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
