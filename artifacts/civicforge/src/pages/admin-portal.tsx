import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Building, Factory, FileText, Layers, Target, FlaskConical, Handshake, CheckCircle, Bell, BarChart3, Wrench, Rocket, ShieldCheck, Eye, Activity
} from "lucide-react";
import { useIssues, useDashboardSummary } from "@/lib/jansamvad-api";

function useAdminUniversities() {
  return useQuery({ queryKey: ["admin-unis"], queryFn: async () => {
    const { data } = await supabase.from("universities").select("*").order("created_at", { ascending: false });
    return (data as any[]) || [];
  }});
}
function useAdminIndustry() {
  return useQuery({ queryKey: ["admin-industry"], queryFn: async () => {
    const { data } = await supabase.from("industry_partners").select("*").order("created_at", { ascending: false });
    return (data as any[]) || [];
  }});
}
function useAdminProjects() {
  return useQuery({ queryKey: ["admin-projects"], queryFn: async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    return (data as any[]) || [];
  }});
}
function useAdminTeams() {
  return useQuery({ queryKey: ["admin-teams"], queryFn: async () => {
    const { data } = await supabase.from("project_teams").select("*").order("created_at", { ascending: false }).limit(50);
    return (data as any[]) || [];
  }});
}
function useAdminCollabs() {
  return useQuery({ queryKey: ["admin-collabs"], queryFn: async () => {
    const { data } = await supabase.from("collaborations").select("*").order("created_at", { ascending: false }).limit(50);
    return (data as any[]) || [];
  }});
}
function useAdminMilestones() {
  return useQuery({ queryKey: ["admin-milestones"], queryFn: async () => {
    const { data } = await supabase.from("project_milestones").select("*").order("due_date", { ascending: true }).limit(50);
    return (data as any[]) || [];
  }});
}
function useAdminProfiles() {
  return useQuery({ queryKey: ["admin-profiles"], queryFn: async () => {
    const { data } = await supabase.from("profiles").select("id, role, full_name, district, university_id, industry_partner_id").limit(50);
    if (!data) return [];
    return data as any[];
  }});
}
function useAdminNotifs() {
  return useQuery({ queryKey: ["admin-notifs"], queryFn: async () => {
    try {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      return (data as any[]) || [];
    } catch { return []; }
  }});
}

