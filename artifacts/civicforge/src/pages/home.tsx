import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  CopyCheck,
  Eye,
  FileSearch,
  Filter,
  Flame,
  HardHat,
  Layers,
  MapPin,
  Plus,
  Radio,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useDashboardSummary, useIssues } from "../lib/jansamvad-api";
import { useLanguage } from "../lib/language-context";
import { IssueCard } from "../components/IssueCard";
import { TrackComplaintDialog } from "../components/TrackComplaintDialog";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/civic-shell";

const CATEGORY_FILTERS = ["All", "Road Infrastructure", "Water Supply", "Electricity", "Sanitation", "Public Safety"];

export default function Home() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [trackOpen, setTrackOpen] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: issues, isLoading: isIssuesLoading, isError, error: issuesError, refetch } = useIssues({
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: search ? search : undefined,
  });

  const visibleIssues = useMemo(() => {
    return issues || [];
  }, [issues]);

  return (
    <div>
      {/* HERO SECTION */}
      <section className="surface-grid relative overflow-hidden border-b border-[hsl(var(--border))]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[38px] border-[hsl(var(--accent)/.3)] animate-drift md:h-[420px] md:w-[420px]" />
        <div className="pointer-events-none absolute bottom-[-80px] left-[35%] h-64 w-64 rounded-full border border-[hsl(var(--primary)/.2)]" />

        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_.9fr] md:items-center md:px-8 md:pb-20 md:pt-16">
          {/* Left Column: Heading & CTAs */}
          <div className="relative z-10 animate-rise">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-0.5 w-8 bg-[hsl(var(--primary))]" />
              <span className="mono-font text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--primary))]">
                {t("hero.subtitle")}
              </span>
            </div>

            <h1 className="display-font text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.93] tracking-[-.05em] text-[hsl(var(--foreground))] text-balance font-extrabold">
              {t("hero.title1")}<br />
              {t("hero.title2")}<br />
              <span className="text-[hsl(var(--primary))]">{t("hero.title3")}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] md:text-lg">
              {t("hero.desc")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/report"
                data-testid="hero-cta-report"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-black text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_hsl(var(--foreground))]"
              >
                <Plus size={16} />
                {t("hero.cta.report")}
              </Link>

              <button
                type="button"
                onClick={() => setTrackOpen(true)}
                data-testid="hero-cta-track"
                className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-[hsl(var(--foreground))] bg-[hsl(var(--background))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--foreground))] shadow-[3px_3px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--muted))]"
              >
                <Search size={16} className="text-[hsl(var(--primary))]" />
                {t("hero.cta.track")}
              </button>

              <Link
                href="/map"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <MapPin size={14} className="text-[hsl(var(--primary))]" />
                {t("hero.viewMap")}
              </Link>
            </div>

            {/* Quick Demo Trigger banner for Judges */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>
                <strong>{t("hero.quicktest")}</strong> {t("hero.quicktest.desc")}
              </span>
              <Link href="/ai-intelligence" className="font-bold underline ml-1">
                {t("hero.openAiDemo")}
              </Link>
            </div>
          </div>

          {/* Right Column: LIVE SYSTEM Intelligence Panel */}
          <div className="relative z-10 animate-rise animate-rise-1">
            <div className="rounded-2xl border-2 border-[hsl(var(--foreground))] bg-[hsl(var(--card))] p-6 text-[hsl(var(--foreground))] shadow-[10px_10px_0_hsl(var(--primary))] md:max-w-[440px] md:ml-auto">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="mono-font text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                    {t("home.sysIntel")}
                  </span>
                </div>
                <span className="mono-font rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {t("home.aiActive")}
                </span>
              </div>

              {/* Real-time stats grid */}
              <div className="mt-5 grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3.5">
                  <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                    {t("home.reportsToday")}
                  </p>
                  <p className="display-font mt-1 text-2xl font-black text-[hsl(var(--foreground))]">
                    {summary?.reportsReceived ?? 0}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{t("metric.reportsReceived.sub")}</p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <p className="mono-font text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                    {t("home.dupMerged")}
                  </p>
                  <p className="display-font mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">
                    {summary?.duplicatesMerged ?? 0}
                  </p>
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">{t("metric.duplicatesMerged.sub")}</p>
                </div>

                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                  <p className="mono-font text-[10px] uppercase font-bold text-red-800 dark:text-red-300">
                    {t("home.spamPrevented")}
                  </p>
                  <p className="display-font mt-1 text-2xl font-black text-red-600 dark:text-red-400">
                    {summary?.spamBlocked ?? 0}
                  </p>
                  <p className="text-[10px] text-red-700/80 dark:text-red-300/80 mt-0.5">{t("metric.spamBlocked.sub")}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <p className="mono-font text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    {t("home.issuesResolved")}
                  </p>
                  <p className="display-font mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {summary?.resolvedToday ?? 0}
                  </p>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">{t("metric.resolvedToday.sub")}</p>
                </div>
              </div>

              {/* Active Tri-Party Pipeline status */}
              <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
                  <span>{t("metric.officersOnline")}</span>
                  <span className="mono-font font-bold text-[hsl(var(--foreground))]">{summary?.activeOfficers ?? 0} Active</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
                  <span>{t("metric.avgDispatch")}</span>
                  <span className="mono-font font-bold text-emerald-600">Live data</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="mono-font text-[10px] text-[hsl(var(--muted-foreground))] uppercase">
                  {t("home.grievanceNet")}
                </span>
                <Link
                  href="/issues"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] hover:underline"
                >
                  {t("home.viewQueue")} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM METRICS STRIP */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-y-6 px-5 py-7 md:grid-cols-5 md:px-8">
          <div className="border-l px-4 first:border-l-0 border-[hsl(var(--primary))] md:px-6">
            <div className="display-font text-3xl font-extrabold tracking-[-.05em] text-[hsl(var(--primary))] md:text-4xl">
              {summary?.reportsReceived ?? 0}
            </div>
            <div className="mono-font mt-1 text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {t("metric.reportsReceived")}
            </div>
          </div>

          <div className="border-l px-4 border-[hsl(var(--border))] md:px-6">
            <div className="display-font text-3xl font-extrabold tracking-[-.05em] text-amber-600 md:text-4xl">
              {summary?.duplicatesMerged ?? 0}
            </div>
            <div className="mono-font mt-1 text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {t("metric.duplicatesMerged")}
            </div>
          </div>

          <div className="border-l px-4 border-[hsl(var(--border))] md:px-6">
            <div className="display-font text-3xl font-extrabold tracking-[-.05em] text-red-600 md:text-4xl">
              {summary?.spamBlocked ?? 0}
            </div>
            <div className="mono-font mt-1 text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {t("metric.spamBlocked")}
            </div>
          </div>

          <div className="border-l px-4 border-[hsl(var(--border))] md:px-6">
            <div className="display-font text-3xl font-extrabold tracking-[-.05em] text-emerald-600 md:text-4xl">
              {summary?.resolvedToday ?? 0}
            </div>
            <div className="mono-font mt-1 text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {t("metric.resolvedToday")}
            </div>
          </div>

          <div className="border-l px-4 border-[hsl(var(--border))] md:px-6">
            <div className="display-font text-3xl font-extrabold tracking-[-.05em] text-[hsl(var(--foreground))] md:text-4xl">
              {summary?.resolutionRate ?? 0}%
            </div>
            <div className="mono-font mt-1 text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {t("metric.resolutionRate")}
            </div>
          </div>
        </div>
      </section>

      {/* 20-SECOND VISUAL EXPLANATION: HOW IT MOVES (SIH WORKFLOW) */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] py-16 md:py-20">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="mono-font text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))] font-bold">
                {t("home.pipeline")}
              </p>
              <h2 className="display-font mt-2 text-3xl font-extrabold tracking-[-.04em] md:text-5xl">
                {t("home.pipelineTitle")}
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t("home.pipelineDesc")}
            </p>
          </div>

          {/* Interactive Stepper Pipeline */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:border-[hsl(var(--primary))] hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="mono-font text-xs font-extrabold text-[hsl(var(--primary))]">{t("pipeline.stage1")}</span>
                <Users size={18} className="text-blue-600" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("pipeline.stage1.title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("home.step1Desc")}
              </p>
              <div className="mt-4 rounded-lg bg-[hsl(var(--muted)/.6)] p-2 text-[11px] font-medium text-stone-600 dark:text-stone-300">
                {t("home.step1Tag")}
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="mono-font text-xs font-extrabold text-amber-700 dark:text-amber-300">{t("pipeline.stage2")}</span>
                <CopyCheck size={18} className="text-amber-600" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("pipeline.stage2.title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("home.step2Desc")}
              </p>
              <div className="mt-4 rounded-lg bg-amber-500/20 p-2 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                {t("home.step2Tag")}
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:border-[hsl(var(--primary))] hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="mono-font text-xs font-extrabold text-indigo-600">{t("pipeline.stage3")}</span>
                <Send size={18} className="text-indigo-600" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("pipeline.stage3.title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("home.step3Desc")}
              </p>
              <div className="mt-4 rounded-lg bg-[hsl(var(--muted)/.6)] p-2 text-[11px] font-medium text-stone-600 dark:text-stone-300">
                {t("home.step3Tag")}
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="mono-font text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{t("pipeline.stage4")}</span>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("pipeline.stage4.title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("home.step4Desc")}
              </p>
              <div className="mt-4 rounded-lg bg-emerald-500/20 p-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                {t("home.step4Tag")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE ISSUES WORKBENCH */}
      <section id="issues" className="mx-auto max-w-[1320px] px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mono-font text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))] font-bold">
              {t("home.activeQueue")}
            </p>
            <h2 className="display-font mt-2 text-3xl font-extrabold tracking-[-.04em] md:text-5xl">
              {t("home.liveGrievances")}
            </h2>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                className="focus-ring w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2 pl-9 pr-4 text-xs font-medium outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-1.5">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Issue Cards Grid */}
        {isIssuesLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <LoadingBlock label={t("home.retrieving")} />
          </div>
        ) : isError ? (
          <div className="mt-10">
            <ErrorBlock
              label={issuesError instanceof Error ? issuesError.message : t("home.failRetrieve")}
              onRetry={() => refetch()}
            />
          </div>
        ) : visibleIssues.length === 0 ? (
          <div className="mt-10">
            <EmptyBlock
              title={t("home.noMatch")}
              detail={t("home.tryAnother")}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <div>
            <h4 className="text-base font-bold text-[hsl(var(--foreground))]">{t("geo.title")}</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {t("home.geoDesc")}
            </p>
          </div>
          <Link
            href="/map"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--foreground))] px-4 py-2 text-xs font-bold text-[hsl(var(--background))] hover:opacity-90"
          >
            <MapPin size={14} /> {t("home.openMap")}
          </Link>
        </div>
      </section>

      {/* Global Track Dialog */}
      <TrackComplaintDialog open={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}
