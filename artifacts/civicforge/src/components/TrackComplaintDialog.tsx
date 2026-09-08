import { useState } from "react";
import { useLocation } from "wouter";
import { Search, ArrowRight, X, Sparkles } from "lucide-react";

interface TrackComplaintDialogProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  { id: "JH-RNC-2026-00482", title: "DAV School Pothole (Officer on site)" },
  { id: "JH-RNC-2026-00319", title: "Doranda Water Pipeline Burst (Work started)" },
  { id: "JH-RNC-2026-00204", title: "Daily Market Sanitation (Awaiting verification)" },
  { id: "JH-RNC-2026-00105", title: "Kanke Road Streetlights (Resolved)" },
];

export function TrackComplaintDialog({ open, onClose }: TrackComplaintDialogProps) {
  const [, setLocation] = useLocation();
  const [complaintId, setComplaintId] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleTrack = (targetId?: string) => {
    const query = (targetId || complaintId).trim().toUpperCase();
    if (!query) {
      setError("Please enter a valid complaint tracking ID");
      return;
    }
    setError("");
    onClose();
    setLocation(`/issues/${encodeURIComponent(query)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))]">
            <Search size={18} />
          </span>
          <div>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Track Civic Complaint</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Enter your public token or complaint ID to view real-time field progress
            </p>
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="mt-5"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={complaintId}
              onChange={(e) => {
                setComplaintId(e.target.value);
                setError("");
              }}
              placeholder="e.g. JH-RNC-2026-00482"
              className="mono-font w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--foreground))] placeholder:normal-case placeholder:tracking-normal placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.2)]"
            />
            <button
              type="submit"
              className="absolute right-1.5 rounded-lg bg-[hsl(var(--primary))] px-3.5 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              Track <ArrowRight size={13} className="inline" />
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </form>

        {/* Demo suggestions */}
        <div className="mt-5">
          <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
            Demo Complaints for Hackathon Judges
          </p>
          <div className="mt-2 space-y-1.5">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleTrack(s.id)}
                className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--border)/.7)] bg-[hsl(var(--muted)/.4)] px-3 py-2 text-left text-xs transition-colors hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--muted))]"
              >
                <span className="mono-font font-bold text-[hsl(var(--foreground))]">{s.id}</span>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
