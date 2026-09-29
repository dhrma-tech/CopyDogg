/**
 * Shown instantly while a page under /app loads its data, so switching pages
 * never looks stuck: the main card's shape in surface-press bars, pulsing
 * only when motion is allowed.
 */
export default function Loading() {
  const bar = "bg-surface-press motion-safe:animate-pulse";
  return (
    <main className="flex flex-1 justify-center px-4 pb-12 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="w-full max-w-2xl">
        <div className={`mb-5 h-8 w-2/3 rounded-pill ${bar}`} />
        <div className="flex flex-col gap-4 rounded-2xl border border-border-strong bg-surface-cream p-4 shadow-float sm:p-6">
          <div className={`h-11 w-full rounded-pill ${bar}`} />
          <div className="flex gap-2">
            <div className={`h-9 w-20 rounded-pill ${bar}`} />
            <div className={`h-9 w-24 rounded-pill ${bar}`} />
            <div className={`h-9 w-20 rounded-pill ${bar}`} />
          </div>
          <div className={`h-24 w-full rounded-lg ${bar}`} />
          <div className={`h-11 w-full rounded-pill ${bar}`} />
        </div>
      </div>
    </main>
  );
}
