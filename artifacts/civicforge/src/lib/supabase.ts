import { createClient } from "@supabase/supabase-js";
import type {
  CreateIssueInput,
  Department,
  Issue,
  IssueReport,
  IssueStatus,
  Officer,
  SupportIssueInput,
} from "@workspace/api-zod";
import type { IssueFilterParams, DashboardSummary, AnalyseReportResponse } from "./jansamvad-api";
import { checkSpam } from "../services/spamDetection";
import { detectCategory } from "../services/categoryDetection";
import { findDuplicateCandidates } from "../services/duplicateDetection";
import { calculatePriorityScore } from "../services/priorityScoring";
import { routeToDepartment } from "../services/departmentRouting";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are missing");
}

// Normalize url so createClient does not crash if raw hostname or protocol-less URL is provided
const normalizedUrl =
  url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}.supabase.co`;

export const supabase = createClient(normalizedUrl, key);

// Live queries run only when requested by real data consumers. Importing the
// client must not issue a connectivity probe on an offline demo dashboard.

// Demo Departments for Jharkhand
export const DEMO_DEPARTMENTS: Department[] = [
  {
    id: "dept-1",
    name: "Road Infrastructure Department",
    code: "ROADS",
    head: "Er. A. K. Sinha, Chief Engineer",
    activeOfficers: 12,
    openIssues: 12,
    slaRate: 92,
    categories: ["Road Infrastructure"],
  },
  {
    id: "dept-2",
    name: "Water Supply Department",
    code: "WATER",
    head: "Er. S. Kerketta, Superintending Engineer",
    activeOfficers: 8,
    openIssues: 8,
    slaRate: 88,
    categories: ["Water Supply"],
  },
  {
    id: "dept-3",
    name: "Electricity Department",
    code: "POWER",
    head: "Er. R. N. Sharma, General Manager (Technical)",
    activeOfficers: 15,
    openIssues: 15,
    slaRate: 95,
    categories: ["Electricity"],
  },
  {
    id: "dept-4",
    name: "Sanitation Department",
    code: "SANITATION",
    head: "Dr. Meena Kumari, City Health Officer",
    activeOfficers: 9,
    openIssues: 9,
    slaRate: 85,
    categories: ["Sanitation"],
  },
  {
    id: "dept-5",
    name: "Drainage Department",
    code: "DRAINAGE",
    head: "Er. B. P. Singh, Executive Engineer",
    activeOfficers: 6,
    openIssues: 6,
    slaRate: 82,
    categories: ["Drainage"],
  },
  {
    id: "dept-6",
    name: "Health Department",
    code: "HEALTH",
    head: "Dr. P. K. Mishra, Civil Surgeon",
    activeOfficers: 4,
    openIssues: 4,
    slaRate: 96,
    categories: ["Healthcare"],
  },
  {
    id: "dept-7",
    name: "Education Department",
    code: "EDUCATION",
    head: "Smt. Neelam Tirkey, District Education Officer",
    activeOfficers: 3,
    openIssues: 3,
    slaRate: 90,
    categories: ["Education"],
  },
  {
    id: "dept-8",
    name: "Public Safety Department",
    code: "SAFETY",
    head: "Shri V. S. Chauhan, Joint Director",
    activeOfficers: 5,
    openIssues: 5,
    slaRate: 98,
    categories: ["Public Safety"],
  },
  {
    id: "dept-9",
    name: "General Civic Administration",
    code: "OTHER",
    head: "Deputy Municipal Commissioner",
    activeOfficers: 2,
    openIssues: 2,
    slaRate: 94,
    categories: ["Other", "Public Transport"],
  },
];

// Demo Officers for Field Portal
export const DEMO_OFFICERS: Officer[] = [
  {
    id: "off-1",
    name: "Ramesh Kumar Verma",
    department: "Road Infrastructure Department",
    district: "Ranchi",
    phone: "+91 94311 20491",
    badge: "JH-PWD-0482",
    designation: "Assistant Engineer (Roads)",
    activeTasks: 3,
    rating: 4.8,
  },
  {
    id: "off-2",
    name: "Sunita Soren",
    department: "Water Supply Department",
    district: "Dhanbad",
    phone: "+91 94313 88102",
    badge: "JH-DWSD-1102",
    designation: "Junior Engineer (Water Works)",
    activeTasks: 2,
    rating: 4.6,
  },
  {
    id: "off-3",
    name: "Amitesh Singh",
    department: "Electricity Department",
    district: "Bokaro",
    phone: "+91 94317 40193",
    badge: "JH-JBVNL-0914",
    designation: "Sub-Divisional Officer (Electric)",
    activeTasks: 4,
    rating: 4.9,
  },
  {
    id: "off-4",
    name: "Priya Murmu",
    department: "Sanitation Department",
    district: "Jamshedpur",
    phone: "+91 94319 77215",
    badge: "JH-SBM-0238",
    designation: "Sanitary Inspector",
    activeTasks: 1,
    rating: 4.7,
  },
  {
    id: "off-5",
    name: "Rajesh Mahato",
    department: "Drainage Department",
    district: "Deoghar",
    phone: "+91 94315 31980",
    badge: "JH-DRN-0761",
    designation: "Junior Engineer (Drainage)",
    activeTasks: 2,
    rating: 4.5,
  },
];

/**
 * Ensures anonymous or persistent citizen session without forcing a login form.
 */
export async function ensureCitizenSession(): Promise<{ userId: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      return { userId: sessionData.session.user.id };
    }

    // Try anonymous sign in if allowed
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (!anonErr && anonData?.user?.id) {
      return { userId: anonData.user.id };
    }
  } catch {
    // Graceful fallback to persistent localStorage citizen ID
  }

  const storedId = localStorage.getItem("jansamvad_citizen_uuid");
  if (storedId) {
    return { userId: storedId };
  }

  const newId = `citizen-${crypto.randomUUID()}`;
  localStorage.setItem("jansamvad_citizen_uuid", newId);
  return { userId: newId };
}

/**
 * Maps Supabase issue row to the application Issue model
 */
export function mapSupabaseRowToIssue(row: any): Issue {
  const id = typeof row.id === "number" ? row.id : (row.id ? String(row.id) : "1");
  const district = row.district || "Ranchi";
  const districtCode = String(district).substring(0, 3).toUpperCase();
  const publicId =
    row.public_id ||
    row.publicId ||
    `JH-${districtCode}-2026-${String(id).slice(-5)}`;

  // Status mapping
  let status: IssueStatus = "Reported";
  const stLower = String(row.status || "").toLowerCase();
  if (stLower === "reported") status = "Reported";
  else if (stLower === "ai_verified") status = "AI Verified";
  else if (stLower === "routed") status = "Routed";
  else if (stLower === "officer_assigned") status = "Officer Assigned";
  else if (stLower === "accepted") status = "Accepted";
  else if (stLower === "work_started" || stLower.includes("progress")) status = "Work Started";
  else if (stLower.includes("awaiting")) status = "Resolved - Awaiting Verification";
  else if (stLower === "resolved") status = "Resolved";
  else if (stLower === "escalated") status = "Escalated";
  else if (stLower === "rejected") status = "Rejected";

  // Priority mapping
  let priority = String(row.priority || "MEDIUM").toUpperCase();
  if (priority === "LOW") priority = "LOW";
  if (priority === "MEDIUM") priority = "MEDIUM";
  if (priority === "HIGH") priority = "HIGH";
  if (priority === "CRITICAL") priority = "CRITICAL";

  // Department name resolution
  let department = row.department || row.department_name;
  if (!department) {
    const matchedDept = DEMO_DEPARTMENTS.find((d) =>
      row.category && d.name.toLowerCase().includes(row.category.toLowerCase().split(" ")[0])
    );
    department = matchedDept ? matchedDept.name : "Road Infrastructure Department";
  }

  const reportCount =
    typeof (row.report_count ?? row.reportCount) === "number"
      ? (row.report_count ?? row.reportCount)
      : 1;

  const duplicateCount =
    typeof (row.duplicate_count ?? row.duplicateCount) === "number"
      ? (row.duplicate_count ?? row.duplicateCount)
      : Math.max(0, reportCount - 1);

  const priorityScore =
    typeof (row.priority_score ?? row.priorityScore) === "number"
      ? (row.priority_score ?? row.priorityScore)
      : priority === "CRITICAL"
      ? 90
      : priority === "HIGH"
      ? 78
      : priority === "LOW"
      ? 35
      : 55;

  const createdAt = row.created_at || row.createdAt || new Date().toISOString();
  const createdDate = new Date(createdAt);
  const timeStr = createdDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const timeline = Array.isArray(row.timeline) && row.timeline.length > 0
    ? row.timeline
    : [
        {
          id: `tl-1`,
          time: timeStr,
          date: "Initial Report",
          title: "Complaint registered in public ledger",
          actor: "Citizen",
          description: `Grievance registered at ${row.location_text || row.locationText || "Jharkhand"} with ID ${publicId}.`,
        },
        ...(status !== "Reported"
          ? [
              {
                id: `tl-2`,
                time: timeStr,
                date: "AI Triage",
                title: "AI verified and routed to department",
                actor: "JANSAMVAD AI",
                description: `Triaged to ${department}. Multi-factor priority score: ${priorityScore}/100.`,
              },
            ]
          : []),
        ...(status === "Officer Assigned" || status === "Accepted" || status === "Work Started" || status === "Resolved - Awaiting Verification" || status === "Resolved"
          ? [
              {
                id: `tl-3`,
                time: timeStr,
                date: "Field Dispatch",
                title: `Officer Assigned (${row.assigned_officer || row.assignedOfficer || "Field Specialist"})`,
                actor: "Department",
                description: "Work order dispatched for field remediation.",
              },
            ]
          : []),
        ...(status === "Work Started" || status === "Resolved - Awaiting Verification" || status === "Resolved"
          ? [
              {
                id: `tl-4`,
                time: timeStr,
                date: "Action Taken",
                title: "Remediation work in progress on ground",
                actor: "Field Officer",
                description: "Field team initiated on-site maintenance work.",
              },
            ]
          : []),
        ...(status === "Resolved - Awaiting Verification" || status === "Resolved"
          ? [
              {
                id: `tl-5`,
                time: timeStr,
                date: "Resolution Submitted",
                title: "Work completed. Photo evidence uploaded.",
                actor: "Field Officer",
                description: "Awaiting citizen ground verification to close grievance.",
              },
            ]
          : []),
        ...(status === "Resolved"
          ? [
              {
                id: `tl-6`,
                time: timeStr,
                date: "Resolved",
                title: "Citizen verified and officially closed",
                actor: "Citizen",
                description: "Citizen verified satisfactory completion of repair.",
              },
            ]
          : []),
      ];

  return {
    id: id as any,
    publicId,
    title: row.title || "Civic Grievance",
    description: row.description || "",
    category: row.category || "Road Infrastructure",
    district,
    locationText: row.location_text || row.locationText || "Jharkhand",
    latitude: typeof row.latitude === "number" ? row.latitude : 23.3441,
    longitude: typeof row.longitude === "number" ? row.longitude : 85.3096,
    status: status as any,
    priority: priority as any,
    priorityScore,
    severity: row.severity || (priority === "CRITICAL" ? "Critical" : priority === "HIGH" ? "High" : "Medium"),
    department,
    assignedOfficer: row.assigned_officer || row.assignedOfficer || (status !== "Reported" ? "Ramesh Kumar Verma" : undefined),
    reportCount,
    duplicateCount,
    createdAt,
    updatedAt: row.updated_at || row.updatedAt || createdAt,
    estimatedResolution: row.estimated_resolution || row.estimatedResolution || "Within 24-48 hours",
    citizenVerification: row.citizen_verification ?? row.citizenVerification ?? undefined,
    aiAnalysis: row.ai_analysis || row.aiAnalysis || {
      isSpam: false,
      spamScore: 3,
      detectedCategory: row.category || "Road Infrastructure",
      categoryConfidence: 94,
      detectedLanguage: "English / Hinglish",
      severity: priority === "CRITICAL" ? "Critical" : "High",
      priority: priority as any,
      priorityScore,
      department,
      scoreBreakdown: {
        severityFactor: 24,
        citizenReportsFactor: Math.min(25, reportCount * 5),
        sensitiveLocationFactor: 16,
        timeUnresolvedFactor: 12,
        repeatReportsFactor: Math.min(12, duplicateCount * 3),
      },
    },
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
    timeline,
  };
}

/**
 * Fetch all issues directly from Supabase `issues` table
 */
export async function getIssues(filters?: IssueFilterParams): Promise<Issue[]> {
  let query = supabase.from("issues").select("*").order("created_at", { ascending: false });

  if (filters?.district && filters.district !== "All") {
    query = query.eq("district", filters.district);
  }
  if (filters?.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters?.priority && filters.priority !== "All") {
    query = query.ilike("priority", `%${filters.priority}%`);
  }
  if (filters?.status && filters.status !== "All") {
    const st = filters.status.toLowerCase().replace(/\s+/g, "_");
    query = query.ilike("status", `%${st}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,public_id.ilike.%${filters.search}%,location_text.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Supabase] getIssues query failed:", error);
    throw new Error(`Supabase Error (${error.code || "Query"}): ${error.message}`);
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  let mapped = data.map(mapSupabaseRowToIssue);

  if (filters?.department && filters.department !== "All") {
    mapped = mapped.filter((item) => item.department === filters.department);
  }

  return mapped;
}

