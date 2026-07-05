"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Scale,
  Clock,
  Mic,
  ArrowRight,
  Loader2,
  Shield,
  Zap,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRACTICE_AREAS } from "@/lib/questions";
import { toast } from "sonner";

interface LandingProps {
  onStart: (responseId: string, answers: Record<string, string>) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Landing({ onStart }: LandingProps) {
  const [email, setEmail] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [city, setCity] = useState("");
  const [yearsOfPractice, setYearsOfPractice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [leadId, setLeadId] = useState<string | null>(null);
  const leadIdRef = useRef<string | null>(null);
  leadIdRef.current = leadId;

  useEffect(() => {
    const savedId = localStorage.getItem("jurivon_response_id");
    if (!savedId) return;
    void checkResume(savedId);
  }, []);

  const checkResume = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) {
        localStorage.removeItem("jurivon_response_id");
        return;
      }
      const data = await res.json();
      if (!data.response) return;

      const r = data.response;
      setEmail(r.email || "");
      setPracticeArea(r.practiceArea || "");
      setCity(r.city || "");
      setYearsOfPractice(r.yearsOfPractice || "");

      setLeadId(r.id);
      leadIdRef.current = r.id;

      if (r.completed) return;
      if (r.started) {
        toast.info(`Welcome back — picking up where you left off.`, {
          duration: 4000,
          action: {
            label: "Resume survey",
            onClick: () => {
              let answers: Record<string, string> = {};
              try {
                answers = JSON.parse(r.answers || "{}");
              } catch {
                answers = {};
              }
              onStart(r.id, answers);
            },
          },
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!email.trim() || !EMAIL_RE.test(email)) return;
    const t = setTimeout(() => {
      void saveLead();
    }, 1000);
    return () => clearTimeout(t);
  }, [email, practiceArea, city, yearsOfPractice]);

  const saveLead = async () => {
    try {
      if (leadIdRef.current) {
        await fetch(`/api/responses/${leadIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practiceArea: practiceArea || null,
            city: city || null,
            yearsOfPractice: yearsOfPractice || null,
          }),
        });
      } else {
        const res = await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            practiceArea: practiceArea || null,
            city: city || null,
            yearsOfPractice: yearsOfPractice || null,
            started: false,
          }),
        });
        const data = await res.json();
        if (data.response) {
          setLeadId(data.response.id);
          leadIdRef.current = data.response.id;
          localStorage.setItem("jurivon_response_id", data.response.id);
        }
      }
    } catch {
      // silent
    }
  };

  const submit = async () => {
    if (!email.trim() || !practiceArea) {
      toast.error("Please add your email and practice area to begin.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      toast.error("That email doesn't look right.");
      return;
    }
    setSubmitting(true);
    try {
      if (leadIdRef.current) {
        await fetch(`/api/responses/${leadIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            started: true,
            practiceArea,
            city: city || null,
            yearsOfPractice: yearsOfPractice || null,
          }),
        });
        onStart(leadIdRef.current, {});
      } else {
        const res = await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            practiceArea,
            city,
            yearsOfPractice,
            started: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        localStorage.setItem("jurivon_response_id", data.response.id);
        onStart(data.response.id, {});
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar — glassmorphism */}
      <header className="sticky top-0 z-30 glass border-b border-white/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shadow-macos-sm">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-[15px] leading-none tracking-tight">
                JurivonAI
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                Research intake
              </div>
            </div>
          </div>
          <a
            href="#admin"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-black/5"
          >
            Internal
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/60 text-[11px] font-medium text-foreground/80 mb-6 shadow-macos-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] animate-soft-pulse" />
            8-minute lawyer interview · 23 questions · confidential
          </div>

          <h1 className="text-[2.25rem] sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-5 leading-[1.05]">
            We're building the legal AI tool
            <br />
            <span className="text-gradient-blue">Pakistani lawyers actually want.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tell us what frustrates you about legal research, drafting, and the tools you
            already use. Your raw, unfiltered answers shape what we build.
          </p>
        </div>

