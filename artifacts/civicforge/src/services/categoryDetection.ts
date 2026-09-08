export interface CategoryDetectionResult {
  category: string;
  confidence: number;
  detectedLanguage: "English" | "Hindi" | "Hinglish";
  reasons: string[];
}

export const CIVIC_CATEGORIES = [
  "Road Infrastructure",
  "Water Supply",
  "Electricity",
  "Sanitation",
  "Healthcare",
  "Education",
  "Drainage",
  "Public Safety",
  "Other",
] as const;

export type CivicCategory = (typeof CIVIC_CATEGORIES)[number];

const HINDI_DEVANAGARI = /[\u0900-\u097F]/;

const HINGLISH_INDICATORS = [
  "hai", "nahi", "raha", "rahi", "hoga", "karo", "bada", "bahut", "chahiye",
  "samne", "paas", "ke", "ki", "ka", "me", "mein", "par", "se", "aur", "pe"
];

const CATEGORY_KEYWORDS: Record<string, { weight: number; keywords: string[] }> = {
  "Road Infrastructure": {
    weight: 1,
    keywords: [
      "road", "sadak", "pothole", "khadda", "gaddha", "kaddha", "highway",
      "street", "footpath", "divider", "rasta", "marg", "tar", "asphalt",
      "pavement", "culvert", "chowk", "overbridge", "flyover", "speed breaker"
    ],
  },
  "Water Supply": {
    weight: 1,
    keywords: [
      "water", "pani", "paani", "jal", "pipe", "pipeline", "tap", "nal",
      "leak", "leakage", "supply", "tanker", "boring", "motor", "handpump",
      "drinking water", "ganda pani", "turbid", "pressure"
    ],
  },
  "Electricity": {
    weight: 1,
    keywords: [
      "electricity", "bijli", "power", "light", "street light", "streetlight",
      "wire", "taar", "pole", "khamba", "transformer", "spark", "sparking",
      "blackout", "load shedding", "low voltage", "fuse", "meter"
    ],
  },
  "Sanitation": {
    weight: 1,
    keywords: [
      "garbage", "kachra", "kuda", "waste", "dustbin", "trash", "dump",
      "safai", "sweeper", "smell", "foul", "badboo", "rotting", "litter",
      "dead animal", "solid waste", "cleaning"
    ],
  },
  "Drainage": {
    weight: 1,
    keywords: [
      "drain", "drainage", "naali", "nali", "gutter", "manhole", "sewer",
      "overflow", "clogged", "jam", "blocked", "waterlogging", "stagnant",
      "sewage", "cover", "dhakkan"
    ],
  },
  "Healthcare": {
    weight: 1,
    keywords: [
      "hospital", "clinic", "dispensary", "doctor", "nurse", "medicine",
      "dawai", "ambulance", "phc", "chc", "swasthya", "patient", "vaccine",
      "dengue", "malaria", "fogging"
    ],
  },
  "Education": {
    weight: 1,
    keywords: [
      "school", "vidyalaya", "college", "classroom", "desk", "blackboard",
      "teacher", "midday meal", "toilet school", "campus", "shiksha"
    ],
  },
  "Public Safety": {
    weight: 1,
    keywords: [
      "safety", "hazard", "fire", "danger", "khatra", "accident", "open pit",
      "stray dog", "dog bite", "traffic light", "cctv", "security", "illegal",
      "unauthorized", "collapse"
    ],
  },
};

export function detectCategory(text: string): CategoryDetectionResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Detect Language
  let language: "English" | "Hindi" | "Hinglish" = "English";
  if (HINDI_DEVANAGARI.test(trimmed)) {
    language = "Hindi";
  } else {
    const tokens = lower.split(/\s+/);
    const hinglishMatches = tokens.filter((t) => HINGLISH_INDICATORS.includes(t));
    if (hinglishMatches.length >= 2 || (hinglishMatches.length >= 1 && tokens.length <= 6)) {
      language = "Hinglish";
    }
  }

  let bestCategory = "Other";
  let highestScore = 0;
  let matchedKeywords: string[] = [];

  for (const [category, config] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const found: string[] = [];

    for (const kw of config.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        score += kw.includes(" ") ? 3 : 2;
        found.push(kw);
      } else if (kw.length >= 5 && lower.includes(kw)) {
        score += 1;
        found.push(kw);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
      matchedKeywords = found;
    }
  }

  // Calculate confidence percentage
  let confidence = 50;
  if (highestScore >= 4) {
    confidence = Math.min(98, 88 + highestScore * 2);
  } else if (highestScore >= 2) {
    confidence = Math.min(85, 72 + highestScore * 5);
  } else if (highestScore === 1) {
    confidence = 68;
  } else {
    confidence = 45;
  }

  const reasons =
    matchedKeywords.length > 0
      ? [`Matched intent signals: [${matchedKeywords.slice(0, 4).join(", ")}]`]
      : ["Defaulted to General Civic Administration based on semantic distribution"];

  return {
    category: bestCategory,
    confidence,
    detectedLanguage: language,
    reasons,
  };
}
