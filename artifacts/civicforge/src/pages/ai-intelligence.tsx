import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Bot,
  Building,
  CheckCircle2,
  CopyCheck,
  Flame,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useAnalyseReport, type AnalyseReportResponse } from "../lib/jansamvad-api";
import { AiAnalysisPanel } from "../components/AiAnalysisPanel";
import { DuplicateMatchCard } from "../components/DuplicateMatchCard";

const SAMPLE_INPUTS = [
  {
    title: "DAV School Road Khadda (Hinglish)",
    text: "DAV school ke samne road par bada khadda hai, do log gir chuke hain",
    location: "DAV School, Bariatu Road, Ranchi",
  },
  {
    title: "Doranda Water Pipeline Burst",
    text: "Drinking water pipe burst near Doranda bazaar, water flooding street since morning",
    location: "Doranda, Ranchi",
  },
  {
    title: "11kV Sparks Harmu Colony",
    text: "High voltage 11kV line sparking continuously next to residential transformer",
    location: "Harmu Housing Colony, Ranchi",
  },
  {
    title: "Commercial Spam Ad Test",
    text: "Earn money fast work from home click link bit.ly/easy-rupees-now",
    location: "Online",
  },
];

import { useLanguage } from "../lib/language-context";

export default function AiIntelligencePage() {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState("DAV school ke samne road par bada khadda hai, do log gir chuke hain");
  const [inputLocation, setInputLocation] = useState("DAV School, Bariatu Road, Ranchi");
  const [analysisResult, setAnalysisResult] = useState<AnalyseReportResponse | null>(null);

  const analyseMutation = useAnalyseReport();

  const handleRunDemo = async (textToRun?: string, locToRun?: string) => {
    const text = textToRun || inputText;
    const loc = locToRun || inputLocation;
    try {
      const res = await analyseMutation.mutateAsync({
        description: text,
        location: loc,
      });
      setAnalysisResult(res);
    } catch (err) {
      alert("AI analysis demo failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="mono-font rounded bg-[hsl(var(--primary)/.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">{t("ai.demoTitle")}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">• {t("ai.demoSubtitle")}</span>
        </div>
        <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">{t("ai.pageTitle")}</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{t("ai.pageDesc")}</p>
      </div>

      {/* 4 Core Pillars */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 01 Spam Intelligence */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="mono-font text-xs font-black text-red-600">{t("ai.pillar1")}</span>
            <ShieldCheck size={18} className="text-red-500" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("ai.pillar1Title")}</h3>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{t("ai.pillar1Desc")}</p>
          <div className="mt-4 border-t border-[hsl(var(--border)/.6)] pt-3">
            <span className="mono-font text-xs font-black text-red-600">73 spam blocked</span>
            <span className="text-[10px] text-stone-500 block">{t("home.reportsToday")}</span>
          </div>
        </div>

        {/* 02 Semantic De-duplication */}
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="mono-font text-xs font-black text-amber-700 dark:text-amber-300">{t("ai.pillar2")}</span>
            <CopyCheck size={18} className="text-amber-600" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("ai.pillar2Title")}</h3>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{t("ai.pillar2Desc")}</p>
          <div className="mt-4 border-t border-amber-500/30 pt-3">
            <span className="mono-font text-xs font-black text-amber-700 dark:text-amber-300">318 duplicates merged</span>
            <span className="text-[10px] text-stone-500 block">{t("ai.pillar2Title")}</span>
          </div>
        </div>

        {/* 03 Smart Routing */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="mono-font text-xs font-black text-indigo-600">{t("ai.pillar3")}</span>
            <Building size={18} className="text-indigo-600" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("ai.pillar3Title")}</h3>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{t("ai.pillar3Desc")}</p>
          <div className="mt-4 border-t border-[hsl(var(--border)/.6)] pt-3">
            <span className="mono-font text-xs font-black text-indigo-600">94.2% accuracy</span>
            <span className="text-[10px] text-stone-500 block">{t("ai.pillar3Title")}</span>
          </div>
        </div>

        {/* 04 Priority Intelligence */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="mono-font text-xs font-black text-emerald-600">{t("ai.pillar4")}</span>
            <Sparkles size={18} className="text-emerald-600" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[hsl(var(--foreground))]">{t("ai.pillar4Title")}</h3>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{t("ai.pillar4Desc")}</p>
          <div className="mt-4 border-t border-[hsl(var(--border)/.6)] pt-3">
            <span className="mono-font text-xs font-black text-emerald-600">31 critical triaged</span>
            <span className="text-[10px] text-stone-500 block">{t("ai.pillar4Title")}</span>
          </div>
        </div>
      </div>

      {/* Mathematical Formula Explainability Card */}
      <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">{t("ai.formulaTitle")}</h3>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          {t("ai.formulaTitle")}
        </p>

        <div className="mt-3 overflow-x-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-4">
          <code className="mono-font text-xs font-bold text-[hsl(var(--foreground))] whitespace-nowrap">
            PriorityScore = (SeverityWeight × 0.30) + (CitizenReportsVolume × 0.25) + (SensitiveLocationProximity × 0.20) + (TimeElapsedUnresolved × 0.15) + (RepeatReports × 0.10)
          </code>
        </div>
      </div>

      {/* INTERACTIVE LIVE AI DEMO WORKBENCH */}
      <div className="mt-10 rounded-2xl border-2 border-[hsl(var(--primary))] bg-[hsl(var(--card))] p-6 sm:p-8 shadow-[8px_8px_0_hsl(var(--foreground)/.1)]">
        <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md">
            <Bot size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[hsl(var(--foreground))]">{t("ai.demoWorkbench")}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("ai.demoWorkbenchDesc")}</p>
          </div>
        </div>

        {/* Preset Sample Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {SAMPLE_INPUTS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(s.text);
                setInputLocation(s.location);
                handleRunDemo(s.text, s.location);
              }}
              className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-1.5 text-xs font-bold text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Input Textarea & Trigger */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-[hsl(var(--muted-foreground))]">
              {t("report.descriptionLabel")}
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[hsl(var(--muted-foreground))]">
              Location / Landmark
            </label>
            <input
              type="text"
              value={inputLocation}
              onChange={(e) => setInputLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleRunDemo()}
              disabled={analyseMutation.isPending || !inputText.trim()}
              className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] p-3 text-xs font-black text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5"
            >
              {analyseMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />{t("ai.running")}</>
              ) : (
                <>
                  <Sparkles size={14} />{t("ai.runEngine")}</>
              )}
            </button>
          </div>
        </div>

        {/* Live Result Rendering */}
        {analysisResult && (
          <div className="mt-8 space-y-6 border-t border-[hsl(var(--border))] pt-6 animate-in fade-in">
            {/* Duplicate candidate card if found */}
            {analysisResult.duplicateMatches && analysisResult.duplicateMatches.length > 0 && (
              <DuplicateMatchCard
                match={analysisResult.duplicateMatches[0]}
                onSupport={() => alert("Demo mode: Citizen support links report and increments report count.")}
                onCreateSeparate={() => alert("Demo mode: Created separate ticket.")}
              />
            )}

            {/* AI Technical Breakdown Panel */}
            <AiAnalysisPanel
              analysis={{
                isSpam: analysisResult.spamScore >= 60,
                spamScore: analysisResult.spamScore,
                detectedCategory: analysisResult.detectedCategory as any,
                categoryConfidence: analysisResult.categoryConfidence,
                detectedLanguage: analysisResult.detectedLanguage,
                severity: analysisResult.severity as any,
                priority: analysisResult.priority as any,
                priorityScore: analysisResult.priorityScore,
                department: analysisResult.department,
                scoreBreakdown: analysisResult.scoreBreakdown,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
