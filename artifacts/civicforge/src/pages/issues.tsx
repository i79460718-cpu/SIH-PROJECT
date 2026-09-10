import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, Plus, MapPin, RefreshCw, AlertTriangle, Layers } from "lucide-react";
import { useIssues } from "../lib/jansamvad-api";
import { useLanguage } from "../lib/language-context";
import { IssueCard } from "../components/IssueCard";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/civic-shell";

const DISTRICTS = ["All", "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"];
const CATEGORIES = ["All", "Road Infrastructure", "Water Supply", "Electricity", "Sanitation", "Public Safety"];
const PRIORITIES = ["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["All", "Officer Assigned", "Work Started", "Resolved - Awaiting Verification", "Resolved"];

export default function IssuesPage() {
  const { t } = useLanguage();
  const [district, setDistrict] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  const { data: issues, isLoading, isError, error, refetch } = useIssues({
    district,
    category,
    priority,
    status,
    search,
  });

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono-font rounded bg-[hsl(var(--primary)/.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
              {t("issues.queue")}
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {t("issues.districts")}
            </span>
          </div>
          <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            {t("issues.title")}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{t("issues.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <MapPin size={14} className="text-[hsl(var(--primary))]" /> {t("issues.geoMap")}</Link>
          <Link
            href="/report"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-black text-[hsl(var(--primary-foreground))] shadow-[3px_3px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5"
          >
            <Plus size={15} /> {t("issues.reportIssue")}</Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t("issues.searchDesc")}</label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("issues.searchPlaceholder")}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-9 pr-3 text-xs outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>
          </div>

          {/* District Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t("issues.district")}</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Districts" : d}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t("issues.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t("issues.priority")}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All Priorities" : p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter summary count */}
        <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border)/.6)] pt-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>
            {t("issues.showing")} <strong>{issues?.length ?? 0}</strong> {t("issues.verifiedCivicIssues")}</span>
          {(district !== "All" || category !== "All" || priority !== "All" || status !== "All" || search) && (
            <button
              type="button"
              onClick={() => {
                setDistrict("All");
                setCategory("All");
                setPriority("All");
                setStatus("All");
                setSearch("");
              }}
              className="text-xs font-bold text-[hsl(var(--primary))] hover:underline"
            >{t("issues.resetFilters")}</button>
          )}
        </div>
      </div>

      {/* Issues Grid */}
      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingBlock label={t("issues.fetching")} />
        </div>
      ) : isError ? (
        <div className="mt-8">
          <ErrorBlock
            label={error instanceof Error ? error.message : t("issues.failRetrieve")}
            onRetry={() => refetch()}
          />
        </div>
      ) : issues?.length === 0 ? (
        <div className="mt-8">
          <EmptyBlock
            title={t("issues.noMatch")}
            detail={t("issues.tryAdjusting")}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {issues?.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
