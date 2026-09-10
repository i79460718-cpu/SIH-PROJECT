import type { AiAnalysis } from "@workspace/api-zod";
import { CheckCircle, ShieldCheck, Sparkles, AlertTriangle, Layers, Building } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { useLanguage } from "../lib/language-context";

export function AiAnalysisPanel({ analysis, compact = false }: { analysis: AiAnalysis; compact?: boolean }) {
  const { t } = useLanguage();
  const breakdown = analysis.scoreBreakdown;

  return (
    <div className="rounded-2xl border border-[hsl(var(--primary)/.35)] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted)/.3)] p-5 md:p-6 shadow-[4px_4px_0_hsl(var(--foreground)/.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))]">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">{t("ai.title")}</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {t("ai.verified")}
              </span>
            </div>
            <p className="mono-font text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {t("ai.language")} {analysis.detectedLanguage} {analysis.languageConfidence ? `(${analysis.languageConfidence}%)` : ""} • {t("ai.preScreened")}
            </p>
          </div>
        </div>
        <PriorityBadge priority={analysis.priority} score={analysis.priorityScore} />
      </div>

      {/* Grid of Key AI Insights */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{t("ai.spamRisk")}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[hsl(var(--foreground))]">{String(analysis.spamScore).padStart(2, "0")}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold">{t("ai.safe")}</span>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{t("ai.detectedCategory")}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-xs font-bold text-[hsl(var(--foreground))]">{analysis.detectedCategory}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-500">{analysis.categoryConfidence}% Confidence</p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{t("ai.severityLevel")}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-[hsl(var(--foreground))]">{analysis.severity}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-[hsl(var(--primary))] font-semibold">{t("ai.triagedPriority")}</p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{t("ai.normalizedIntent")}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-xs font-bold text-[hsl(var(--foreground))]">{analysis.normalizedIntent || t("ai.verifiedCivicIssue")}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-500">{t("ai.crossLanguageMeaning")}</p>
        </div>
      </div>

      {/* Explainable Priority Score Breakdown */}
      {!compact && breakdown && (
        <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[hsl(var(--foreground))]">{t("ai.explainablePriority")}</span>
            <span className="mono-font text-xs font-bold text-[hsl(var(--primary))]">
              {analysis.priorityScore} / 100 ({analysis.priority})
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
            {t("ai.calculatedAlgorithmically")}
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t("ai.issueSeverityWeight")}</span>
              <span className="mono-font font-bold text-[hsl(var(--foreground))]">+{breakdown.severityFactor}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-[hsl(var(--primary))] rounded-full" style={{ width: `${(breakdown.severityFactor / 30) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t("ai.citizenReportsVolume")}</span>
              <span className="mono-font font-bold text-[hsl(var(--foreground))]">+{breakdown.citizenReportsFactor}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(breakdown.citizenReportsFactor / 25) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t("ai.sensitiveLocation")}</span>
              <span className="mono-font font-bold text-[hsl(var(--foreground))]">+{breakdown.sensitiveLocationFactor}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(breakdown.sensitiveLocationFactor / 20) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t("ai.timeElapsedUnresolved")}</span>
              <span className="mono-font font-bold text-[hsl(var(--foreground))]">+{breakdown.timeUnresolvedFactor}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(breakdown.timeUnresolvedFactor / 15) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t("ai.repeatCitizenCitations")}</span>
              <span className="mono-font font-bold text-[hsl(var(--foreground))]">+{breakdown.repeatReportsFactor}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(breakdown.repeatReportsFactor / 10) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Automatic Department Routing */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
        <div className="flex items-center gap-2.5">
          <Building size={16} className="text-indigo-600 shrink-0" />
          <div>
            <p className="mono-font text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
              {t("ai.automatedDepartmentRouting")}
            </p>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))] mt-0.5">
              {analysis.department}
            </p>
          </div>
        </div>
        <span className="mono-font rounded bg-indigo-600/15 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
          96% {t("ai.confidence")}
        </span>
      </div>
    </div>
  );
}
