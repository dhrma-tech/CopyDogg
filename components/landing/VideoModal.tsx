"use client";

import { useEffect, useRef, useState } from "react";

/** Drop the walkthrough video here (public/how-it-works.mp4). Served from this copy, no third party. */
export const HOW_IT_WORKS_VIDEO = "/how-it-works.mp4";

/**
 * "See how it works" video in a native <dialog>: Esc closes it, focus stays
 * inside while open, and the video stops when it closes.
 */
export function VideoModal({
  open,
  onClose,
  fallbackHref,
}: {
  open: boolean;
  onClose: () => void;
  /** Where to send people if the video file isn't there. */
  fallbackHref: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // The <video> only exists while open, so closing also stops playback.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself, not its content.
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-label="How CopyDogg works"
      className="m-auto w-[min(960px,calc(100vw-32px))] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgba(27,28,20,.72)] backdrop:backdrop-blur-[4px]"
    >
      <div className="flex justify-end pb-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-9 items-center rounded-full px-4 py-2 text-[14px] leading-5 font-medium"
          style={{ background: "var(--surface-cream)", color: "var(--ink)" }}
        >
          Close
        </button>
      </div>

      {!open ? null : missing ? (
        <div
          className="flex aspect-video flex-col items-center justify-center gap-3 rounded-[20px] p-8 text-center"
          style={{ background: "var(--surface-warm)", color: "var(--ink)" }}
        >
          <p className="text-[24px] leading-8 tracking-[-0.5px]" style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}>
            The video isn&rsquo;t up yet
          </p>
          <p className="max-w-[420px] text-[15px] leading-[1.4]" style={{ color: "var(--ink-65)" }}>
            Here&rsquo;s the short written tour in the meantime.
          </p>
          <a
            href={fallbackHref}
            onClick={onClose}
            className="mt-2 inline-flex min-h-11 items-center rounded-full px-5 py-[10px] text-[16px] leading-6 font-semibold no-underline"
            style={{ border: "1px solid var(--ink-50)", color: "var(--ink)" }}
          >
            Read how it works
          </a>
        </div>
      ) : (
        <video
          src={HOW_IT_WORKS_VIDEO}
          controls
          autoPlay
          playsInline
          preload="metadata"
          onError={() => setMissing(true)}
          className="block aspect-video w-full rounded-[20px]"
          style={{ background: "var(--bg-dark)" }}
        />
      )}
    </dialog>
  );
}
