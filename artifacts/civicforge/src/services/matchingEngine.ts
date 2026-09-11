import { University } from "./universityService";
import { Issue } from "../lib/jansamvad-api";

export interface MatchResult {
  university: University;
  score: number;
  reasons: string[];
}

export function matchUniversityToChallenge(challenge: Issue, unis: University[]): MatchResult[] {
  return unis.map(uni => {
    let score = 0;
    const reasons: string[] = [];

    // Domain check
    if (uni.academic_disciplines.includes(challenge.category)) {
      score += 40;
      reasons.push(`${challenge.category} expertise`);
    }

    // Facilities check
    if (uni.facilities?.length) {
      score += 30;
      reasons.push("Advanced laboratory facilities");
    }

    // Simple deterministic score
    return {
      university: uni,
      score: Math.min(score, 100),
      reasons
    };
  }).sort((a, b) => b.score - a.score);
}
