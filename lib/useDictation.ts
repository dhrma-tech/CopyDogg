"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Dictation with the browser's own speech recognition (Chrome, Edge, Safari).
 * Audio goes to the browser vendor's speech service, which is why voice
 * input is opt-in in Settings. Words stream in while you talk, and listening
 * restarts by itself when the browser times out, so long notes work.
 */

// The Web Speech API isn't in TypeScript's DOM types everywhere yet; this is
// the slice CopyDogg uses.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognition(): RecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

/** True in browsers that can dictate (false during server render). */
export function useDictationSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, () => !!getRecognition(), () => false);
}

const ERRORS: Record<string, string> = {
  "not-allowed":
    "The mic is blocked. Allow microphone access for this site in your browser, then try again.",
  "service-not-allowed":
    "Your browser isn't allowing speech recognition here. Check its microphone and speech settings.",
  "audio-capture": "No microphone found. Plug one in or check your system sound settings.",
  network: "Couldn't reach your browser's speech service. Check your connection and try again.",
  "language-not-supported":
    "Your browser can't dictate in that language. Pick another in Settings.",
};

export interface Dictation {
  supported: boolean;
  listening: boolean;
  /** Words heard so far that the browser may still change. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useDictation({
  lang,
  onFinal,
}: {
  /** BCP-47 tag; "" uses the browser's language. */
  lang: string;
  /** Called with each finished phrase, in order. */
  onFinal: (text: string) => void;
}): Dictation {
  const supported = useDictationSupported();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognition = useRef<RecognitionLike | null>(null);
  // True while the user wants to keep listening; false after Stop or a fatal error.
  const wanted = useRef(false);
  const restarts = useRef<number[]>([]);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  const begin = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = lang || navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current(text.trim());
        } else {
          pending += text;
        }
      }
      setInterim(pending.trim());
    };
    r.onerror = (event) => {
      // "no-speech" and "aborted" aren't failures: keep going or we stopped it.
      if (event.error === "no-speech" || event.error === "aborted") return;
      wanted.current = false;
      setError(ERRORS[event.error] ?? "Dictation stopped unexpectedly. Try again.");
    };
    r.onend = () => {
      setInterim("");
      if (!wanted.current) {
        setListening(false);
        return;
      }
      // Browsers end recognition after a pause or a minute; pick up again,
      // unless it's ending instantly over and over (then something's wrong).
      const now = Date.now();
      restarts.current = [...restarts.current.filter((t) => now - t < 3000), now];
      if (restarts.current.length > 4) {
        wanted.current = false;
        setListening(false);
        setError("Dictation keeps stopping. Check your mic, then try again.");
        return;
      }
      try {
        r.start();
      } catch {
        wanted.current = false;
        setListening(false);
      }
    };
    recognition.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      wanted.current = false;
      setError("Couldn't start dictation. Try again.");
    }
  }, [lang]);

  const start = useCallback(() => {
    if (wanted.current) return;
    wanted.current = true;
    restarts.current = [];
    setError(null);
    setInterim("");
    begin();
  }, [begin]);

  const stop = useCallback(() => {
    wanted.current = false;
    // stop() (not abort) lets the browser deliver the last phrase first.
    recognition.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (wanted.current) stop();
    else start();
  }, [start, stop]);

  // Never keep the mic open after leaving the page.
  useEffect(
    () => () => {
      wanted.current = false;
      recognition.current?.abort();
    },
    []
  );

  return { supported, listening, interim, error, start, stop, toggle };
}