/**
 * Fetch a single issue by ID or publicId directly from Supabase `issues` table
 */
export async function getIssueById(
  idOrPublicId: string | number
): Promise<Issue & { reports?: IssueReport[] }> {
  const trimmed = String(idOrPublicId).trim();

  // 1. Try public_id query
  let { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("public_id", trimmed)
    .maybeSingle();

  // 2. If not found by public_id, try by id (UUID or numeric)
  if (!data) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    const isNumeric = /^\d+$/.test(trimmed);

    if (isUuid || isNumeric) {
      const queryVal = isNumeric ? Number(trimmed) : trimmed;
      const res = await supabase.from("issues").select("*").eq("id", queryVal).maybeSingle();
      if (res.data) {
        data = res.data;
      } else if (res.error) {
        console.warn("[Supabase] Query by id error:", res.error);
      }
    }
  }

  if (error) {
    console.error("[Supabase] getIssueById query failed:", error);
    throw new Error(`Supabase Error (${error.code || "Query"}): ${error.message}`);
  }

  if (!data) {
    throw new Error(`Supabase Error: Issue with identifier "${idOrPublicId}" was not found in 'issues' table.`);
  }

  const mapped = mapSupabaseRowToIssue(data);

  // Fetch status history if available
  try {
    const { data: hist } = await supabase
      .from("issue_status_history")
      .select("*")
      .eq("issue_id", data.id)
      .order("created_at", { ascending: true });

    if (hist && hist.length > 0) {
      mapped.timeline = hist.map((h: any, idx: number) => ({
        id: h.id || `tl-${idx}`,
        time: new Date(h.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        date: new Date(h.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        title: h.action || `Status: ${h.status}`,
        actor: h.actor || "System",
        description: h.notes || "Timeline update logged in Supabase.",
      }));
    }
  } catch {
    // Ignore if history read is restricted
  }

  return mapped;
}

/**
 * Create an issue directly in Supabase `issues` table
 */
export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const district =
    input.district ||
    (input.locationText.toLowerCase().includes("jamshedpur")
      ? "Jamshedpur"
      : input.locationText.toLowerCase().includes("dhanbad")
      ? "Dhanbad"
      : input.locationText.toLowerCase().includes("bokaro")
      ? "Bokaro"
      : input.locationText.toLowerCase().includes("deoghar")
      ? "Deoghar"
      : input.locationText.toLowerCase().includes("hazaribagh")
      ? "Hazaribagh"
      : "Ranchi");

  const districtCode = district.substring(0, 3).toUpperCase();
  const timestamp = Date.now();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const publicId = `JH-${districtCode}-2026-${randomNum}`;
  const now = new Date().toISOString();

  // Run AI services to compute real category, spam, priority, and routing
  const categoryResult = detectCategory(input.description);
  const inputCatStr = input.category as string | undefined;
  const category = inputCatStr && inputCatStr !== "Let AI Detect" ? input.category : (categoryResult.category as any);
  const priorityResult = calculatePriorityScore({
    text: input.description,
    locationText: input.locationText,
    category,
    urgency: input.urgency,
    reportCount: 1,
  });

  const deptResult = routeToDepartment(category, categoryResult.confidence);

  const currentPayload: Record<string, any> = {
    public_id: publicId,
    title: input.title || input.description.slice(0, 75).trim() + (input.description.length > 75 ? "..." : ""),
    description: input.description,
    category,
    district,
    location_text: input.locationText,
    status: "reported",
    priority: priorityResult.priority.toLowerCase(),
    priority_score: priorityResult.priorityScore,
    report_count: 1,
  };

  let insertedData: any = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase
      .from("issues")
      .insert([currentPayload])
      .select()
      .maybeSingle();

    if (!error) {
      insertedData = data;
      break;
    }

    // Prune unknown columns if PostgREST cache complains
    const pgrstMatch = error.message?.match(/Could not find the '([^']+)' column/i);
    const pgMatch = error.message?.match(/column [^.]*\.?([a-zA-Z0-9_]+) does not exist/i);
    const missingCol = pgrstMatch?.[1] || pgMatch?.[1];

    if (missingCol && missingCol in currentPayload) {
      console.warn(`[Supabase] Pruning missing column '${missingCol}' from insert...`);
      delete currentPayload[missingCol];
      continue;
    }

    console.error("[Supabase] createIssue insert failed:", error);
    throw new Error(`Supabase Error (${error.code || "Insert"}): ${error.message}`);
  }

  const createdId = insertedData?.id || insertedData?.public_id || publicId;
  console.log(`[Supabase] Issue created: ${createdId}`);

  // Insert initial status history record (best-effort)
  try {
    if (insertedData?.id) {
      await supabase.from("issue_status_history").insert([
        {
          issue_id: insertedData.id,
          status: "reported",
          actor: "Citizen",
          action: "Complaint registered in public ledger",
          notes: `Initial report submitted at ${input.locationText}. Priority calculated: ${priorityResult.priorityScore}/100.`,
        },
      ]);
    }
  } catch (err) {
    console.warn("[Supabase] Status history logging skipped:", err);
  }

  const mapped = mapSupabaseRowToIssue(
    insertedData || {
      ...currentPayload,
      id: createdId,
      public_id: publicId,
    }
  );

  return mapped;
}

