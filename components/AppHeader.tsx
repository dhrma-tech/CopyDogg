"use client";

import { Fragment } from "react";
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
 * Sticky, blurred top bar with page links on wider screens; on phones the
 * links move to a bottom tab bar, within thumb reach. The current page is
 * marked in both.
 */
export default function AppHeader() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <>
      {/* Same width as app content (max-w-2xl), so the logo lines up with the page. */}
      <header className="sticky top-0 z-30 w-full border-b border-border-soft bg-[var(--header-bg)] px-4 backdrop-blur-[14px] sm:px-6">
        <div className="mx-auto flex h-[62px] max-w-2xl items-center justify-between">
          <Link href="/app" aria-label="CopyDogg, writing screen" className="no-underline">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-2 sm:flex">
            {LINKS.map(({ href, label }, i) => (
              <Fragment key={href}>
                {i > 0 && <span aria-hidden className="h-3 w-px bg-border-mid" />}
                <Link
                  href={href}
                  aria-current={isCurrent(href) ? "page" : undefined}
                  className={`rounded-pill px-3 py-1.5 text-ui no-underline transition-colors hover:text-ink ${
                    isCurrent(href) ? "bg-surface-hover font-medium text-ink" : "text-ink-60"
                  }`}
                >
                  {label}
                </Link>
              </Fragment>
            ))}
          </nav>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-bg pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent(href) ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-micro font-medium no-underline ${
                  isCurrent(href) ? "text-ink" : "text-ink-65"
                }`}
              >
                <span
                  className={`flex rounded-pill px-4 py-1 transition-colors ${
                    isCurrent(href) ? "bg-primary text-on-primary" : ""
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
