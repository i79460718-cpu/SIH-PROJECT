import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUniversities } from "@/services/universityService";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Users, Wrench, Target, Briefcase, BarChart3, Building2,
  FlaskConical, Handshake, Lightbulb, Award, Rocket, Beaker, Megaphone, Layers
} from "lucide-react";

function useIndustryPartner(partnerId?: string) {
  return useQuery({
    queryKey: ["industry-partner", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await supabase.from("industry_partners").select("*").eq("id", partnerId).maybeSingle();
      return data as any;
    },
    enabled: Boolean(partnerId),
  });
}
function usePartnerProjects() {
  return useQuery({
    queryKey: ["partner-discover-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(20);
      return (data as any[]) || [];
    },
  });
}
function usePartnerCollabs(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-collabs", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data } = await supabase.from("collaborations").select("*").eq("industry_partner_id", partnerId).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: Boolean(partnerId),
  });
}
function usePartnerMilestones(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-milestones", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data: collabs } = await supabase.from("collaborations").select("project_id").eq("industry_partner_id", partnerId);
      const ids = (collabs || []).map((c: any) => c.project_id).filter(Boolean);
      if (!ids.length) return [];
      const { data } = await supabase.from("project_milestones").select("*").in("project_id", ids).order("due_date", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: Boolean(partnerId),
  });
}

