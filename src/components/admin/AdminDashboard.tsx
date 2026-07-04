"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Lock,
  Search,
  Download,
  ArrowLeft,
  Eye,
  TrendingUp,
  Quote,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PRACTICE_AREAS, QUESTIONS, SECTIONS } from "@/lib/questions";
import { toast } from "sonner";

interface ResponseRow {
  id: string;
  email: string;
  practiceArea: string | null;
  city: string | null;
  yearsOfPractice: string | null;
  started: boolean;
  completed: boolean;
  completionPct: number;
  answeredCount: number;
  totalQuestions: number;
  createdAt: string;
  completedAt: string | null;
  answers: Record<string, string>;
  currentSection: number;
}

const ADMIN_PASSWORD_KEY = "jurivon_admin_pw";

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // restore session
  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  const login = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        toast.error("Wrong password");
        return;
      }
      localStorage.setItem(ADMIN_PASSWORD_KEY, password);
      setAuthed(true);
      toast.success("Signed in");
    } catch {
      toast.error("Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_PASSWORD_KEY);
    setAuthed(false);
    setPassword("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <a href="#" className="text-sm text-muted-foreground hover:text-stone-700 inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to survey
          </a>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center mb-4">
              <Lock className="h-4 w-4" />
            </div>
            <h1 className="font-serif text-2xl mb-1">JurivonAI Internal</h1>
            <p className="text-sm text-muted-foreground mb-5">Admin access only.</p>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="Admin password"
              />
            </div>
            <Button onClick={login} disabled={loginLoading || !password} className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white">
              {loginLoading ? "Checking…" : "Sign in"}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              Set <code className="bg-stone-100 px-1 py-0.5 rounded">ADMIN_PASSWORD</code> env var in production.
              Default for dev: <code className="bg-stone-100 px-1 py-0.5 rounded">jurivon-internal-2026</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardInner password={password} onLogout={logout} />;
}

function DashboardInner({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [practiceArea, setPracticeArea] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all / completed / inprogress / opened
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (practiceArea !== "all") params.set("practiceArea", practiceArea);
      if (statusFilter === "completed") params.set("completed", "true");
      if (statusFilter === "inprogress") {
        params.set("started", "true");
        params.set("completed", "false");
      }
      if (statusFilter === "opened") {
        params.set("started", "false");
        params.set("completed", "false");
      }
      if (search) params.set("search", search);

      const res = await fetch(`/api/responses?${params.toString()}`, {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      setResponses(data.responses || []);
      setLastRefresh(new Date());
    } catch {
      toast.error("Failed to load responses");
    } finally {
      setLoading(false);
    }
  }, [password, practiceArea, statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh every 30s so admin sees new leads land in real time
  useEffect(() => {
    const interval = setInterval(() => {
      void load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const exportCsv = () => {
    fetch("/api/admin/export", { headers: { "x-admin-password": password } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jurivon-lawyer-survey-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const stats = {
    total: responses.length,
    completed: responses.filter((r) => r.completed).length,
    inProgress: responses.filter((r) => r.started && !r.completed).length,
    opened: responses.filter((r) => !r.started && !r.completed).length,
    avgPct: responses.length
      ? Math.round(responses.reduce((s, r) => s + r.completionPct, 0) / responses.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs font-serif">
              J
            </div>
            <div>
              <div className="font-serif leading-none">JurivonAI · Internal</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Lawyer survey dashboard
                {lastRefresh && (
                  <span className="ml-2 normal-case tracking-normal">
                    · Updated {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats — including "Just opened" leads */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total leads" value={stats.total} dotClass="bg-stone-400" />
          <StatCard label="Just opened" value={stats.opened} dotClass="bg-slate-400" />
          <StatCard label="In progress" value={stats.inProgress} dotClass="bg-amber-500" />
          <StatCard label="Completed" value={stats.completed} dotClass="bg-emerald-500" />
          <StatCard label="Avg completion" value={`${stats.avgPct}%`} />
        </div>

        {/* Filters */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">Search verbatim answers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. PakistanLawSite, deadline, Digilawyer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Practice area</Label>
            <Select value={practiceArea} onValueChange={setPracticeArea}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {PRACTICE_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="opened">Just opened</SelectItem>
                <SelectItem value="inprogress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Practice area</TableHead>
                <TableHead className="w-[180px]">Progress</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Started</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No responses match your filters yet.
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r) => {
                  const statusInfo = r.completed
                    ? { dot: "bg-emerald-500", label: "Complete", variant: "default" as const }
                    : r.started
                      ? { dot: "bg-amber-500", label: "In progress", variant: "secondary" as const }
                      : { dot: "bg-slate-400", label: "Just opened", variant: "outline" as const };
                  return (
                    <TableRow key={r.id} className="hover:bg-stone-50 cursor-pointer" onClick={() => setSelected(r)}>
                      <TableCell>
                        <div className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>
                        {r.practiceArea ? (
                          <Badge variant="outline" className="font-normal">{r.practiceArea}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">— not selected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={r.completionPct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {r.completionPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="font-normal">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground mt-3 px-1">
          Auto-refreshes every 30 seconds. "Just opened" = lawyer landed on the form and entered their email but hasn't clicked Begin yet.
        </p>
      </main>

      {selected && (
        <ResponseDetail
          response={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, dotClass }: { label: string; value: number | string; dotClass?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        {dotClass && <div className={`h-2 w-2 rounded-full ${dotClass}`} />}
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-2xl font-serif tabular-nums">{value}</div>
    </div>
  );
}

function ResponseDetail({ response, onClose }: { response: ResponseRow; onClose: () => void }) {
  // Group answers by section
  const sectionsWithAnswers = SECTIONS.map((s) => ({
    ...s,
    questions: QUESTIONS.filter((q) => q.section === s.id),
  }));

  const statusInfo = response.completed
    ? "Completed"
    : response.started
      ? "In progress"
      : "Just opened (hasn't clicked Begin yet)";

  return (
    <div className="fixed inset-0 bg-stone-900/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={response.completed ? "default" : response.started ? "secondary" : "outline"}>
                {statusInfo}
              </Badge>
              {response.practiceArea && <Badge variant="outline">{response.practiceArea}</Badge>}
              {response.city && <Badge variant="outline">{response.city}</Badge>}
              {response.yearsOfPractice && (
                <Badge variant="outline">{response.yearsOfPractice} yrs</Badge>
              )}
            </div>
            <div className="font-mono text-sm text-stone-700">{response.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              First seen {new Date(response.createdAt).toLocaleString()}
              {response.completedAt && ` · Completed ${new Date(response.completedAt).toLocaleString()}`}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body: all answers */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {sectionsWithAnswers.map((section) => {
            const answeredInSection = section.questions.filter(
              (q) => response.answers[q.id] && response.answers[q.id].trim().length > 0
            );
            if (answeredInSection.length === 0) return null;

            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                    {section.id}
                  </div>
                  <h3 className="font-serif text-base text-stone-900">{section.title}</h3>
                </div>
                <div className="space-y-3 pl-7">
                  {section.questions.map((q) => {
                    const answer = response.answers[q.id];
                    if (!answer || !answer.trim()) return null;
                    return (
                      <div key={q.id} className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                        <div className="text-xs text-stone-500 mb-1.5 flex items-start gap-1.5">
                          <Quote className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{q.prompt}</span>
                        </div>
                        <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed pl-5">
                          {answer}
                        </p>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          {answer.trim().length} chars
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {Object.keys(response.answers).length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {response.started
                ? "No answers yet — this lawyer just started."
                : "This lawyer opened the form but hasn't clicked Begin yet. Their intake info above is all we have."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
