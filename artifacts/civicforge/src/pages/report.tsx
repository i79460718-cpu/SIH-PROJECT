import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../lib/language-context";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CopyCheck,
  Flame,
  Loader2,
  MapPin,
  Mic,
  Plus,
  Send,
  Sparkles,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAnalyseReport, useCreateIssue, useSupportIssue, type AnalyseReportResponse } from "../lib/jansamvad-api";
import { DuplicateMatchCard } from "../components/DuplicateMatchCard";
import { AiAnalysisPanel } from "../components/AiAnalysisPanel";
import { VoiceInput } from "../components/VoiceInput";

const PRESET_PROMPTS = [
  {
    label: "DAV School Pothole (Hinglish Duplicate Test)",
    text: "DAV school ke samne road par bada khadda hai, do log gir chuke hain",
    location: "DAV School, Bariatu Road, Ranchi",
    category: "Road Infrastructure",
  },
  {
    label: "Water Pipeline Burst Doranda",
    text: "Drinking water pipe burst near Doranda bazaar, water flooding street since morning",
    location: "Near Doranda Bazaar, Ranchi",
    category: "Water Supply",
  },
  {
    label: "Harmu Live Electric Wire Sparks",
    text: "High voltage wire hanging low and sparking near Harmu Housing Colony transformer",
    location: "Road No. 4, Harmu Housing Colony, Ranchi",
    category: "Electricity",
  },
  {
    label: "Garbage Overflow Jamshedpur",
    text: "Big municipal dustbin overflowing with foul smell near Sakchi market",
    location: "Sakchi Market, Jamshedpur",
    category: "Sanitation",
  },
];

