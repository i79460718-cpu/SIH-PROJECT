import { useState } from "react";
import type { UserRole } from "./auth-context";

export const DEMO_WORKSPACE_KEY = "jansamvad.demo.workspace.v1";
export interface DemoProject {
  id: string; title: string; category: string; location: string; description: string;
  status: string; assignment: "pending" | "accepted" | "rejected" | "info_requested";
  reason: string; students: string[]; mentors: { name: string; start: string; end: string | null; reason: string }[];
  proposal: "draft" | "submitted"; collaboration: boolean;
  milestones: { name: string; completed: boolean; amount: number; released: boolean }[];
  legal: "draft" | "under_review" | "approved" | "rejected" | "needs_revision";
  votes: number; voted: boolean;
}
export interface DemoWorkspace { version: 1; projects: DemoProject[]; history: { id: string; at: string; actor: string; action: string }[] }
export const demoStudents = ["Aarav Kumar", "Neha Kumari", "Ravi Oraon", "Priya Soren", "Aman Singh", "Sunita Murmu"];
function seed(): DemoWorkspace {
  return { version: 1, history: [], projects: [
    ["water", "Solar-powered drinking water monitoring", "Water", "Kanke", "Monitor community drinking water quality with a low-cost sensor prototype."],
    ["waste", "Community waste collection tracker", "Sanitation", "Doranda", "Coordinate collection schedules and track neighbourhood feedback."],
    ["crossing", "Accessible school crossing", "Road safety", "Lalpur", "Improve pedestrian access and visibility near a school entrance."],
  ].map(([id, title, category, location, description]) => ({ id, title, category, location: `Ranchi · ${location}`, description, status: "Validated", assignment: "pending", reason: "", students: [], mentors: [], proposal: "draft", collaboration: false, legal: "draft", votes: 0, voted: false, milestones: [
    { name: "Research", completed: false, amount: 20000, released: false },
    { name: "Prototype", completed: false, amount: 40000, released: false },
    { name: "Field pilot", completed: false, amount: 40000, released: false },
  ] })) };
}
function restore(): DemoWorkspace {
  try {
    const value = JSON.parse(sessionStorage.getItem(DEMO_WORKSPACE_KEY) || "null");
    if (value?.version === 1 && Array.isArray(value.projects) && value.projects.length === 3 && Array.isArray(value.history) && value.projects.every((p: DemoProject) => typeof p.id === "string" && Array.isArray(p.students) && Array.isArray(p.mentors) && Array.isArray(p.milestones))) return value;
  } catch { /* A stale or malformed presentation fixture starts a fresh demo. */ }
  return seed();
}
// No HTTP client, Supabase dependency, user token, or production database IDs.
// Local changes are shared across demo personas in this tab only.
export function useDemoWorkspace(actor: UserRole) {
  const [workspace, setWorkspace] = useState<DemoWorkspace>(restore);
  const [error, setError] = useState("");
  function update(projectId: string, action: string, mutate: (project: DemoProject) => void) {
    const next = structuredClone(workspace);
    const project = next.projects.find(p => p.id === projectId);
    if (!project) return;
    mutate(project);
    next.history.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor, action: `${project.title}: ${action}` });
    try { sessionStorage.setItem(DEMO_WORKSPACE_KEY, JSON.stringify(next)); setWorkspace(next); setError(""); }
    catch { setError("Demo changes could not be saved. Browser storage may be full or disabled."); }
  }
  return { workspace, update, error };
}
