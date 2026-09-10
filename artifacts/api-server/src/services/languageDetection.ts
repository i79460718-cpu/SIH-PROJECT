export type SupportedLanguage = 
  | "English" | "Hindi" | "Hinglish" | "Nagpuri" | "Khortha" 
  | "Kurukh" | "Mundari" | "Santali" | "Ho" | "Bengali" | "Unknown";

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  // Graceful heuristic fallback since true LLM/API might be missing
  const lower = text.toLowerCase();
  
  if (/[ऀ-ॿ]/.test(text)) {
    // Contains Devanagari 
    // Heuristics for basic Hindi vs Nagpur/Khortha in Devanagari:
    if (lower.includes("रस्ता मं") || lower.includes("हाय") || lower.includes("रोडवा")) {
        return { detectedLanguage: "Nagpuri", confidence: 85 };
    }
    return { detectedLanguage: "Hindi", confidence: 95 };
  } else if (/[ঀ-৿]/.test(text)) {
    // Bengali script
    return { detectedLanguage: "Bengali", confidence: 98 };
  } else if (/[᱐-᱿]/.test(text)) {
    // Ol Chiki script (Santali)
    return { detectedLanguage: "Santali", confidence: 99 };
  }
  
  // Roman script checks
  const hinglishWords = ["ke", "ki", "ka", "mein", "par", "hai", "khadda", "sadak", "paani", "bijli", "kachra", "naali", "bada", "bahut", "kripya"];
  const hasHinglish = hinglishWords.some(w => new RegExp(`\b${w}\b`, "i").test(text));
  
  if (hasHinglish) {
    return { detectedLanguage: "Hinglish", confidence: 88 };
  }
  
  // Default to English if strictly roman and no Hinglish markers
  return { detectedLanguage: "English", confidence: 90 };
}
