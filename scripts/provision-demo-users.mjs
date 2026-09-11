/*
 * Server-side, idempotent local/demo provisioning. Never import this from the
 * browser bundle. Requires SUPABASE_SERVICE_ROLE_KEY; password is demo-only.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

async function loadLocalEnv() {
  for (const file of [".env.local", "artifacts/api-server/.env.local"]) {
    try {
      const text = await readFile(resolve(process.cwd(), file), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    } catch { /* optional local file */ }
  }
}

await loadLocalEnv();
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = "JansamvadDemo@2026!";
const missing = [!url && "SUPABASE_URL", !serviceKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
if (missing.length) {
  throw new Error(`Demo provisioning blocked: missing server credential/configuration: ${missing.join(", ")}. No Auth users or profiles were changed.`);
}
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  ["citizen@jansamvad.gov.in", "citizen", "Demo Citizen"],
  ["admin@jansamvad.gov.in", "admin", "Demo Government Administrator"],
  ["officer@jansamvad.gov.in", "officer", "Demo Field Officer"],
  ["university@jansamvad.gov.in", "university_admin", "Demo University Administrator"],
  ["industry@jansamvad.gov.in", "industry_partner", "Demo Industry Partner"],
];

async function findUser(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match || data.users.length < 1000) return match;
  }
}

async function entityId(table, values) {
  const { data, error } = await supabase.from(table).upsert(values, { onConflict: "name" }).select("id").single();
  if (error) throw new Error(`${table} provisioning failed: ${error.message}`);
  return data.id;
}

const universityId = await entityId("universities", {
  name: "Jharkhand Institute of Innovation & Technology", district: "Ranchi", city: "Ranchi", state: "Jharkhand",
  institution_type: "DEMO", academic_disciplines: ["Agriculture", "Water", "Healthcare", "Education", "Environment"],
  research_areas: ["Societal Innovation", "Applied AI"], facilities: ["Innovation Lab", "Prototype Lab"],
  description: "DEMO institution for SIH26043 workflow testing; not a real partnership.", data_origin: "DEMO", verification_status: "DEMO",
});
const partnerId = await entityId("industry_partners", {
  name: "Jharkhand Civic Innovation Labs", type: "Innovation", industry_domain: "Civic Technology",
  expertise: ["IoT", "AI", "Prototype Engineering"], capabilities: ["Mentorship", "Prototyping", "Testing", "Pilot", "Deployment"],
  funding_capacity: "DEMO — no commitment", description: "DEMO partner for workflow testing; not a real partnership.",
  data_origin: "DEMO", verification_status: "DEMO",
});

for (const [email, role, fullName] of accounts) {
  const metadata = { role, full_name: fullName, data_origin: "DEMO" };
  let user = await findUser(email);
  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: metadata });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
    if (error || !data.user) throw error || new Error(`Could not create ${email}`);
    user = data.user;
  }
  const profile = { id: user.id, role, full_name: fullName, district: "Ranchi", university_id: role === "university_admin" ? universityId : null, industry_partner_id: role === "industry_partner" ? partnerId : null };
  const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
  if (error) throw new Error(`Profile provisioning failed for ${email}: ${error.message}`);
}

const { data: departments, error: departmentError } = await supabase.from("university_departments").upsert([
  { university_id: universityId, name: "Applied Agriculture", disciplines: ["Agriculture"], research_areas: ["Soil Health"] },
  { university_id: universityId, name: "Water & Environment", disciplines: ["Water", "Environment"], research_areas: ["Water Quality"] },
  { university_id: universityId, name: "Computing for Society", disciplines: ["AI", "Education"], research_areas: ["Civic Technology"] },
], { onConflict: "university_id,name" }).select("id,name");
if (departmentError) throw new Error(`Workspace schema is unavailable: ${departmentError.message}`);
const dept = Object.fromEntries(departments.map((row) => [row.name, row.id]));
const { error: facultyError } = await supabase.from("faculty").upsert([
  { university_id: universityId, department_id: dept["Applied Agriculture"], name: "Demo Faculty: Soil Mentor", expertise: ["Soil Health"], data_origin: "DEMO", verification_status: "DEMO" },
  { university_id: universityId, department_id: dept["Water & Environment"], name: "Demo Faculty: Water Mentor", expertise: ["Water Quality"], data_origin: "DEMO", verification_status: "DEMO" },
], { onConflict: "university_id,name" });
if (facultyError) throw new Error(`Faculty provisioning failed: ${facultyError.message}`);
const { error: studentError } = await supabase.from("students").upsert(["Aarav", "Sunita", "Ravi", "Neha", "Aman", "Priya"].map((name, index) => ({ university_id: universityId, department_id: index < 2 ? dept["Applied Agriculture"] : dept["Computing for Society"], name: `Demo Student: ${name}`, skills: ["Research", "Prototype"], study_year: 2 + (index % 3), data_origin: "DEMO", verification_status: "DEMO" })), { onConflict: "university_id,name" });
if (studentError) throw new Error(`Student provisioning failed: ${studentError.message}`);
console.log("JANSAMVAD DEMO provisioning complete: 5 real Supabase Auth accounts and linked DEMO entities are ready.");
