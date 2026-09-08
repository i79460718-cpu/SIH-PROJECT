import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Issue } from "@workspace/api-zod";
import { Link } from "wouter";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Users, ArrowRight, Layers, ShieldCheck, Flame } from "lucide-react";

interface IssueMapProps {
  issues: Issue[];
  selectedIssueId?: number | null;
  onSelectIssue?: (issue: Issue) => void;
}

export function IssueMap({ issues, selectedIssueId, onSelectIssue }: IssueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Jharkhand (Ranchi corridor)
    const map = L.map(mapContainerRef.current, {
      center: [23.45, 85.6],
      zoom: 8,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    issues.forEach((issue) => {
      const isCritical = issue.priority === "CRITICAL";
      const isHigh = issue.priority === "HIGH";
      const isResolved = issue.status === "Resolved";

      const pinColor = isResolved
        ? "#059669"
        : isCritical
        ? "#dc2626"
        : isHigh
        ? "#d97706"
        : "#4f46e5";

      // Custom divIcon
      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${pinColor};
              border: 3px solid #fff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 800;
              font-size: 11px;
            ">
              ${issue.reportCount}
            </div>
            ${
              isCritical
                ? `<span style="
                    position: absolute;
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background-color: ${pinColor};
                    opacity: 0.4;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></span>`
                : ""
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        setActiveIssue(issue);
        onSelectIssue?.(issue);
        map.panTo([issue.latitude, issue.longitude]);
      });

      markersRef.current.push(marker);
    });

    if (issues.length > 0 && !activeIssue) {
      setActiveIssue(issues[0]);
    }
  }, [issues, onSelectIssue]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[hsl(var(--border))] shadow-lg">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full min-h-[520px] w-full bg-stone-100 dark:bg-stone-900" />

      {/* Cluster Details Card (Floating on bottom/left) */}
      {activeIssue && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.95)] p-5 shadow-2xl backdrop-blur-md md:left-6 md:right-auto md:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-[hsl(var(--border)/.6)] pb-3">
            <div className="flex items-center gap-2">
              <span className="mono-font rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-[11px] font-bold text-[hsl(var(--foreground))]">
                {activeIssue.publicId}
              </span>
              <span className="text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
                {activeIssue.category}
              </span>
            </div>
            <PriorityBadge priority={activeIssue.priority} score={activeIssue.priorityScore} />
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] line-clamp-2">
              {activeIssue.title}
            </h4>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <MapPin size={13} className="text-[hsl(var(--primary))] shrink-0" />
              <span className="truncate">{activeIssue.locationText}</span>
            </div>
          </div>

          {/* Cluster Duplicate Intelligence */}
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {activeIssue.reportCount} citizen reports clustered
              </span>
              <span className="mono-font text-[10px]">
                {activeIssue.aiAnalysis?.categoryConfidence || 94}% duplicate confidence
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border)/.6)] pt-3">
            <StatusBadge status={activeIssue.status} />
            <Link
              href={`/issues/${activeIssue.publicId}`}
              className="focus-ring inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-3.5 py-1.5 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-[2px_2px_0_hsl(var(--foreground))]"
            >
              View Issue <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute right-4 top-4 z-[1000] hidden sm:block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.9)] p-3 text-[11px] shadow-md backdrop-blur-md">
        <p className="mono-font text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] mb-1.5">
          Priority Pins
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            <span>Critical Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            <span>Medium / Routine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span>Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