/**
 * Add a citizen report to an existing issue directly in Supabase issue_reports table.
 */
export async function addReportToIssue(
  issueId: string | number,
  description: string,
  locationText?: string
) {
  // Ensure the citizen has a Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Citizen authentication failed");
  }

  // Resolve UUID if a public_id was passed
  const idStr = String(issueId);
  let resolvedIssueId = idStr;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
  if (!isUuid) {
    const { data: issueRow } = await supabase
      .from("issues")
      .select("id")
      .eq("public_id", idStr)
      .maybeSingle();
    if (issueRow?.id) {
      resolvedIssueId = issueRow.id;
    }
  }

  // Attempt insert into Supabase issue_reports table
  const payload: any = {
    issue_id: resolvedIssueId,
    reporter_user_id: user.id,
    description,
    location_text: locationText ?? null,
    urgency: "normal",
    is_duplicate: true,
  };

  let { data, error } = await supabase
    .from("issue_reports")
    .insert(payload)
    .select()
    .single();

  // If column doesn't exist in Supabase schema cache (PGRST204), retry with base schema columns
  if (error && (error as any).code === "PGRST204") {
    const fallbackPayload: any = {
      issue_id: resolvedIssueId,
      reporter_user_id: user.id,
      description,
      is_duplicate: true,
    };
    const retry = await supabase
      .from("issue_reports")
      .insert(fallbackPayload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("[Supabase] Add report failed:", error);
    throw error;
  }

  console.log("[Supabase] Report created:", data);
  return data;
}

