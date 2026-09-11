import {
  Activity,
  ArrowUpRight,
  Flame,
  Globe2,
  HardHat,
  Layers,
  MapPin,
  Menu,
  Plus,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "../lib/language-context";
import { TrackComplaintDialog } from "./TrackComplaintDialog";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useDashboardSummary } from "../lib/jansamvad-api";
import { useAuth } from "../lib/auth-context";

export function CivicShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const { t } = useLanguage();
  const { role, setLoginModalOpen } = useAuth();
  const { data: summary } = useDashboardSummary();

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: Layers },
    { href: "/report", label: t("nav.report"), icon: Plus },
    { href: "/issues", label: t("nav.issues"), icon: ShieldAlert },
    { href: "/map", label: t("nav.map"), icon: MapPin },
    { href: "/ai-intelligence", label: t("nav.ai"), icon: Sparkles },
    { href: "/officer", label: t("nav.officer"), icon: HardHat },
    { href: "/university", label: t("nav.university"), icon: Users },
    { href: "/industry", label: t("nav.industry"), icon: Wrench },
  ];

  return (
    <div className="noise-layer min-h-[100dvh] flex flex-col justify-between">
      {/* Top Emergency & AI Notification Strip */}
      <div className="border-b border-amber-600/30 bg-[hsl(var(--foreground))] px-4 py-1.5 text-xs text-[hsl(var(--background))]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-400">{t("top.ai_online")}</span>
            <span className="hidden text-[hsl(var(--background)/.7)] sm:inline">
              {t("top.ai_desc")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--background)/.8)]">
            {summary ? (
              <>
                <span>{summary.openIssues} open</span>
                <span className="hidden md:inline">{summary.resolutionRate}% resolved</span>
                <span className="hidden lg:inline">{summary.activeOfficers} officers active</span>
              </>
            ) : (
              <span className="opacity-60">Syncing live data…</span>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border)/.8)] bg-[hsl(var(--background)/.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" data-testid="link-brand" className="focus-ring group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--foreground))] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-3deg]">
              <span className="display-font text-[24px] font-bold leading-none">J</span>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[hsl(var(--accent))] ring-2 ring-[hsl(var(--background))]" />
            </span>
            <span className="leading-tight">
              <span className="block text-[18px] font-black tracking-[-.03em] text-[hsl(var(--foreground))]">
                JANSAMVAD AI
              </span>
              <span className="mono-font block text-[9px] font-semibold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                {t("app.brand")}
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 xl:gap-1.5 lg:flex" aria-label="Primary navigation">
            {navItems.filter(({ href }) => href !== "/report").map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`focus-ring group flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                  location === href
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-[2px_2px_0_hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.6)] px-3 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              {role === "officer" ? <HardHat size={13} /> : <Users size={13} />}
              {role === "officer" ? "Officer Mode" : role === "admin" ? "Admin HQ" : "Role / Portal"}
            </button>
            {/* Prominent Track Complaint Action */}
            <button
              type="button"
              onClick={() => setTrackOpen(true)}
              data-testid="button-track-complaint-header"
              className="focus-ring group flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-bold text-[hsl(var(--foreground))] shadow-sm transition-all hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"
            >
              <Search size={14} className="text-[hsl(var(--primary))]" />
              {t("nav.track")}
            </button>

            {/* Primary Report CTA */}
            <Link
              href="/report"
              data-testid="link-submit-header"
              className="focus-ring group flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-black text-[hsl(var(--primary-foreground))] shadow-[3px_3px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_hsl(var(--foreground))]"
            >
              <Plus size={15} />
              {t("nav.report")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setTrackOpen(true)}
              className="rounded-full p-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              aria-label="Track Complaint"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              data-testid="button-toggle-menu"
              onClick={() => setOpen((value) => !value)}
              className="focus-ring rounded-full p-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {open && (
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-4 lg:hidden animate-in slide-in-from-top-2 duration-150">
            <div className="grid gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  data-testid={`link-mobile-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold ${
                    location === href
                      ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                      : "hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  <Icon size={16} /> {label}
                </Link>
              ))}

              <div className="mt-3 grid gap-2 border-t border-[hsl(var(--border))] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setTrackOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 font-bold"
                >
                  <Search size={16} className="text-[hsl(var(--primary))]" /> {t("nav.track")}
                </button>

                <Link
                  href="/report"
                  onClick={() => setOpen(false)}
                  data-testid="link-mobile-submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2.5 font-black text-[hsl(var(--primary-foreground))]"
                >
                  <Plus size={16} /> {t("nav.report")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 md:grid-cols-[1.6fr_1fr_1fr] md:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] display-font text-xl font-bold">
                J
              </span>
              <span className="font-extrabold text-lg tracking-tight">JANSAMVAD AI</span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-5 text-[hsl(var(--background)/.7)]">
              {t("footer.motto")}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="mono-font rounded bg-white/10 px-2 py-0.5 text-[10px] text-emerald-400">
                {t("footer.ai_status")}
              </span>
            </div>
          </div>

          <div className="text-xs">
            <p className="mono-font mb-3 text-[10px] uppercase tracking-[.2em] text-[hsl(var(--background)/.45)]">
              {t("footer.portals")}
            </p>
            <div className="grid gap-2 text-[hsl(var(--background)/.8)]">
              <Link href="/issues" className="hover:text-[hsl(var(--accent))]">
                {t("footer.link.issues")}
              </Link>
              <Link href="/map" className="hover:text-[hsl(var(--accent))]">
                {t("footer.link.map")}
              </Link>
              <Link href="/ai-intelligence" className="hover:text-[hsl(var(--accent))]">
                {t("footer.link.ai")}
              </Link>
              <Link href="/officer" className="hover:text-[hsl(var(--accent))]">
                {t("footer.link.officer")}
              </Link>
            </div>
          </div>

          <div className="text-xs">
            <p className="mono-font mb-3 text-[10px] uppercase tracking-[.2em] text-[hsl(var(--background)/.45)]">
              {t("footer.citizen")}
            </p>
            <div className="grid gap-2 text-[hsl(var(--background)/.8)]">
              <Link href="/report" className="flex items-center gap-1.5 hover:text-[hsl(var(--accent))]">
                {t("footer.link.report")} <ArrowUpRight size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setTrackOpen(true)}
                className="text-left hover:text-[hsl(var(--accent))]"
              >
                {t("footer.link.track")}
              </button>
              <span className="text-[hsl(var(--background)/.5)]">
                {t("footer.demo")}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[hsl(var(--background)/.1)] px-5 py-4 text-center text-[10px] text-[hsl(var(--background)/.5)]">
          {t("footer.disclaimer")}
        </div>
      </footer>

      {/* Global Track Complaint Dialog */}
      <TrackComplaintDialog open={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}

export function LoadingBlock({ label = "Gathering latest civic intelligence..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center" data-testid="state-loading">
      <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-[hsl(var(--accent))]" />
      <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}

export function ErrorBlock({
  onRetry,
  label = "We could not reach the grievance intelligence engine.",
}: {
  onRetry?: () => void;
  label?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.06)] p-8 text-center" data-testid="state-error">
      <Activity className="mx-auto mb-3 text-[hsl(var(--destructive))]" size={22} />
      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{label}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          data-testid="button-retry"
          className="mt-4 rounded-full bg-[hsl(var(--foreground))] px-4 py-2 text-xs font-bold text-[hsl(var(--background))]"
        >
          {t("action.tryAgain")}
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-10 text-center" data-testid="state-empty">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))]">
        <Sparkles size={18} />
      </div>
      <h3 className="display-font text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{detail}</p>
    </div>
  );
}
