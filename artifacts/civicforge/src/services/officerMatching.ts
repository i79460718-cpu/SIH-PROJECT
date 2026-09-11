export interface RoutingOfficer { id: string; name: string; department: string; district: string; activeTasks: number; active?: boolean }
export function selectOfficer(officers: RoutingOfficer[], department: string, district: string): RoutingOfficer | null {
  const normalized = (value: string) => value.trim().toLowerCase();
  // Never silently route across jurisdictions or to an unrelated department.
  return officers.filter(officer => officer.active !== false && normalized(officer.department) === normalized(department) && normalized(officer.district) === normalized(district))
    .sort((a, b) => a.activeTasks - b.activeTasks || a.id.localeCompare(b.id))[0] ?? null;
}