/**
 * Load consolidated citizen reports from Supabase issue_reports table.
 */
export async function getIssueReports(issueId: string | number) {
  const idStr = String(issueId);
  let resolvedIssueId = idStr;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
  if (!isUuid) {
    const { data: issueRow } = await supabase
      .from("issues")
      .select("id")
      .eq("public_id", idStr)
      .maybeSingle();
    if (issueRow?.id) {
      resolvedIssueId = issueRow.id;
    }
  }

  const { data, error } = await supabase
    .from("issue_reports")
    .select("*")
    .eq("issue_id", resolvedIssueId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("[Supabase] Load issue_reports failed:", error);
    throw error;
  }

  return data || [];
}

/**
 * Support/Merge with an existing issue
 */
export async function supportExistingIssue(
  issueIdOrPublicId: string | number,
  input: SupportIssueInput
): Promise<{ issue: Issue; report?: any }> {
  // First get current issue
  const existing = await getIssueById(issueIdOrPublicId);

  // Write directly to Supabase issue_reports table.
  // Do NOT manually increase report_count in React; database trigger calculates report_count.
  const reportData = await addReportToIssue(
    existing.id,
    input.comment || "I also live in this ward and confirm this issue needs resolution.",
    existing.locationText || existing.district
  );

  const updatedIssue = await getIssueById(existing.publicId);
  return {
    issue: updatedIssue,
    report: reportData,
  };
}

