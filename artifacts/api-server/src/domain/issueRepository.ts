import type {
  Category,
  CreateIssueInput,
  Department,
  Evidence,
  Issue,
  IssueReport,
  IssueStatus,
  Officer,
  Priority,
  SupportIssueInput,
  TimelineItem,
} from "@workspace/api-zod";
import { checkSpam } from "../services/spamDetection";
import { findDuplicateMatches } from "../services/duplicateDetection";
import { routeIssue } from "../services/departmentRouting";
import { calculatePriorityScore } from "../services/priorityScoring";
import { normalizeComplaint } from "../services/languageNormalization";

export interface IssueFilter {
  district?: string;
  category?: string;
  priority?: string;
  status?: string;
  department?: string;
  search?: string;
}

export interface DashboardSummary {
  reportsReceived: number;
  duplicatesMerged: number;
  spamBlocked: number;
  resolvedToday: number;
  resolutionRate: number;
  openIssues: number;
  criticalIssues: number;
  highIssues: number;
  activeOfficers: number;
  slaCompliance: number;
}

const SEEDED_OFFICERS: Officer[] = [
  {
    id: "off-01",
    name: "Amit Kumar",
    badge: "JH-RCD-4819",
    designation: "Assistant Engineer (Roads)",
    department: "Jharkhand Road Construction Dept (RCD)",
    district: "Ranchi",
    phone: "+91 94311 82910",
    avatarUrl: "",
    activeTasks: 3,
    rating: 4.8,
  },
  {
    id: "off-02",
    name: "Rajesh Soren",
    badge: "JH-DWSD-1092",
    designation: "Sub-Divisional Officer (Water)",
    department: "Drinking Water & Sanitation Dept (DWSD)",
    district: "Ranchi",
    phone: "+91 94301 44521",
    avatarUrl: "",
    activeTasks: 2,
    rating: 4.7,
  },
  {
    id: "off-03",
    name: "Priya Sharma",
    badge: "JH-JBVNL-3304",
    designation: "Junior Electrical Inspector",
    department: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
    district: "Ranchi",
    phone: "+91 94703 19283",
    avatarUrl: "",
    activeTasks: 4,
    rating: 4.9,
  },
  {
    id: "off-04",
    name: "Mohammed Farhan",
    badge: "JH-RMC-2015",
    designation: "Sanitation Supervisor",
    department: "Municipal Sanitation Corporation (RMC)",
    district: "Ranchi",
    phone: "+91 94315 77620",
    avatarUrl: "",
    activeTasks: 2,
    rating: 4.6,
  },
  {
    id: "off-05",
    name: "Sunita Hansda",
    badge: "JH-JSR-0842",
    designation: "Civic Safety & Drainage Engineer",
    department: "Urban Stormwater & Drainage Cell",
    district: "Jamshedpur",
    phone: "+91 94308 66144",
    avatarUrl: "",
    activeTasks: 1,
    rating: 4.8,
  },
];

const SEEDED_DEPARTMENTS: Department[] = [
  {
    id: "dept-rcd",
    name: "Jharkhand Road Construction Dept (RCD)",
    code: "RCD-JH",
    head: "Er. S. N. Sinha, Chief Engineer",
    activeOfficers: 34,
    openIssues: 72,
    slaRate: 88,
    categories: ["Road Infrastructure"],
  },
  {
    id: "dept-dwsd",
    name: "Drinking Water & Sanitation Dept (DWSD)",
    code: "DWSD-JH",
    head: "Shri Alok Prasad, Director Water Supply",
    activeOfficers: 28,
    openIssues: 54,
    slaRate: 91,
    categories: ["Water Supply"],
  },
  {
    id: "dept-jbvnl",
    name: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
    code: "JBVNL",
    head: "Er. K. K. Verma, General Manager Ops",
    activeOfficers: 42,
    openIssues: 46,
    slaRate: 93,
    categories: ["Electricity"],
  },
  {
    id: "dept-rmc",
    name: "Municipal Sanitation Corporation (RMC)",
    code: "RMC",
    head: "Smt. Neelam Kujur, Municipal Commissioner",
    activeOfficers: 55,
    openIssues: 38,
    slaRate: 84,
    categories: ["Sanitation"],
  },
  {
    id: "dept-drainage",
    name: "Urban Stormwater & Drainage Cell",
    code: "USDC",
    head: "Er. Vikas Munda, Executive Engineer",
    activeOfficers: 18,
    openIssues: 26,
    slaRate: 86,
    categories: ["Drainage"],
  },
  {
    id: "dept-health",
    name: "Department of Health & Family Welfare",
    code: "DHFW",
    head: "Dr. B. K. Singh, Civil Surgeon",
    activeOfficers: 15,
    openIssues: 12,
    slaRate: 95,
    categories: ["Healthcare"],
  },
];

