import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { CopyCheck, MapPin, Users, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface DuplicateMatchCardProps {
  match: {
    issueId: string | number;
    publicId: string;
    title: string;
    similarityScore: number;
    location: string;
    reportCount: number;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
    status: any;
  };
  onSupport: (issueId: string | number) => void;
  onCreateSeparate: () => void;
  isSupporting?: boolean;
}

import { useLanguage } from "../lib/language-context";

export function DuplicateMatchCard({ match, onSupport, onCreateSeparate, isSupporting }: DuplicateMatchCardProps) {
  const { t } = useLanguage();
  const normPriority = (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(match.priority).toUpperCase())
    ? String(match.priority).toUpperCase()
    : "HIGH") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  return (
    <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/5 p-5 md:p-6 shadow-[5px_5px_0_hsl(var(--foreground)/.1)]">
      {/* Alert Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-[2px_2px_0_hsl(var(--foreground))]">
            <CopyCheck size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">{t("dup.title")}</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-800 dark:text-amber-300">
                {match.similarityScore}% {t("dup.similarity")}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("dup.desc")}</p>
          </div>
        </div>
      </div>

      {/* Target Issue Details */}
      <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="mono-font rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold text-[hsl(var(--foreground))]">
            {match.publicId}
          </span>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={normPriority} />
            <StatusBadge status={match.status} />
          </div>
        </div>

        <h4 className="mt-2.5 text-sm font-bold text-[hsl(var(--foreground))]">
          {match.title}
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[hsl(var(--primary))]" />
            {match.location}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[hsl(var(--foreground))]">
            <Users size={13} className="text-[hsl(var(--primary))]" /> {match.reportCount} {t("dup.linked")} </span>
        </div>
      </div>

      {/* Decision Guidance */}
      <div className="mt-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border)/.7)] p-3 text-xs text-[hsl(var(--muted-foreground))] flex items-start gap-2">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-[hsl(var(--foreground))]">{t("dup.recommendationTitle")}</strong>{t("dup.recommendationDesc")}</p>
      </div>

      {/* Tri-Party Action Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => onSupport(match.issueId)}
          disabled={isSupporting}
          className="focus-ring w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[3px_3px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_hsl(var(--foreground))]"
        >
          <Users size={16} />
          {isSupporting ? "Linking your report..." : "Support Existing Issue (Recommended)"}
        </button>

        <button
          type="button"
          onClick={onCreateSeparate}
          className="focus-ring w-full sm:w-auto rounded-full border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs font-bold text-[hsl(var(--foreground))] transition-all hover:bg-[hsl(var(--muted))]"
        >
          {t("dup.createSeparateBtn")}
        </button>
      </div>
    </div>
  );
}