export default function AdminPortal() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("challenges");
  const { data: issues } = useIssues();
  const { data: summary } = useDashboardSummary();
  const { data: unis } = useAdminUniversities();
  const { data: industry } = useAdminIndustry();
  const { data: projects } = useAdminProjects();
  const { data: teams } = useAdminTeams();
  const { data: collabs } = useAdminCollabs();
  const { data: milestones } = useAdminMilestones();
  const { data: profiles } = useAdminProfiles();
  const { data: notifs } = useAdminNotifs();

  const updateIssueStatus = useMutation({
    mutationFn: async (vars: { issueId: string; status: string }) => {
      // Resolve public_id vs uuid
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vars.issueId);
      let q = supabase.from("issues").update({ status: vars.status } as any);
      q = isUuid ? (q as any).eq("id", vars.issueId) : (q as any).eq("public_id", vars.issueId);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issues"] }); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const updateProjectStatus = useMutation({
    mutationFn: async (vars: { projectId: string; status: string }) => {
      const { error } = await supabase.from("projects").update({ status: vars.status } as any).eq("id", vars.projectId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); toast({ title: "Project updated" }); },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="mx-auto max-w-[1320px] p-6 lg:p-10">
      <h1 className="display-font text-3xl font-black mb-2 text-[hsl(var(--foreground))]">Government Command Center</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Validation, university & industry orchestration, pilots, deployments, impact.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Challenges", value: issues?.length ?? 0, icon: Target },
          { label: "Universities", value: unis?.length ?? 0, icon: Building },
          { label: "Industry", value: industry?.length ?? 0, icon: Factory },
          { label: "Projects", value: projects?.length ?? 0, icon: FlaskConical },
          { label: "Collabs", value: collabs?.length ?? 0, icon: Handshake },
          { label: "Open Issues", value: summary?.openIssues ?? 0, icon: ShieldCheck },
        ].map(s => (
          <Card key={s.label} className="p-3 border-2 rounded-2xl">
            <div className="flex items-center gap-2 mb-1"><s.icon size={14} className="text-[hsl(var(--primary))]"/><span className="text-sm font-black">{s.value}</span></div>
            <p className="text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wide">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="bg-[hsl(var(--muted))] p-1 rounded-2xl w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="challenges" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Target size={12}/> Challenges</TabsTrigger>
          <TabsTrigger value="validation" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><ShieldCheck size={12}/> Validation</TabsTrigger>
          <TabsTrigger value="evidence" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Eye size={12}/> Evidence</TabsTrigger>
          <TabsTrigger value="universities" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Building size={12}/> Universities</TabsTrigger>
          <TabsTrigger value="industry" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Factory size={12}/> Industry</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Users size={12}/> Users</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><FlaskConical size={12}/> Projects</TabsTrigger>
          <TabsTrigger value="teams" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Users size={12}/> Teams</TabsTrigger>
          <TabsTrigger value="collabs" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Handshake size={12}/> Collaborations</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Target size={12}/> Milestones</TabsTrigger>
          <TabsTrigger value="pilots" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Rocket size={12}/> Pilots</TabsTrigger>
          <TabsTrigger value="deployments" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Wrench size={12}/> Deployments</TabsTrigger>
          <TabsTrigger value="impact" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><BarChart3 size={12}/> Impact</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Bell size={12}/> Notifications</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Activity size={12}/> Analytics</TabsTrigger>
          <TabsTrigger value="sources" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><FileText size={12}/> Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-3">
          {(issues||[]).length===0 ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No challenges yet.</p> : (issues||[]).slice(0,20).map((i:any)=>(
            <Card key={String(i.id)} className="rounded-2xl border-2 p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-bold text-sm line-clamp-2">{i.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">{i.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap"><Badge variant="outline" className="text-[10px]">{i.category}</Badge><Badge variant="outline" className="text-[10px]">{i.district}</Badge><Badge className="text-[10px]">{i.status}</Badge><Badge variant="outline" className="text-[10px]">{i.priority}</Badge></div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={()=>updateIssueStatus.mutate({ issueId: String(i.publicId||i.id), status: "routed" })}>Route</Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={()=>updateIssueStatus.mutate({ issueId: String(i.publicId||i.id), status: "reported" })}>Reset</Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="validation" className="space-y-3">
          {(issues||[]).filter((i:any)=>["Reported","AI Verified","Routed"].includes(i.status)).length===0
            ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No pending validation.</p>
            : (issues||[]).filter((i:any)=>["Reported","AI Verified","Routed"].includes(i.status)).map((i:any)=>(
                <Card key={String(i.id)} className="rounded-2xl border-2 p-4 flex justify-between items-center gap-3">
                  <div><p className="font-bold text-sm">{i.title}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{i.district} · {i.category} · {i.priority}</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl text-xs" onClick={()=>updateIssueStatus.mutate({ issueId: String(i.publicId||i.id), status: "routed" })}><CheckCircle size={12}/> Validate & Route</Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={()=>updateIssueStatus.mutate({ issueId: String(i.publicId||i.id), status: "rejected" })}>Reject</Button>
                  </div>
                </Card>
              ))}
          <Card className="rounded-2xl border-2 p-4"><p className="text-xs font-bold">Validation flow</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Reported → Evidence Review → Verification Required → Site Inspection if needed → Validated (routed) → University matching. Officers retain site-inspection role.</p></Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-3">
          {(issues||[]).length===0 ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No evidence queue.</p> : (issues||[]).slice(0,10).map((i:any)=>(
            <Card key={String(i.id)} className="rounded-2xl border-2 p-4">
              <p className="font-bold text-sm">{i.title}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Evidence items: {(i.evidence||[]).length} · Status: {i.status}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Photo / video / document / location supported at submission. Inspect via challenge detail page.</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="universities" className="space-y-3">
          {(unis||[]).map((u:any)=>(
            <Card key={u.id} className="rounded-2xl border-2 p-4">
              <p className="font-black text-sm">{u.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{u.district} · {(u.academic_disciplines||[]).join(", ")}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{u.data_origin||"PUBLIC_SOURCE"} · {u.verification_status||"VERIFIED"} {u.source_url ? `· ${u.source_url}` : ""}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="industry" className="space-y-3">
          {(industry||[]).map((p:any)=>(
            <Card key={p.id} className="rounded-2xl border-2 p-4">
              <p className="font-black text-sm">{p.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.type} · {p.industry_domain} · {(p.expertise||[]).join(", ")}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{p.data_origin||"DEMO"} · {p.verification_status||"DEMO"} {p.source_url?`· ${p.source_url}`:""}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-3">
          <Card className="rounded-2xl border-2 p-4 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Role</TableHead><TableHead>Name</TableHead><TableHead>District</TableHead></TableRow></TableHeader>
              <TableBody>
                {(profiles||[]).map((pr:any)=>(
                  <TableRow key={pr.id}><TableCell className="text-xs font-mono">{String(pr.id).slice(0,8)}</TableCell><TableCell><Badge variant="outline" className="text-[10px]">{pr.role}</Badge></TableCell><TableCell className="text-xs">{pr.full_name||"—"}</TableCell><TableCell className="text-xs">{pr.district||"—"}</TableCell></TableRow>
                ))}
                {!(profiles||[]).length && <TableRow><TableCell colSpan={4} className="text-xs text-center text-[hsl(var(--muted-foreground))]">No profiles (table may be empty or RLS restricted).</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-3">
          {(projects||[]).map((p:any)=>(
            <Card key={p.id} className="rounded-2xl border-2 p-4 flex justify-between gap-3">
              <div><p className="font-bold text-sm line-clamp-2">{p.title}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{String(p.status).replace(/_/g," ")} · {new Date(p.created_at).toLocaleDateString()}</p></div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={()=>updateProjectStatus.mutate({ projectId: p.id, status: "prototype" })}>To Prototype</Button>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={()=>updateProjectStatus.mutate({ projectId: p.id, status: "testing" })}>To Testing</Button>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={()=>updateProjectStatus.mutate({ projectId: p.id, status: "pilot" })}>To Pilot</Button>
              </div>
            </Card>
          ))}
          {!(projects||[]).length && <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No projects.</p>}
        </TabsContent>

        <TabsContent value="teams" className="space-y-3">
          {(teams||[]).map((t:any)=>(
            <Card key={t.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">Team {String(t.id).slice(0,8)} · Project {String(t.project_id).slice(0,8)}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{Array.isArray(t.students)?t.students.map((s:any)=>s.name).join(", "):""} · {(t.disciplines||[]).join(", ")}</p></Card>
          ))}
          {!(teams||[]).length && <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No teams.</p>}
        </TabsContent>

        <TabsContent value="collabs" className="space-y-3">
          {(collabs||[]).map((c:any)=>(
            <Card key={c.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">Project {String(c.project_id).slice(0,8)} → Industry {String(c.industry_partner_id).slice(0,8)} · <Badge className="text-[10px]">{c.status}</Badge></p><p className="text-xs text-[hsl(var(--muted-foreground))]">Support: {(c.support_type||[]).join(", ")||"—"}</p></Card>
          ))}
          {!(collabs||[]).length && <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No collaborations.</p>}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-2">
          {(milestones||[]).map((m:any)=>(<Card key={m.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">{m.title}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{m.description||""} · Due {m.due_date||"—"} · {m.status}</p></Card>))}
          {!(milestones||[]).length && <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No milestones.</p>}
        </TabsContent>

        <TabsContent value="pilots" className="space-y-3">
          {(projects||[]).filter((p:any)=>p.status==="pilot").length===0 ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No pilots.</p> : (projects||[]).filter((p:any)=>p.status==="pilot").map((p:any)=>(<Card key={p.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">{p.title}</p><p className="text-xs">Pilot deployment</p></Card>))}
        </TabsContent>

        <TabsContent value="deployments" className="space-y-3">
          {(projects||[]).filter((p:any)=>["deployed","completed"].includes(p.status)).length===0 ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No deployments.</p> : (projects||[]).filter((p:any)=>["deployed","completed"].includes(p.status)).map((p:any)=>(<Card key={p.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">{p.title}</p><p className="text-xs capitalize">{p.status}</p></Card>))}
        </TabsContent>

        <TabsContent value="impact" className="space-y-3">
          {(projects||[]).filter((p:any)=>p.impact_metrics && Object.keys(p.impact_metrics).length>0).length===0 ? <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No impact recorded yet.</p> : (projects||[]).filter((p:any)=>p.impact_metrics && Object.keys(p.impact_metrics).length>0).map((p:any)=>(<Card key={p.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">{p.title}</p><pre className="text-[11px] whitespace-pre-wrap mt-1">{JSON.stringify(p.impact_metrics,null,2)}</pre></Card>))}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-2">
          {(notifs||[]).map((n:any)=>(<Card key={n.id} className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">{n.title||n.type}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{n.body||n.message||""}</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">{new Date(n.created_at).toLocaleString()}</p></Card>))}
          {!(notifs||[]).length && <p className="text-xs p-4 border-2 border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))]">No notifications.</p>}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          <Card className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">Ecosystem analytics</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
              <div className="rounded-xl border p-3"><p className="font-black text-lg">{issues?.length??0}</p><p className="text-[hsl(var(--muted-foreground))]">Challenges</p></div>
              <div className="rounded-xl border p-3"><p className="font-black text-lg">{projects?.length??0}</p><p className="text-[hsl(var(--muted-foreground))]">Projects</p></div>
              <div className="rounded-xl border p-3"><p className="font-black text-lg">{collabs?.length??0}</p><p className="text-[hsl(var(--muted-foreground))]">Collaborations</p></div>
              <div className="rounded-xl border p-3"><p className="font-black text-lg">{notifs?.length??0}</p><p className="text-[hsl(var(--muted-foreground))]">Notifications</p></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-3">
          <Card className="rounded-2xl border-2 p-4"><p className="font-bold text-sm">Data sources & provenance</p>
            <div className="mt-3 space-y-2 text-xs">
              <p><strong>Universities:</strong> baujharkhand.org, nitjsr.ac.in, cuj.ac.in — PUBLIC_SOURCE, VERIFIED.</p>
              <p><strong>Seed challenges/projects/collaborations:</strong> DEMO, verification_status=DEMO.</p>
              <p><strong>Departments/Officers:</strong> fallback DEMO lists when Supabase tables not yet populated.</p>
              <p className="text-[hsl(var(--muted-foreground))]">Each record stores source_url / verified_at / data_origin / verification_status for audit.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
