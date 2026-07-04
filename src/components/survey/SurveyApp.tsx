"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, SkipForward, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VoiceRecorder } from "./VoiceRecorder";
import { QUESTIONS, getVisibleQuestions, type Question } from "@/lib/questions";
import { toast } from "sonner";

interface SurveyAppProps {
  responseId: string;
  initialAnswers: Record<string, string>;
  initialQuestionIndex?: number;
  onComplete: () => void;
  onExit: () => void;
}

export function SurveyApp({
  responseId,
  initialAnswers,
  initialQuestionIndex = 0,
  onComplete,
  onExit,
}: SurveyAppProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [draft, setDraft] = useState<string>(initialAnswers[QUESTIONS[0]?.id] ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const currentQuestion: Question | undefined = visibleQuestions[currentIndex];

  // Keep draft synced when question changes
  useEffect(() => {
    if (currentQuestion) {
      setDraft(answers[currentQuestion.id] ?? "");
    }
  }, [currentQuestion, answers]);

  // Auto-save draft after 1s of inactivity (debounced)
  useEffect(() => {
    if (!currentQuestion) return;
    const t = setTimeout(() => {
      // Only auto-save if there's actually a change
      if (draft !== (answers[currentQuestion.id] ?? "")) {
        void saveAnswer(draft, false);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [draft, currentQuestion]);

  const saveAnswer = useCallback(
    async (text: string, showToast: boolean) => {
      if (!currentQuestion) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/responses/${responseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            answer: text,
            currentSection: currentQuestion.section,
            currentQuestion: currentIndex,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
        setSavedAt(new Date());
        if (showToast) toast.success("Saved");
      } catch {
        if (showToast) toast.error("Couldn't save — try again");
      } finally {
        setSaving(false);
      }
    },
    [currentQuestion, responseId, currentIndex]
  );

  const goNext = useCallback(() => {
    if (!currentQuestion) return;
    // Save current answer (forced) then advance
    void saveAnswer(draft, false);
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      void markComplete();
    }
  }, [currentQuestion, saveAnswer, draft, currentIndex, visibleQuestions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      void saveAnswer(draft, false);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, draft, saveAnswer]);

  const skip = useCallback(() => {
    if (!currentQuestion) return;
    setDraft("");
    void saveAnswer("", false);
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      void markComplete();
    }
  }, [currentQuestion, saveAnswer, currentIndex, visibleQuestions.length]);

  const markComplete = useCallback(async () => {
    try {
      const res = await fetch(`/api/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error("complete failed");
      toast.success("Thank you! Your responses have been recorded.");
      onComplete();
    } catch {
      toast.error("Couldn't submit — please try again");
    }
  }, [responseId, onComplete]);

  if (!currentQuestion) {
    return null;
  }

  const progressPct =
    visibleQuestions.length > 0
      ? Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)
      : 0;

  const isLast = currentIndex === visibleQuestions.length - 1;
  const charCount = draft.trim().length;
  const meetsMin = currentQuestion.minLength
    ? charCount >= currentQuestion.minLength
    : true;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Top bar: progress + exit */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <Progress value={progressPct} className="h-1.5" />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
            {currentIndex + 1} / {visibleQuestions.length}
          </span>
          <Button variant="ghost" size="sm" onClick={onExit} className="text-muted-foreground">
            <Flag className="h-3.5 w-3.5 mr-1" />
            Save & exit
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
          {/* Section badge */}
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 border-stone-300 bg-stone-100 text-stone-700">
              Section {currentQuestion.section} — {currentQuestion.sectionTitle}
            </Badge>
          </div>

          {/* Question */}
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-stone-900 leading-snug mb-2">
            {currentQuestion.prompt}
          </h1>
          {currentQuestion.hint && (
            <p className="text-sm text-muted-foreground italic mb-6">{currentQuestion.hint}</p>
          )}

          {/* Answer area */}
          <div className="space-y-3">
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your answer, or use voice input below…"
              className="min-h-[180px] sm:min-h-[220px] text-base leading-relaxed resize-y border-stone-200 focus-visible:ring-stone-400"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  goNext();
                }
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <VoiceRecorder
                initialText={draft}
                onTranscript={(text) => setDraft(text)}
                lang="en-PK"
              />
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                {charCount} chars
                {!meetsMin && currentQuestion.minLength ? (
                  <span className="text-amber-600 ml-2">· aim for {currentQuestion.minLength}+</span>
                ) : null}
              </span>
            </div>
          </div>

          {/* Save status */}
          <div className="mt-2 h-4 text-xs text-muted-foreground">
            {saving
              ? "Saving…"
              : savedAt
                ? `Saved · ${savedAt.toLocaleTimeString()}`
                : "Auto-saves as you type"}
          </div>
        </div>

        {/* Bottom nav */}
        <footer className="border-t bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
                <SkipForward className="h-3.5 w-3.5 mr-1" />
                Skip
              </Button>
              {isLast ? (
                <Button onClick={goNext} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
                  <Check className="h-4 w-4" />
                  Submit responses
                </Button>
              ) : (
                <Button onClick={goNext} className="bg-stone-900 hover:bg-stone-800 text-white gap-1.5">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
