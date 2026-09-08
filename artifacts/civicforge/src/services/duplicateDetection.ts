export interface DuplicateCandidate {
  issueId: string | number;
  publicId: string;
  title: string;
  similarityScore: number;
  location: string;
  reportCount: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: any;
  matchedTokens?: string[];
}

const SYNONYM_MAP: Record<string, string> = {
  // Road & potholes
  "khadda": "pothole",
  "gaddha": "pothole",
  "kaddha": "pothole",
  "gatha": "pothole",
  "hole": "pothole",
  "potholes": "pothole",
  "sadak": "road",
  "rasta": "road",
  "marg": "road",
  "highway": "road",
  "street": "road",
  "tuta": "broken",
  "toota": "broken",
  "kharab": "damaged",
  "damage": "damaged",
  "damaged": "damaged",

  // Water
  "paani": "water",
  "pani": "water",
  "jal": "water",
  "nal": "pipe",
  "piping": "pipe",
  "pipeline": "pipe",
  "leak": "leakage",
  "risav": "leakage",
  "leakage": "leakage",
  "supply": "supply",

  // Electricity
  "bijli": "electricity",
  "vidyut": "electricity",
  "wire": "wire",
  "taar": "wire",
  "current": "electricity",
  "sparking": "sparking",
  "pole": "pole",
  "khamba": "pole",
  "light": "light",
  "streetlight": "light",
  "transformer": "transformer",
  "blackout": "powercut",

  // Sanitation & Garbage
  "kachra": "garbage",
  "kuda": "garbage",
  "safai": "sanitation",
  "dustbin": "dustbin",
  "gandagi": "garbage",
  "trash": "garbage",
  "waste": "garbage",
  "heap": "dump",
  "dump": "dump",

  // Drainage
  "naali": "drainage",
  "nali": "drainage",
  "drain": "drainage",
  "drainage": "drainage",
  "gutter": "drainage",
  "manhole": "drainage",
  "dhakkan": "cover",
  "jam": "blocked",
  "block": "blocked",
  "blocked": "blocked",

  // Modifiers & locations
  "bada": "large",
  "badi": "large",
  "huge": "large",
  "samne": "outside",
  "paas": "near",
  "bagal": "near",
  "outside": "outside",
  "near": "near",
  "front": "outside",
};

const STOP_WORDS = new Set([
  "hai", "hai.", "hain", "ke", "ki", "ka", "me", "mein", "par", "se", "aur", "pe",
  "ko", "yeh", "woh", "the", "a", "an", "in", "on", "at", "to", "for", "of", "and",
  "is", "are", "very", "too", "there", "here", "bhi", "ho", "gaya", "gayi"
]);

/**
 * Normalizes text to canonical tokens for language-agnostic similarity matching
 */
export function normalizeCivicText(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");
  const tokens: string[] = [];

  for (const word of words) {
    if (!word || STOP_WORDS.has(word)) continue;
    const mapped = SYNONYM_MAP[word] || word;
    tokens.push(mapped);
  }

  return tokens;
}

/**
 * Computes Dice-Sørensen similarity between two token sets
 */
function tokenSimilarity(tokensA: string[], tokensB: string[]): { score: number; matches: string[] } {
  if (tokensA.length === 0 || tokensB.length === 0) return { score: 0, matches: [] };

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection: string[] = [];
  for (const t of setA) {
    if (setB.has(t)) {
      intersection.push(t);
    }
  }

  const score = (2 * intersection.length) / (setA.size + setB.size);
  return { score, matches: intersection };
}

/**
 * Location similarity based on shared locality tokens
 */
function locationSimilarity(locA: string, locB: string): number {
  if (!locA || !locB) return 0.5;
  const tA = normalizeCivicText(locA);
  const tB = normalizeCivicText(locB);
  const { score } = tokenSimilarity(tA, tB);
  return score;
}

export function findDuplicateCandidates(
  newDescription: string,
  newLocation: string,
  newCategory: string,
  existingIssues: Array<{
    id: string | number;
    publicId?: string;
    public_id?: string;
    title: string;
    description?: string;
    locationText?: string;
    location_text?: string;
    district?: string;
    category: string;
    reportCount?: number;
    report_count?: number;
    priority: string;
    status: string;
  }>,
  threshold: number = 0.55
): DuplicateCandidate[] {
  const newTokens = normalizeCivicText(`${newDescription} ${newLocation}`);
  const results: DuplicateCandidate[] = [];

  for (const issue of existingIssues) {
    const issueDesc = issue.description || issue.title;
    const issueLoc = issue.locationText || issue.location_text || "";
    const issueTokens = normalizeCivicText(`${issue.title} ${issueDesc} ${issueLoc}`);

    const { score: textScore, matches } = tokenSimilarity(newTokens, issueTokens);

    // Category similarity (1.0 if match, 0.3 if different)
    const catScore =
      issue.category && newCategory && issue.category.toLowerCase() === newCategory.toLowerCase()
        ? 1.0
        : 0.35;

    // Location similarity
    const locScore = locationSimilarity(newLocation, issueLoc);

    // Weighted composite similarity
    // Text is 60%, Category is 20%, Location is 20%
    let composite = textScore * 0.6 + catScore * 0.2 + locScore * 0.2;

    // Bonus if key landmarks match (e.g. "dav", "school", "station", "chowk")
    const landmarkTokens = ["dav", "school", "hospital", "chowk", "bazaar", "market", "station", "bridge"];
    const hasSharedLandmark = matches.some((m) => landmarkTokens.includes(m));
    if (hasSharedLandmark) {
      composite = Math.min(1.0, composite + 0.15);
    }

    if (composite >= threshold) {
      const percentage = Math.round(composite * 100);
      const publicId =
        issue.publicId ||
        issue.public_id ||
        `JH-${String(issue.district || "RNC").substring(0, 3).toUpperCase()}-2026-${String(issue.id).slice(-5)}`;

      let pVal: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "HIGH";
      const prStr = String(issue.priority || "").toUpperCase();
      if (prStr === "LOW" || prStr === "MEDIUM" || prStr === "HIGH" || prStr === "CRITICAL") {
        pVal = prStr;
      }

      results.push({
        issueId: issue.id,
        publicId,
        title: issue.title,
        similarityScore: Math.min(99, Math.max(55, percentage)),
        location: issueLoc || issue.district || "Jharkhand",
        reportCount: issue.reportCount ?? issue.report_count ?? 1,
        priority: pVal,
        status: issue.status || "Reported",
        matchedTokens: matches,
      });
    }
  }

  // Sort by highest similarity score
  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}
