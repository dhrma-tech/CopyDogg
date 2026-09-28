import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

/** Shared by every /app page: the nav stays put while pages change. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {/* Room for the phone tab bar at the bottom. */}
      <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>
    </>
  );
}
