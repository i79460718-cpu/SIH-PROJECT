import type { Priority, ScoreBreakdown, Severity } from "@workspace/api-zod";

export interface PriorityCalculationResult {
  priority: Priority;
  priorityScore: number;
  severity: Severity;
  scoreBreakdown: ScoreBreakdown;
}

const SENSITIVE_KEYWORDS = [
  "school", "vidyalaya", "college", "hospital", "dispensary", "clinic",
  "highway", "railway", "station", "market", "bazaar", "nursing", "icu", "emergency"
];

export function calculatePriorityScore(params: {
  severity: Severity;
  reportCount: number;
  text: string;
  hoursUnresolved?: number;
  repeatCount?: number;
  urgency?: "Normal" | "Urgent" | "Emergency";
}): PriorityCalculationResult {
  const { severity, reportCount, text, hoursUnresolved = 2, repeatCount = 0, urgency = "Normal" } = params;
  const lowerText = text.toLowerCase();

  // 1. Severity Factor (+10 to +30)
  let severityFactor = 15;
  if (severity === "Critical" || urgency === "Emergency") severityFactor = 30;
  else if (severity === "High" || urgency === "Urgent") severityFactor = 25;
  else if (severity === "Medium") severityFactor = 18;
  else severityFactor = 10;

  // 2. Citizen Reports Factor (+5 to +25)
  // Scaling based on report volume
  let citizenReportsFactor = Math.min(25, Math.round(5 + Math.log2(Math.max(1, reportCount)) * 4.5));
  if (reportCount >= 20) citizenReportsFactor = 22;
  if (reportCount >= 40) citizenReportsFactor = 25;

  // 3. Sensitive Location Factor (+0 to +20)
  const isSensitive = SENSITIVE_KEYWORDS.some(kw => lowerText.includes(kw));
  let sensitiveLocationFactor = isSensitive ? 18 : 6;
  if (lowerText.includes("hospital") || lowerText.includes("emergency") || lowerText.includes("school")) {
    sensitiveLocationFactor = 18;
  }

  // 4. Time Unresolved Factor (+5 to +15)
  let timeUnresolvedFactor = 8;
  if (hoursUnresolved >= 48) timeUnresolvedFactor = 15;
  else if (hoursUnresolved >= 24) timeUnresolvedFactor = 14;
  else if (hoursUnresolved >= 12) timeUnresolvedFactor = 11;
  else timeUnresolvedFactor = 8;

  // 5. Repeat Reports Factor (+0 to +10)
  let repeatReportsFactor = Math.min(10, Math.round(repeatCount * 1.5 + (reportCount > 5 ? 5 : 2)));
  if (reportCount > 15) repeatReportsFactor = 8;

  const totalScore = Math.min(100, Math.max(10,
    severityFactor +
    citizenReportsFactor +
    sensitiveLocationFactor +
    timeUnresolvedFactor +
    repeatReportsFactor
  ));

  let priority: Priority = "LOW";
  if (totalScore >= 85) priority = "CRITICAL";
  else if (totalScore >= 68) priority = "HIGH";
  else if (totalScore >= 45) priority = "MEDIUM";
  else priority = "LOW";

  return {
    priority,
    priorityScore: totalScore,
    severity,
    scoreBreakdown: {
      severityFactor,
      citizenReportsFactor,
      sensitiveLocationFactor,
      timeUnresolvedFactor,
      repeatReportsFactor,
    },
  };
}