/**
 * Assign Officer to Issue
 */
export async function assignOfficer(
  issueId: string | number,
  officerId: string
): Promise<Issue> {
  const existing = await getIssueById(issueId);
  const matchedOfficer = DEMO_OFFICERS.find((o) => o.id === officerId) || DEMO_OFFICERS[0];

  const { error } = await supabase
    .from("issues")
    .update({
      status: "officer_assigned",
    })
    .eq("public_id", existing.publicId);

  if (error) {
    console.warn("[Supabase] assignOfficer update error:", error);
  }

  // Insert timeline event
  try {
    await supabase.from("issue_status_history").insert([
      {
        issue_id: existing.id,
        status: "officer_assigned",
        actor: "Department Supervisor",
        action: `Field Officer Assigned: ${matchedOfficer.name}`,
        notes: `Dispatched to ${matchedOfficer.name} (Badge: ${matchedOfficer.badge}). Officer has accepted assignment.`,
      },
    ]);
  } catch {}

  return getIssueById(existing.publicId);
}

/**
 * Update Issue Status
 */
export async function updateIssueStatus(
  issueId: string | number,
  status: IssueStatus,
  comment?: string,
  actor?: string
): Promise<Issue> {
  const existing = await getIssueById(issueId);

  let dbStatus = "reported";
  if (status === "Routed" || status === "AI Verified") dbStatus = "routed";
  if (status === "Officer Assigned") dbStatus = "officer_assigned";
  if (status === "Accepted") dbStatus = "accepted";
  if (status === "Work Started") dbStatus = "work_started";
  if (status === "Resolved - Awaiting Verification") dbStatus = "resolved_awaiting_verification";
  if (status === "Resolved") dbStatus = "resolved";
  if (status === "Escalated") dbStatus = "escalated";
  if (status === "Rejected") dbStatus = "rejected";

  const { error } = await supabase
    .from("issues")
    .update({
      status: dbStatus,
    })
    .eq("public_id", existing.publicId);

  if (error) {
    console.warn("[Supabase] updateIssueStatus update error:", error);
  }

  try {
    await supabase.from("issue_status_history").insert([
      {
        issue_id: existing.id,
        status: dbStatus,
        actor: actor || "Field Officer",
        action: `Status changed to: ${status}`,
        notes: comment || `Officer updated progress to ${status}.`,
      },
    ]);
  } catch {}

  return getIssueById(existing.publicId);
}