export default function IndustryPortal() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("discover");
  const [supportType, setSupportType] = useState<string>("mentorship");

  const { data: partners } = useQuery({
    queryKey: ["industry-partners-list"],
    queryFn: async () => {
      const { data } = await supabase.from("industry_partners").select("*").order("created_at", { ascending: true }).limit(10);
      return (data as any[]) || [];
    },
  });
  const partner = partners?.find((p: any) => p.id === profile?.industry_partner_id) || partners?.[0];
  const partnerId = partner?.id;

  const { data: discoverProjects } = usePartnerProjects();
  const { data: collabs } = usePartnerCollabs(partnerId);
  const { data: milestones } = usePartnerMilestones(partnerId);

  const activeCollabs = (collabs || []).filter((c: any) => c.status === "active" || c.status === "accepted");
  const pendingReqs = (collabs || []).filter((c: any) => c.status === "requested" || c.status === "interested");
  const testingSupports = (collabs || []).filter((c: any) => Array.isArray(c.support_type) && c.support_type.includes("testing"));

  const expressInterest = useMutation({
    mutationFn: async (vars: { projectId: string }) => {
      if (!partnerId) throw new Error("No industry partner profile linked");
      // Insert collaboration request
      const { data, error } = await supabase.from("collaborations").insert([{
        project_id: vars.projectId,
        industry_partner_id: partnerId,
        status: "requested",
        support_type: [supportType],
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-collabs"] });
      toast({ title: "Interest expressed", description: `Collaboration request sent with support: ${supportType}` });
      setActiveTab("collaborations");
    },
    onError: (e: any) => toast({ title: "Request failed", description: e.message, variant: "destructive" }),
  });

  const updateCollabStatus = useMutation({
    mutationFn: async (vars: { collabId: string; status: string }) => {
      const { error } = await supabase.from("collaborations").update({ status: vars.status } as any).eq("id", vars.collabId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partner-collabs"] }); toast({ title: "Collaboration updated" }); },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="mx-auto max-w-[1320px] p-6 lg:p-10">
      <div className="flex flex-col md:flex-row justify-between mb-6 items-start gap-4">
        <div>
          <h1 className="display-font text-3xl font-black mb-1 text-[hsl(var(--foreground))]">{partner ? partner.name : "Industry Innovation Partnership Center"}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
            {partner ? `${partner.type || "Industry"} · ${partner.industry_domain || ""} · ${partner.description || ""}` : "Strategic innovation dashboard for CSR, MSME, and Industry partners to mentor, fund, and test societal solutions."}
          </p>
          {partner && <div className="flex gap-2 mt-2"><Badge variant="outline" className="text-[10px]">{partner.industry_domain || "Cross-domain"}</Badge><Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">VERIFIED</Badge></div>}
        </div>
        <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => toast({ title: "Profile", description: "Update via Supabase industry_partners table." })}>Update Organization Profile</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Recommended Projs", value: String(discoverProjects?.length ?? 0), icon: Sparkles },
          { label: "Active Collaborations", value: String(activeCollabs.length), icon: Users },
          { label: "Requests Pending", value: String(pendingReqs.length), icon: Briefcase },
          { label: "Testing Supports", value: String(testingSupports.length), icon: Wrench },
          { label: "Total Requests", value: String(collabs?.length ?? 0), icon: BarChart3 },
          { label: "Milestones", value: String(milestones?.length ?? 0), icon: Target },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 border-2 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className="text-[hsl(var(--primary))]" />
              <span className="text-sm font-black">{stat.value}</span>
            </div>
            <p className="text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wide">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[hsl(var(--muted))] p-1 rounded-2xl w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="discover" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Lightbulb size={12}/> Discover Projects</TabsTrigger>
          <TabsTrigger value="collaborations" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Handshake size={12}/> Active Collaborations</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Briefcase size={12}/> Requests</TabsTrigger>
          <TabsTrigger value="mentorship" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Users size={12}/> Mentorship & Funding</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Target size={12}/> Milestones</TabsTrigger>
          <TabsTrigger value="impact" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Award size={12}/> Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <Card className="rounded-2xl border-2 p-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold">Support type for next request:</span>
            {["mentorship","funding","technical","prototyping","testing","pilot"].map(t => (
              <Badge key={t} variant={supportType===t?"default":"outline"} className="cursor-pointer capitalize text-[11px]" onClick={() => setSupportType(t)}>{t}</Badge>
            ))}
          </Card>
          {(discoverProjects || []).length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed rounded-2xl text-xs font-bold text-[hsl(var(--muted-foreground))]">No projects yet — universities create projects by accepting challenges. Seed demo data to preview the workflow.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(discoverProjects || []).map((p: any) => (
                <Card key={p.id} className="border-2 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black leading-tight line-clamp-2">{p.title}</CardTitle>
                    <Badge variant="outline" className="w-fit text-[10px] capitalize">{String(p.status).replace(/_/g," ")}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">{p.impact_metrics ? JSON.stringify(p.impact_metrics).slice(0,120) : "University project seeking industry collaboration."}</p>
                    <div className="flex gap-2">
                      <Button className="w-full text-[11px] h-8 rounded-xl" variant="outline" onClick={() => toast({ title: p.title, description: `Status: ${p.status} · University: ${String(p.university_id||"").slice(0,8)}` })}>View Project</Button>
                      <Button className="w-full text-[11px] h-8 rounded-xl" onClick={() => expressInterest.mutate({ projectId: p.id })} disabled={expressInterest.isPending || !partnerId}><Handshake size={12}/> Express Interest</Button>
                    </div>
                    {!partnerId && <p className="text-[11px] text-amber-600">Link industry_partner_id in profiles to send requests.</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-3">
          {activeCollabs.length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No active collaborations. Express interest from Discover, then accept the request here.</p> : activeCollabs.map((c: any) => (
            <Card key={c.id} className="rounded-2xl border-2 p-4">
              <p className="font-bold text-sm">Project {String(c.project_id).slice(0,8)} · <Badge className="text-[10px] capitalize">{c.status}</Badge></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Support: {(c.support_type||[]).join(", ") || "—"}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{new Date(c.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-3">
          {(pendingReqs.length===0) ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No pending requests.</p> : pendingReqs.map((c: any) => (
            <Card key={c.id} className="rounded-2xl border-2 p-4 flex justify-between items-center gap-3">
              <div>
                <p className="font-bold text-sm">Project {String(c.project_id).slice(0,8)}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Support: {(c.support_type||[]).join(", ")} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl text-xs" onClick={() => updateCollabStatus.mutate({ collabId: c.id, status: "active" })}>Accept / Start</Button>
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => updateCollabStatus.mutate({ collabId: c.id, status: "declined" })}>Decline</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="mentorship" className="space-y-3">
          <Card className="rounded-2xl border-2 p-4">
            <p className="font-bold text-sm">Mentorship & Funding</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Offer mentorship, technical guidance, prototyping help, testing infrastructure, or funding. Choose support type in Discover before expressing interest.</p>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {(collabs||[]).slice(0,6).map((c:any)=>(<Card key={c.id} className="rounded-xl border p-3"><p className="font-bold text-xs">{(c.support_type||[]).join(", ")||"—"}</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">{c.status}</p></Card>))}
              {!(collabs||[]).length && <p className="text-xs text-[hsl(var(--muted-foreground))]">No support offers yet.</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-2">
          {(milestones||[]).length===0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No milestones for your collaborations yet.</p> : (milestones||[]).map((m:any)=>(
            <Card key={m.id} className="rounded-2xl border-2 p-4">
              <p className="font-bold text-sm">{m.title}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.description||""} · Due {m.due_date||"—"} · <Badge variant="outline" className="text-[10px]">{m.status}</Badge></p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="impact" className="space-y-3">
          <Card className="rounded-2xl border-2 p-6 text-center"><Award className="mx-auto mb-2 text-[hsl(var(--primary))]" size={20}/><p className="font-bold text-sm">Impact</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Impact is recorded on projects via impact_metrics. Completed and deployed projects surface here once universities log outcomes.</p></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
