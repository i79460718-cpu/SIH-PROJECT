import { Link } from "wouter";
import type { Issue } from "@workspace/api-zod";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { ArrowRight, Building2, Droplets, Lightbulb, MapPin, Shield, Trash2, Truck, Users, Wrench } from "lucide-react";

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "Road Infrastructure":
      return Wrench;
    case "Water Supply":
      return Droplets;
    case "Electricity":
      return Lightbulb;
    case "Sanitation":
      return Trash2;
    case "Public Safety":
      return Shield;
    case "Public Transport":
      return Truck;
    default:
      return Building2;
  }
}

export function IssueCard({ issue }: { issue: Issue }) {
  const CatIcon = getCategoryIcon(issue.category);
  const isLive = issue.status === "Work Started" || issue.status === "Officer Assigned";

  return (
    <article
      id={`issue-card-${issue.publicId}`}
      data-testid={`card-issue-${issue.publicId}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[4px_4px_0_hsl(var(--foreground)/.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_hsl(var(--foreground)/.14)]"
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="mono-font rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.6)] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--foreground))]">
              {issue.publicId}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                Live on site
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={issue.priority} score={issue.priorityScore} />
            <StatusBadge status={issue.status} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3.5">
          <h3 className="line-clamp-2 text-base font-bold tracking-tight text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
            <Link href={`/issues/${issue.publicId}`} className="focus-ring focus:outline-none">
              {issue.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
            {issue.description}
          </p>
        </div>

        {/* Location & Department */}
        <div className="mt-4 space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-[hsl(var(--primary))]" />
            <span className="truncate">{issue.locationText}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CatIcon size={13} className="shrink-0 text-[hsl(var(--accent))]" />
            <span className="truncate font-medium text-[hsl(var(--foreground)/.85)]">{issue.department}</span>
          </div>
        </div>
      </div>

      {/* Footer Metrics & Action */}
      <div className="mt-5 border-t border-[hsl(var(--border)/.7)] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-[hsl(var(--foreground))]">
              <Users size={13} className="text-[hsl(var(--primary))]" />
              {issue.reportCount} {issue.reportCount === 1 ? "report" : "reports"}
            </span>
            {issue.duplicateCount > 0 && (
              <span className="mono-font rounded bg-[hsl(var(--accent)/.2)] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--foreground))]">
                +{issue.duplicateCount} merged
              </span>
            )}
          </div>
          <Link
            href={`/issues/${issue.publicId}`}
            className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] transition-transform group-hover:translate-x-1"
          >
            Track Issue
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
