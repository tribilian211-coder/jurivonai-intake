"use client";

import { useState, useEffect } from "react";
import { Mail, Scale, Clock, Mic, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRACTICE_AREAS } from "@/lib/questions";
import { toast } from "sonner";

interface LandingProps {
  onStart: (responseId: string, answers: Record<string, string>) => void;
}

export function Landing({ onStart }: LandingProps) {
  const [email, setEmail] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [city, setCity] = useState("");
  const [yearsOfPractice, setYearsOfPractice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check for an existing in-progress response (localStorage resume)
  useEffect(() => {
    const savedId = localStorage.getItem("jurivon_response_id");
    if (savedId) {
      // Offer resume — but don't force it; let user start fresh if they want
      // We do this by pre-filling nothing, just showing a banner via toast once
      void checkResume(savedId);
    }
  }, []);

  const checkResume = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) {
        localStorage.removeItem("jurivon_response_id");
        return;
      }
      const data = await res.json();
      if (data.response && !data.response.completed) {
        toast.info(`Welcome back — picking up where you left off.`, {
          duration: 3000,
          action: {
            label: "Resume",
            onClick: () => onStart(data.response.id, data.response.answers || {}),
          },
        });
      }
    } catch {
      // ignore
    }
  };

  const submit = async () => {
    if (!email.trim() || !practiceArea) {
      toast.error("Please add your email and practice area to begin.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("That email doesn't look right.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, practiceArea, city, yearsOfPractice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      localStorage.setItem("jurivon_response_id", data.response.id);
      let answers: Record<string, string> = {};
      try {
        answers = JSON.parse(data.response.answers || "{}");
      } catch {
        answers = {};
      }
      onStart(data.response.id, answers);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-stone-900 text-white flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <div className="font-serif text-lg leading-none">JurivonAI</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Research intake
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero + intake form */}
      <main className="flex-1 flex flex-col">
        <section className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-medium mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              8-minute lawyer interview · 23 questions · confidential
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-stone-900 mb-4 leading-tight">
              We're building the legal AI tool<br />Pakistani lawyers actually want.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tell us what frustrates you about legal research, drafting, and the tools you already use.
              Your raw, unfiltered answers shape what we build. In return — early access to JurivonAI
              and a summary of what 50+ lawyers told us.
            </p>
          </div>

          {/* Intake card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-stone-700">
                  Work email <span className="text-rose-600">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="advocate@firm.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-stone-700">
                  Primary practice area <span className="text-rose-600">*</span>
                </Label>
                <Select value={practiceArea} onValueChange={setPracticeArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your area" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRACTICE_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-stone-700">
                  City <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Karachi, Lahore, Islamabad…"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="years" className="text-stone-700">
                  Years of practice <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="years"
                  placeholder="e.g. 7"
                  value={yearsOfPractice}
                  onChange={(e) => setYearsOfPractice(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={submit}
              disabled={submitting}
              size="lg"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white gap-2 h-12"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Begin interview
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              We auto-save your progress. You can leave and resume anytime.
            </p>
          </div>

          {/* What to expect */}
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <Clock className="h-5 w-5 text-stone-700 mb-2" />
              <div className="font-medium text-stone-900 text-sm">~8 minutes</div>
              <div className="text-xs text-muted-foreground">One question at a time. No endless scroll.</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <Mic className="h-5 w-5 text-stone-700 mb-2" />
              <div className="font-medium text-stone-900 text-sm">Voice answers OK</div>
              <div className="text-xs text-muted-foreground">Tap the mic and talk — Chrome / Safari / Edge.</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <Scale className="h-5 w-5 text-stone-700 mb-2" />
              <div className="font-medium text-stone-900 text-sm">100% confidential</div>
              <div className="text-xs text-muted-foreground">No public attribution. Quotes used internally only.</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
          JurivonAI · Building legal AI for Pakistani lawyers · <a href="#admin" className="underline hover:text-stone-700">Internal</a>
        </div>
      </footer>
    </div>
  );
}
