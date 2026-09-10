import { z } from "zod";

export const IssueStatusSchema = z.enum([
  "Reported",
  "AI Verified",
  "Routed",
  "Officer Assigned",
  "Accepted",
  "Work Started",
  "Resolved - Awaiting Verification",
  "Resolved",
  "Escalated",
  "Rejected",
]);
export type IssueStatus = z.infer<typeof IssueStatusSchema>;

export const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const CategorySchema = z.enum([
  "Road Infrastructure",
  "Water Supply",
  "Electricity",
  "Sanitation",
  "Healthcare",
  "Education",
  "Public Safety",
  "Drainage",
  "Public Transport",
  "Other",
]);
export type Category = z.infer<typeof CategorySchema>;

export const SeveritySchema = z.enum(["Low", "Medium", "High", "Critical"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  uploaderType: z.enum(["citizen", "officer"]),
  type: z.enum(["initial", "before", "after", "site_inspection"]),
  url: z.string(),
  caption: z.string(),
  timestamp: z.string(),
  officerName: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const TimelineItemSchema = z.object({
  id: z.string(),
  time: z.string(),
  date: z.string().optional(),
  title: z.string(),
  actor: z.enum(["Citizen", "AI/System", "Department", "Field Officer"]),
  description: z.string(),
  evidenceUrl: z.string().optional(),
});
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export const DuplicateMatchSchema = z.object({
  issueId: z.number(),
  publicId: z.string(),
  title: z.string(),
  similarityScore: z.number(),
  location: z.string(),
  reportCount: z.number(),
  priority: PrioritySchema,
  status: IssueStatusSchema,
});
export type DuplicateMatch = z.infer<typeof DuplicateMatchSchema>;

export const ScoreBreakdownSchema = z.object({
  severityFactor: z.number(),
  citizenReportsFactor: z.number(),
  sensitiveLocationFactor: z.number(),
  timeUnresolvedFactor: z.number(),
  repeatReportsFactor: z.number(),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const AiAnalysisSchema = z.object({
  isSpam: z.boolean(),
  spamScore: z.number(),
  detectedCategory: CategorySchema,
  categoryConfidence: z.number(),
  detectedLanguage: z.string(),
  languageConfidence: z.number().optional(),
  normalizedDescription: z.string().optional(),
  normalizedIntent: z.string().optional(),
  severity: SeveritySchema,
  priority: PrioritySchema,
  priorityScore: z.number(),
  department: z.string(),
  scoreBreakdown: ScoreBreakdownSchema,
  duplicateMatches: z.array(DuplicateMatchSchema).optional(),
});
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

export const OfficerSchema = z.object({
  id: z.string(),
  name: z.string(),
  badge: z.string(),
  designation: z.string(),
  department: z.string(),
  district: z.string(),
  phone: z.string(),
  avatarUrl: z.string().optional(),
  activeTasks: z.number(),
  rating: z.number(),
});
export type Officer = z.infer<typeof OfficerSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  head: z.string(),
  activeOfficers: z.number(),
  openIssues: z.number(),
  slaRate: z.number(),
  categories: z.array(CategorySchema),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const IssueReportSchema = z.object({
  id: z.string(),
  issueId: z.number(),
  citizenName: z.string(),
  citizenPhone: z.string().optional(),
  description: z.string(),
  locationText: z.string(),
  evidenceUrl: z.string().optional(),
  reportedAt: z.string(),
  originalLanguage: z.string().optional(),
  normalizedDescription: z.string().optional(),
  detectedIntent: z.string().optional(),
  similarityToParent: z.number().optional(),
});
export type IssueReport = z.infer<typeof IssueReportSchema>;

export const CitizenVerificationSchema = z.object({
  status: z.enum(["pending", "confirmed", "disputed"]),
  comment: z.string().optional(),
  verifiedAt: z.string().optional(),
});
export type CitizenVerification = z.infer<typeof CitizenVerificationSchema>;

export const IssueSchema = z.object({
  id: z.number(),
  publicId: z.string(),
  title: z.string(),
  description: z.string(),
  originalLanguage: z.string().optional(),
  normalizedDescription: z.string().optional(),
  detectedIntent: z.string().optional(),
  category: CategorySchema,
  district: z.string(),
  locationText: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  status: IssueStatusSchema,
  priority: PrioritySchema,
  priorityScore: z.number(),
  severity: SeveritySchema,
  department: z.string(),
  assignedOfficer: OfficerSchema.optional(),
  reportCount: z.number(),
  duplicateCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  estimatedResolution: z.string(),
  citizenVerification: CitizenVerificationSchema.optional(),
  aiAnalysis: AiAnalysisSchema,
  evidence: z.array(EvidenceSchema),
  timeline: z.array(TimelineItemSchema),
});
export type Issue = z.infer<typeof IssueSchema>;

export const AnalyseReportInputSchema = z.object({
  description: z.string(),
  location: z.string().optional(),
  category: z.string().optional(),
  urgency: z.string().optional(),
});
export type AnalyseReportInput = z.infer<typeof AnalyseReportInputSchema>;

export const CreateIssueInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: CategorySchema.optional(),
  district: z.string().optional(),
  locationText: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  evidenceUrl: z.string().optional(),
  citizenName: z.string().optional(),
  citizenPhone: z.string().optional(),
  urgency: z.enum(["Normal", "Urgent", "Emergency"]).optional(),
});
export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;

export const SupportIssueInputSchema = z.object({
  citizenName: z.string().optional(),
  citizenPhone: z.string().optional(),
  comment: z.string().optional(),
  evidenceUrl: z.string().optional(),
});
export type SupportIssueInput = z.infer<typeof SupportIssueInputSchema>;
