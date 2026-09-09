import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type UserRole = "citizen" | "officer" | "admin";

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  district?: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("citizen");
  const [isLoading, setIsLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Fetch or infer profile from Supabase
  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRole("citizen");
      return;
    }

    try {
      // 1. Check profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
        setRole(data.role as UserRole);
        return;
      }

      // 2. Check metadata or email conventions
      const metaRole = (currentUser.user_metadata?.role as UserRole) ||
        (currentUser.email?.includes("admin")
          ? "admin"
          : currentUser.email?.includes("officer")
          ? "officer"
          : "citizen");

      const inferredProfile: UserProfile = {
        id: currentUser.id,
        role: metaRole,
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Citizen Resident",
        phone: currentUser.phone || undefined,
        district: "Ranchi",
      };

      setProfile(inferredProfile);
      setRole(metaRole);
    } catch {
      setRole("citizen");
    }
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      loadProfile(currentSession?.user ?? null).finally(() => setIsLoading(false));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      loadProfile(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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

  // Demo helper for hackathon judges: effortlessly toggle between Citizen, Officer, Admin personas
  const switchDemoRole = async (targetRole: UserRole, officerName?: string) => {
    if (targetRole === "citizen") {
      setRole("citizen");
      if (profile) {
        setProfile({ ...profile, role: "citizen" });
      }
      return;
    }

    // Try signing in with demo email if exists
    const demoEmail = targetRole === "admin" ? "admin@jansamvad.gov.in" : "officer.verma@jansamvad.gov.in";
    const demoPassword = "Password123!@#";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!error && data?.user) {
        setSession(data.session);
        setUser(data.user);
        await loadProfile(data.user);
        return;
      }
    } catch {
      // If auth user does not exist in Supabase auth yet, provide client persona preview
    }

    // Client-side persona state for immediate evaluation
    setRole(targetRole);
    setProfile({
      id: user?.id || `demo-${targetRole}-uuid`,
      role: targetRole,
      full_name: officerName || (targetRole === "admin" ? "State Administrator (Ranchi HQ)" : "Ramesh Kumar Verma (Assistant Engineer)"),
      district: "Ranchi",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        loginModalOpen,
        setLoginModalOpen,
        signInWithPassword,
        signInAnonymously,
        signOut,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
