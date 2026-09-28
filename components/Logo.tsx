/** Wordmark: "Copy" in ink, "Dogg" highlighted. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-heading font-bold tracking-tight text-ink ${className}`}>
      Copy<span className="ml-px rounded-sm bg-highlight px-1 text-on-highlight">Dogg</span>
    </span>
  );
}
