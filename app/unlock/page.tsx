import { redirect } from "next/navigation";
import { gatePassword } from "@/lib/passwordGate";
import UnlockForm from "./UnlockForm";

export default async function UnlockPage({ searchParams }: PageProps<"/unlock">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";

  // No password configured means nothing to unlock.
  if (!gatePassword()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <UnlockForm next={nextPath} />
    </main>
  );
}