const INITIAL_ISSUES: Issue[] = [
  {
    id: 1,
    publicId: "JH-RNC-2026-00482",
    title: "Large pothole outside DAV School, Bariatu Road, Ranchi",
    description: "Deep dangerous crater in front of the primary school gate. Water accumulates during rain causing school buses and children on two-wheelers to slip repeatedly.",
    category: "Road Infrastructure",
    district: "Ranchi",
    locationText: "DAV School Bariatu Road, Ranchi, Jharkhand 834009",
    latitude: 23.3887,
    longitude: 85.3465,
    status: "Officer Assigned",
    priority: "HIGH",
    priorityScore: 87,
    severity: "High",
    department: "Jharkhand Road Construction Dept (RCD)",
    assignedOfficer: SEEDED_OFFICERS[0],
    reportCount: 23,
    duplicateCount: 22,
    createdAt: "2026-09-04T09:42:00Z",
    updatedAt: "2026-09-04T10:17:00Z",
    estimatedResolution: "Within 24 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 2,
      detectedCategory: "Road Infrastructure",
      categoryConfidence: 96,
      detectedLanguage: "English",
      severity: "High",
      priority: "HIGH",
      priorityScore: 87,
      department: "Jharkhand Road Construction Dept (RCD)",
      scoreBreakdown: {
        severityFactor: 25,
        citizenReportsFactor: 22,
        sensitiveLocationFactor: 18,
        timeUnresolvedFactor: 14,
        repeatReportsFactor: 8,
      },
    },
    evidence: [
      {
        id: "ev-01",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        caption: "Citizen photo: 4-foot wide pothole directly across the school entrance",
        timestamp: "09:42 AM",
      },
    ],
    timeline: [
      {
        id: "tl-01",
        time: "09:42",
        date: "Today",
        title: "Complaint submitted",
        actor: "Citizen",
        description: "Initial report registered with geo-tagged photographic evidence.",
      },
      {
        id: "tl-02",
        time: "09:42",
        date: "Today",
        title: "AI verification completed",
        actor: "AI/System",
        description: "Content verified safe. Category recognized with 96% confidence. Priority calculated as HIGH (87/100).",
      },
      {
        id: "tl-03",
        time: "09:43",
        date: "Today",
        title: "Routed to Jharkhand Road Construction Dept",
        actor: "AI/System",
        description: "Automated routing dispatch to Ranchi Division Road Maintenance cell.",
      },
      {
        id: "tl-04",
        time: "10:05",
        date: "Today",
        title: "Officer Amit Kumar assigned",
        actor: "Department",
        description: "RCD Divisional Engineer dispatched field inspector Amit Kumar.",
      },
      {
        id: "tl-05",
        time: "10:17",
        date: "Today",
        title: "Officer accepted task",
        actor: "Field Officer",
        description: "Officer Amit Kumar acknowledged assignment and initiated route to Bariatu.",
      },
    ],
  },
  {
    id: 2,
    publicId: "JH-RNC-2026-00319",
    title: "High pressure water pipeline burst near Doranda Chowk, Ranchi",
    description: "Main municipal drinking water feeder line ruptured near Doranda chowk. Gallons of clean water wasting and surrounding residential lanes flooded.",
    category: "Water Supply",
    district: "Ranchi",
    locationText: "Near Doranda Police Station Chowk, Ranchi 834002",
    latitude: 23.3326,
    longitude: 85.3218,
    status: "Work Started",
    priority: "CRITICAL",
    priorityScore: 94,
    severity: "Critical",
    department: "Drinking Water & Sanitation Dept (DWSD)",
    assignedOfficer: SEEDED_OFFICERS[1],
    reportCount: 47,
    duplicateCount: 46,
    createdAt: "2026-09-04T08:15:00Z",
    updatedAt: "2026-09-04T10:45:00Z",
    estimatedResolution: "Within 6 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 1,
      detectedCategory: "Water Supply",
      categoryConfidence: 98,
      detectedLanguage: "English",
      severity: "Critical",
      priority: "CRITICAL",
      priorityScore: 94,
      department: "Drinking Water & Sanitation Dept (DWSD)",
      scoreBreakdown: {
        severityFactor: 30,
        citizenReportsFactor: 25,
        sensitiveLocationFactor: 16,
        timeUnresolvedFactor: 15,
        repeatReportsFactor: 8,
      },
    },
    evidence: [
      {
        id: "ev-02",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
        caption: "Citizen photo: Water gushing across highway lane",
        timestamp: "08:15 AM",
      },
      {
        id: "ev-02b",
        uploaderType: "officer",
        type: "site_inspection",
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        caption: "Field Officer Soren inspection: Valve isolation in progress",
        timestamp: "10:30 AM",
        officerName: "Rajesh Soren",
      },
    ],
    timeline: [
      {
        id: "tl-201",
        time: "08:15",
        date: "Today",
        title: "Initial report received",
        actor: "Citizen",
        description: "Multiple residents reported severe flooding and water loss.",
      },
      {
        id: "tl-202",
        time: "08:16",
        date: "Today",
        title: "Semantic duplicate cluster created",
        actor: "AI/System",
        description: "47 individual reports merged automatically into single master record JH-RNC-2026-00319.",
      },
      {
        id: "tl-203",
        time: "08:20",
        date: "Today",
        title: "Critical priority escalation",
        actor: "AI/System",
        description: "Priority score reached 94/100 due to rapid report influx and arterial road risk.",
      },
      {
        id: "tl-204",
        time: "08:40",
        date: "Today",
        title: "SDO Rajesh Soren dispatched",
        actor: "Department",
        description: "Assigned to rapid pipeline emergency response team.",
      },
      {
        id: "tl-205",
        time: "09:15",
        date: "Today",
        title: "Officer reached location",
        actor: "Field Officer",
        description: "On-site GPS confirmed. Feeder valve shutoff team assembled.",
      },
      {
        id: "tl-206",
        time: "10:45",
        date: "Today",
        title: "Excavation & welding started",
        actor: "Field Officer",
        description: "Ruptured 14-inch ductile iron pipe exposed. Replacement section being installed.",
      },
    ],
  },
  {
    id: 3,
    publicId: "JH-RNC-2026-00511",
    title: "High-voltage wire sparking near Harmu Housing Colony, Ranchi",
    description: "Tree branch fallen on 11kV distribution line causing loud sparks and power fluctuation during evening winds.",
    category: "Electricity",
    district: "Ranchi",
    locationText: "Road No. 4, Harmu Housing Colony, Ranchi 834002",
    latitude: 23.3562,
    longitude: 85.3114,
    status: "Officer Assigned",
    priority: "CRITICAL",
    priorityScore: 96,
    severity: "Critical",
    department: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
    assignedOfficer: SEEDED_OFFICERS[2],
    reportCount: 18,
    duplicateCount: 17,
    createdAt: "2026-09-04T10:02:00Z",
    updatedAt: "2026-09-04T10:20:00Z",
    estimatedResolution: "Within 3 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 1,
      detectedCategory: "Electricity",
      categoryConfidence: 97,
      detectedLanguage: "English",
      severity: "Critical",
      priority: "CRITICAL",
      priorityScore: 96,
      department: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
      scoreBreakdown: {
        severityFactor: 30,
        citizenReportsFactor: 21,
        sensitiveLocationFactor: 20,
        timeUnresolvedFactor: 15,
        repeatReportsFactor: 10,
      },
    },
    evidence: [
      {
        id: "ev-03",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80",
        caption: "Citizen photo: Sparks near residential roof line",
        timestamp: "10:02 AM",
      },
    ],
    timeline: [
      {
        id: "tl-301",
        time: "10:02",
        date: "Today",
        title: "Emergency report flagged",
        actor: "Citizen",
        description: "Immediate safety hazard logged by colony residents.",
      },
      {
        id: "tl-302",
        time: "10:03",
        date: "Today",
        title: "AI Safety Fast-Track",
        actor: "AI/System",
        description: "11kV wire hazard classified as CRITICAL (96/100). Bypassed standard triage queue.",
      },
      {
        id: "tl-303",
        time: "10:20",
        date: "Today",
        title: "Inspector Priya Sharma dispatched",
        actor: "Department",
        description: "JBVNL emergency hotline dispatched line technician squad.",
      },
    ],
  },
  {
    id: 4,
    publicId: "JH-RNC-2026-00204",
    title: "Garbage accumulation & blocked drainage behind Daily Market, Ranchi",
    description: "Solid waste overflow blocking storm drain behind Daily Market vegetable stalls. Severe foul smell and breeding vector for mosquitoes.",
    category: "Sanitation",
    district: "Ranchi",
    locationText: "Behind Daily Market, Main Road, Ranchi 834001",
    latitude: 23.3644,
    longitude: 85.3289,
    status: "Resolved - Awaiting Verification",
    priority: "MEDIUM",
    priorityScore: 68,
    severity: "Medium",
    department: "Municipal Sanitation Corporation (RMC)",
    assignedOfficer: SEEDED_OFFICERS[3],
    reportCount: 12,
    duplicateCount: 11,
    createdAt: "2026-09-03T14:10:00Z",
    updatedAt: "2026-09-04T12:42:00Z",
    estimatedResolution: "Completed - Pending citizen audit",
    citizenVerification: {
      status: "pending",
    },
    aiAnalysis: {
      isSpam: false,
      spamScore: 3,
      detectedCategory: "Sanitation",
      categoryConfidence: 94,
      detectedLanguage: "English",
      severity: "Medium",
      priority: "MEDIUM",
      priorityScore: 68,
      department: "Municipal Sanitation Corporation (RMC)",
      scoreBreakdown: {
        severityFactor: 18,
        citizenReportsFactor: 16,
        sensitiveLocationFactor: 14,
        timeUnresolvedFactor: 12,
        repeatReportsFactor: 8,
      },
    },
    evidence: [
      {
        id: "ev-04a",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
        caption: "Before: Overflowing waste and stagnant blackwater",
        timestamp: "Yesterday, 02:10 PM",
      },
      {
        id: "ev-04b",
        uploaderType: "officer",
        type: "after",
        url: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&auto=format&fit=crop&q=80",
        caption: "After: Waste removed with mechanized loader, drain desilted and bleached",
        timestamp: "Today, 12:36 PM",
        officerName: "Mohammed Farhan",
      },
    ],
    timeline: [
      {
        id: "tl-401",
        time: "14:10",
        date: "Yesterday",
        title: "Complaint submitted",
        actor: "Citizen",
        description: "Shopkeepers reported accumulated vegetable refuse.",
      },
      {
        id: "tl-402",
        time: "15:30",
        date: "Yesterday",
        title: "Routed to RMC Sanitation",
        actor: "AI/System",
        description: "Assigned to Ward 19 municipal zonal team.",
      },
      {
        id: "tl-403",
        time: "08:00",
        date: "Today",
        title: "Supervisor Mohammed Farhan started work",
        actor: "Field Officer",
        description: "Compactor truck and 6 sanitation workers mobilized.",
      },
      {
        id: "tl-404",
        time: "12:36",
        date: "Today",
        title: "Repair & cleanup completed",
        actor: "Field Officer",
        description: "Entire 30-meter stretch cleared. Photographic evidence uploaded.",
      },
      {
        id: "tl-405",
        time: "12:42",
        date: "Today",
        title: "Awaiting citizen verification",
        actor: "AI/System",
        description: "Automated notification dispatched to 12 reporting citizens for verification.",
      },
    ],
  },
  {
    id: 5,
    publicId: "JH-RNC-2026-00105",
    title: "Streetlights not working for 2 weeks on Kanke Road, Ranchi",
    description: "Continuous dark stretch of 1.2 km from Kanke Dam turn to Rock Garden road. Multiple evening theft attempts reported.",
    category: "Electricity",
    district: "Ranchi",
    locationText: "Kanke Road, near Rock Garden approach, Ranchi 834006",
    latitude: 23.4124,
    longitude: 85.3211,
    status: "Resolved",
    priority: "HIGH",
    priorityScore: 78,
    severity: "High",
    department: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
    assignedOfficer: SEEDED_OFFICERS[2],
    reportCount: 31,
    duplicateCount: 30,
    createdAt: "2026-09-01T11:00:00Z",
    updatedAt: "2026-09-03T13:08:00Z",
    estimatedResolution: "Resolved",
    citizenVerification: {
      status: "confirmed",
      comment: "All 18 LED luminaires replaced and illuminated tonight. Excellent rapid work!",
      verifiedAt: "2026-09-03T13:08:00Z",
    },
    aiAnalysis: {
      isSpam: false,
      spamScore: 2,
      detectedCategory: "Electricity",
      categoryConfidence: 96,
      detectedLanguage: "English",
      severity: "High",
      priority: "HIGH",
      priorityScore: 78,
      department: "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
      scoreBreakdown: {
        severityFactor: 24,
        citizenReportsFactor: 22,
        sensitiveLocationFactor: 14,
        timeUnresolvedFactor: 12,
        repeatReportsFactor: 6,
      },
    },
    evidence: [
      {
        id: "ev-05a",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
        caption: "Dark highway stretch at 8 PM",
        timestamp: "Sep 01, 11:00 AM",
      },
      {
        id: "ev-05b",
        uploaderType: "officer",
        type: "after",
        url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80",
        caption: "Luminaires reconnected to grid with surge protector installed",
        timestamp: "Sep 03, 11:45 AM",
        officerName: "Priya Sharma",
      },
    ],
    timeline: [
      {
        id: "tl-501",
        time: "11:00",
        date: "Sep 01",
        title: "Complaint submitted",
        actor: "Citizen",
        description: "Residents and evening commuters lodged collective report.",
      },
      {
        id: "tl-502",
        time: "10:15",
        date: "Sep 02",
        title: "Officer Priya Sharma assigned",
        actor: "Department",
        description: "JBVNL street lighting division dispatched technical squad.",
      },
      {
        id: "tl-503",
        time: "11:45",
        date: "Sep 03",
        title: "Work completed & evidence uploaded",
        actor: "Field Officer",
        description: "Burnt underground junction box re-wired.",
      },
      {
        id: "tl-504",
        time: "13:08",
        date: "Sep 03",
        title: "Citizen verified resolution",
        actor: "Citizen",
        description: "Local resident R. N. Pathak verified fully functional street lights.",
      },
    ],
  },
  {
    id: 6,
    publicId: "JH-JSR-2026-00198",
    title: "Open manhole hazard near Sakchi Roundabout, Jamshedpur",
    description: "Deep storm drain concrete cover missing on busy pedestrian crossing right next to auto stand. High risk of severe pedestrian injury.",
    category: "Drainage",
    district: "Jamshedpur",
    locationText: "Near Sakchi Golchakkar Auto Stand, Jamshedpur 831001",
    latitude: 22.8046,
    longitude: 86.2029,
    status: "Work Started",
    priority: "CRITICAL",
    priorityScore: 91,
    severity: "Critical",
    department: "Urban Stormwater & Drainage Cell",
    assignedOfficer: SEEDED_OFFICERS[4],
    reportCount: 19,
    duplicateCount: 18,
    createdAt: "2026-09-04T07:30:00Z",
    updatedAt: "2026-09-04T09:10:00Z",
    estimatedResolution: "Within 4 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 1,
      detectedCategory: "Drainage",
      categoryConfidence: 95,
      detectedLanguage: "English",
      severity: "Critical",
      priority: "CRITICAL",
      priorityScore: 91,
      department: "Urban Stormwater & Drainage Cell",
      scoreBreakdown: {
        severityFactor: 30,
        citizenReportsFactor: 21,
        sensitiveLocationFactor: 18,
        timeUnresolvedFactor: 14,
        repeatReportsFactor: 8,
      },
    },
    evidence: [
      {
        id: "ev-06",
        uploaderType: "citizen",
        type: "initial",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
        caption: "Open manhole covered only with a dry tree branch",
        timestamp: "07:30 AM",
      },
    ],
    timeline: [
      {
        id: "tl-601",
        time: "07:30",
        date: "Today",
        title: "Complaint logged",
        actor: "Citizen",
        description: "Commuters flagged hazardous open manhole.",
      },
      {
        id: "tl-602",
        time: "08:15",
        date: "Today",
        title: "Officer Sunita Hansda reached location",
        actor: "Field Officer",
        description: "Emergency barricading placed. Reinforced pre-cast slab ordered from municipal depot.",
      },
    ],
  },
  {
    id: 7,
    publicId: "JH-DHN-2026-00412",
    title: "Severe dust pollution & broken coal haulage road, Bank More, Dhanbad",
    description: "Deep potholes on the main junction carrying heavy dumper traffic. Fine coal dust causing severe respiratory issues for local market vendors.",
    category: "Road Infrastructure",
    district: "Dhanbad",
    locationText: "Bank More Junction, Dhanbad, Jharkhand 826001",
    latitude: 23.7957,
    longitude: 86.4304,
    status: "Routed",
    priority: "HIGH",
    priorityScore: 82,
    severity: "High",
    department: "Jharkhand Road Construction Dept (RCD)",
    reportCount: 15,
    duplicateCount: 14,
    createdAt: "2026-09-04T06:40:00Z",
    updatedAt: "2026-09-04T08:00:00Z",
    estimatedResolution: "Within 48 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 2,
      detectedCategory: "Road Infrastructure",
      categoryConfidence: 94,
      detectedLanguage: "English",
      severity: "High",
      priority: "HIGH",
      priorityScore: 82,
      department: "Jharkhand Road Construction Dept (RCD)",
      scoreBreakdown: {
        severityFactor: 25,
        citizenReportsFactor: 20,
        sensitiveLocationFactor: 16,
        timeUnresolvedFactor: 13,
        repeatReportsFactor: 8,
      },
    },
    evidence: [],
    timeline: [
      {
        id: "tl-701",
        time: "06:40",
        date: "Today",
        title: "Complaint submitted",
        actor: "Citizen",
        description: "Bank More Traders Association submitted grievance.",
      },
      {
        id: "tl-702",
        time: "07:15",
        date: "Today",
        title: "AI routed to Dhanbad RCD",
        actor: "AI/System",
        description: "Assigned priority HIGH (82/100) based on heavy commercial traffic impact.",
      },
    ],
  },
  {
    id: 8,
    publicId: "JH-BOK-2026-00305",
    title: "Primary health center medicine supply disruption, Sector 4, Bokaro",
    description: "Essential antibiotics, ORS, and insulin refrigerated stock depleted at Urban Primary Health Center for 4 days.",
    category: "Healthcare",
    district: "Bokaro",
    locationText: "Sector 4 City Center UPHC, Bokaro Steel City 827004",
    latitude: 23.6693,
    longitude: 86.1511,
    status: "AI Verified",
    priority: "HIGH",
    priorityScore: 79,
    severity: "High",
    department: "Department of Health & Family Welfare",
    reportCount: 8,
    duplicateCount: 7,
    createdAt: "2026-09-04T08:50:00Z",
    updatedAt: "2026-09-04T08:52:00Z",
    estimatedResolution: "Within 24 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 2,
      detectedCategory: "Healthcare",
      categoryConfidence: 92,
      detectedLanguage: "English",
      severity: "High",
      priority: "HIGH",
      priorityScore: 79,
      department: "Department of Health & Family Welfare",
      scoreBreakdown: {
        severityFactor: 26,
        citizenReportsFactor: 15,
        sensitiveLocationFactor: 18,
        timeUnresolvedFactor: 12,
        repeatReportsFactor: 8,
      },
    },
    evidence: [],
    timeline: [
      {
        id: "tl-801",
        time: "08:50",
        date: "Today",
        title: "Complaint registered",
        actor: "Citizen",
        description: "Patient relatives reported dispensary stockout.",
      },
      {
        id: "tl-802",
        time: "08:52",
        date: "Today",
        title: "AI verification completed",
        actor: "AI/System",
        description: "Recognized as urgent healthcare supply issue.",
      },
    ],
  },
  {
    id: 9,
    publicId: "JH-DGH-2026-00155",
    title: "Water tanker delivery failure in pilgrim transit corridor, Deoghar",
    description: "Designated drinking water hydration kiosks along Baidyanath Dham pilgrim ring road without water supply since morning.",
    category: "Water Supply",
    district: "Deoghar",
    locationText: "Shivganga Ring Road, Near Baidyanath Dham, Deoghar 814112",
    latitude: 24.4826,
    longitude: 86.7001,
    status: "Reported",
    priority: "MEDIUM",
    priorityScore: 64,
    severity: "Medium",
    department: "Drinking Water & Sanitation Dept (DWSD)",
    reportCount: 11,
    duplicateCount: 10,
    createdAt: "2026-09-04T10:10:00Z",
    updatedAt: "2026-09-04T10:10:00Z",
    estimatedResolution: "Within 12 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 3,
      detectedCategory: "Water Supply",
      categoryConfidence: 95,
      detectedLanguage: "English",
      severity: "Medium",
      priority: "MEDIUM",
      priorityScore: 64,
      department: "Drinking Water & Sanitation Dept (DWSD)",
      scoreBreakdown: {
        severityFactor: 18,
        citizenReportsFactor: 16,
        sensitiveLocationFactor: 16,
        timeUnresolvedFactor: 8,
        repeatReportsFactor: 6,
      },
    },
    evidence: [],
    timeline: [
      {
        id: "tl-901",
        time: "10:10",
        date: "Today",
        title: "Complaint received",
        actor: "Citizen",
        description: "Pilgrim assistance volunteers submitted report.",
      },
    ],
  },
  {
    id: 10,
    publicId: "JH-HZB-2026-00221",
    title: "Broken culvert bridge isolating rural connectivity, Barhi, Hazaribagh",
    description: "Heavy monsoon runoff washed away side approach of small culvert bridge connecting 4 agricultural villages to Barhi GT road.",
    category: "Road Infrastructure",
    district: "Hazaribagh",
    locationText: "Barhi-Padma Link Road, Hazaribagh 825405",
    latitude: 23.9937,
    longitude: 85.3621,
    status: "Officer Assigned",
    priority: "CRITICAL",
    priorityScore: 92,
    severity: "Critical",
    department: "Jharkhand Road Construction Dept (RCD)",
    assignedOfficer: SEEDED_OFFICERS[0],
    reportCount: 26,
    duplicateCount: 25,
    createdAt: "2026-09-04T07:00:00Z",
    updatedAt: "2026-09-04T08:30:00Z",
    estimatedResolution: "Within 36 hours",
    aiAnalysis: {
      isSpam: false,
      spamScore: 2,
      detectedCategory: "Road Infrastructure",
      categoryConfidence: 96,
      detectedLanguage: "English",
      severity: "Critical",
      priority: "CRITICAL",
      priorityScore: 92,
      department: "Jharkhand Road Construction Dept (RCD)",
      scoreBreakdown: {
        severityFactor: 30,
        citizenReportsFactor: 23,
        sensitiveLocationFactor: 17,
        timeUnresolvedFactor: 14,
        repeatReportsFactor: 8,
      },
    },
    evidence: [],
    timeline: [
      {
        id: "tl-1001",
        time: "07:00",
        date: "Today",
        title: "Complaint submitted",
        actor: "Citizen",
        description: "Village Mukhiya submitted photos of culvert breach.",
      },
      {
        id: "tl-1002",
        time: "08:30",
        date: "Today",
        title: "Emergency culvert squad assigned",
        actor: "Department",
        description: "RCD rural engineering wing dispatched precast pipes and Bailey bridge team.",
      },
    ],
  },
];

