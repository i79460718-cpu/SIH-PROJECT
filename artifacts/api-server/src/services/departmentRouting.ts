import type { Category, Severity } from "@workspace/api-zod";

export interface DepartmentRoutingResult {
  detectedCategory: Category;
  categoryConfidence: number;
  assignedDepartment: string;
  detectedLanguage: "English" | "Hindi" | "Hinglish";
  severity: Severity;
  normalizedIntent: string;
}

const CATEGORY_MAP: Record<Category, string> = {
  "Road Infrastructure": "Jharkhand Road Construction Dept (RCD)",
  "Water Supply": "Drinking Water & Sanitation Dept (DWSD)",
  "Electricity": "Jharkhand Bijli Vitran Nigam Ltd (JBVNL)",
  "Sanitation": "Municipal Sanitation Corporation (RMC)",
  "Drainage": "Urban Stormwater & Drainage Cell",
  "Healthcare": "Department of Health & Family Welfare",
  "Education": "School Education & Literacy Department",
  "Public Safety": "District Administration & Police",
  "Public Transport": "Jharkhand Urban Transport Corporation",
  "Other": "District Grievance Redressal Cell",
};

export function routeIssue(text: string, manualCategory?: string, location = ""): DepartmentRoutingResult {
  const lower = `${text} ${location}`.toLowerCase();

  // Language check
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hinglishWords = ["ke", "ki", "ka", "mein", "par", "hai", "khadda", "sadak", "paani", "bijli", "kachra", "naali", "bada", "bahut", "kripya"];
  const hasHinglish = hinglishWords.some(w => new RegExp(`\\b${w}\\b`, "i").test(text));

  let detectedLanguage: "English" | "Hindi" | "Hinglish" = "English";
  if (hasDevanagari) detectedLanguage = "Hindi";
  else if (hasHinglish) detectedLanguage = "Hinglish";

  // Category determination
  let detectedCategory: Category = "Road Infrastructure";
  let confidence = 92;
  let severity: Severity = "Medium";
  let normalizedIntent = "Civic grievance reported";

  if (manualCategory && manualCategory !== "Let AI Detect" && manualCategory in CATEGORY_MAP) {
    detectedCategory = manualCategory as Category;
    confidence = 98;
  } else {
    // Heuristic detection based on keywords
    if (/khadda|pothole|road|sadak|rasta|asphalt|culvert|bridge|flyover/i.test(lower)) {
      detectedCategory = "Road Infrastructure";
      confidence = 96;
      normalizedIntent = "Road damage or hazardous pothole requiring resurfacing";
      if (/bada|deep|accident|danger|school/i.test(lower)) severity = "High";
    } else if (/water|paani|pani|jal|leakage|pipe|pipeline|tanker|supply|borewell/i.test(lower)) {
      detectedCategory = "Water Supply";
      confidence = 95;
      normalizedIntent = "Water pipeline leakage or clean drinking water disruption";
      if (/burst|flooding|drinking/i.test(lower)) severity = "High";
    } else if (/bijli|power|electricity|wire|taar|spark|transformer|pole|khamba|streetlight|blackout/i.test(lower)) {
      detectedCategory = "Electricity";
      confidence = 97;
      normalizedIntent = "Electrical hazard, sparking power line, or outage";
      if (/spark|wire|hanging|danger|current/i.test(lower)) severity = "Critical";
    } else if (/kachra|kuda|garbage|dustbin|waste|gandagi|dump|safai|cleanliness/i.test(lower)) {
      detectedCategory = "Sanitation";
      confidence = 93;
      normalizedIntent = "Uncollected municipal waste and garbage overflow";
      severity = "Medium";
    } else if (/naali|nali|drain|drainage|gutter|manhole|sewage|stagnant/i.test(lower)) {
      detectedCategory = "Drainage";
      confidence = 94;
      normalizedIntent = "Blocked stormwater drainage or open manhole safety hazard";
      if (/open\s+manhole|overflow/i.test(lower)) severity = "High";
    } else if (/hospital|clinic|doctor|medicine|ambulance|health|patient|dispensary/i.test(lower)) {
      detectedCategory = "Healthcare";
      confidence = 91;
      normalizedIntent = "Primary healthcare or medical facility service deficiency";
      severity = "High";
    } else if (/school|vidyalaya|classroom|teacher|midday|bench/i.test(lower)) {
      detectedCategory = "Education";
      confidence = 90;
      normalizedIntent = "Government school infrastructure or amenity issue";
      severity = "Medium";
    } else if (/theft|dark|crime|safety|harassment|cctv|police/i.test(lower)) {
      detectedCategory = "Public Safety";
      confidence = 92;
      normalizedIntent = "Public safety or civic hazard requiring administrative intervention";
      severity = "High";
    } else if (/bus|auto|transport|stand|depot|fare/i.test(lower)) {
      detectedCategory = "Public Transport";
      confidence = 88;
      normalizedIntent = "Public transit irregularity or bus shelter issue";
      severity = "Low";
    }
  }

  return {
    detectedCategory,
    categoryConfidence: confidence,
    assignedDepartment: CATEGORY_MAP[detectedCategory] || "District Grievance Redressal Cell",
    detectedLanguage,
    severity,
    normalizedIntent,
  };
}
