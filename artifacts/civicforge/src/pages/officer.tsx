import { useState } from "react";
import { Link } from "wouter";
import {
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HardHat,
  Info,
  MapPin,
  Send,
  ShieldAlert,
  Upload,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  useOfficers,
  useOfficerAssignments,
  useUpdateIssueStatus,
  useAddEvidence,
  type Issue,
} from "../lib/jansamvad-api";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingBlock, ErrorBlock } from "../components/civic-shell";
import { useAuth } from "../lib/auth-context";
import { uploadEvidenceFile } from "../lib/supabase";

export default function OfficerPage() {
  const { role, switchDemoRole, setLoginModalOpen } = useAuth();
  const { data: officers, isLoading: isOfficersLoading } = useOfficers();

  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");
  const activeOfficerId = selectedOfficerId || (officers && officers.length > 0 ? officers[0].id : "");
  const { data: assignments, isLoading: isAssignmentsLoading, refetch } = useOfficerAssignments(activeOfficerId);

  const updateStatusMutation = useUpdateIssueStatus();
  const addEvidenceMutation = useAddEvidence();

  // Evidence Modal State
  const [evidenceModalIssue, setEvidenceModalIssue] = useState<Issue | null>(null);
  const [evidenceCaption, setEvidenceCaption] = useState("");
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState(
    "https://images.unsplash.com/photo-1578991624414-276ef23a534f?auto=format&fit=crop&w=800&q=80"
  );
  const [evidenceType, setEvidenceType] = useState<"after" | "before" | "site_inspection">("after");
  const [uploadingFile, setUploadingFile] = useState(false);

  const currentOfficer = officers?.find((o) => o.id === activeOfficerId) || officers?.[0];

  // Handle Accept Task
  const handleAcceptTask = async (issueId: string | number) => {
    try {
      await updateStatusMutation.mutateAsync({
        issueId,
        status: "Accepted",
        comment: `Officer ${currentOfficer?.name || "Field Officer"} accepted task for field inspection.`,
        actor: "Field Officer",
      });
      refetch();
    } catch (err) {
      alert("Failed to accept task.");
    }
  };

  // Handle Start Work / Reached Location
  const handleStartWork = async (issueId: string | number) => {
    try {
      await updateStatusMutation.mutateAsync({
        issueId,
        status: "Work Started",
        comment: `Officer ${currentOfficer?.name || "Field Officer"} reached location and initiated repair work.`,
        actor: "Field Officer",
      });
      refetch();
    } catch (err) {
      alert("Failed to start work.");
    }
  };

  // Handle Evidence Upload & Mark Awaiting Verification
  const handleSubmitEvidence = async () => {
    if (!evidenceModalIssue) return;
    try {
      // 1. Add Evidence
      await addEvidenceMutation.mutateAsync({
        issueId: evidenceModalIssue.id,
        type: evidenceType,
        uploaderType: "officer",
        url: evidencePhotoUrl,
        caption: evidenceCaption || "Repair completed on site by municipal squad.",
        officerName: currentOfficer?.name,
      });

      // 2. Update status to 'Resolved - Awaiting Verification'
      await updateStatusMutation.mutateAsync({
        issueId: evidenceModalIssue.id,
        status: "Resolved - Awaiting Verification",
        comment: `Officer ${currentOfficer?.name} completed work and uploaded verification evidence. Awaiting citizen confirmation.`,
        actor: "Field Officer",
      });

      setEvidenceModalIssue(null);
      setEvidenceCaption("");
      refetch();
      alert("Evidence recorded! Issue sent for Citizen Verification.");
    } catch (err) {
      alert("Failed to submit evidence.");
    }
  };

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Persona Notice if not in Officer mode */}
      {role !== "officer" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Info size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-200">
              You are currently viewing as <strong>{role.toUpperCase()}</strong>. Switch to <strong>Field Officer</strong> persona to execute assignments and upload resolution evidence.
            </span>
          </div>
          <button
            type="button"
            onClick={() => switchDemoRole("officer")}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <HardHat size={13} />
            Switch to Officer Persona
          </button>
        </div>
      )}

      {/* Officer Profile Header */}
      <div className="rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-md">
              <HardHat size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="mono-font text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  FIELD OFFICER DISPATCH PORTAL
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h1 className="text-xl font-black text-[hsl(var(--foreground))]">
                {currentOfficer?.name || "Field Officer"}
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {currentOfficer?.designation} • {currentOfficer?.department} ({currentOfficer?.district})
              </p>
            </div>
          </div>

          {/* Officer Selector Switcher */}
          <div className="sm:text-right">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
              Switch Officer Demo Account
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5 text-xs font-bold text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              {officers?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tri-Party Accountability Banner */}
      <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">SIH Tri-Party Rule:</strong> Field Officers cannot unilaterally mark complaints as "Resolved". Once you upload repair photos and mark completion, status transitions to <em>"Resolved - Awaiting Verification"</em>. Final closure requires resident confirmation.
        </div>
      </div>

      {/* Assigned Tasks List */}
      <div className="mt-8">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <h2 className="text-base font-extrabold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Wrench size={16} className="text-[hsl(var(--primary))]" />
            Active Field Assignments ({assignments?.length ?? 0})
          </h2>
          <span className="mono-font text-xs text-[hsl(var(--muted-foreground))]">
            Assigned to {currentOfficer?.name}
          </span>
        </div>

        {isAssignmentsLoading ? (
          <div className="mt-6">
            <LoadingBlock label="Fetching field tasks..." />
          </div>
        ) : assignments?.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
            No active assignments pending for this officer right now.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {assignments?.map((task) => {
              const isAccepted = task.status === "Accepted";
              const isWorkStarted = task.status === "Work Started";
              const isAwaitingVerification = task.status === "Resolved - Awaiting Verification";
              const isResolved = task.status === "Resolved";

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border)/.6)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="mono-font rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-bold text-[hsl(var(--foreground))]">
                        {task.publicId}
                      </span>
                      <PriorityBadge priority={task.priority} score={task.priorityScore} />
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                      <Link href={`/issues/${task.publicId}`} className="hover:text-[hsl(var(--primary))]">
                        {task.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {task.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[hsl(var(--primary))]" />
                        {task.locationText}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[hsl(var(--foreground))]">
                        <Users size={12} className="text-[hsl(var(--primary))]" />
                        {task.reportCount} citizen reports
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar for Field Officer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border)/.6)] pt-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {task.status === "Officer Assigned" && (
                        <button
                          type="button"
                          onClick={() => handleAcceptTask(task.id)}
                          disabled={updateStatusMutation.isPending}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                        >
                          <CheckCircle2 size={13} />
                          Accept Task
                        </button>
                      )}

                      {(task.status === "Accepted" || task.status === "Officer Assigned") && (
                        <button
                          type="button"
                          onClick={() => handleStartWork(task.id)}
                          disabled={updateStatusMutation.isPending}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                        >
                          <HardHat size={13} />
                          Reached Location / Start Work
                        </button>
                      )}

                      {task.status === "Work Started" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEvidenceModalIssue(task);
                            setEvidenceCaption(`Remediated by ${currentOfficer?.name}. Bitumen patching and resurfacing complete.`);
                          }}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <Camera size={13} />
                          Upload Evidence & Complete
                        </button>
                      )}

                      {isAwaitingVerification && (
                        <span className="mono-font rounded bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-800 dark:text-purple-300">
                          ✓ Evidence Uploaded • Awaiting Citizen Confirmation
                        </span>
                      )}

                      {isResolved && (
                        <span className="mono-font rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ Resolved & Closed in Public Record
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/issues/${task.publicId}`}
                      className="text-xs font-bold text-[hsl(var(--primary))] hover:underline"
                    >
                      View Live Timeline →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Evidence & Complete Modal */}
      {evidenceModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                Upload Repair Evidence
              </h3>
              <button
                type="button"
                onClick={() => setEvidenceModalIssue(null)}
                className="rounded-full p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Attach on-site proof for <strong>{evidenceModalIssue.publicId}</strong> to submit for citizen verification.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-[hsl(var(--muted-foreground))]">
                    Evidence Photo URL / Proof
                  </label>
                  <label className="flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[hsl(var(--primary))] hover:underline">
                    <Upload size={12} />
                    <span>{uploadingFile ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !evidenceModalIssue) return;
                        setUploadingFile(true);
                        try {
                          const res = await uploadEvidenceFile(file, String(evidenceModalIssue.id), "after", evidenceCaption);
                          if (res.fileUrl) {
                            setEvidencePhotoUrl(res.fileUrl);
                          }
                        } catch (err) {
                          console.error("Upload error:", err);
                        } finally {
                          setUploadingFile(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={evidencePhotoUrl}
                  onChange={(e) => setEvidencePhotoUrl(e.target.value)}
                  placeholder="https://... or upload a local image file"
                  className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
                />
                {evidencePhotoUrl && (
                  <div className="mt-2 h-32 w-full overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-stone-900">
                    <img src={evidencePhotoUrl} alt="Proof" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[hsl(var(--muted-foreground))]">
                  Field Inspection Notes / Summary
                </label>
                <textarea
                  rows={2}
                  value={evidenceCaption}
                  onChange={(e) => setEvidenceCaption(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEvidenceModalIssue(null)}
                className="rounded-full px-4 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvidence}
                disabled={addEvidenceMutation.isPending || updateStatusMutation.isPending}
                className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {addEvidenceMutation.isPending ? "Submitting Proof..." : "Submit for Citizen Verification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
