export interface DepartmentRoutingResult {
  departmentName: string;
  departmentCode: string;
  confidence: number;
  routingReason: string;
}

export const DEPARTMENT_MAPPINGS: Record<
  string,
  { name: string; code: string; authority: string }
> = {
  "Road Infrastructure": {
    name: "Road Infrastructure Department",
    code: "ROADS",
    authority: "Jharkhand State Road Development Corporation & Municipal Roads Wing",
  },
  "Water Supply": {
    name: "Water Supply Department",
    code: "WATER",
    authority: "Drinking Water and Sanitation Department (DWSD), Jharkhand",
  },
  "Electricity": {
    name: "Electricity Department",
    code: "POWER",
    authority: "Jharkhand Bijli Vitran Nigam Limited (JBVNL)",
  },
  "Sanitation": {
    name: "Sanitation Department",
    code: "SANITATION",
    authority: "Urban Local Bodies (ULB) Solid Waste Cell",
  },
  "Drainage": {
    name: "Drainage Department",
    code: "DRAINAGE",
    authority: "Stormwater and Underground Sewerage Division",
  },
  "Healthcare": {
    name: "Health Department",
    code: "HEALTH",
    authority: "Department of Health, Medical Education & Family Welfare",
  },
  "Education": {
    name: "Education Department",
    code: "EDUCATION",
    authority: "School Education and Literacy Department, Jharkhand",
  },
  "Public Safety": {
    name: "Public Safety Department",
    code: "SAFETY",
    authority: "Jharkhand State Police & Civil Defence Coordination Cell",
  },
  "Other": {
    name: "General Civic Administration",
    code: "OTHER",
    authority: "Municipal Commissioner Grievance Redressal Cell",
  },
};

export function routeToDepartment(
  category: string,
  categoryConfidence: number = 90
): DepartmentRoutingResult {
  const mapping = DEPARTMENT_MAPPINGS[category] || DEPARTMENT_MAPPINGS["Other"];
  const confidence = Math.min(99, Math.max(70, Math.round(categoryConfidence * 0.98)));

  return {
    departmentName: mapping.name,
    departmentCode: mapping.code,
    confidence,
    routingReason: `Automated rule-based assignment to ${mapping.name} (${mapping.authority}) based on detected "${category}" classification.`,
  };
}
