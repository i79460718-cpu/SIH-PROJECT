import { createContext, useContext, useState, type ReactNode } from "react";
import type { UserRole } from "./auth-context";

export const DEMO_SESSION_KEY = "jansamvad.demo.session.v1";
export const demoRoles: UserRole[] = ["citizen", "officer", "admin", "university_admin", "industry_partner"];
export const demoDestinations: Record<UserRole, string> = { citizen: "/dashboard", officer: "/officer", admin: "/admin", university_admin: "/university", industry_partner: "/industry" };
export const demoLabels: Record<UserRole, string> = { citizen: "Citizen", officer: "Officer", admin: "Admin", university_admin: "University Admin", industry_partner: "Industry Partner" };
export const demoEmails: Record<UserRole, string> = { citizen: "citizen@jansamvad.gov.in", officer: "officer@jansamvad.gov.in", admin: "admin@jansamvad.gov.in", university_admin: "university@jansamvad.gov.in", industry_partner: "industry@jansamvad.gov.in" };
export const demoUniversity = { id: "demo-university", name: "Jharkhand Institute of Innovation & Technology", dataOrigin: "DEMO", verificationStatus: "DEMO", district: "Ranchi" } as const;
export const demoIndustry = { id: "demo-industry", name: "Jharkhand Civic Innovation Labs", dataOrigin: "DEMO", verificationStatus: "DEMO", district: "Ranchi" } as const;

export interface DemoSession {
  mode: "demo";
  role: UserRole;
  profile: { id: string; role: UserRole; full_name: string; email: string; district: string; dataOrigin: "DEMO"; university_id?: string; industry_partner_id?: string };
}
function makeSession(role: UserRole): DemoSession {
  return { mode: "demo", role, profile: { id: `demo-${role}`, role, full_name: `Demo ${demoLabels[role]}`, email: demoEmails[role], district: "Ranchi", dataOrigin: "DEMO", ...(role === "university_admin" ? { university_id: demoUniversity.id } : {}), ...(role === "industry_partner" ? { industry_partner_id: demoIndustry.id } : {}) } };
}
function restore(): DemoSession | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(DEMO_SESSION_KEY) || "null");
    return stored?.mode === "demo" && demoRoles.includes(stored.role) ? makeSession(stored.role) : null;
  } catch { return null; }
}
const DemoContext = createContext<{
  demoSession: DemoSession | null;
  startDemoSession: (role: UserRole) => void;
  endDemoSession: () => void;
} | null>(null);

// Tab-scoped presentation state, never a Supabase User/Session or an API token.
// Persist only the selected role; profiles are reconstructed from trusted demo fixtures.
export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [demoSession, setSession] = useState<DemoSession | null>(restore);
  function startDemoSession(role: UserRole) {
    if (!demoRoles.includes(role)) throw new Error("Unknown demo persona");
    try { sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ mode: "demo", role })); }
    catch { throw new Error("Browser storage is unavailable. Enable storage for this site to keep a demo session across refresh."); }
    setSession(makeSession(role));
  }
  function endDemoSession() {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setSession(null);
  }
  return <DemoContext.Provider value={{ demoSession, startDemoSession, endDemoSession }}>{children}</DemoContext.Provider>;
}
export function useDemoSession() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoSessionProvider is missing");
  return context;
}
