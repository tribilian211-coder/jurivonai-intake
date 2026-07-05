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

  useEffect(() => {
    if (currentQuestion) {
      setDraft(answers[currentQuestion.id] ?? "");
    }
  }, [currentQuestion, answers]);

  useEffect(() => {
    if (!currentQuestion) return;
    const t = setTimeout(() => {
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

  if (!currentQuestion) return null;

  const progressPct =
    visibleQuestions.length > 0
      ? Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)
      : 0;

  const isLast = currentIndex === visibleQuestions.length - 1;
  const charCount = draft.trim().length;
  const meetsMin = currentQuestion.minLength ? charCount >= currentQuestion.minLength : true;

  return (
    <div className="min-h-screen flex flex-col">
      {/* macOS-style window chrome top bar */}
      <header className="sticky top-0 z-30 glass border-b border-white/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-2 mr-2">
            <span className="traffic-light traffic-red" />
            <span className="traffic-light traffic-yellow" />
            <span className="traffic-light traffic-green" />
          </div>
          <div className="flex-1 max-w-md mx-auto">
            <Progress value={progressPct} className="h-1 bg-[#ECECEC]" />
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums font-medium">
            {currentIndex + 1}/{visibleQuestions.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
          >
            <Flag className="h-3 w-3 mr-1" />
            Save & exit
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 flex-1 animate-fade-in" key={currentQuestion.id}>
          {/* Section badge */}
          <div className="mb-5 flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 border-[#D2D2D7] bg-white/70 text-[11px] font-medium"
            >
              Section {currentQuestion.section} — {currentQuestion.sectionTitle}
            </Badge>
          </div>

          {/* Question */}
          <h1 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-[-0.02em] text-foreground mb-2 leading-tight">
            {currentQuestion.prompt}
          </h1>
          {currentQuestion.hint && (
            <p className="text-sm text-muted-foreground italic mb-7 leading-relaxed">
              {currentQuestion.hint}
            </p>
          )}

          {/* Answer area — glass card */}
          <div className="glass-strong rounded-[22px] shadow-macos-md p-5 sm:p-6 space-y-3">
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your answer, or use voice input below…"
              className="min-h-[180px] sm:min-h-[220px] text-[15px] leading-relaxed resize-y border-transparent bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  goNext();
                }
              }}
            />

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#D2D2D7]/60">
              <VoiceRecorder initialText={draft} onTranscript={(text) => setDraft(text)} lang="en-PK" />
              <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                {charCount} chars
                {!meetsMin && currentQuestion.minLength ? (
                  <span className="text-[#FF9F0A] ml-2">· aim for {currentQuestion.minLength}+</span>
                ) : null}
              </span>
            </div>
          </div>

          {/* Save status */}
          <div className="mt-3 h-4 text-[11px] text-muted-foreground flex items-center gap-2">
            {saving ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF9F0A] animate-soft-pulse" />
                Saving…
              </>
            ) : savedAt ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                Saved · {savedAt.toLocaleTimeString()}
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Auto-saves as you type
              </>
            )}
          </div>
        </div>

        {/* Bottom nav — floating glass bar */}
        <footer className="sticky bottom-0 z-20 glass border-t border-white/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-xl press-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                className="text-muted-foreground rounded-xl press-scale"
              >
                <SkipForward className="h-3.5 w-3.5 mr-1" />
                Skip
              </Button>
              {isLast ? (
                <Button
                  onClick={goNext}
                  className="bg-gradient-to-r from-[#30D158] to-[#30D158]/90 hover:from-[#30D158] hover:to-[#30D158] text-white rounded-xl gap-1.5 press-scale shadow-macos-sm"
                >
                  <Check className="h-4 w-4" />
                  Submit responses
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  className="bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/90 hover:from-[#0A84FF] hover:to-[#0A84FF] text-white rounded-xl gap-1.5 press-scale shadow-macos-sm"
                >
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
