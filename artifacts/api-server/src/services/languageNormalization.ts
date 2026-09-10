import { detectLanguage, type SupportedLanguage } from "./languageDetection";

export interface NormalizationResult {
  originalText: string;
  originalLanguage: SupportedLanguage;
  normalizedDescription: string;
  normalizedIntent: string;
  confidence: number;
}

const REGIONAL_SYNONYMS: Record<string, string> = {
  // Add graceful translation representations for testing
  "khadda": "pothole",
  "gaddha": "pothole",
  "kaddha": "pothole",
  "gatha": "pothole",
  "hole": "pothole",
  "potholes": "pothole",
  "गड्ढा": "pothole",
  "sadak": "road",
  "rasta": "road",
  "सड़क": "road",
  "paani": "water",
  "pani": "water",
  "पानी": "water",
  "jal": "water",
  "nal": "pipe",
  "pipeline": "pipe",
  "leak": "leakage",
  "risav": "leakage",
  "bijli": "electricity",
  "बिजली": "electricity",
  "vidyut": "electricity",
  "wire": "wire",
  "taar": "wire",
  "तार": "wire",
  "current": "electricity",
  "sparking": "sparking",
  "kachra": "garbage",
  "कचरा": "garbage",
  "kuda": "garbage",
  "safai": "sanitation",
  "dustbin": "dustbin",
  "gandagi": "garbage",
  "naali": "drainage",
  "nali": "drainage",
  "नाली": "drainage",
  "drain": "drainage",
  "gutter": "drainage",
  "manhole": "drainage",
};

export function normalizeComplaint(text: string): NormalizationResult {
  const langResult = detectLanguage(text);
  
  // Here we normalize by translating basic regional intent to English canonical intent
  // so the rest of the existing duplicateDetection/routing pipeline can rely on it.
  
  let normalizedDescription = text.toLowerCase();
  
  // Basic heuristic normalization for demo
  const tokens = normalizedDescription.replace(/[^\w\sऀ-ॿ]/g, " ").split(/\s+/);
  const normalizedTokens = tokens.map(token => {
    return REGIONAL_SYNONYMS[token] || token;
  });
  
  normalizedDescription = normalizedTokens.join(" ");
  
  // Determine canonical intent
  let normalizedIntent = "Civic grievance reported";
  if (/pothole|road|asphalt|culvert|bridge/i.test(normalizedDescription)) {
    normalizedIntent = "Road damage or hazardous pothole requiring resurfacing";
  } else if (/water|pipe|leakage|supply/i.test(normalizedDescription)) {
    normalizedIntent = "Water pipeline leakage or clean drinking water disruption";
  } else if (/electricity|power|wire|sparking|transformer/i.test(normalizedDescription)) {
    normalizedIntent = "Electrical hazard, sparking power line, or outage";
  } else if (/garbage|sanitation|dustbin/i.test(normalizedDescription)) {
    normalizedIntent = "Uncollected municipal waste and garbage overflow";
  } else if (/drainage|manhole/i.test(normalizedDescription)) {
    normalizedIntent = "Blocked stormwater drainage or open manhole safety hazard";
  }
  
  return {
    originalText: text,
    originalLanguage: langResult.detectedLanguage,
    normalizedDescription: normalizedDescription,
    normalizedIntent: normalizedIntent,
    confidence: langResult.confidence,
  };
}