export default function ReportPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("Let AI Detect");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent" | "Emergency">("Normal");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);

  // AI Pipeline Step State
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<AnalyseReportResponse | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const analyseMutation = useAnalyseReport();
  const createIssueMutation = useCreateIssue();
  const supportIssueMutation = useSupportIssue();

  // Simulate Current Location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setLocationText("Bariatu Road, Ranchi, Jharkhand 834009");
        },
        () => {
          setIsLocating(false);
          setLocationText("Main Road, Ranchi, Jharkhand 834001");
        },
        { timeout: 3000 }
      );
    } else {
      setIsLocating(false);
      setLocationText("Ranchi Central, Jharkhand");
    }
  };

  // Voice Dictation
  // Handled by VoiceInput component

  // Simulate Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submission & Analysis Workflow
  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (!photoUrl) {
      alert("Supporting evidence (photo or video) is required to submit a challenge.");
      return;
    }

    setIsAnalysing(true);
    setAnalysisStep(1);

    // Multi-step animated progress simulation
    setTimeout(() => setAnalysisStep(2), 500);
    setTimeout(() => setAnalysisStep(3), 900);
    setTimeout(() => setAnalysisStep(4), 1300);

    try {
      const result = await analyseMutation.mutateAsync({
        description,
        location: locationText || "Ranchi, Jharkhand",
        category: category === "Let AI Detect" ? undefined : category,
        urgency,
      });

      setAnalysisStep(5);
      setAnalysisResult(result);
      setIsAnalysing(false);

      // If no duplicate matches, automatically create or prompt
      if (!result.duplicateMatches || result.duplicateMatches.length === 0) {
        handleProceedCreate(result);
      }
    } catch (err) {
      setIsAnalysing(false);
      setAnalysisStep(0);
      alert("AI triage service temporarily unavailable. Proceeding with standard priority.");
    }
  };

  // Create Issue
  const handleProceedCreate = async (analysisData?: AnalyseReportResponse) => {
    const currentAnalysis = analysisData || analysisResult;
    try {
      const newIssue = await createIssueMutation.mutateAsync({
        title: description.slice(0, 75).trim() + (description.length > 75 ? "..." : ""),
        description,
        category: (currentAnalysis?.detectedCategory as any) || "Road Infrastructure",
        district: locationText.toLowerCase().includes("jamshedpur") ? "Jamshedpur" : "Ranchi",
        locationText: locationText || "Ranchi, Jharkhand",
        latitude: 23.375,
        longitude: 85.335,
        evidenceUrl: photoUrl || undefined,
        urgency,
      });

      setLocation(`/issues/${newIssue.publicId}`);
    } catch (err) {
      console.error("[CreateIssue] Error:", err);
      alert(err instanceof Error ? err.message : "Failed to submit issue to Supabase. Please try again.");
    }
  };

  // Support Existing Issue
  const handleSupportExisting = async (issueId: string | number) => {
    try {
      const result = await supportIssueMutation.mutateAsync({
        issueId,
        input: {
          comment: description,
          evidenceUrl: photoUrl || undefined,
          citizenName: "Resident Citizen",
        },
      });
      setLocation(`/issues/${result.issue.publicId}`);
    } catch (err) {
      alert("Failed to link your report to the existing issue.");
    }
  };

  const topDuplicate = analysisResult?.duplicateMatches?.[0];

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Title & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="mono-font rounded-md bg-[hsl(var(--primary)/.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
            {t("report.portalName")}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            • AI Auto-Triage & Deduplication
          </span>
        </div>
        <h1 className="display-font mt-2 text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
          {t("report.reportTitle")}
        </h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
          {t("report.reportDesc")}
        </p>
      </div>

      {/* Preset Prompts for Hackathon Demo */}
      <div className="mb-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
        <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-500" />
          {t("report.loadDemo")}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setDescription(p.text);
                setLocationText(p.location);
                setCategory(p.category);
                setAnalysisResult(null);
                setAnalysisStep(0);
              }}
              className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))] transition-colors hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Reporting Form */}
      <div className="rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 shadow-[6px_6px_0_hsl(var(--foreground)/.08)]">
        <form onSubmit={handleAnalyse} className="space-y-6">
          {/* Issue Description */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                {t("report.descriptionLabel")} <span className="text-red-500">*</span>
              </label>
              <VoiceInput onTranscript={(text) => setDescription(prev => prev + " " + text)} />
            </div>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setAnalysisResult(null);
              }}
              placeholder={t("report.placeholder")}
              className="mt-2 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.2)]"
            />
          </div>

          {/* Location & GPS */}
          <div>
            <label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
              Location / Landmark
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-3.5 top-3.5 text-[hsl(var(--primary))]" />
                <input
                  id="location"
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. Outside DAV School, Bariatu Road, Ranchi"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-3 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.2)]"
                />
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="focus-ring flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.6)] px-4 py-3 text-xs font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <MapPin size={14} className="text-[hsl(var(--primary))]" />
                {isLocating ? "Locating..." : "Use Current Location"}
              </button>
            </div>
          </div>

          {/* Category & Urgency Selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category-select" className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                {t("report.categoryLabel")}
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
              >
                <option value="Let AI Detect">✨ Let AI Detect Automatically</option>
                <option value="Road Infrastructure">Road Infrastructure & Potholes</option>
                <option value="Water Supply">Water Supply & Pipeline Leakage</option>
                <option value="Electricity">Electricity & Transformers</option>
                <option value="Sanitation">Sanitation & Garbage Waste</option>
                <option value="Public Safety">Public Safety & Drainage Hazard</option>
              </select>
            </div>

            <div>
              <label htmlFor="urgency-select" className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                {t("report.urgencyLabel")}
              </label>
              <select
                id="urgency-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
              >
                <option value="Normal">Normal (Standard municipal schedule)</option>
                <option value="Urgent">Urgent (Impacts school/hospital/commute)</option>
                <option value="Emergency">Emergency (Immediate hazard to life/limb)</option>
              </select>
            </div>
          </div>

          {/* Photo Evidence Upload with local preview */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))] text-red-600">
              Supporting Evidence Required <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 mb-2">
              Attach evidence of the reported problem to help verify the challenge and reduce false or misleading reports.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] px-5 py-3.5 text-xs font-bold text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]">
                <Camera size={16} className="text-[hsl(var(--primary))]" />
                <span>Upload Photo / Video / Document</span>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {photoUrl ? (
                <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-[hsl(var(--border))] shadow-sm">
                  <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Required for submission
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isAnalysing || !description.trim()}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-4 text-base font-black text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_hsl(var(--foreground))] disabled:opacity-50"
            >
              {isAnalysing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("report.runningAi")}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t("report.analyseBtn")}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Real-time Multi-step AI Verification Progress */}
        {isAnalysing && (
          <div className="mt-8 rounded-2xl border border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.05)] p-5 animate-in fade-in">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))]">
              <Loader2 size={16} className="animate-spin text-[hsl(var(--primary))]" />
              Analysing report with JANSAMVAD AI Engine...
            </h4>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Content safety & spam filter complete</span>
              </div>
              <div className={`flex items-center gap-2 ${analysisStep >= 2 ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-[hsl(var(--muted-foreground))]"}`}>
                {analysisStep >= 2 ? <CheckCircle2 size={14} className="text-emerald-600" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-300 animate-spin" />}
                <span>Issue category & intent extracted</span>
              </div>
              <div className={`flex items-center gap-2 ${analysisStep >= 3 ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-[hsl(var(--muted-foreground))]"}`}>
                {analysisStep >= 3 ? <CheckCircle2 size={14} className="text-emerald-600" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-300 animate-spin" />}
                <span>Searching active complaints database for spatial & semantic duplicates</span>
              </div>
              <div className={`flex items-center gap-2 ${analysisStep >= 4 ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-[hsl(var(--muted-foreground))]"}`}>
                {analysisStep >= 4 ? <CheckCircle2 size={14} className="text-emerald-600" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-300 animate-spin" />}
                <span>Calculating multi-factor priority score (0–100)</span>
              </div>
              <div className={`flex items-center gap-2 ${analysisStep >= 5 ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-[hsl(var(--muted-foreground))]"}`}>
                {analysisStep >= 5 ? <CheckCircle2 size={14} className="text-emerald-600" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-300 animate-spin" />}
                <span>Identifying responsible department in Jharkhand</span>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Detection Result Card */}
        {analysisResult && topDuplicate && (
          <div className="mt-8 space-y-6 animate-in fade-in-50">
            <DuplicateMatchCard
              match={topDuplicate}
              onSupport={handleSupportExisting}
              onCreateSeparate={() => handleProceedCreate()}
              isSupporting={supportIssueMutation.isPending}
            />

            {/* AI Technical Details Breakdown */}
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