        {/* Bento grid layout — mixed card sizes */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-10">
          {/* Main intake card — spans 8 cols on desktop, 12 on mobile */}
          <div className="col-span-12 lg:col-span-8 glass-strong rounded-[22px] shadow-macos-md p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-6 w-6 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-[#0A84FF]" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Start your interview</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-foreground/80">
                  Work email <span className="text-[#FF453A]">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="advocate@firm.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-[#D2D2D7] bg-white/70 focus-visible:ring-[#0A84FF]/30 focus-visible:border-[#0A84FF] transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-foreground/80">
                  Primary practice area <span className="text-[#FF453A]">*</span>
                </Label>
                <Select value={practiceArea} onValueChange={setPracticeArea}>
                  <SelectTrigger className="h-11 rounded-xl border-[#D2D2D7] bg-white/70">
                    <SelectValue placeholder="Choose your area" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PRACTICE_AREAS.map((area) => (
                      <SelectItem key={area} value={area} className="rounded-lg">
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-[13px] font-medium text-foreground/80">
                  City <span className="text-muted-foreground text-[11px]">(optional)</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Karachi, Lahore, Islamabad…"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 rounded-xl border-[#D2D2D7] bg-white/70 focus-visible:ring-[#0A84FF]/30 focus-visible:border-[#0A84FF] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="years" className="text-[13px] font-medium text-foreground/80">
                  Years of practice <span className="text-muted-foreground text-[11px]">(optional)</span>
                </Label>
                <Input
                  id="years"
                  placeholder="e.g. 7"
                  value={yearsOfPractice}
                  onChange={(e) => setYearsOfPractice(e.target.value)}
                  className="h-11 rounded-xl border-[#D2D2D7] bg-white/70 focus-visible:ring-[#0A84FF]/30 focus-visible:border-[#0A84FF] transition-all"
                />
              </div>
            </div>

            <Button
              onClick={submit}
              disabled={submitting}
              size="lg"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/90 hover:from-[#0A84FF] hover:to-[#0A84FF] text-white font-medium shadow-macos-sm press-scale transition-all gap-2"
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

            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Auto-saves as you type. You can leave and resume anytime.
            </p>
          </div>

          {/* Right column — 3 stacked bento cards */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <BentoCard
              icon={<Clock className="h-4 w-4" />}
              accent="#0A84FF"
              title="~8 minutes"
              subtitle="One question at a time. No endless scroll."
            />
            <BentoCard
              icon={<Mic className="h-4 w-4" />}
              accent="#BF5AF2"
              title="Voice answers OK"
              subtitle="Tap the mic and talk — Chrome / Safari / Edge."
            />
            <BentoCard
              icon={<Shield className="h-4 w-4" />}
              accent="#30D158"
              title="100% confidential"
              subtitle="No public attribution. Quotes used internally only."
            />
          </div>
        </div>

        {/* Stats row — small bento cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatBento icon={<FileText className="h-4 w-4" />} value="23" label="Deep questions" />
          <StatBento icon={<TrendingUp className="h-4 w-4" />} value="5" label="Sections" />
          <StatBento icon={<Mic className="h-4 w-4" />} value="∞" label="Voice minutes" />
          <StatBento icon={<Shield className="h-4 w-4" />} value="0" label="Public shares" />
        </div>
      </main>

      <footer className="border-t border-[#D2D2D7]/60 glass mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
          JurivonAI · Building legal AI for Pakistani lawyers
        </div>
      </footer>
    </div>
  );
}

function BentoCard({
  icon,
  accent,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="glass rounded-[18px] p-4 sm:p-5 hover-lift animate-fade-in"
      style={{ animationDelay: "100ms" }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${accent}15`, color: accent }}
      >
        {icon}
      </div>
      <div className="font-semibold text-[13px] text-foreground mb-0.5">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-snug">{subtitle}</div>
    </div>
  );
}

function StatBento({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 hover-lift">
      <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-gradient">{value}</div>
    </div>
  );
}