const INITIAL_REPORTS: IssueReport[] = [
  {
    id: "rep-01",
    issueId: 1,
    citizenName: "Rakesh Verma",
    citizenPhone: "+91 98351 22910",
    description: "Large pothole outside DAV School Ranchi. Children falling on two-wheelers.",
    locationText: "DAV School Bariatu Road, Ranchi",
    reportedAt: "2026-09-04T09:42:00Z",
  },
  {
    id: "rep-02",
    issueId: 1,
    citizenName: "Sunil Marandi",
    citizenPhone: "+91 94311 00293",
    description: "DAV school gate par gaddha bahut bada ho gaya hai",
    locationText: "Bariatu DAV, Ranchi",
    reportedAt: "2026-09-04T10:05:00Z",
    similarityToParent: 93,
  },
];

class IssueRepository {
  private issues: Issue[] = [...INITIAL_ISSUES];
  private reports: IssueReport[] = [...INITIAL_REPORTS];
  private officers: Officer[] = [...SEEDED_OFFICERS];
  private departments: Department[] = [...SEEDED_DEPARTMENTS];
  private nextId = 11;
  private duplicatesPreventedCount = 318;
  private spamPreventedCount = 73;

  async getIssues(filter?: IssueFilter): Promise<Issue[]> {
    let result = [...this.issues];

    if (filter) {
      if (filter.district && filter.district !== "All") {
        result = result.filter(i => i.district.toLowerCase() === filter.district?.toLowerCase());
      }
      if (filter.category && filter.category !== "All") {
        result = result.filter(i => i.category.toLowerCase() === filter.category?.toLowerCase());
      }
      if (filter.priority && filter.priority !== "All") {
        result = result.filter(i => i.priority === filter.priority);
      }
      if (filter.status && filter.status !== "All") {
        result = result.filter(i => i.status === filter.status);
      }
      if (filter.department && filter.department !== "All") {
        result = result.filter(i => i.department.toLowerCase().includes(filter.department!.toLowerCase()));
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(i =>
          i.title.toLowerCase().includes(q) ||
          i.publicId.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.locationText.toLowerCase().includes(q)
        );
      }
    }

    // Default sort: CRITICAL first, then HIGH, then by updatedAt descending
    const priorityWeight: Record<Priority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    result.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }

