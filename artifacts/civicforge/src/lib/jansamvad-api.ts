import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  getIssues,
  getIssueById,
  createIssue,
  supportExistingIssue,
  addReportToIssue,
  getIssueReports,
  assignOfficer,
  getOfficerAssignments,
  updateIssueStatus,
  verifyIssueResolution,
  getDashboardSummary,
  getDepartments,
  getOfficers,
  uploadEvidenceFile,
  DEMO_DEPARTMENTS,
  DEMO_OFFICERS,
} from "./supabase";
import { checkSpam } from "../services/spamDetection";
import { detectCategory } from "../services/categoryDetection";
import { findDuplicateCandidates } from "../services/duplicateDetection";
import { calculatePriorityScore } from "../services/priorityScoring";
import { routeToDepartment } from "../services/departmentRouting";

import type {
  CreateIssueInput,
  Department,
  Issue,
  IssueReport,
  IssueStatus,
  Officer,
  SupportIssueInput,
} from "@workspace/api-zod";

export {
  getIssues,
  getIssueById,
  createIssue,
  supportExistingIssue,
  addReportToIssue,
  getIssueReports,
  assignOfficer,
  getOfficerAssignments,
  updateIssueStatus,
  verifyIssueResolution,
  getDashboardSummary,
};

export type {
  CreateIssueInput,
  Department,
  Issue,
  IssueReport,
  IssueStatus,
  Officer,
  SupportIssueInput,
};

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

export interface AnalyseReportResponse {
  isSpam: boolean;
  spamScore: number;
  classification: "Valid" | "Spam" | "Advertisement" | "Abusive" | "Suspicious Repetition";
  abusiveContent: boolean;
  detectedCategory: string;
  categoryConfidence: number;
  detectedLanguage: string;
  normalizedIntent: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priorityScore: number;
  department: string;
  scoreBreakdown: {
    severityFactor: number;
    citizenReportsFactor: number;
    sensitiveLocationFactor: number;
    timeUnresolvedFactor: number;
    repeatReportsFactor: number;
  };
  duplicateMatches?: Array<{
    issueId: string | number;
    publicId: string;
    title: string;
    similarityScore: number;
    location: string;
    reportCount: number;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
    status: IssueStatus;
  }>;
}

export interface IssueFilterParams {
  district?: string;
  category?: string;
  priority?: string;
  status?: string;
  department?: string;
  search?: string;
}

export function useIssues(filters?: IssueFilterParams) {
  return useQuery<Issue[]>({
    queryKey: ["issues", filters],
    queryFn: async () => {
      return getIssues(filters);
    },
  });
}

export function useIssue(idOrPublicId: string | number) {
  return useQuery<Issue & { reports?: IssueReport[] }>({
    queryKey: ["issue", idOrPublicId],
    queryFn: async () => {
      return getIssueById(idOrPublicId);
    },
    enabled: Boolean(idOrPublicId),
  });
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      return getDashboardSummary();
    },
    refetchInterval: 15000,
  });
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      return getDepartments();
    },
    staleTime: 30000,
  });
}

export function useOfficers() {
  return useQuery<Officer[]>({
    queryKey: ["officers"],
    queryFn: async () => {
      return getOfficers();
    },
    staleTime: 30000,
  });
}

export function useOfficerAssignments(officerId?: string) {
  return useQuery<Issue[]>({
    queryKey: ["officer-assignments", officerId],
    queryFn: async () => {
      if (!officerId) return [];
      return getOfficerAssignments(officerId);
    },
    enabled: Boolean(officerId),
  });
}

export function useAnalyseReport() {
  return useMutation<
    AnalyseReportResponse,
    Error,
    { description: string; location?: string; category?: string; urgency?: string }
  >({
    mutationFn: async (data) => {
      // 1. Spam detection
      const spam = checkSpam(data.description);

      // 2. Category detection
      const cat = detectCategory(data.description);
      const chosenCat =
        data.category && data.category !== "Let AI Detect" ? data.category : cat.category;

      // 3. Duplicate search against real Supabase issues
      const existingIssues = await getIssues();
      const duplicateMatches = findDuplicateCandidates(
        data.description,
        data.location || "",
        chosenCat,
        existingIssues
      );

      // 4. Priority scoring
      const priority = calculatePriorityScore({
        text: data.description,
        locationText: data.location,
        category: chosenCat,
        urgency: data.urgency,
        reportCount: 1,
      });

      // 5. Department routing
      const dept = routeToDepartment(chosenCat, cat.confidence);

      return {
        isSpam: spam.isSpam,
        spamScore: spam.spamScore,
        classification: spam.classification,
        abusiveContent: spam.abusiveContent,
        detectedCategory: chosenCat,
        categoryConfidence: cat.confidence,
        detectedLanguage: cat.detectedLanguage,
        normalizedIntent: data.description.slice(0, 100),
        severity: priority.severity,
        priority: priority.priority,
        priorityScore: priority.priorityScore,
        department: dept.departmentName,
        scoreBreakdown: priority.breakdown,
        duplicateMatches: duplicateMatches as any,
      };
    },
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation<Issue, Error, CreateIssueInput>({
    mutationFn: async (data) => {
      return createIssue(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useIssueReports(issueId: string | number) {
  const idStr = String(issueId || "").trim();
  const isValid = Boolean(idStr && idStr !== "undefined" && idStr !== "null");

  return useQuery({
    queryKey: ["issue-reports", idStr],
    queryFn: async () => {
      if (!isValid) return [];
      try {
        return await getIssueReports(idStr);
      } catch (err) {
        console.warn("[ReactQuery] useIssueReports notice:", err);
        return [];
      }
    },
    enabled: isValid,
    staleTime: 30000,
    retry: 1,
  });
}

export function useAddReportToIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      issueId,
      description,
      locationText,
    }: {
      issueId: string | number;
      description: string;
      locationText?: string;
    }) => {
      return addReportToIssue(issueId, description, locationText);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue", String(variables.issueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["issue-reports", String(variables.issueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["issues"],
      });
    },
  });
}

