"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Lock,
  Search,
  Download,
  ArrowLeft,
  Eye,
  Quote,
  X,
  RefreshCw,
  Scale,
  Inbox,
  Clock,
  Loader2,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-scale-in">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to survey
          </a>
          <div className="glass-strong rounded-[22px] p-7 shadow-macos-md">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center mb-4 shadow-macos-sm">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold mb-1 tracking-tight">JurivonAI Internal</h1>
            <p className="text-sm text-muted-foreground mb-5">Admin access only.</p>
            <div className="space-y-2">
              <Label htmlFor="pw" className="text-[13px] font-medium">
                Password
              </Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="Admin password"
                className="h-11 rounded-xl bg-white/70 border-[#D2D2D7] focus-visible:border-[#0A84FF] focus-visible:ring-[#0A84FF]/30"
              />
            </div>
            <Button
              onClick={login}
              disabled={loginLoading || !password}
              className="w-full mt-4 h-11 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/90 text-white font-medium press-scale shadow-macos-sm"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Checking…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              Set <code className="bg-[#ECECEC] px-1.5 py-0.5 rounded-md font-mono text-[10px]">ADMIN_PASSWORD</code>{" "}
              env var on Vercel.
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
  const [statusFilter, setStatusFilter] = useState("all");
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
    <div className="min-h-screen flex">
      {/* Sidebar — macOS style */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col glass border-r border-white/40 sticky top-0 h-screen">
        <div className="p-5 border-b border-[#D2D2D7]/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shadow-macos-sm">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-[13px] leading-tight">JurivonAI</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Internal
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <SidebarItem icon={<Inbox className="h-4 w-4" />} label="All responses" active />
          <SidebarItem icon={<Clock className="h-4 w-4" />} label="Just opened" count={stats.opened} />
          <SidebarItem icon={<Loader2 className="h-4 w-4" />} label="In progress" count={stats.inProgress} />
          <SidebarItem icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" count={stats.completed} />
        </nav>

        <div className="p-3 border-t border-[#D2D2D7]/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground rounded-lg text-[13px]"
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 glass border-b border-white/40">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile logo */}
              <div className="md:hidden h-8 w-8 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shrink-0">
                <Scale className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[14px] leading-tight truncate">Lawyer survey dashboard</div>
                <div className="text-[10px] text-muted-foreground">
                  {lastRefresh && <>Updated {lastRefresh.toLocaleTimeString()}</>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void load()}
                disabled={loading}
                className="rounded-lg press-scale"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="rounded-lg press-scale bg-white/70 border-[#D2D2D7]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout} className="md:hidden rounded-lg">
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 space-y-5">
          {/* Bento stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <StatCard
              icon={<Inbox className="h-4 w-4" />}
              accent="#8E8E93"
              label="Total leads"
              value={stats.total}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              accent="#8E8E93"
              label="Just opened"
              value={stats.opened}
            />
            <StatCard
              icon={<Loader2 className="h-4 w-4" />}
              accent="#FF9F0A"
              label="In progress"
              value={stats.inProgress}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              accent="#30D158"
              label="Completed"
              value={stats.completed}
            />
            <StatCard
              icon={<Percent className="h-4 w-4" />}
              accent="#0A84FF"
              label="Avg completion"
              value={`${stats.avgPct}%`}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {/* Filters bar — glass */}
          <div className="glass rounded-[18px] p-3 sm:p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Search verbatim answers
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="PakistanLawSite, deadline, Digilawyer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 rounded-xl bg-white/70 border-[#D2D2D7] focus-visible:border-[#0A84FF] focus-visible:ring-[#0A84FF]/30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Practice area
              </Label>
              <Select value={practiceArea} onValueChange={setPracticeArea}>
                <SelectTrigger className="w-[150px] sm:w-[180px] h-10 rounded-xl bg-white/70 border-[#D2D2D7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All areas</SelectItem>
                  {PRACTICE_AREAS.map((a) => (
                    <SelectItem key={a} value={a} className="rounded-lg">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] sm:w-[160px] h-10 rounded-xl bg-white/70 border-[#D2D2D7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="opened">Just opened</SelectItem>
                  <SelectItem value="inprogress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table — glass card */}
          <div className="glass rounded-[18px] overflow-hidden shadow-macos-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-[#D2D2D7]/60 hover:bg-transparent">
                  <TableHead className="w-[24px]"></TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Practice area
                  </TableHead>
                  <TableHead className="w-[160px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Progress
                  </TableHead>
                  <TableHead className="w-[110px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-[140px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hidden sm:table-cell">
                    Started
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No responses match your filters yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((r) => {
                    const statusInfo = r.completed
                      ? { dot: "bg-[#30D158]", label: "Complete", variant: "default" as const }
                      : r.started
                        ? { dot: "bg-[#FF9F0A]", label: "In progress", variant: "secondary" as const }
                        : { dot: "bg-[#8E8E93]", label: "Just opened", variant: "outline" as const };
                    return (
                      <TableRow
                        key={r.id}
                        className="hover:bg-white/50 cursor-pointer border-[#D2D2D7]/40 transition-colors"
                        onClick={() => setSelected(r)}
                      >
                        <TableCell>
                          <div className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                        </TableCell>
                        <TableCell className="font-mono text-[12px]">{r.email}</TableCell>
                        <TableCell>
                          {r.practiceArea ? (
                            <Badge variant="outline" className="font-normal rounded-full text-[11px]">
                              {r.practiceArea}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">— not selected</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={r.completionPct} className="h-1.5 flex-1 bg-[#ECECEC]" />
                            <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                              {r.completionPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="font-normal rounded-full text-[10px]">
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden sm:table-cell">
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

          <p className="text-[11px] text-muted-foreground px-1">
            Auto-refreshes every 30 seconds. "Just opened" = lawyer landed on the form and entered
            their email but hasn't clicked Begin yet.
          </p>
        </main>
      </div>

      {selected && <ResponseDetail response={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-[#0A84FF]/10 text-[#0A84FF] font-medium"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] tabular-nums bg-black/5 px-1.5 py-0.5 rounded-md">{count}</span>
      )}
    </button>
  );
}

function StatCard({
  icon,
  accent,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-4 hover-lift ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </div>
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ResponseDetail({ response, onClose }: { response: ResponseRow; onClose: () => void }) {
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white/95 backdrop-blur-xl w-full sm:max-w-2xl sm:rounded-[22px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-macos-xl animate-scale-in">
        {/* Header with traffic lights */}
        <div className="border-b border-[#D2D2D7]/60 p-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Traffic lights (decorative on mobile) */}
            <div className="hidden sm:flex items-center gap-1.5 mt-1.5">
              <span className="traffic-light traffic-red" />
              <span className="traffic-light traffic-yellow" />
              <span className="traffic-light traffic-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant={response.completed ? "default" : response.started ? "secondary" : "outline"}
                  className="rounded-full text-[10px]"
                >
                  {statusInfo}
                </Badge>
                {response.practiceArea && (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {response.practiceArea}
                  </Badge>
                )}
                {response.city && (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {response.city}
                  </Badge>
                )}
                {response.yearsOfPractice && (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {response.yearsOfPractice} yrs
                  </Badge>
                )}
              </div>
              <div className="font-mono text-[13px] text-foreground/80">{response.email}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                First seen {new Date(response.createdAt).toLocaleString()}
                {response.completedAt &&
                  ` · Completed ${new Date(response.completedAt).toLocaleString()}`}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {sectionsWithAnswers.map((section) => {
            const answeredInSection = section.questions.filter(
              (q) => response.answers[q.id] && response.answers[q.id].trim().length > 0
            );
            if (answeredInSection.length === 0) return null;

            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] text-white text-[10px] flex items-center justify-center font-semibold">
                    {section.id}
                  </div>
                  <h3 className="font-semibold text-[14px] text-foreground">{section.title}</h3>
                </div>
                <div className="space-y-2.5 pl-7">
                  {section.questions.map((q) => {
                    const answer = response.answers[q.id];
                    if (!answer || !answer.trim()) return null;
                    return (
                      <div
                        key={q.id}
                        className="bg-[#F5F5F7] border border-[#ECECEC] rounded-xl p-3.5"
                      >
                        <div className="text-[11px] text-muted-foreground mb-1.5 flex items-start gap-1.5">
                          <Quote className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{q.prompt}</span>
                        </div>
                        <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed pl-5">
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
