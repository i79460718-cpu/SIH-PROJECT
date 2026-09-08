import type { Priority } from "@workspace/api-zod";
import { AlertCircle, AlertTriangle, Flame, ShieldAlert } from "lucide-react";
import { useLanguage } from "../lib/language-context";

export function PriorityBadge({ priority, score, showScore = true }: { priority: Priority; score?: number; showScore?: boolean }) {
  const { t } = useLanguage();

  switch (priority) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          <Flame size={12} className="text-red-600" />
          <span>{t(`priority.${priority}`)}</span>
          {showScore && score !== undefined && (
            <span className="mono-font ml-0.5 rounded bg-red-600/20 px-1 py-0.2 text-[10px] font-semibold">{score}</span>
          )}
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <AlertTriangle size={12} className="text-amber-600" />
          <span>{t(`priority.${priority}`)}</span>
          {showScore && score !== undefined && (
            <span className="mono-font ml-0.5 rounded bg-amber-600/20 px-1 py-0.2 text-[10px] font-semibold">{score}</span>
          )}
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-600/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-800 dark:text-yellow-200">
          <AlertCircle size={12} className="text-yellow-600" />
          <span>{t(`priority.${priority}`)}</span>
          {showScore && score !== undefined && (
            <span className="mono-font ml-0.5 rounded bg-yellow-600/20 px-1 py-0.2 text-[10px] font-medium">{score}</span>
          )}
        </span>
      );
    case "LOW":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <ShieldAlert size={12} className="text-emerald-600" />
          <span>{t(`priority.${priority}`)}</span>
          {showScore && score !== undefined && (
            <span className="mono-font ml-0.5 rounded bg-emerald-600/20 px-1 py-0.2 text-[10px]">{score}</span>
          )}
        </span>
      );
  }
}
