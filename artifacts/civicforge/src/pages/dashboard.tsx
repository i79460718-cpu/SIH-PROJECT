import { useMemo } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  CopyCheck,
  Flame,
  HardHat,
  Layers,
  MapPin,
  Plus,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardSummary, useDepartments, useIssues, useOfficers } from "../lib/jansamvad-api";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingBlock, ErrorBlock } from "../components/civic-shell";

const RESOLUTION_TREND_DATA = [
  { day: "Mon", incoming: 210, resolved: 175 },
  { day: "Tue", incoming: 240, resolved: 198 },
  { day: "Wed", incoming: 195, resolved: 184 },
  { day: "Thu", incoming: 280, resolved: 232 },
  { day: "Fri", incoming: 310, resolved: 265 },
  { day: "Sat", incoming: 180, resolved: 190 },
  { day: "Sun", incoming: 155, resolved: 160 },
];

const CATEGORY_DISTRIBUTION = [
  { name: "Roads", count: 98, color: "#d97706" },
  { name: "Water", count: 64, color: "#0284c7" },
  { name: "Electric", count: 42, color: "#eab308" },
  { name: "Sanitation", count: 31, color: "#059669" },
  { name: "Public Safety", count: 12, color: "#dc2626" },
];

const DISTRICT_DATA = [
  { district: "Ranchi", issues: 84 },
  { district: "Jamshedpur", issues: 58 },
  { district: "Dhanbad", issues: 43 },
  { district: "Bokaro", issues: 32 },
  { district: "Deoghar", issues: 21 },
  { district: "Hazaribagh", issues: 19 },
];

export default function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useDashboardSummary();
  const { data: issues, isLoading: isIssuesLoading } = useIssues();
  const { data: officers } = useOfficers();
  const { data: departments } = useDepartments();

  // Top ranked issues by Priority Score
  const rankedIssues = useMemo(() => {
    return [...(issues || [])].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  }, [issues]);

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-[hsl(var(--border))] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono-font rounded bg-[hsl(var(--primary)/.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
              GOVERNMENT OF JHARKHAND
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              • Department Command Center
            </span>
          </div>
          <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            Civic Grievance Intelligence Command
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Real-time inter-departmental visibility into incoming citizen complaints, duplicate clustering, and field resolution SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/issues"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            All Live Issues <ArrowRight size={13} />
          </Link>
          <Link
            href="/report"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-black text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))]"
          >
            <Plus size={14} /> New Grievance
          </Link>
        </div>
      </div>

      {/* Top 5 High-Impact Metric Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
          <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
            Open Issues
          </p>
          <p className="display-font mt-2 text-3xl font-extrabold text-[hsl(var(--foreground))]">
            {summary?.openIssues ?? 248}
          </p>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Across 24 districts</p>
        </div>

        <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-4 shadow-sm">
          <p className="mono-font text-[10px] uppercase font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
            <Flame size={12} className="text-red-600" />
            Critical Priority
          </p>
          <p className="display-font mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
            {summary?.criticalIssues ?? 31}
          </p>
          <p className="mt-1 text-[11px] text-red-700/80 dark:text-red-300/80">Immediate hazard flag</p>
        </div>

        <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4 shadow-sm">
          <p className="mono-font text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-600" />
            High Priority
          </p>
          <p className="display-font mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400">
            {summary?.highIssues ?? 78}
          </p>
          <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80">Under active assignment</p>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
          <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <HardHat size={12} className="text-emerald-600" />
            Active Officers
          </p>
          <p className="display-font mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary?.activeOfficers ?? 102}
          </p>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Deployed on field</p>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
          <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <CheckCircle2 size={12} className="text-blue-600" />
            SLA Compliance
          </p>
          <p className="display-font mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary?.slaCompliance ?? 86.4}%
          </p>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Resolved within target</p>
        </div>
      </div>

      {/* Analytics Visualizers Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Resolution Trend Chart (7 cols) */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                7-Day Grievance Resolution Trend
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Incoming citizen complaints vs. verified on-ground closures
              </p>
            </div>
            <span className="mono-font text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              +14% efficiency
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RESOLUTION_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="incoming" stroke="#d97706" fillOpacity={1} fill="url(#colorIncoming)" strokeWidth={2} name="Incoming Reports" />
                <Area type="monotone" dataKey="resolved" stroke="#059669" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} name="Verified Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Load Breakdown (5 cols) */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                Active Issues by District
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Top municipal headquarters workload
              </p>
            </div>
            <span className="mono-font text-[10px] text-[hsl(var(--muted-foreground))]">
              Jharkhand GIS
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DISTRICT_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="district" type="category" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="issues" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Open Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Ranked Queue & Officer Allocation */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* AI Ranked Priority Queue (7 cols) */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                AI Triaged High-Priority Queue
              </h3>
            </div>
            <span className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--primary))]">
              Ranked by Urgency & Impact
            </span>
          </div>

          <div className="mt-4 divide-y divide-[hsl(var(--border)/.6)]">
            {isIssuesLoading ? (
              <p className="py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                Loading priority queue...
              </p>
            ) : rankedIssues.length === 0 ? (
              <p className="py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No active issues in the triaged queue.
              </p>
            ) : (
              rankedIssues.map((issue) => (
                <div key={issue.id} className="py-3.5 first:pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="mono-font rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold text-[hsl(var(--foreground))]">
                        {issue.publicId}
                      </span>
                      <PriorityBadge priority={issue.priority} score={issue.priorityScore} />
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-[hsl(var(--foreground))] line-clamp-1 hover:text-[hsl(var(--primary))]">
                    <Link href={`/issues/${issue.publicId}`}>{issue.title}</Link>
                  </h4>

                  <div className="mt-1.5 flex flex-wrap items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <MapPin size={11} className="text-[hsl(var(--primary))] shrink-0" />
                      {issue.locationText}
                    </span>
                    <span className="font-bold text-[hsl(var(--foreground))]">
                      {issue.reportCount} reports ({issue.duplicateCount} merged)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-[hsl(var(--border)/.6)] pt-3 text-right">
            <Link
              href="/issues"
              className="text-xs font-bold text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
            >
              View complete priority queue <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Officer Allocation Overview (5 cols) */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div className="flex items-center gap-2">
              <HardHat size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                Field Officer Allocation
              </h3>
            </div>
            <Link href="/officer" className="text-xs font-bold text-[hsl(var(--primary))] hover:underline">
              Open Portal →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[hsl(var(--border)/.6)]">
            {officers?.map((officer) => (
              <div key={officer.id} className="py-3 first:pt-1 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[hsl(var(--foreground))]">{officer.name}</h4>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {officer.designation} • {officer.district}
                  </p>
                  <p className="text-[10px] text-stone-500">{officer.department}</p>
                </div>
                <div className="text-right">
                  <span className="mono-font rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {officer.activeTasks} Active Tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
