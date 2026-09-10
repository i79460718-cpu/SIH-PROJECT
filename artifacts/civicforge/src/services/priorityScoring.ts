export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PriorityScoreBreakdown {
  severityFactor: number;
  citizenReportsFactor: number;
  urgencyFactor: number;
  sensitiveLocationFactor: number;
  timeUnresolvedFactor: number;
  repeatReportsFactor: number;
}

export interface PriorityScoreResult {
  priorityScore: number;
  priority: PriorityLevel;
  severity: "Low" | "Medium" | "High" | "Critical";
  breakdown: PriorityScoreBreakdown;
  rationale: string;
}

const SENSITIVE_LOCATION_PATTERNS = [
  /school|vidyalaya|dav\s+school|dps|college|university/i,
  /hospital|clinic|phc|chc|apollo|rims|dispensary/i,
  /market|bazaar|chowk|main\s+road|station|bus\s+stand/i,
  /highway|nh-\d+|overbridge|flyover/i,
];

const SEVERE_KEYWORD_PATTERNS = [
  /danger|khatra|accident|death|dying|live\s+wire|collapse|electrocution|sinkhole|open\s+manhole/i,
  /emergency|ambulance|child|elderly|gas\s+leak|sparking/i,
];

export function calculatePriorityScore(params: {
  text: string;
  locationText?: string;
  category?: string;
  urgency?: "Normal" | "Urgent" | "Emergency" | string;
  reportCount?: number;
  duplicateCount?: number;
  createdAt?: string | Date;
}): PriorityScoreResult {
  const {
    text,
    locationText = "",
    urgency = "Normal",
    reportCount = 1,
    duplicateCount = 0,
    createdAt,
  } = params;

  const combinedText = `${text} ${locationText}`.toLowerCase();

  // 1. Severity Factor (10 to 30 points)
  let severityFactor = 15;
  let severityLevel: "Low" | "Medium" | "High" | "Critical" = "Medium";

  const hasExtremeKeywords = SEVERE_KEYWORD_PATTERNS[0].test(combinedText);
  const hasHighKeywords = SEVERE_KEYWORD_PATTERNS[1].test(combinedText);

  if (urgency === "Emergency" || hasExtremeKeywords) {
    severityFactor = 30;
    severityLevel = "Critical";
  } else if (urgency === "Urgent" || hasHighKeywords) {
    severityFactor = 24;
    severityLevel = "High";
  } else if (combinedText.includes("major") || combinedText.includes("bada") || combinedText.includes("large")) {
    severityFactor = 20;
    severityLevel = "Medium";
  } else {
    severityFactor = 14;
    severityLevel = "Low";
  }

  // 2. Citizen Reports Factor (5 to 25 points)
  // Scale dynamically with reports
  let citizenReportsFactor = 5;
  if (reportCount >= 20) {
    citizenReportsFactor = 25;
  } else if (reportCount >= 10) {
    citizenReportsFactor = 20;
  } else if (reportCount >= 5) {
    citizenReportsFactor = 15;
  } else if (reportCount >= 2) {
    citizenReportsFactor = 10;
  }

  // 3. Urgency Selection Factor (5 to 20 points)
  let urgencyFactor = 8;
  if (urgency === "Emergency") {
    urgencyFactor = 20;
  } else if (urgency === "Urgent") {
    urgencyFactor = 15;
  }

  // 4. Sensitive Location Factor (0 to 18 points)
  let sensitiveLocationFactor = 0;
  for (const pattern of SENSITIVE_LOCATION_PATTERNS) {
    if (pattern.test(combinedText)) {
      sensitiveLocationFactor = 16;
      break;
    }
  }

  // 5. Time Unresolved Factor (0 to 18 points)
  let timeUnresolvedFactor = 4;
  if (createdAt) {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours > 72) {
      timeUnresolvedFactor = 18;
    } else if (ageHours > 48) {
      timeUnresolvedFactor = 14;
    } else if (ageHours > 24) {
      timeUnresolvedFactor = 10;
    } else {
      timeUnresolvedFactor = 5;
    }
  }

  // 6. Repeated Reports / Duplicate factor (0 to 12 points)
  let repeatReportsFactor = Math.min(12, duplicateCount * 3);

  // Calculate sum (0-100 clamped)
  const totalScore = Math.min(
    100,
    Math.max(
      15,
      severityFactor +
        citizenReportsFactor +
        urgencyFactor +
        sensitiveLocationFactor +
        timeUnresolvedFactor +
        repeatReportsFactor
    )
  );

  // Determine categorical priority
  let priority: PriorityLevel = "MEDIUM";
  if (totalScore >= 80) {
    priority = "CRITICAL";
  } else if (totalScore >= 65) {
    priority = "HIGH";
  } else if (totalScore >= 45) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  return {
    priorityScore: totalScore,
    priority,
    severity: severityLevel,
    breakdown: {
      severityFactor,
      citizenReportsFactor,
      urgencyFactor,
      sensitiveLocationFactor,
      timeUnresolvedFactor,
      repeatReportsFactor,
    },
    rationale: `Computed priority score ${totalScore}/100 (${priority}) weighted across severity, sensitive location impact, and duplicate report aggregation.`,
  };
}