export function useSupportIssue() {
  const queryClient = useQueryClient();
  return useMutation<
    { issue: Issue; report?: any },
    Error,
    { issueId: string | number; input: SupportIssueInput }
  >({
    mutationFn: async ({ issueId, input }) => {
      return supportExistingIssue(issueId, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue", String(variables.issueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["issue-reports", String(variables.issueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      });
    },
  });
}

export function useAssignOfficer() {
  const queryClient = useQueryClient();
  return useMutation<Issue, Error, { issueId: string | number; officerId: string }>({
    mutationFn: async ({ issueId, officerId }) => {
      return assignOfficer(issueId, officerId);
    },
    onSuccess: (updatedIssue, variables) => {
      // Set query data synchronously for instantaneous UI update
      if (updatedIssue) {
        queryClient.setQueryData(["issue", variables.issueId], updatedIssue);
        queryClient.setQueryData(["issue", String(variables.issueId)], updatedIssue);
        if (updatedIssue.id) {
          queryClient.setQueryData(["issue", updatedIssue.id], updatedIssue);
        }
        if (updatedIssue.publicId) {
          queryClient.setQueryData(["issue", updatedIssue.publicId], updatedIssue);
        }
      }

      // Requirement 8: Invalidate ["issue", issueId], ["issues"], ["issue-timeline", issueId], ["officer-assignments"]
      queryClient.invalidateQueries({ queryKey: ["issue", variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ["issue", String(variables.issueId)] });
      if (updatedIssue?.id) {
        queryClient.invalidateQueries({ queryKey: ["issue", updatedIssue.id] });
      }
      if (updatedIssue?.publicId) {
        queryClient.invalidateQueries({ queryKey: ["issue", updatedIssue.publicId] });
      }
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue-timeline", variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ["issue-timeline", String(variables.issueId)] });
      if (updatedIssue?.id) {
        queryClient.invalidateQueries({ queryKey: ["issue-timeline", updatedIssue.id] });
      }
      if (updatedIssue?.publicId) {
        queryClient.invalidateQueries({ queryKey: ["issue-timeline", updatedIssue.publicId] });
      }
      queryClient.invalidateQueries({ queryKey: ["officer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["officers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    Issue,
    Error,
    { issueId: string | number; status: IssueStatus; comment?: string; actor?: string }
  >({
    mutationFn: async ({ issueId, status, comment, actor }) => {
      return updateIssueStatus(issueId, status, comment, actor);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ["officer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useVerifyResolution() {
  const queryClient = useQueryClient();
  return useMutation<
    Issue,
    Error,
    { issueId: string | number; confirmed: boolean; comment?: string }
  >({
    mutationFn: async ({ issueId, confirmed, comment }) => {
      return verifyIssueResolution(issueId, confirmed, comment);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useAddEvidence() {
  const queryClient = useQueryClient();
  return useMutation<
    Issue,
    Error,
    {
      issueId: string | number;
      type: "initial" | "before" | "after" | "site_inspection";
      uploaderType: "citizen" | "officer";
      url: string;
      caption: string;
      officerName?: string;
    }
  >({
    mutationFn: async ({ issueId, type, uploaderType, url, caption, officerName }) => {
      // 1. Insert into evidence table
      try {
        const evType = type === "after" ? "after" : type === "before" ? "before" : "initial_report";
        const res = await supabase.from("evidence").insert([
          {
            issue_id: String(issueId),
            evidence_type: evType,
            file_url: url,
            file_name: caption || "Ground evidence",
          },
        ]);
        if (res.error) {
          console.warn("[Supabase] Direct evidence insert notice:", res.error.message);
        }
      } catch (err) {
        console.warn("[Supabase] Evidence persistence notice:", err);
      }

      // 2. Update issue status
      const nextStatus = type === "after" ? "Resolved - Awaiting Verification" : "Work Started";
      return updateIssueStatus(
        issueId,
        nextStatus,
        `Evidence uploaded (${type.toUpperCase()}): ${caption}`,
        uploaderType === "officer" ? `Officer ${officerName || "Field Inspector"}` : "Citizen"
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["issue", String(variables.issueId)] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["officer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
