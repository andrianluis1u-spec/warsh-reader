import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser speech recognition (Web Speech API) as a no-backend fallback for
 * the Whisper ASR service. Emits final Arabic result phrases word-by-word to
 * the matching engine. Support: Chrome/Edge/Safari (not Firefox).
 */

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SRCtor = new () => SR;

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
}

export type SpeechStatus = "unsupported" | "idle" | "listening" | "error";

export function useBrowserSpeech(onWords: (words: string[]) => void) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const wantRef = useRef(false);
  const onWordsRef = useRef(onWords);
  onWordsRef.current = onWords;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SRCtor;
      webkitSpeechRecognition?: SRCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    rec.lang = "ar-SA";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          const words = res[0].transcript.split(/\s+/).filter(Boolean);
          if (words.length > 0) onWordsRef.current(words);
        }
      }
    };
    rec.onerror = (ev) => {
      if (ev.error !== "no-speech" && ev.error !== "aborted") {
        setError(ev.error);
        setStatus("error");
      }
    };
    rec.onend = () => {
      // Chrome stops after silence — restart while the user still wants it.
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          /* already started race */
        }
      } else {
        setStatus("idle");
      }
    };
    recRef.current = rec;
    return () => {
      wantRef.current = false;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    wantRef.current = true;
    setError(null);
    try {
      rec.start();
      setStatus("listening");
    } catch {
      /* start() race — onend restart handles it */
    }
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setStatus("idle");
  }, []);

  return { status, error, start, stop };
}
