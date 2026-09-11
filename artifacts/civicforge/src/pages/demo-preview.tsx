import { useState } from "react";
import { Link } from "wouter";
import { Building2, BriefcaseBusiness, GraduationCap, ShieldCheck, HardHat, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Deliberately static fixtures. This page never imports live data services or
// modifies Auth state. The URL identifies a preview, never an authorization role.
const personas = {
  citizen: { label: "Citizen", icon: User, title: "Your community", subtitle: "Explore sample challenges from Ranchi", stats: ["3 community challenges", "2 in progress", "1 completed"], tabs: ["Community feed", "My reports"], action: "Vote" },
  officer: { label: "Officer", icon: HardHat, title: "Field officer workspace", subtitle: "Demo officer · Ranchi district", stats: ["3 assigned challenges", "1 inspection pending", "1 resolved"], tabs: ["Assigned challenges", "Inspections"], action: "Update status" },
  admin: { label: "Admin", icon: ShieldCheck, title: "Government overview", subtitle: "Demo government workspace · Jharkhand", stats: ["3 validated challenges", "2 active projects", "1 legal review"], tabs: ["Projects", "Legal & funding"], action: "Review case" },
  university_admin: { label: "University", icon: GraduationCap, title: "University workspace", subtitle: "Jharkhand Institute of Innovation & Technology", stats: ["1 pending assignment", "2 active projects", "4 students · 1 mentor"], tabs: ["Assignments", "Team & milestones"], action: "Accept assignment" },
  industry_partner: { label: "Industry", icon: BriefcaseBusiness, title: "Industry workspace", subtitle: "Jharkhand Civic Innovation Labs", stats: ["3 recommended projects", "1 collaboration", "2 support opportunities"], tabs: ["Recommended projects", "Collaborations"], action: "Express interest" },
} as const;
type Persona = keyof typeof personas;
const projects = [
  { title: "Solar-powered drinking water monitoring", category: "Water", location: "Ranchi · Kanke", status: "Assigned", votes: 42, ai: "High", summary: "Sample sensor network to monitor drinking water quality at community water points." },
  { title: "Community waste collection tracker", category: "Sanitation", location: "Ranchi · Doranda", status: "In progress", votes: 28, ai: "Medium", summary: "Sample collection schedule and resident feedback project for cleaner neighbourhoods." },
  { title: "Accessible school crossing", category: "Road safety", location: "Ranchi · Lalpur", status: "Completed", votes: 61, ai: "High", summary: "Sample pedestrian safety improvements near a school entrance." },
];

export default function DemoPreview({ persona }: { persona: string }) {
  if (!Object.prototype.hasOwnProperty.call(personas, persona)) return <main className="p-10"><h1>Demo persona not found</h1><Link href="/demo/citizen" className="underline">Open citizen demo</Link></main>;
  return <PreviewWorkspace key={persona} persona={persona as Persona} />;
}

function PreviewWorkspace({ persona }: { persona: Persona }) {
  const config = personas[persona];
  const Icon = config.icon;
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="noise-layer min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm" role="status">
      <strong>DEMO PREVIEW</strong> · Sample data only · No authentication or live changes
    </div>
    <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 p-5">
        <Link href="/" className="display-font text-2xl font-bold">JANSAMVAD</Link>
        <span className="flex items-center gap-2 text-sm"><Icon size={18} />Preview persona: <strong>{config.label}</strong></span>
        <Link href="/" className="flex items-center gap-2 text-sm underline"><ArrowLeft size={16} />Exit preview</Link>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <nav aria-label="Demo personas" className="flex flex-wrap gap-2">{Object.entries(personas).map(([key, value]) => <Link key={key} href={`/demo/${key}`} aria-current={persona === key ? "page" : undefined} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${persona === key ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--card))]"}`}>{value.label}</Link>)}</nav>
      <section className="space-y-2">
        <Badge variant="outline">DEMO / TEST WORKSPACE</Badge>
        <h1 className="display-font text-3xl font-bold sm:text-4xl">{config.title}</h1>
        <p className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]"><Building2 size={18} />{config.subtitle}</p>
        {(persona === "university_admin" || persona === "industry_partner") && <p className="text-xs text-[hsl(var(--muted-foreground))]">Data origin: DEMO · Verification: DEMO · Fictional institution/partner for preview purposes.</p>}
      </section>
      <div className="grid gap-4 sm:grid-cols-3">{config.stats.map(stat => <Card key={stat}><CardContent className="pt-6"><p className="text-lg font-bold">{stat}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Sample metric</p></CardContent></Card>)}</div>
      <div className="flex gap-2" role="group" aria-label="Workspace sections">{config.tabs.map((name, index) => <Button key={name} variant={tab === index ? "default" : "outline"} aria-pressed={tab === index} onClick={() => setTab(index)}>{name}</Button>)}</div>
      {tab === 0 ? <div className="grid gap-4 lg:grid-cols-3">{projects.map(project => <Card key={project.title}>
        <CardHeader><div className="flex justify-between gap-2"><Badge variant="secondary">{project.category}</Badge><Badge variant="outline">{project.status}</Badge></div><CardTitle className="pt-3 text-lg">{project.title}</CardTitle><p className="text-xs text-[hsl(var(--muted-foreground))]">{project.location}</p></CardHeader>
        <CardContent className="space-y-4"><p className="text-sm">{project.summary}</p><p className="text-xs">AI priority: {project.ai} · Community votes: {project.votes} (sample)</p>
          <Button variant="outline" onClick={() => setExpanded(expanded === project.title ? null : project.title)} aria-expanded={expanded === project.title}>{expanded === project.title ? "Hide details" : "View sample details"}</Button>
          {expanded === project.title && <div className="rounded-lg bg-[hsl(var(--muted))] p-3 text-sm"><p>Milestones: research completed → prototype in progress → field pilot planned.</p><p className="mt-2">Sample team: 4 students and 1 faculty mentor.</p></div>}
          <Button disabled className="w-full">{config.action} · Requires real sign-in</Button>
        </CardContent></Card>)}</div> : <Card><CardHeader><CardTitle>{config.tabs[1]} · Sample data</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
          {persona === "university_admin" ? <><p>Solar-powered drinking water monitoring</p><p>Demo Student Aarav · Computing · Year 3 · Active</p><p>Demo Student Neha · Environment · Year 2 · Active</p><p>Demo Student Ravi · Computing · Year 3 · Active</p><p>Demo Student Priya · Environment · Year 2 · Active</p><p>Demo Faculty Mentor · Water Resources · Active</p><p>Research: completed · Prototype: in progress · Field pilot: planned</p></> : persona === "industry_partner" ? <><p>Solar-powered drinking water monitoring · Sample collaboration</p><p>Support: sensor prototyping and technical mentorship</p><p>Partner: Jharkhand Civic Innovation Labs · DEMO</p></> : persona === "admin" ? <><p>Sample legal case: solar-powered drinking water monitoring · Under review</p><p>Proposed funding: ₹1,00,000 · No funds committed or released</p><p>Research: ₹20,000 · Prototype: ₹40,000 · Field pilot: ₹40,000</p><p>Illustrative milestone schedule only.</p></> : persona === "officer" ? <><p>Water monitoring site · Sample inspection pending</p><p>School crossing · Sample inspection completed</p></> : <><p>Community waste collection tracker · Sample report in progress</p><p>Accessible school crossing · Sample report completed</p></>}
          <p className="border-t pt-4 text-[hsl(var(--muted-foreground))]">This preview is read-only. Real submissions, approvals, funding, voting and team changes require a provisioned account.</p>
        </CardContent></Card>}
    </main>
  </div>;
}
