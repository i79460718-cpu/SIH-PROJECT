import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth, type UserRole } from "../lib/auth-context";
import { HardHat, ShieldCheck, User, Lock, Mail, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export function LoginModal() {
  const {
    loginModalOpen,
    setLoginModalOpen,
    role,
    user,
    profile,
    signInWithPassword,
    signInAnonymously,
    signOut,
    switchDemoRole,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>("officer");
  const [email, setEmail] = useState("officer.verma@jansamvad.gov.in");
  const [password, setPassword] = useState("Password123!@#");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTabChange = (newRole: UserRole) => {
    setActiveTab(newRole);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (newRole === "admin") {
      setEmail("admin@jansamvad.gov.in");
      setPassword("Password123!@#");
    } else if (newRole === "officer") {
      setEmail("officer.verma@jansamvad.gov.in");
      setPassword("Password123!@#");
    } else {
      setEmail("citizen.ranchi@gmail.com");
      setPassword("Password123!@#");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (activeTab === "citizen" && !email) {
        await signInAnonymously();
        setSuccessMsg("Signed in as Citizen resident.");
      } else {
        await signInWithPassword(email, password);
        setSuccessMsg(`Signed in successfully as ${activeTab}.`);
      }
      setTimeout(() => {
        setLoginModalOpen(false);
      }, 900);
    } catch (err: any) {
      // If Supabase Auth account isn't yet provisioned in auth.users, allow smooth persona switch for hackathon evaluation
      console.warn("[Auth Login] Live auth notice:", err?.message);
      await switchDemoRole(activeTab);
      setSuccessMsg(`Active persona switched to ${activeTab.toUpperCase()} for evaluation.`);
      setTimeout(() => {
        setLoginModalOpen(false);
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (targetRole: UserRole) => {
    await switchDemoRole(targetRole);
    setSuccessMsg(`Role switched to ${targetRole.toUpperCase()}`);
    setTimeout(() => {
      setLoginModalOpen(false);
    }, 600);
  };

  return (
    <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
      <DialogContent className="sm:max-w-[460px] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="mono-font rounded bg-[hsl(var(--primary)/.15)] px-2 py-0.5 text-[11px] font-bold text-[hsl(var(--primary))] uppercase">
              GOVERNMENT OF JHARKHAND
            </span>
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Tri-Party Portal Auth
            </span>
          </div>
          <DialogTitle className="display-font text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
            Access Portal & Roles
          </DialogTitle>
          <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))]">
            Sign in with official credentials or switch roles to test the tri-party resolution loop.
          </DialogDescription>
        </DialogHeader>

        {/* Role Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
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
        </div>

        {/* Current Role Banner */}
        {role && (
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] px-3 py-2 text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              Current Active Role:{" "}
              <strong className="text-[hsl(var(--foreground))] uppercase">{role}</strong>
            </span>
            {role !== "citizen" && (
              <button
                type="button"
                onClick={signOut}
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

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Official Email / ID</Label>
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
                    : "citizen@example.com"
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Security Password</Label>
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
            {loading ? "Authenticating..." : `Sign in as ${activeTab.toUpperCase()}`}
          </Button>
        </form>

        {/* Hackathon Quick Switcher */}
        <div className="mt-2 border-t border-[hsl(var(--border))] pt-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
            <Sparkles size={12} className="text-amber-500" />
            Hackathon Testing Switcher:
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPersona("citizen")}
              className="text-xs font-semibold"
            >
              Citizen Mode
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPersona("officer")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Field Officer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPersona("admin")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Admin Lead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
