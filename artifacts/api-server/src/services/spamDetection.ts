export interface SpamCheckResult {
  isSpam: boolean;
  spamScore: number;
  classification: "Valid" | "Spam" | "Advertisement" | "Abusive" | "Suspicious Repetition";
  abusiveContent: boolean;
  reasons: string[];
}

const AD_PATTERNS = [
  /buy\s+(now|crypto|bitcoin|followers|shoes|viagra)/i,
  /call\s+(for\s+loan|for\s+escort|girls|whatsapp\s+now)/i,
  /earn\s+(\$|rs|inr|\d+k)\s+(daily|weekly|from\s+home)/i,
  /casino|poker|lottery|jackpot|free\s+recharge/i,
  /seo\s+services?|click\s+here\s+to\s+win/i,
];

const ABUSIVE_WORDS = [
  "chutiya", "madarchod", "bhosdike", "harami", "kamine", "gaand", "randi",
  "fuck", "bastard", "bitch", "asshole", "motherfucker", "idiots"
];

const GIBBERISH_REGEX = /^[bcdfghjklmnpqrstvwxyz]{6,}$/i;
const REPEATED_CHAR_REGEX = /(.)\1{5,}/;

export function checkSpam(text: string): SpamCheckResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const reasons: string[] = [];

  if (trimmed.length < 5) {
    return {
      isSpam: true,
      spamScore: 85,
      classification: "Spam",
      abusiveContent: false,
      reasons: ["Input is too brief to describe a civic grievance"],
    };
  }

  // Check Advertisements
  for (const pattern of AD_PATTERNS) {
    if (pattern.test(lower)) {
      reasons.push("Commercial or promotional content detected");
      return {
        isSpam: true,
        spamScore: 95,
        classification: "Advertisement",
        abusiveContent: false,
        reasons,
      };
    }
  }

  // Check Abusive
  const hasAbusive = ABUSIVE_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });

  if (hasAbusive) {
    reasons.push("Inappropriate or abusive language detected");
    return {
      isSpam: true,
      spamScore: 92,
      classification: "Abusive",
      abusiveContent: true,
      reasons,
    };
  }

  // Check Gibberish
  if (GIBBERISH_REGEX.test(lower) || REPEATED_CHAR_REGEX.test(lower)) {
    reasons.push("Random or repetitive keyboard sequences detected");
    return {
      isSpam: true,
      spamScore: 88,
      classification: "Suspicious Repetition",
      abusiveContent: false,
      reasons,
    };
  }

  return {
    isSpam: false,
    spamScore: 3,
    classification: "Valid",
    abusiveContent: false,
    reasons: [],
  };
}
