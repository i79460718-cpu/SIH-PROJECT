import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HardHat,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  useIssue,
  useOfficers,
  useSupportIssue,
  useAddReportToIssue,
  useIssueReports,
  useAssignOfficer,
  useVerifyResolution,
} from "../lib/jansamvad-api";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { AiAnalysisPanel } from "../components/AiAnalysisPanel";
import { IssueTimeline } from "../components/IssueTimeline";
import { EvidenceGallery } from "../components/EvidenceGallery";
import { LoadingBlock, ErrorBlock } from "../components/civic-shell";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueIdOrPublicId = params?.id || "";

  const { data: issue, isLoading, isError, error, refetch } = useIssue(issueIdOrPublicId);
  const { data: officers } = useOfficers();
  const { data: issueReports = [], isLoading: reportsLoading } = useIssueReports(issue?.id || "");

  const addReportMutation = useAddReportToIssue();
  const assignMutation = useAssignOfficer();
  const verifyMutation = useVerifyResolution();

  const [supportComment, setSupportComment] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [citizenFeedback, setCitizenFeedback] = useState("");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1140px] px-4 py-16">
        <LoadingBlock label="Loading issue intelligence and resolution timeline..." />
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <div className="mx-auto max-w-[1140px] px-4 py-16">
        <ErrorBlock
          label={error instanceof Error ? error.message : "Complaint record not found or could not be retrieved from Supabase."}
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Link href="/issues" className="text-xs font-bold text-[hsl(var(--primary))] hover:underline">
            ← Return to Live Issues
          </Link>
        </div>
      </div>
    );
  }

  const isAwaitingVerification = issue.status === "Resolved - Awaiting Verification";

  const handleConfirmVerification = async () => {
    try {
      await verifyMutation.mutateAsync({
        issueId: issue.id,
        confirmed: true,
        comment: citizenFeedback || "Citizen confirmed repair completed satisfactorily on ground.",
      });
      alert("Thank you! Resolution confirmed and closed in public record.");
    } catch (err) {
      alert("Failed to record verification.");
    }
  };

  const handleRejectVerification = async () => {
    try {
      await verifyMutation.mutateAsync({
        issueId: issue.id,
        confirmed: false,
        comment: citizenFeedback || "Citizen reported problem remains unresolved. Escalated to department supervisor.",
      });
      alert("Complaint has been escalated to the department head.");
    } catch (err) {
      alert("Failed to escalate issue.");
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedOfficerId) return;
    try {
      await assignMutation.mutateAsync({
        issueId: issue.id,
        officerId: selectedOfficerId,
      });
      setShowAssignModal(false);
    } catch (err) {
      alert("Failed to assign officer.");
    }
  };

  const handleSupport = async () => {
    setSupportError(null);
    setSupportSuccess(null);
    try {
      await addReportMutation.mutateAsync({
        issueId: issue.id,
        description: supportComment.trim() || "I also live in this ward and confirm this issue needs resolution.",
        locationText: issue.locationText || issue.district,
      });

      // ONLY show "Report added successfully" AFTER the Supabase INSERT succeeds!
      setSupportSuccess("Report added successfully");
      setSupportComment("");
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSuccess(null);
      }, 1600);
    } catch (err: any) {
      console.error("[Supabase] Add report failed:", err);
      // PostgreSQL unique constraint error 23505
      if (
        err?.code === "23505" ||
        err?.message?.includes("23505") ||
        err?.message?.toLowerCase().includes("unique constraint") ||
        err?.message?.toLowerCase().includes("duplicate key")
      ) {
        setSupportError("You have already added your report to this issue.");
      } else {
        // Display the actual Supabase error
        setSupportError(err?.message || err?.details || String(err));
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <Link
          href="/issues"
          className="focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <ArrowLeft size={14} /> Back to Live Issues
        </Link>

        <div className="flex items-center gap-2">
          {/* Support This Issue CTA */}
          <button
            type="button"
            onClick={() => {
              setSupportError(null);
              setSupportSuccess(null);
              setShowSupportModal(true);
            }}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))] transition-transform hover:-translate-y-0.5"
          >
            <Users size={14} /> Support This Issue (+1)
          </button>

          {/* Department Head Quick Assign */}
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <UserCheck size={14} className="text-[hsl(var(--primary))]" />
            Department Dispatch
          </button>
        </div>
      </div>

      {/* Hero Issue Header */}
      <div className="mt-6 rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 shadow-[6px_6px_0_hsl(var(--foreground)/.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-font rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] px-3 py-1 text-sm font-black tracking-wider text-[hsl(var(--background))]">
              {issue.publicId}
            </span>
            <span className="rounded-md bg-stone-200/70 dark:bg-stone-800 px-2.5 py-1 text-xs font-bold text-[hsl(var(--foreground))]">
              {issue.category}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={issue.priority} score={issue.priorityScore} />
            <StatusBadge status={issue.status} />
          </div>
        </div>

        <h1 className="display-font mt-4 text-2xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
          {issue.title}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          {issue.description}
        </p>

        {/* Metadata Badges */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-[hsl(var(--border)/.7)] pt-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Location</span>
            <p className="mt-0.5 font-semibold text-[hsl(var(--foreground))] flex items-center gap-1 truncate">
              <MapPin size={12} className="text-[hsl(var(--primary))] shrink-0" />
              {issue.locationText}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Responsible Department</span>
            <p className="mt-0.5 font-semibold text-[hsl(var(--foreground))] truncate">
              {issue.department}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Assigned Officer</span>
            <p className="mt-0.5 font-semibold text-[hsl(var(--foreground))] flex items-center gap-1 truncate">
              <HardHat size={12} className="text-emerald-600 shrink-0" />
              {issue.assignedOfficer ? `${issue.assignedOfficer.name} (${issue.assignedOfficer.designation})` : "Unassigned"}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Citizen Consensus</span>
            <p className="mt-0.5 font-bold text-[hsl(var(--primary))] flex items-center gap-1">
              <Users size={12} />
              {issue.reportCount} reports ({issue.duplicateCount} merged)
            </p>
          </div>
        </div>
      </div>

      {/* CITIZEN RESOLUTION VERIFICATION CALLOUT (SIH Core Tri-Party Rule) */}
      {isAwaitingVerification && (
        <div className="mt-6 rounded-2xl border-2 border-purple-500/60 bg-purple-500/10 p-6 shadow-[5px_5px_0_hsl(var(--foreground)/.1)] animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white font-black shadow-md">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[hsl(var(--foreground))]">
                  Tri-Party Check: Citizen Resolution Verification Needed
                </h3>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl">
                  Field Officer <strong>{issue.assignedOfficer?.name || "assigned"}</strong> has completed work and submitted photo evidence. In JANSAMVAD AI, an issue <strong>cannot be closed unilaterally by the department</strong> without citizen confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-purple-500/20 pt-4">
            <input
              type="text"
              value={citizenFeedback}
              onChange={(e) => setCitizenFeedback(e.target.value)}
              placeholder="Optional notes or ground feedback (e.g. 'Road is smooth now', 'Pothole still visible')..."
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={verifyMutation.isPending}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-[2px_2px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5"
              >
                <CheckCircle2 size={14} />
                {verifyMutation.isPending ? "Recording..." : "Confirm Resolution (Mark as Resolved)"}
              </button>

              <button
                type="button"
                onClick={handleRejectVerification}
                disabled={verifyMutation.isPending}
                className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-red-600/50 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-500/20"
              >
                <XCircle size={14} />
                Still Not Resolved (Escalate to Department Head)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Timeline + Evidence, Right AI Explainability & Linked Reports */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Tri-Party Resolution Timeline & Evidence */}
        <div className="space-y-8 lg:col-span-7">
          {/* Timeline Section */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[hsl(var(--primary))]" />
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Tri-Party Resolution Timeline
                </h3>
              </div>
              <span className="mono-font text-[11px] text-[hsl(var(--muted-foreground))]">
                {issue.timeline?.length || 0} milestones
              </span>
            </div>

            <IssueTimeline items={issue.timeline || []} />
          </div>

          {/* Evidence Gallery */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-[hsl(var(--primary))]" />
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Site Evidence & Inspections
                </h3>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {issue.evidence?.length || 0} photographic records
              </span>
            </div>

            <EvidenceGallery evidence={issue.evidence || []} />
          </div>
        </div>

        {/* Right Column (5 cols): AI Explainability Card & Citizen Reports */}
        <div className="space-y-8 lg:col-span-5">
          {/* AI Intelligence Card */}
          {issue.aiAnalysis && (
            <AiAnalysisPanel analysis={issue.aiAnalysis} />
          )}

          {/* Citizen Reports Linked / Clustered */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[hsl(var(--primary))]" />
                <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">
                  Consolidated Citizen Reports ({issue.reportCount || 1})
                </h4>
              </div>
              <span className="mono-font rounded bg-[hsl(var(--accent)/.3)] px-2 py-0.5 text-[10px] font-bold">
                1 Master Issue
              </span>
            </div>

            <div className="mt-4 divide-y divide-[hsl(var(--border)/.6)] text-xs">
              <div className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[hsl(var(--foreground))]">Resident Citizen (Original Complaint)</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {typeof issue.createdAt === "string" ? issue.createdAt.slice(0, 10) : "Recent"}
                  </span>
                </div>
                <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                  {issue.description}
                </p>
              </div>

              {reportsLoading ? (
                <div className="py-2 text-[hsl(var(--muted-foreground))] text-xs">
                  Loading citizen reports from Supabase...
                </div>
              ) : (
                issueReports.map((r: any, idx: number) => (
                  <div key={r.id || idx} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[hsl(var(--foreground))]">
                        Citizen Report #{idx + 1}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "Recent"}
                      </span>
                    </div>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                      {r.description}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[hsl(var(--border)/.7)]">
              <button
                type="button"
                onClick={() => {
                  setSupportError(null);
                  setSupportSuccess(null);
                  setShowSupportModal(true);
                }}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] py-2 text-center text-xs font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"
              >
                + Add your report to this issue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Issue Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Support This Civic Issue</h3>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Adding your voice links your report to <strong>{issue.publicId}</strong>, strengthening its priority ranking without creating duplicate tickets.
            </p>

            {supportError && (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                {supportError}
              </div>
            )}

            {supportSuccess && (
              <div className="mt-3 rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-xs font-bold text-green-600 dark:text-green-400">
                {supportSuccess}
              </div>
            )}

            <textarea
              rows={3}
              value={supportComment}
              onChange={(e) => {
                setSupportComment(e.target.value);
                if (supportError) setSupportError(null);
              }}
              placeholder="e.g. I commute through here every morning and this road is severely damaged..."
              className="mt-4 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportError(null);
                  setSupportSuccess(null);
                }}
                className="rounded-full px-4 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSupport}
                disabled={addReportMutation.isPending || !!supportSuccess}
                className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))]"
              >
                {addReportMutation.isPending ? "Submitting..." : "Submit Support (+1)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Officer Dispatch Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Department Officer Assignment</h3>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Select an available municipal field officer in Jharkhand to inspect and remediate this grievance.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                Available Field Officers
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none"
              >
                <option value="">-- Choose on-ground officer --</option>
                {officers?.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} • {off.designation} ({off.department}) • {off.activeTasks} active
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignOfficer}
                disabled={!selectedOfficerId || assignMutation.isPending}
                className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
