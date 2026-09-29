import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { gatePassword } from "@/lib/passwordGate";
import UnlockForm from "./UnlockForm";

export default async function UnlockPage({ searchParams }: PageProps<"/unlock">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";

  // No password configured means nothing to unlock.
  if (!gatePassword()) redirect("/");

  return (
    <>
      {/* The logo isn't a link: every page is behind the lock. */}
      <header className="sticky top-0 z-30 w-full border-b border-border-soft bg-[var(--header-bg)] px-4 backdrop-blur-[14px] sm:px-6">
        <div className="mx-auto flex h-[62px] max-w-sm items-center">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pt-12 pb-24 sm:px-6">
        <UnlockForm next={nextPath} />
      </main>
    </>
  );
}
