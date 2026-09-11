import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth, type UserRole } from "../lib/auth-context";
import { HardHat, ShieldCheck, User, Lock, Mail, AlertCircle, CheckCircle2, Building2, BriefcaseBusiness } from "lucide-react";
import { useLocation } from "wouter";
import { useDemoSession, demoDestinations, demoLabels } from "@/lib/demo-session";

export function LoginModal() {
  const [, setLocation] = useLocation();
  const {
    loginModalOpen,
    setLoginModalOpen,
    role,
    user,
    signOut,
  } = useAuth();
  const { demoSession, startDemoSession, endDemoSession } = useDemoSession();

  const [activeTab, setActiveTab] = useState<UserRole>("citizen");
  const [email, setEmail] = useState("citizen@jansamvad.gov.in");
  const [password, setPassword] = useState("JansamvadDemo@2026!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTabChange = (newRole: UserRole) => {
    setActiveTab(newRole);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (newRole === "admin") {
      setEmail("admin@jansamvad.gov.in");
    } else if (newRole === "officer") {
      setEmail("officer@jansamvad.gov.in");
    } else if (newRole === "university_admin") {
      setEmail("university@jansamvad.gov.in");
    } else if (newRole === "industry_partner") {
      setEmail("industry@jansamvad.gov.in");
    } else {
      setEmail("citizen@jansamvad.gov.in");
    }
    setPassword("JansamvadDemo@2026!");
  };

  useEffect(() => {
    if (loginModalOpen) handleTabChange(demoSession?.role ?? "citizen");
  }, [loginModalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Credentials are display-only conveniences, never sent to Auth or an API.
      startDemoSession(activeTab);
      setSuccessMsg(`Demo session active — ${demoLabels[activeTab]}`);
      setLoginModalOpen(false);
      setLocation(demoDestinations[activeTab]);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not start the local demo session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
      <DialogContent className="sm:max-w-[460px] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Societal Innovation Ecosystem
            </span>
          </div>
          <DialogTitle className="display-font text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
            Access Portal & Roles
          </DialogTitle>
          <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))]">
            Sign in to a local demo workspace instantly. No real account or password verification is required. Changes stay in this browser tab.
          </DialogDescription>
        </DialogHeader>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1 rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange("citizen")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${
              activeTab === "citizen"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <User size={14} />
            Citizen
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("officer")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${
              activeTab === "officer"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <HardHat size={14} />
            Officer
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${
              activeTab === "admin"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <ShieldCheck size={14} />
            Admin
          </button>
          <button type="button" onClick={() => handleTabChange("university_admin")} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${activeTab === "university_admin" ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}><Building2 size={14} />University</button>
          <button type="button" onClick={() => handleTabChange("industry_partner")} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${activeTab === "industry_partner" ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}><BriefcaseBusiness size={14} />Industry</button>
        </div>

        {/* Current Role Banner */}
        {role && (
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] px-3 py-2 text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              Selected Demo Role:{" "}
              <strong className="text-[hsl(var(--foreground))] uppercase">{activeTab === "admin" ? "ADMIN / SUPER_ADMIN" : activeTab.toUpperCase()}</strong>
              {demoSession ? <span className="block mt-1">Active demo: <strong>{demoLabels[demoSession.role]}</strong></span> : user && <span className="block mt-1">Real account: <strong>{role}</strong></span>}
            </span>
            {(demoSession || user) && (
              <button
                type="button"
                onClick={() => { if (demoSession) { endDemoSession(); setLocation("/"); } else { void signOut(); } }}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <Button type="button" variant="outline" className="w-full font-bold" onClick={() => {
          setLoginModalOpen(false);
          setLocation(`/demo/${activeTab}`);
        }}>Open {activeTab.replaceAll("_", " ")} demo preview</Button>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Preview is read-only. Sign in below to use the interactive DEMO / TEST workspace.</p>
        <form onSubmit={handleLogin} noValidate className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Demo account email</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
                placeholder={
                  activeTab === "admin"
                    ? "admin@jansamvad.gov.in"
                    : activeTab === "officer"
                    ? "officer@jansamvad.gov.in"
                    : activeTab === "university_admin" ? "university@jansamvad.gov.in" : activeTab === "industry_partner" ? "industry@jansamvad.gov.in" : "citizen@jansamvad.gov.in"
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Demo password</Label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-bold bg-[hsl(var(--primary))] text-white shadow-md hover:bg-[hsl(var(--primary)/.9)]"
          >
            {loading ? "Starting demo..." : `Sign in as ${activeTab.replaceAll("_", " ").toUpperCase()}`}
          </Button>
        </form>

      </DialogContent>
    </Dialog>
  );
}
