"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Mic } from "lucide-react";

// The Web Speech API isn't in TypeScript's DOM types everywhere yet; this is
// the small slice CopyDogg uses.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

/**
 * Dictation for the idea box. Only rendered when voice input is switched on in
 * Settings, because the browser's speech service (Google, Apple, Microsoft)
 * hears the audio. Hidden on browsers without speech recognition.
 */
export default function MicButton({ onText }: { onText: (text: string) => void }) {
  const supported = useSyncExternalStore(noopSubscribe, () => !!getRecognition(), () => false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Recognition = getRecognition();
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = navigator.language || "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (heard) onText(heard);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    r.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop dictating" : "Dictate"}
      aria-pressed={listening}
      className={
        listening
          ? "absolute right-2 top-2 rounded-sm bg-accent-soft p-1.5 text-accent motion-safe:animate-pulse"
          : "absolute right-2 top-2 rounded-sm p-1.5 text-ink-soft hover:text-ink"
      }
    >
      <Mic size={16} strokeWidth={2} />
    </button>
  );
}