  async getIssueById(id: number | string): Promise<Issue | null> {
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    if (!isNaN(numId)) {
      const found = this.issues.find(i => i.id === numId);
      if (found) return found;
    }
    // Try finding by publicId
    return this.issues.find(i => i.publicId.toLowerCase() === String(id).toLowerCase()) || null;
  }

  async analyseReport(input: {
    description: string;
    location?: string;
    category?: string;
    urgency?: "Normal" | "Urgent" | "Emergency";
  }) {
    const { description, location = "Ranchi, Jharkhand", category, urgency = "Normal" } = input;

    // 1. Spam Check
    const spamCheck = checkSpam(description);

    // 2. Language Detection & Normalization
    const normalization = normalizeComplaint(description);

    // 3. Department Routing
    const routing = routeIssue(normalization.normalizedDescription, category, location);

    // 3. Priority Scoring
    const priorityResult = calculatePriorityScore({
      severity: routing.severity,
      reportCount: 1,
      text: `${description} ${location}`,
      urgency,
    });

    // 4. Semantic Duplicate Detection
    const duplicateMatches = findDuplicateMatches(normalization.normalizedDescription, location, this.issues, 60);

    return {
      isSpam: spamCheck.isSpam,
      spamScore: spamCheck.spamScore,
      classification: spamCheck.classification,
      abusiveContent: spamCheck.abusiveContent,
      detectedCategory: routing.detectedCategory,
      categoryConfidence: routing.categoryConfidence,
      detectedLanguage: normalization.originalLanguage,
      languageConfidence: normalization.confidence,
      normalizedDescription: normalization.normalizedDescription,
      normalizedIntent: normalization.normalizedIntent,
      severity: routing.severity,
      priority: priorityResult.priority,
      priorityScore: priorityResult.priorityScore,
      department: routing.assignedDepartment,
      scoreBreakdown: priorityResult.scoreBreakdown,
      duplicateMatches,
    };
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const analysis = await this.analyseReport({
      description: input.description,
      location: input.locationText,
      category: input.category,
      urgency: input.urgency,
    });

    if (analysis.isSpam) {
      this.spamPreventedCount++;
    }

    const id = this.nextId++;
    const district = input.district || (input.locationText.includes("Jamshedpur") ? "Jamshedpur" :
      input.locationText.includes("Dhanbad") ? "Dhanbad" :
      input.locationText.includes("Bokaro") ? "Bokaro" :
      input.locationText.includes("Deoghar") ? "Deoghar" :
      input.locationText.includes("Hazaribagh") ? "Hazaribagh" : "Ranchi");

    const districtCode = district.substring(0, 3).toUpperCase();
    const publicId = `JH-${districtCode}-2026-${String(id).padStart(5, "0")}`;

    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

    const evidenceList: Evidence[] = [];
    if (input.evidenceUrl) {
      evidenceList.push({
        id: `ev-${id}-init`,
        uploaderType: "citizen",
        type: "initial",
        url: input.evidenceUrl,
        caption: "Citizen uploaded evidence",
        timestamp: timeStr,
      });
    }

    const timeline: TimelineItem[] = [
      {
        id: `tl-${id}-1`,
        time: timeStr,
        date: "Today",
        title: "Complaint submitted",
        actor: "Citizen",
        description: `Registered by citizen${input.citizenName ? ` (${input.citizenName})` : ""}.`,
      },
      {
        id: `tl-${id}-2`,
        time: timeStr,
        date: "Today",
        title: "AI verification completed",
        actor: "AI/System",
        description: `Verified safe. Classified as ${analysis.detectedCategory} with ${analysis.categoryConfidence}% confidence. Priority scored at ${analysis.priorityScore}/100 (${analysis.priority}).`,
      },
      {
        id: `tl-${id}-3`,
        time: timeStr,
        date: "Today",
        title: `Routed to ${analysis.department}`,
        actor: "AI/System",
        description: `Auto-dispatched to responsible district division.`,
      },
    ];

    const newIssue: Issue = {
      id,
      publicId,
      title: input.title || analysis.normalizedIntent,
      description: input.description,
      originalLanguage: analysis.detectedLanguage,
      normalizedDescription: analysis.normalizedDescription,
      detectedIntent: analysis.normalizedIntent,
      category: analysis.detectedCategory,
      district,
      locationText: input.locationText,
      latitude: input.latitude || (district === "Jamshedpur" ? 22.8046 : district === "Dhanbad" ? 23.7957 : 23.3441),
      longitude: input.longitude || (district === "Jamshedpur" ? 86.2029 : district === "Dhanbad" ? 86.4304 : 85.3096),
      status: "Routed",
      priority: analysis.priority,
      priorityScore: analysis.priorityScore,
      severity: analysis.severity,
      department: analysis.department,
      reportCount: 1,
      duplicateCount: 0,
      createdAt: now,
      updatedAt: now,
      estimatedResolution: analysis.priority === "CRITICAL" ? "Within 6 hours" : analysis.priority === "HIGH" ? "Within 24 hours" : "Within 48 hours",
      aiAnalysis: {
        isSpam: analysis.isSpam,
        spamScore: analysis.spamScore,
        detectedCategory: analysis.detectedCategory,
        categoryConfidence: analysis.categoryConfidence,
        detectedLanguage: analysis.detectedLanguage,
        languageConfidence: analysis.languageConfidence,
        normalizedDescription: analysis.normalizedDescription,
        normalizedIntent: analysis.normalizedIntent,
        severity: analysis.severity,
        priority: analysis.priority,
        priorityScore: analysis.priorityScore,
        department: analysis.department,
        scoreBreakdown: analysis.scoreBreakdown,
        duplicateMatches: analysis.duplicateMatches,
      },
      evidence: evidenceList,
      timeline,
    };

    this.issues.unshift(newIssue);

    // Create initial report link
    this.reports.push({
      id: `rep-${id}-main`,
      issueId: id,
      citizenName: input.citizenName || "Anonymous Citizen",
      citizenPhone: input.citizenPhone,
      description: input.description,
      locationText: input.locationText,
      evidenceUrl: input.evidenceUrl,
      reportedAt: now,
      originalLanguage: analysis.detectedLanguage,
      normalizedDescription: analysis.normalizedDescription,
      detectedIntent: analysis.normalizedIntent,
    });

    return newIssue;
  }

