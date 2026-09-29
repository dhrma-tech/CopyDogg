/**
 * Shown instantly while a page under /app loads its data, so switching pages
 * never looks stuck. Uses the card and hairline tokens, pulsing only when
 * motion is allowed.
 */
export default function Loading() {
  const bar = "rounded-full bg-hairline motion-safe:animate-pulse";
  return (
    <main className="flex flex-1 justify-center px-4 pb-12 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="w-full max-w-2xl">
        <div className={`mb-5 h-8 w-2/3 ${bar}`} />
        <div className="flex flex-col gap-4 rounded-2xl border border-border-strong bg-surface-cream p-4 shadow-float sm:p-6">
          <div className={`h-9 w-full ${bar}`} />
          <div className="flex gap-2">
            <div className={`h-9 w-20 ${bar}`} />
            <div className={`h-9 w-24 ${bar}`} />
            <div className={`h-9 w-20 ${bar}`} />
          </div>
          <div className="h-24 w-full rounded-md bg-hairline motion-safe:animate-pulse" />
          <div className={`h-12 w-full ${bar}`} />
        </div>
      </div>
    </main>
  );
}
