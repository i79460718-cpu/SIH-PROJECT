import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Plus, Flame, ShieldAlert, Users, ArrowRight, Layers, Filter } from "lucide-react";
import { useIssues } from "../lib/jansamvad-api";
import { IssueMap } from "../components/IssueMap";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingBlock, ErrorBlock } from "../components/civic-shell";

const MAP_FILTERS = ["All", "Critical Only", "Road Infrastructure", "Water Supply", "Electricity", "Sanitation"];

export default function MapPage() {
  const [filter, setFilter] = useState("All");

  const { data: allIssues, isLoading, isError, refetch } = useIssues();

  const filteredIssues = (allIssues || []).filter((issue) => {
    if (filter === "Critical Only") return issue.priority === "CRITICAL";
    if (filter !== "All") return issue.category === filter;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono-font rounded bg-[hsl(var(--primary)/.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
              GIS GRIEVANCE INTELLIGENCE
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              • Jharkhand Geographic View
            </span>
          </div>
          <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            Jharkhand Civic Grievance Map
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Live geographic distribution with automatic spatial clustering, duplicate grouping, and field dispatch tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/report"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-black text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))]"
          >
            <Plus size={15} /> Report New Issue
          </Link>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--muted-foreground))] mr-1">
          <Filter size={13} /> Filter:
        </span>
        {MAP_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === f
                ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                : "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Map + Sidebar Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 min-h-[540px]">
          {isLoading ? (
            <div className="h-[540px] flex items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <LoadingBlock label="Initializing Jharkhand OpenStreetMap geospatial engine..." />
            </div>
          ) : isError ? (
            <div className="h-[540px] flex items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <ErrorBlock onRetry={() => refetch()} label="Failed to load map data." />
            </div>
          ) : (
            <IssueMap issues={filteredIssues} />
          )}
        </div>

        {/* Hotspot & Duplicate Clusters Sidebar (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-red-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                  Active Duplicate Clusters
                </h3>
              </div>
              <span className="mono-font text-[10px] text-[hsl(var(--muted-foreground))]">
                {filteredIssues.length} active issues
              </span>
            </div>

            <div className="mt-3 divide-y divide-[hsl(var(--border)/.6)]">
              {filteredIssues.length === 0 ? (
                <p className="py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                  No active issues found for this filter.
                </p>
              ) : (
                filteredIssues.map((issue) => (
                  <div key={issue.id} className="py-3 first:pt-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="mono-font text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                        {issue.publicId}
                      </span>
                      <PriorityBadge priority={issue.priority} showScore={false} />
                    </div>

                    <h4 className="mt-1 text-xs font-bold text-[hsl(var(--foreground))] line-clamp-1 hover:text-[hsl(var(--primary))]">
                      <Link href={`/issues/${issue.publicId}`}>{issue.title}</Link>
                    </h4>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin size={11} className="text-[hsl(var(--primary))] shrink-0" />
                        {issue.locationText}
                      </span>
                      <span className="font-bold text-[hsl(var(--foreground))] shrink-0">
                        {issue.reportCount} reports
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={issue.status} />
                      <Link
                        href={`/issues/${issue.publicId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--primary))] hover:underline"
                      >
                        Track <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