  async supportIssue(issueId: number, input: SupportIssueInput): Promise<{ issue: Issue; report: IssueReport }> {
    const issue = await this.getIssueById(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

    // Link report
    const report: IssueReport = {
      id: `rep-${Date.now()}`,
      issueId: issue.id,
      citizenName: input.citizenName || "Verified Resident",
      citizenPhone: input.citizenPhone,
      description: input.comment || "Citizen supported this ongoing civic problem",
      locationText: issue.locationText,
      evidenceUrl: input.evidenceUrl,
      reportedAt: now,
    };
    this.reports.push(report);

    // Update Issue metrics
    issue.reportCount += 1;
    issue.duplicateCount += 1;
    this.duplicatesPreventedCount += 1;

    // Recalculate priority score based on increased report count
    const recalculation = calculatePriorityScore({
      severity: issue.severity,
      reportCount: issue.reportCount,
      text: `${issue.title} ${issue.description}`,
      repeatCount: issue.duplicateCount,
    });

    issue.priorityScore = recalculation.priorityScore;
    issue.priority = recalculation.priority;
    issue.aiAnalysis.priorityScore = recalculation.priorityScore;
    issue.aiAnalysis.priority = recalculation.priority;
    issue.aiAnalysis.scoreBreakdown = recalculation.scoreBreakdown;
    issue.updatedAt = now;

    // Add timeline entry
    issue.timeline.push({
      id: `tl-${Date.now()}`,
      time: timeStr,
      date: "Today",
      title: "Citizen supported issue",
      actor: "Citizen",
      description: `Report count increased to ${issue.reportCount}. AI priority recalculated to ${issue.priorityScore}/100 (${issue.priority}).`,
    });

    return { issue, report };
  }

  async assignOfficer(issueId: number, officerId: string): Promise<Issue> {
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error("Issue not found");

    const officer = this.officers.find(o => o.id === officerId) || this.officers[0];
    issue.assignedOfficer = officer;
    issue.status = "Officer Assigned";
    issue.updatedAt = new Date().toISOString();

    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    issue.timeline.push({
      id: `tl-assign-${Date.now()}`,
      time: timeStr,
      date: "Today",
      title: `Officer ${officer.name} assigned`,
      actor: "Department",
      description: `${officer.department} assigned field supervisor ${officer.name} (${officer.badge}).`,
    });

    return issue;
  }

  async updateStatus(issueId: number, status: IssueStatus, comment?: string, actor: "Citizen" | "AI/System" | "Department" | "Field Officer" = "Field Officer"): Promise<Issue> {
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error("Issue not found");

    issue.status = status;
    issue.updatedAt = new Date().toISOString();

    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    issue.timeline.push({
      id: `tl-status-${Date.now()}`,
      time: timeStr,
      date: "Today",
      title: `Status changed to ${status}`,
      actor,
      description: comment || `Work status updated to ${status}.`,
    });

    return issue;
  }

  async addEvidence(issueId: number, evidenceData: {
    type: "initial" | "before" | "after" | "site_inspection";
    uploaderType: "citizen" | "officer";
    url: string;
    caption: string;
    officerName?: string;
  }): Promise<Issue> {
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error("Issue not found");

    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const evidence: Evidence = {
      id: `ev-${Date.now()}`,
      uploaderType: evidenceData.uploaderType,
      type: evidenceData.type,
      url: evidenceData.url,
      caption: evidenceData.caption,
      timestamp: timeStr,
      officerName: evidenceData.officerName || issue.assignedOfficer?.name,
    };

    issue.evidence.push(evidence);
    issue.updatedAt = new Date().toISOString();

    issue.timeline.push({
      id: `tl-ev-${Date.now()}`,
      time: timeStr,
      date: "Today",
      title: `${evidenceData.uploaderType === "officer" ? "Field Officer" : "Citizen"} evidence uploaded`,
      actor: evidenceData.uploaderType === "officer" ? "Field Officer" : "Citizen",
      description: evidenceData.caption,
      evidenceUrl: evidenceData.url,
    });

    return issue;
  }

  async verifyResolution(issueId: number, confirmed: boolean, comment?: string): Promise<Issue> {
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error("Issue not found");

    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const now = new Date().toISOString();

    if (confirmed) {
      issue.status = "Resolved";
      issue.citizenVerification = {
        status: "confirmed",
        comment: comment || "Citizen verified resolution on ground.",
        verifiedAt: now,
      };
      issue.timeline.push({
        id: `tl-ver-${Date.now()}`,
        time: timeStr,
        date: "Today",
        title: "Citizen verified resolution",
        actor: "Citizen",
        description: comment ? `Resolution confirmed: "${comment}"` : "Citizen inspected and confirmed problem has been resolved.",
      });
    } else {
      issue.status = "Escalated";
      issue.citizenVerification = {
        status: "disputed",
        comment: comment || "Issue still unresolved on ground.",
        verifiedAt: now,
      };
      issue.priority = "CRITICAL";
      issue.priorityScore = Math.min(100, issue.priorityScore + 15);
      issue.timeline.push({
        id: `tl-ver-esc-${Date.now()}`,
        time: timeStr,
        date: "Today",
        title: "Citizen reported issue still NOT resolved",
        actor: "Citizen",
        description: `Resolution rejected: "${comment || "Work incomplete"}". Grievance escalated to Departmental Chief Engineer.`,
      });
    }

    issue.updatedAt = now;
    return issue;
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const totalReports = this.issues.reduce((acc, curr) => acc + curr.reportCount, 0) + 1284;
    const resolvedIssues = this.issues.filter(i => i.status === "Resolved").length;
    const openIssues = this.issues.filter(i => i.status !== "Resolved" && i.status !== "Rejected").length;
    const criticalIssues = this.issues.filter(i => i.priority === "CRITICAL" && i.status !== "Resolved").length;
    const highIssues = this.issues.filter(i => i.priority === "HIGH" && i.status !== "Resolved").length;

    return {
      reportsReceived: totalReports,
      duplicatesMerged: this.duplicatesPreventedCount,
      spamBlocked: this.spamPreventedCount,
      resolvedToday: 186,
      resolutionRate: 91.4,
      openIssues: 248 + openIssues,
      criticalIssues: 31 + criticalIssues,
      highIssues: 78 + highIssues,
      activeOfficers: 102,
      slaCompliance: 86.4,
    };
  }

  async getOfficers(): Promise<Officer[]> {
    return this.officers;
  }

  async getDepartments(): Promise<Department[]> {
    return this.departments;
  }

  async getReportsForIssue(issueId: number): Promise<IssueReport[]> {
    return this.reports.filter(r => r.issueId === issueId);
  }
}

export const issueRepository = new IssueRepository();