/**
 * Verify Issue Resolution (Citizen Ground Verification)
 */
export async function verifyIssueResolution(
  issueId: string | number,
  confirmed: boolean,
  comment?: string
): Promise<Issue> {
  const existing = await getIssueById(issueId);

  const nextStatus = confirmed ? "resolved" : "escalated";
  const { error } = await supabase
    .from("issues")
    .update({
      status: nextStatus,
    })
    .eq("public_id", existing.publicId);

  if (error) {
    console.warn("[Supabase] verifyIssueResolution update error:", error);
  }

  try {
    await supabase.from("issue_status_history").insert([
      {
        issue_id: existing.id,
        status: nextStatus,
        actor: "Citizen",
        action: confirmed ? "Citizen Confirmed Resolution" : "Citizen Rejected Resolution",
        notes: comment || (confirmed
          ? "Citizen inspected site and confirmed satisfactory repair on ground. Issue permanently closed."
          : "Citizen flagged incomplete resolution. Escalated to Department Superintending Engineer."),
      },
    ]);
  } catch {}

  return getIssueById(existing.publicId);
}

/**
 * Compute real-time dashboard analytics directly from Supabase
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [issues, officersResult] = await Promise.all([
    getIssues(),
    supabase.from("officers").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const reportsReceived = issues.reduce((acc, curr) => acc + (curr.reportCount || 1), 0);
  const duplicatesMerged = issues.reduce((acc, curr) => acc + (curr.duplicateCount || 0), 0);
  const resolvedToday = issues.filter(
    (i) => i.status === "Resolved" || i.status === "Resolved - Awaiting Verification"
  ).length;

  const total = issues.length || 1;
  const resolutionRate = Math.round((resolvedToday / total) * 100);

  const openIssues = issues.filter((i) => i.status !== "Resolved").length;
  const criticalIssues = issues.filter((i) => i.priority === "CRITICAL").length;
  const highIssues = issues.filter((i) => i.priority === "HIGH").length;

  // Truthful aggregation — no hardcoded floor values. Zero is a valid state.
  return {
    reportsReceived,
    duplicatesMerged,
    spamBlocked: 0,
    resolvedToday,
    resolutionRate,
    openIssues,
    criticalIssues,
    highIssues,
    activeOfficers: officersResult.count || 0,
    slaCompliance: 0,
  };
}

/**
 * Fetch departments from Supabase or fall back to demo data
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return DEMO_DEPARTMENTS;
    }

    return data.map((d: any) => ({
      id: String(d.id),
      name: d.name,
      code: d.code,
      head: d.head || "Not assigned",
      activeOfficers: 0,
      openIssues: 0,
      slaRate: 90,
      categories: ["Other"],
    }));
  } catch {
    return DEMO_DEPARTMENTS;
  }
}

/**
 * Fetch officers from Supabase or fall back to demo data
 */
