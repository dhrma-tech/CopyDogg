import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="flex w-full items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/app" className="font-display text-xl font-semibold text-ink">
        Copy<span className="text-accent">Dogg</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm font-medium text-ink-soft">
        <Link href="/app/library" className="hover:text-ink">
          Library
        </Link>
        <Link href="/app/profile" className="hover:text-ink">
          Profile
        </Link>
        <Link href="/app/settings" className="hover:text-ink">
          Settings
        </Link>
      </nav>
    </header>
  );
}
