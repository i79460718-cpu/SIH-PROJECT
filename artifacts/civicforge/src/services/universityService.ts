import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface University {
  id: string;
  name: string;
  district: string;
  academic_disciplines: string[];
  description: string;
  facilities: string[];
  status?: string;
}

export async function getUniversities(): Promise<University[]> {
  const { data, error } = await supabase.from("universities").select("*");
  if (error) throw error;
  return data || [];
}

export function useUniversities() {
  return useQuery<University[]>({
    queryKey: ["universities"],
    queryFn: getUniversities,
  });
}