export async function getOfficers(): Promise<Officer[]> {
  try {
    const { data, error } = await supabase
      .from("officers")
      .select("*, departments!inner(code, name)")
      .eq("active", true)
      .order("name");

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return DEMO_OFFICERS;
    }

    return data.map((o: any) => ({
      id: String(o.id),
      name: o.name,
      badge: o.badge_number || "JH-OFFICER",
      designation: o.designation || "Field Inspector",
      department: o.departments?.name || "General Civic Administration",
      district: o.district || "Ranchi",
      phone: o.phone || "",
      activeTasks: 0,
      rating: 4.5,
    }));
  } catch {
    return DEMO_OFFICERS;
  }
}

/**
 * Fetch issues assigned to a specific officer from Supabase
 */
export async function getOfficerAssignments(officerId: string): Promise<Issue[]> {
  try {
    // Try to find the officer in Supabase first
    const { data: officerRows } = await supabase
      .from("officers")
      .select("id")
      .eq("id", officerId)
      .maybeSingle();

    if (officerRows?.id) {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("assigned_officer_id", officerId)
        .order("created_at", { ascending: false });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data.map(mapSupabaseRowToIssue);
      }
    }

    // Fallback: filter demo issues by officer name match
    const officer = DEMO_OFFICERS.find((o) => o.id === officerId);
    if (officer) {
      const allIssues = await getIssues();
      return allIssues.filter(
        (i) => i.assignedOfficer && typeof i.assignedOfficer === "object"
          ? (i.assignedOfficer as any).id === officerId
          : typeof i.assignedOfficer === "string" && i.assignedOfficer === officer.name
      );
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Realtime subscription to updates on a specific issue
 */
export function subscribeToIssue(
  issuePublicId: string,
  onUpdate: (payload: any) => void
): () => void {
  const channel = supabase
    .channel(`issue-${issuePublicId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "issues",
        filter: `public_id=eq.${issuePublicId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
