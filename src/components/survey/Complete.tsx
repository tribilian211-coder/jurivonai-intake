"use client";

import { Check, Scale, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteProps {
  email: string;
  onRestart: () => void;
}

export function Complete({ email, onRestart }: CompleteProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full animate-scale-in">
        {/* macOS-style modal card */}
        <div className="glass-strong rounded-[22px] shadow-macos-lg p-8 text-center">
          {/* Success icon with gradient */}
          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-[#30D158] to-[#30D158]/80 flex items-center justify-center mb-5 shadow-macos-sm">
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            Thank you.
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed text-[15px]">
            Your answers are now in our research database. We read every word — the verbatim way
            you described your frustrations is exactly what shapes what we build next.
          </p>

          {/* Next steps — frosted card */}
          <div className="glass rounded-2xl p-4 mb-6 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-[#0A84FF]" />
              </div>
              <div className="text-[13px]">
                <div className="font-semibold text-foreground mb-0.5">What happens next</div>
                <p className="text-muted-foreground leading-relaxed">
                  We'll email{" "}
                  <span className="font-mono text-foreground/80 text-[12px]">{email || "you"}</span>{" "}
                  when early-access is ready. ~4–6 weeks.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#BF5AF2]/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#BF5AF2]" />
              </div>
              <div className="text-[13px]">
                <div className="font-semibold text-foreground mb-0.5">Want to go deeper?</div>
                <p className="text-muted-foreground leading-relaxed">
                  We'd love a 30-min call to walk through your answers. Reply to the confirmation
                  email.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onRestart}
            className="text-muted-foreground hover:text-foreground text-[13px] w-full rounded-xl"
          >
            Submit another response from a colleague
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-[11px] text-muted-foreground">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center">
            <Scale className="h-2.5 w-2.5 text-white" />
          </div>
          JurivonAI · Building legal AI for Pakistani lawyers
        </div>
      </div>
    </div>
  );
}
