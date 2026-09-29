/** Wordmark: plain serif "CopyDogg", same on every page. */
export default function Logo({ className = "" }: { className?: string }) {
  return <span className={`font-display text-h3 text-ink ${className}`}>CopyDogg</span>;
}
