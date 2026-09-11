import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUniversities } from "@/services/universityService";
import { useAuth } from "@/lib/auth-context";
import { useIssues } from "@/lib/jansamvad-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Users, Wrench, FileText, Target, Activity, CheckCircle, Building, Layers,
  BookOpen, FlaskConical, GraduationCap, UsersRound, Lightbulb, BarChart3, Megaphone, Beaker,
  Rocket, Award, Bell, Plus, Eye, UserPlus, Send, Calendar, Handshake,
} from "lucide-react";

function useUniversityProjects(universityId?: string) {
  return useQuery({
    queryKey: ["uni-projects", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data } = await supabase.from("projects").select("*").eq("university_id", universityId).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: Boolean(universityId),
  });
}

function useUniversityTeams(universityId?: string) {
  return useQuery({
    queryKey: ["uni-teams", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data: projs } = await supabase.from("projects").select("id").eq("university_id", universityId);
      const ids = (projs || []).map((p: any) => p.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("project_teams").select("*").in("project_id", ids);
      return (data as any[]) || [];
    },
    enabled: Boolean(universityId),
  });
}

function useUniversityMilestones(universityId?: string) {
  return useQuery({
    queryKey: ["uni-milestones", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data: projs } = await supabase.from("projects").select("id").eq("university_id", universityId);
      const ids = (projs || []).map((p: any) => p.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("project_milestones").select("*").in("project_id", ids).order("due_date", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: Boolean(universityId),
  });
}

function useUniversityCollaborations(universityId?: string) {
  return useQuery({
    queryKey: ["uni-collabs", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data: projs } = await supabase.from("projects").select("id").eq("university_id", universityId);
      const ids = (projs || []).map((p: any) => p.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("collaborations").select("*").in("project_id", ids);
      return (data as any[]) || [];
    },
    enabled: Boolean(universityId),
  });
}

function useUniversityNotifications(universityId?: string) {
  return useQuery({
    queryKey: ["uni-notifs", universityId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("notifications").select("*").eq("university_id", universityId as string).order("created_at", { ascending: false }).limit(20);
        if (error) return [];
        return (data as any[]) || [];
      } catch { return []; }
    },
    enabled: Boolean(universityId),
  });
}

function useDepartmentsDb(universityId?: string) {
  return useQuery({
    queryKey: ["uni-departments", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      try {
        const { data } = await supabase.from("university_departments").select("*").eq("university_id", universityId).order("name");
        return (data as any[]) || [];
      } catch { return []; }
    },
    enabled: Boolean(universityId),
  });
}

function useUniversityPeople(universityId?: string) {
  return useQuery({
    queryKey: ["uni-people", universityId],
    queryFn: async () => {
      if (!universityId) return { faculty: [], students: [] };
      const [faculty, students] = await Promise.all([
        supabase.from("faculty").select("*").eq("university_id", universityId).eq("active", true).order("name"),
        supabase.from("students").select("*").eq("university_id", universityId).eq("active", true).order("name"),
      ]);
      if (faculty.error) throw faculty.error;
      if (students.error) throw students.error;
      return { faculty: faculty.data || [], students: students.data || [] };
    }, enabled: Boolean(universityId),
  });
}

export default function UniversityPortal() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [evalIssueId, setEvalIssueId] = useState<string | null>(null);
  const [assignFacultyName, setAssignFacultyName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");

  const { data: unis, isLoading } = useUniversities();
  const university = unis?.find((u) => u.id === profile?.university_id) || unis?.[0];
  const { data: projects } = useUniversityProjects(university?.id);
  const { data: teams } = useUniversityTeams(university?.id);
  const { data: milestones } = useUniversityMilestones(university?.id);
  const { data: collabs } = useUniversityCollaborations(university?.id);
  const { data: notifs } = useUniversityNotifications(university?.id);
  const { data: departmentsDb } = useDepartmentsDb(university?.id);
  const { data: people } = useUniversityPeople(university?.id);
  const { data: issues } = useIssues();

  // Recommended challenges: issues that are validated/routed and not yet linked to a project for this uni
  const recommended = (issues || []).filter((i: any) =>
    ["Routed", "AI Verified", "Reported", "Accepted"].includes(i.status)
  ).slice(0, 6);

  const faculty = people?.faculty || [];
  const students = people?.students || [];

  const acceptChallenge = useMutation({
    mutationFn: async (issueId: string) => {
      if (!university) throw new Error("No university");
      // Create a project linked to this issue + university
      const issue = (issues || []).find((x: any) => String(x.id) === String(issueId) || String(x.publicId) === String(issueId));
      const title = issue ? `${issue.title} — University Solution` : `Challenge ${String(issueId).slice(0, 8)}`;
      const payload: any = { title, status: "proposal", university_id: university.id };
      if (issue?.id) {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRe.test(String(issue.id))) payload.issue_id = issue.id;
      }
      const { data, error } = await supabase.from("projects").insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uni-projects"] });
      toast({ title: "Challenge accepted", description: "Project created. Assign faculty and form a team next." });
      setActiveTab("projects");
    },
    onError: (e: any) => toast({ title: "Could not accept challenge", description: e.message, variant: "destructive" }),
  });

  const createTeam = useMutation({
    mutationFn: async (vars: { projectId: string }) => {
      const payload: any = { project_id: vars.projectId, students: students.slice(0, 4).map((s: any) => ({ id: s.id, name: s.name, skills: s.skills })), disciplines: [...new Set(students.slice(0, 4).flatMap((s: any) => s.skills || []))] };
      if (assignFacultyName) payload.faculty_mentor_id = assignFacultyName;
      const { data, error } = await supabase.from("project_teams").insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uni-teams"] });
      toast({ title: "Team created" });
    },
    onError: (e: any) => toast({ title: "Team creation failed", description: e.message, variant: "destructive" }),
  });

  const createProposal = useMutation({
    mutationFn: async (vars: { projectId: string }) => {
      const { error } = await supabase.from("projects").update({ status: "team_formed" } as any).eq("id", vars.projectId);
      if (error) throw error;
      // Add a milestone as proposal submission marker
      await supabase.from("project_milestones").insert([{ project_id: vars.projectId, title: proposalTitle || "Proposal Submitted", description: "Initial proposal submitted for review", due_date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), status: "pending" }]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uni-projects"] });
      qc.invalidateQueries({ queryKey: ["uni-milestones"] });
      toast({ title: "Proposal submitted", description: "Project moved to Team Formed. Add milestones next." });
      setProposalTitle("");
    },
    onError: (e: any) => toast({ title: "Proposal failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-10 text-center text-sm font-semibold">Loading Ecosystem…</div>;
  if (!university) return (
    <div className="p-10 text-center">
      <h2 className="text-lg font-black mb-2">University workspace is being provisioned</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Your authenticated university-admin account is provisioned automatically from the seeded ecosystem. If this remains visible, the database migrations have not yet been applied.</p>
    </div>
  );

  const statItems = [
    { label: "Challenges", value: issues?.length ?? 0, icon: Target },
    { label: "Projects", value: projects?.length ?? 0, icon: Activity },
    { label: "Teams", value: teams?.length ?? 0, icon: UsersRound },
    { label: "Milestones", value: milestones?.length ?? 0, icon: Calendar },
    { label: "Collabs", value: collabs?.length ?? 0, icon: Handshake },
    { label: "Departments", value: departmentsDb?.length ?? (university.academic_disciplines?.length ?? 0), icon: Building },
  ];

  return (
    <div className="mx-auto max-w-[1320px] p-6 lg:p-10">
      <div className="flex flex-col md:flex-row justify-between mb-6 items-start gap-4">
        <div>
          <h1 className="display-font text-3xl font-black mb-1 text-[hsl(var(--foreground))]">{university.name}</h1>
          <div className="flex gap-2 items-center text-xs text-[hsl(var(--muted-foreground))]">
            <Building size={14} /> {university.district}
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">VERIFIED</Badge>
            <span className="hidden sm:inline">· {university.description?.slice(0, 80)}</span>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setActiveTab("institution")}>View Institution Profile</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statItems.map((stat) => (
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
        <TabsList className="bg-[hsl(var(--muted))] p-1 rounded-2xl w-full justify-start overflow-auto flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Layers size={12} /> Overview</TabsTrigger>
          <TabsTrigger value="recommended" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Lightbulb size={12} /> Recommended</TabsTrigger>
          <TabsTrigger value="evaluation" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Beaker size={12} /> Evaluation</TabsTrigger>
          <TabsTrigger value="institution" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Building size={12} /> Institution</TabsTrigger>
          <TabsTrigger value="departments" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><BookOpen size={12} /> Departments</TabsTrigger>
          <TabsTrigger value="faculty" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><GraduationCap size={12} /> Faculty</TabsTrigger>
          <TabsTrigger value="students" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Users size={12} /> Students</TabsTrigger>
          <TabsTrigger value="teams" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><UsersRound size={12} /> Teams</TabsTrigger>
          <TabsTrigger value="proposals" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><FileText size={12} /> Proposals</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><FlaskConical size={12} /> Projects</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Calendar size={12} /> Milestones</TabsTrigger>
          <TabsTrigger value="collab" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Handshake size={12} /> Industry</TabsTrigger>
          <TabsTrigger value="testing" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Wrench size={12} /> Testing</TabsTrigger>
          <TabsTrigger value="pilot" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Rocket size={12} /> Pilot</TabsTrigger>
          <TabsTrigger value="impact" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Award size={12} /> Impact</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-3 py-2 text-xs font-bold gap-1"><Bell size={12} /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-sm flex gap-2 items-center"><Target size={14} /> At a glance</CardTitle></CardHeader><CardContent className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <p><strong className="text-[hsl(var(--foreground))]">{projects?.length ?? 0}</strong> active projects · <strong className="text-[hsl(var(--foreground))]">{recommended.length}</strong> recommended challenges</p>
              <p>{university.academic_disciplines?.join(" · ") || "—"}</p>
            </CardContent></Card>
            <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-sm flex gap-2 items-center"><BarChart3 size={14} /> Pipeline</CardTitle></CardHeader><CardContent className="text-xs space-y-1">
              {(["proposal","team_formed","prototype","testing","pilot","deployed","completed"] as const).map(s => {
                const n = (projects || []).filter((p: any) => p.status === s).length;
                return <div key={s} className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))] capitalize">{s.replace("_"," ")}</span><Badge variant="outline" className="text-[10px]">{n}</Badge></div>;
              })}
            </CardContent></Card>
            <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-sm flex gap-2 items-center"><Megaphone size={14} /> Next actions</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">
              <Button size="sm" className="rounded-xl text-xs" onClick={() => setActiveTab("recommended")}><Eye size={12} /> View recommended</Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setActiveTab("projects")}><FlaskConical size={12} /> Open projects</Button>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          {recommended.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed rounded-2xl text-xs font-bold text-[hsl(var(--muted-foreground))]">No recommendations yet — create civic challenges via Report, then validate in Admin.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommended.map((iss: any) => (
                <Card key={String(iss.id)} className="rounded-2xl border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm leading-tight line-clamp-2">{iss.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{iss.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{iss.district}</Badge>
                      <Badge className="text-[10px]">{iss.priority}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3">{iss.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => { setEvalIssueId(String(iss.id)); setActiveTab("evaluation"); }}><Eye size={12} /> Evaluate</Button>
                      <Button size="sm" className="rounded-xl text-xs" onClick={() => acceptChallenge.mutate(String(iss.publicId || iss.id))} disabled={acceptChallenge.isPending}><CheckCircle size={12} /> Accept</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-sm flex gap-2 items-center"><Beaker size={14}/> Challenge Evaluation</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              {!evalIssueId ? <p className="text-[hsl(var(--muted-foreground))]">Select a challenge from Recommended → Evaluate to review it here.</p> : (() => {
                const iss: any = (issues || []).find((x: any) => String(x.id) === evalIssueId || String(x.publicId) === evalIssueId);
                if (!iss) return <p>Challenge not found.</p>;
                return (
                  <div className="space-y-3">
                    <h3 className="font-black text-sm">{iss.title}</h3>
                    <p className="text-[hsl(var(--muted-foreground))]">{iss.description}</p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span>District: <strong>{iss.district}</strong></span>
                      <span>Category: <strong>{iss.category}</strong></span>
                      <span>Priority: <Badge className="text-[10px]">{iss.priority}</Badge></span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 pt-2">
                      <div className="rounded-xl border p-3"><p className="font-bold mb-1">Evidence</p><p className="text-[hsl(var(--muted-foreground))]">{(iss.evidence?.length ?? 0)} item(s) {iss.evidence?.length ? "— review in challenge detail" : "— none uploaded yet"}</p></div>
                      <div className="rounded-xl border p-3"><p className="font-bold mb-1">AI Analysis</p><p className="text-[hsl(var(--muted-foreground))]">Priority {iss.priorityScore ?? "—"}/100 · {iss.department ?? ""}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-xl" onClick={() => acceptChallenge.mutate(String(iss.publicId || iss.id))} disabled={acceptChallenge.isPending}><CheckCircle size={12}/> Accept & Create Project</Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEvalIssueId(null)}>Clear</Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="institution" className="space-y-4">
          <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-sm">Institution Profile</CardTitle></CardHeader><CardContent className="text-xs space-y-2">
            <p><strong>Name:</strong> {university.name}</p>
            <p><strong>District:</strong> {university.district}</p>
            <p className="text-[hsl(var(--muted-foreground))]">{university.description}</p>
            <p><strong>Facilities:</strong> {(university.facilities || []).join(", ") || "—"}</p>
            <p><strong>Disciplines:</strong> {(university.academic_disciplines || []).join(", ") || "—"}</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(departmentsDb?.length ? departmentsDb : (university.academic_disciplines || []).map((d: string) => ({ id: d, name: d, code: d.slice(0,4).toUpperCase() })) ).map((d: any) => (
              <Card key={String(d.id)} className="rounded-2xl border-2 p-4">
                <p className="font-black text-sm">{d.name}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{d.code || ""}</p>
              </Card>
            ))}
            {!departmentsDb?.length && !(university.academic_disciplines || []).length && <p className="text-xs text-[hsl(var(--muted-foreground))]">No departments yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {faculty.map(f => (
              <Card key={f.name} className="rounded-2xl border-2 p-4">
                <p className="font-bold text-sm">{f.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.dept} · {f.expertise}</p>
                <Button size="sm" variant="outline" className="mt-2 rounded-xl text-[11px] h-7" onClick={() => { setAssignFacultyName(f.id); toast({ title: "Faculty selected", description: `${f.name} will be used for the next team.` }); }}><UserPlus size={12}/> Assign</Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {students.map(s => (
              <Card key={s.name} className="rounded-2xl border-2 p-3 text-center">
                <p className="font-bold text-xs">{s.name}</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{s.discipline} · Y{s.year}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {(teams || []).length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No teams yet — accept a challenge, assign faculty, then create a team.</p> : (
            <div className="grid md:grid-cols-2 gap-3">
              {(teams || []).map((t: any) => (
                <Card key={t.id} className="rounded-2xl border-2 p-4">
                  <p className="font-bold text-sm">Team {String(t.id).slice(0, 8)}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Project: {String(t.project_id).slice(0, 8)} · Mentor: {t.faculty_mentor_id || "—"}</p>
                  <p className="text-xs mt-1">{Array.isArray(t.students) ? t.students.map((s: any) => s.name).join(", ") : ""}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{(t.disciplines || []).join(", ")}</p>
                </Card>
              ))}
            </div>
          )}
          {(projects || []).length > 0 && (
            <Card className="rounded-2xl border-2 p-4">
              <p className="font-bold text-sm mb-2">Create team for a project</p>
              <div className="flex flex-wrap gap-2">
                {(projects || []).slice(0, 4).map((p: any) => (
                  <Button key={p.id} size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => createTeam.mutate({ projectId: p.id })} disabled={createTeam.isPending}><UsersRound size={12}/> Team for {String(p.title).slice(0, 22)}</Button>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <Card className="rounded-2xl border-2 p-4">
            <p className="font-bold text-sm mb-2">Submit proposal (creates milestone + advances project)</p>
            <div className="flex flex-col md:flex-row gap-2">
              <input value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} placeholder="Proposal / milestone title" className="flex-1 rounded-xl border px-3 py-2 text-xs" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(projects || []).filter((p: any) => p.status === "proposal" || p.status === "team_formed").slice(0, 4).map((p: any) => (
                <Button key={p.id} size="sm" className="rounded-xl text-xs" onClick={() => createProposal.mutate({ projectId: p.id })} disabled={createProposal.isPending}><Send size={12}/> Submit for {String(p.title).slice(0, 18)}</Button>
              ))}
              {(projects || []).filter((p: any) => p.status === "proposal" || p.status === "team_formed").length === 0 && <p className="text-xs text-[hsl(var(--muted-foreground))]">No proposal-stage projects. Accept a challenge first.</p>}
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-3">
            {(projects || []).map((p: any) => (
              <Card key={p.id} className="rounded-2xl border-2 p-4">
                <p className="font-bold text-sm line-clamp-2">{p.title}</p>
                <Badge variant="outline" className="text-[10px] mt-1 capitalize">{String(p.status).replace("_"," ")}</Badge>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {(projects || []).length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No projects yet.</p> : (
            <div className="grid md:grid-cols-2 gap-3">
              {(projects || []).map((p: any) => (
                <Card key={p.id} className="rounded-2xl border-2 p-4">
                  <p className="font-black text-sm line-clamp-2">{p.title}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className="text-[10px] capitalize">{String(p.status).replace(/_/g," ")}</Badge>
                    {p.issue_id && <Badge variant="outline" className="text-[10px]">Linked challenge</Badge>}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">{new Date(p.created_at).toLocaleString()}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={() => { setTeamName(String(p.id)); toast({ title: "Project workspace", description: "Use Teams / Milestones tabs to manage this project." }); }}><Layers size={12}/> Workspace</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {(milestones || []).length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No milestones — submit a proposal to generate the first milestone.</p> : (
            <div className="space-y-2">
              {(milestones || []).map((m: any) => (
                <Card key={m.id} className="rounded-2xl border-2 p-4 flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-sm">{m.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.description || ""}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Due: {m.due_date || "—"} · <Badge variant="outline" className="text-[10px]">{m.status}</Badge></p>
                  </div>
                  {m.status !== "completed" && (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={async () => {
                      const { error } = await supabase.from("project_milestones").update({ status: "completed", completed_at: new Date().toISOString() } as any).eq("id", m.id);
                      if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
                      else { qc.invalidateQueries({ queryKey: ["uni-milestones"] }); toast({ title: "Milestone completed" }); }
                    }}><CheckCircle size={12}/> Complete</Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collab" className="space-y-4">
          {(collabs || []).length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No industry collaborations yet — industry partners can express interest from /industry.</p> : (
            <div className="space-y-2">
              {(collabs || []).map((c: any) => (
                <Card key={c.id} className="rounded-2xl border-2 p-4">
                  <p className="font-bold text-sm">Project {String(c.project_id).slice(0, 8)} · {c.status}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Support: {(c.support_type || []).join(", ") || "—"}</p>
                </Card>
              ))}
            </div>
          )}
          <Card className="rounded-2xl border-2 p-4"><p className="text-xs font-bold mb-1">How collaboration works</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Industry views Discover projects → Express Interest → chooses support type (mentorship/funding/testing/pilot) → Collaboration requested → University accepts → Active.</p></Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card className="rounded-2xl border-2 p-6 text-center"><Wrench className="mx-auto mb-2 text-[hsl(var(--primary))]" size={20}/><p className="font-bold text-sm">Testing</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Lab and field testing tracked via milestones. Mark prototype/testing milestones complete to advance toward pilot.</p></Card>
        </TabsContent>
        <TabsContent value="pilot" className="space-y-4">
          <Card className="rounded-2xl border-2 p-6 text-center"><Rocket className="mx-auto mb-2 text-[hsl(var(--primary))]" size={20}/><p className="font-bold text-sm">Pilot</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Pilot deployments are tracked as milestones with status pilot. Create a pilot milestone from the project workspace.</p>
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {(projects || []).filter((p: any) => ["prototype","testing","pilot"].includes(p.status)).slice(0,3).map((p: any) => (
                <Button key={p.id} size="sm" variant="outline" className="rounded-xl text-xs" onClick={async () => {
                  await supabase.from("project_milestones").insert([{ project_id: p.id, title: "Pilot Deployment", description: "Field pilot with community", due_date: new Date(Date.now()+30*864e5).toISOString().slice(0,10), status: "pending" }]);
                  qc.invalidateQueries({ queryKey: ["uni-milestones"] }); toast({ title: "Pilot milestone created" });
                }}><Plus size={12}/> Pilot for {String(p.title).slice(0,16)}</Button>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="impact" className="space-y-4">
          <Card className="rounded-2xl border-2 p-4">
            <p className="font-bold text-sm flex gap-2 items-center"><Award size={14}/> Impact</p>
            <div className="grid md:grid-cols-3 gap-3 mt-3">
              {(projects || []).filter((p: any) => p.impact_metrics && Object.keys(p.impact_metrics).length > 0).length === 0
                ? <p className="text-xs text-[hsl(var(--muted-foreground))] col-span-3">No impact recorded yet — completed/pilot projects will surface impact_metrics here.</p>
                : (projects || []).filter((p: any) => p.impact_metrics && Object.keys(p.impact_metrics).length>0).map((p: any) => (
                    <Card key={p.id} className="rounded-xl border p-3"><p className="font-bold text-xs line-clamp-2">{p.title}</p><pre className="text-[11px] mt-1 whitespace-pre-wrap">{JSON.stringify(p.impact_metrics, null, 2)}</pre></Card>
                  ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-3">
          {(notifs || []).length === 0 ? <p className="text-xs text-[hsl(var(--muted-foreground))] p-4 border-2 border-dashed rounded-2xl text-center">No notifications.</p> : (notifs || []).map((n: any) => (
            <Card key={n.id} className="rounded-2xl border-2 p-4">
              <p className="font-bold text-sm">{n.title || n.type || "Notification"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{n.body || n.message || ""}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{new Date(n.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
