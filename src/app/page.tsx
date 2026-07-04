"use client";

import { useEffect, useState, useCallback } from "react";
import { Landing } from "@/components/survey/Landing";
import { SurveyApp } from "@/components/survey/SurveyApp";
import { Complete } from "@/components/survey/Complete";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

type View =
  | { name: "landing" }
  | { name: "survey"; responseId: string; answers: Record<string, string> }
  | { name: "complete"; email: string }
  | { name: "admin" };

export default function Home() {
  const [view, setView] = useState<View>({ name: "landing" });

  // Hash-based routing — only the / route exists, but #admin shows the dashboard.
  // This keeps the single-route constraint while letting us deep-link to admin.
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === "#admin") {
        setView({ name: "admin" });
      } else if (view.name === "admin") {
        setView({ name: "landing" });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const startSurvey = useCallback((responseId: string, answers: Record<string, string>) => {
    setView({ name: "survey", responseId, answers });
  }, []);

  const handleComplete = useCallback(async () => {
    // Find email from current view (we stored responseId; email is in the answers map's response)
    // Simpler: we already know the email from when we created the response — but we passed only responseId+answers.
    // So we'll just show complete screen without email personalization; that's fine.
    if (view.name === "survey") {
      // Fetch the email for personalization
      try {
        const res = await fetch(`/api/resumes/${view.responseId}`);
        const data = await res.json();
        setView({ name: "complete", email: data.response?.email || "" });
      } catch {
        setView({ name: "complete", email: "" });
      }
    } else {
      setView({ name: "complete", email: "" });
    }
  }, [view]);

  const handleExit = useCallback(() => {
    // Save & exit — back to landing
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    setView({ name: "landing" });
  }, []);

  const handleRestart = useCallback(() => {
    localStorage.removeItem("jurivon_response_id");
    setView({ name: "landing" });
  }, []);

  if (view.name === "admin") {
    return <AdminDashboard />;
  }

  if (view.name === "survey") {
    return (
      <SurveyApp
        responseId={view.responseId}
        initialAnswers={view.answers}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    );
  }

  if (view.name === "complete") {
    return <Complete email={view.email} onRestart={handleRestart} />;
  }

  return <Landing onStart={startSurvey} />;
}
