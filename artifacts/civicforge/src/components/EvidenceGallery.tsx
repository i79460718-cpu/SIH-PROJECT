import { useLanguage } from "../lib/language-context";
import type { Evidence } from "@workspace/api-zod";
import { Camera, CheckCircle2, User, HardHat, ZoomIn } from "lucide-react";
import { useState } from "react";

export function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  const { t } = useLanguage();
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
        {t("evidence.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm transition-all hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
              <img
                src={item.url}
                alt={item.caption}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setActivePhoto(item.url)}
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Zoom image"
              >
                <ZoomIn size={14} />
              </button>

              <div className="absolute left-2 top-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ${
                  item.type === "after" ? "bg-emerald-600" : item.type === "before" ? "bg-amber-600" : "bg-blue-600"
                }`}>
                  {item.type.toUpperCase()} EVIDENCE
                </span>
              </div>
            </div>

            <div className="p-3">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] line-clamp-2">
                {item.caption}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1">
                  {item.uploaderType === "officer" ? <HardHat size={11} className="text-emerald-600" /> : <User size={11} className="text-blue-600" />}
                  {item.officerName || (item.uploaderType === "officer" ? "Field Officer" : "Resident Citizen")}
                </span>
                <span>{item.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-black">
            <img src={activePhoto} alt="Evidence enlarged" className="max-h-[85vh] w-auto object-contain" />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
