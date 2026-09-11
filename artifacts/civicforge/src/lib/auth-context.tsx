import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useDemoSession } from "./demo-session";

export type UserRole = "citizen" | "officer" | "admin" | "university_admin" | "industry_partner";

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  district?: string;
  university_id?: string;
  industry_partner_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (targetRole: UserRole, officerName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: UserRole[] = ["citizen", "officer", "admin", "university_admin", "industry_partner"];

/**
 * Provision a missing linked demo entity once for an authenticated profile.  This
 * makes the development seed usable after a database reset without asking a
 * presenter to edit profile foreign keys by hand.  The update is persisted; it
 * is never a client-only persona override.
 */
async function provisionPersonaLinkage(p: UserProfile): Promise<UserProfile> {
  try {
    const changes: Partial<UserProfile> = {};
    if (p.role === "university_admin" && !p.university_id) {
      const { data } = await supabase.from("universities").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (data?.id) changes.university_id = data.id as string;
    }
    if (p.role === "industry_partner" && !p.industry_partner_id) {
      const { data } = await supabase.from("industry_partners").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (data?.id) changes.industry_partner_id = data.id as string;
    }
    if (Object.keys(changes).length) {
      const { data, error } = await supabase.from("profiles").update(changes).eq("id", p.id).select("*").single();
      if (!error && data) return data as UserProfile;
    }
  } catch { /* ignore */ }
  return p;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { demoSession } = useDemoSession();
  const demoActive = Boolean(demoSession);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("citizen");
  const [isLoading, setIsLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRole("citizen");
      return;
    }
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
      if (!error && data) {
        const enriched = await provisionPersonaLinkage(data as UserProfile);
        setProfile(enriched);
        setRole(enriched.role as UserRole);
        return;
      }
      const requestedRole = currentUser.user_metadata?.role;
      const base: UserProfile = {
        id: currentUser.id,
        role: VALID_ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "citizen",
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Citizen Resident",
        district: "Ranchi",
      };
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert(base)
        .select("*")
        .single();
      const enriched = await provisionPersonaLinkage((!createError && created ? created : base) as UserProfile);
      setProfile(enriched);
      setRole(enriched.role as UserRole);
    } catch {
      setRole("citizen");
    }
  };

  useEffect(() => {
    // Demo sessions never hydrate or refresh real account data.
    if (demoActive) { setIsLoading(false); return; }
    let disposed = false;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (disposed) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      loadProfile(currentSession?.user ?? null).finally(() => setIsLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (disposed) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      loadProfile(newSession?.user ?? null);
    });
    return () => { disposed = true; subscription.unsubscribe(); };
  }, [demoActive]);

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    await loadProfile(data.user);
  };

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    await loadProfile(data.user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole("citizen");
  };

  const switchDemoRole = async (targetRole: UserRole, officerName?: string) => {
    // Roles are database-authorized.  A browser must never impersonate a role
    // by changing React state; use a seeded account or an account provisioned
    // with role metadata instead.
    void targetRole;
    void officerName;
    throw new Error("Sign in with a provisioned account for this role. Role switching is not available in the browser.");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isLoading, loginModalOpen, setLoginModalOpen, signInWithPassword, signInAnonymously, signOut, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
