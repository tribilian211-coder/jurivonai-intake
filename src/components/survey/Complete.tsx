"use client";

import { Check, Scale, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteProps {
  email: string;
  onRestart: () => void;
}

export function Complete({ email, onRestart }: CompleteProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-emerald-700" />
          </div>
          <h1 className="font-serif text-3xl text-stone-900 mb-3">
            Thank you.
          </h1>
          <p className="text-stone-600 mb-6 leading-relaxed">
            Your answers are now in our research database. We read every word —
            the verbatim way you described your frustrations is exactly what
            shapes what we build next.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-stone-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-stone-900">What happens next</div>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                We'll email <span className="font-mono text-stone-700">{email}</span> when
                the early-access build of JurivonAI is ready. Expect a first
                invite within 4–6 weeks.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Scale className="h-4 w-4 text-stone-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-stone-900">Want to go deeper?</div>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                We'd love a 30-minute call to walk through your answers. Reply to
                the confirmation email and we'll set it up.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onRestart} className="text-muted-foreground">
            Submit another response from a colleague
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          JurivonAI · Building legal AI for Pakistani lawyers
        </p>
      </div>
    </div>
  );
}
