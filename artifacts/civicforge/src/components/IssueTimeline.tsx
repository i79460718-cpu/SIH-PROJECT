import type { TimelineItem } from "@workspace/api-zod";
import { Bot, Building2, CheckCircle2, HardHat, User, Sparkles, ExternalLink } from "lucide-react";

export function IssueTimeline({ items }: { items: TimelineItem[] }) {
  function getActorBadge(actor: TimelineItem["actor"]) {
    switch (actor) {
      case "Citizen":
        return {
          icon: User,
          label: "Citizen",
          badgeClass: "bg-blue-500/10 text-blue-700 border-blue-400/40 dark:text-blue-300",
          nodeClass: "bg-blue-500 text-white",
        };
      case "AI/System":
        return {
          icon: Sparkles,
          label: "AI / System Engine",
          badgeClass: "bg-purple-500/10 text-purple-700 border-purple-400/40 dark:text-purple-300",
          nodeClass: "bg-purple-600 text-white",
        };
      case "Department":
        return {
          icon: Building2,
          label: "Department",
          badgeClass: "bg-amber-500/10 text-amber-800 border-amber-400/40 dark:text-amber-300",
          nodeClass: "bg-amber-600 text-white",
        };
      case "Field Officer":
        return {
          icon: HardHat,
          label: "Field Officer",
          badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-400/40 dark:text-emerald-300",
          nodeClass: "bg-emerald-600 text-white",
        };
      default:
        return {
          icon: CheckCircle2,
          label: actor,
          badgeClass: "bg-stone-500/10 text-stone-700 border-stone-300",
          nodeClass: "bg-stone-600 text-white",
        };
    }
  }

  return (
    <div className="relative pl-6 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-0.5 before:bg-[hsl(var(--border))]">
      <div className="space-y-6">
        {items.map((item, idx) => {
          const { icon: Icon, label, badgeClass, nodeClass } = getActorBadge(item.actor);
          const isLatest = idx === items.length - 1;

          return (
            <div key={item.id || idx} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative -left-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-[hsl(var(--background))] ${nodeClass}`}>
                <Icon size={14} />
              </div>

              {/* Content box */}
              <div className="flex-1 -ml-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                      {item.title}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-semibold ${badgeClass}`}>
                      {label}
                    </span>
                  </div>
                  <span className="mono-font text-[11px] text-[hsl(var(--muted-foreground))]">
                    {item.date ? `${item.date}, ` : ""}{item.time}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {item.description}
                </p>

                {item.evidenceUrl && (
                  <div className="mt-2.5">
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))] hover:underline"
                    >
                      <ExternalLink size={12} />
                      View uploaded photo evidence
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
