import type { IssueStatus } from "@workspace/api-zod";
import { CheckCircle2, Clock, Eye, HardHat, RefreshCw, Send, ShieldCheck, UserCheck, AlertOctagon } from "lucide-react";
import { useLanguage } from "../lib/language-context";

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { t } = useLanguage();

  switch (status) {
    case "Reported":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-400/40 bg-stone-200/50 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          <Clock size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "AI Verified":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
          <ShieldCheck size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Routed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Send size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Officer Assigned":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <UserCheck size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Accepted":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
          <CheckCircle2 size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Work Started":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
          <HardHat size={12} className="animate-bounce" />
          {t(`status.${status}`)}
        </span>
      );
    case "Resolved - Awaiting Verification":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/50 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:text-purple-300">
          <Eye size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Resolved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 size={12} />
          {t(`status.${status}`)}
        </span>
      );
    case "Escalated":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-600/50 bg-red-600/15 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:text-red-300">
          <AlertOctagon size={12} />
          {t(`status.${status}`)}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          <RefreshCw size={12} />
          {status}
        </span>
      );
  }
}
