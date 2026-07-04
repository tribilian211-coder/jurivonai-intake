"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Web Speech API types are not in TS DOM lib by default; minimal declaration.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface VoiceRecorderProps {
  // Existing text in the textarea — appended/inserted into.
  initialText: string;
  // Called whenever new text is recognized (full updated string passed)
  onTranscript: (text: string) => void;
  // For lawyers who may prefer Urdu mixed with English legal terms
  lang?: string;
}

// Detect support synchronously at module init (avoids setState-in-effect lint error).
function detectSpeechSupport(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Browser-native speech-to-text. Zero API cost.
// Works in Chrome, Edge, Safari 14.1+, Chrome Android.
// Falls back gracefully (button hidden) on unsupported browsers.
export function VoiceRecorder({
  initialText,
  onTranscript,
  lang = "en-PK",
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const currentTextRef = useRef<string>(initialText);
  const supported = detectSpeechSupport();

  // Keep ref synced with parent so onresult always sees latest text
  useEffect(() => {
    currentTextRef.current = initialText;
  }, [initialText]);

  useEffect(() => {
    if (!supported) return;

    const SR =
      ((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | undefined;

    if (!SR) return;

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setError(null);
      setRecording(true);
    };

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        const base = currentTextRef.current;
        const sep = base && !base.endsWith(" ") && !base.endsWith("\n") ? " " : "";
        const updated = (base + sep + finalChunk).trim() + " ";
        currentTextRef.current = updated;
        onTranscript(updated);
      }
      setInterim(interimChunk);
    };

    rec.onerror = (e: { error: string }) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone permission denied. Allow mic access to use voice input.");
      } else if (e.error === "no-speech") {
        // ignore — recognition continues
      } else {
        setError(`Voice input error: ${e.error}`);
      }
    };

    rec.onend = () => {
      setRecording(false);
      setInterim("");
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    };
  }, [lang, onTranscript, supported]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        // start() throws if already started — safe to ignore
      }
    }
  };

  if (!supported) {
    // Silently hidden on unsupported browsers — typing is the universal fallback
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size="sm"
        onClick={toggle}
        className="gap-2 w-fit"
      >
        {recording ? (
          <>
            <Square className="h-3.5 w-3.5" />
            Stop recording
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            Answer by voice
          </>
        )}
      </Button>
      {recording && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {interim ? <span className="italic">"{interim}"</span> : <span>Listening…</span>}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
