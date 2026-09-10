export type SpamClassification =
  | "Valid"
  | "Spam"
  | "Advertisement"
  | "Abusive"
  | "Suspicious Repetition";

export interface SpamCheckResult {
  isSpam: boolean;
  spamScore: number;
  classification: SpamClassification;
  abusiveContent: boolean;
  reasons: string[];
}

const AD_PATTERNS = [
  /buy\s+(cheap\s+)?(crypto|bitcoin|nft|followers|shoes|viagra|course|now)/i,
  /win\s+(free\s+)?(iphone|cash|money|prize|crypto)/i,
  /click\s+(here|link|to\s+win)/i,
  /call\s+(for\s+loan|for\s+escort|girls|whatsapp\s+now|now\s+for)/i,
  /earn\s+(\$|rs|inr|\d+k|\d+\s*lakh)\s+(daily|weekly|from\s+home)/i,
  /casino|poker|lottery|jackpot|free\s+recharge|rummy/i,
  /seo\s+services?|telegram\s+channel/i,
  /\b(crypto|bitcoin|nft|airdrop)\b/i,
  /telegram\s*:\s*@/i,
  /100%\s+guaranteed\s+(profit|returns|loan)/i,
];

const ABUSIVE_WORDS = [
  "chutiya", "madarchod", "bhosdike", "harami", "kamine", "gaand", "randi",
  "fuck", "bastard", "bitch", "asshole", "motherfucker", "idiots", "kutta",
  "saale", "kamina"
];

const GIBBERISH_REGEX = /^[bcdfghjklmnpqrstvwxyz]{6,}$/i;
const REPEATED_CHAR_REGEX = /(.)\1{5,}/;

export function checkSpam(text: string): SpamCheckResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const reasons: string[] = [];

  // 1. Too short
  if (trimmed.length < 5) {
    return {
      isSpam: true,
      spamScore: 85,
      classification: "Spam",
      abusiveContent: false,
      reasons: ["Input is too brief to describe a civic grievance (minimum 5 characters required)"],
    };
  }

  // 2. Advertisements / Commercial promotion
  for (const pattern of AD_PATTERNS) {
    if (pattern.test(lower)) {
      reasons.push("Commercial, promotional, or unauthorized marketing pattern detected");
      return {
        isSpam: true,
        spamScore: 95,
        classification: "Advertisement",
        abusiveContent: false,
        reasons,
      };
    }
  }

  // 3. Abusive / Profanity check
  const abusiveMatches = ABUSIVE_WORDS.filter((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });

  if (abusiveMatches.length > 0) {
    reasons.push(`Inappropriate or abusive language identified: [${abusiveMatches.join(", ")}]`);
    return {
      isSpam: true,
      spamScore: 90,
      classification: "Abusive",
      abusiveContent: true,
      reasons,
    };
  }

  // 4. Repeated character or key mashing
  if (REPEATED_CHAR_REGEX.test(lower)) {
    reasons.push("Suspicious repeated character sequence detected");
    return {
      isSpam: true,
      spamScore: 78,
      classification: "Suspicious Repetition",
      abusiveContent: false,
      reasons,
    };
  }

  // 5. Gibberish consonant sequence
  const words = lower.split(/\s+/);
  const gibberishWord = words.find((w) => w.length >= 6 && GIBBERISH_REGEX.test(w));
  if (gibberishWord) {
    reasons.push(`Unintelligible non-word string detected: "${gibberishWord}"`);
    return {
      isSpam: true,
      spamScore: 75,
      classification: "Suspicious Repetition",
      abusiveContent: false,
      reasons,
    };
  }

  // 6. Suspicious repeated phrases (e.g. "test test test test")
  if (words.length >= 4) {
    const uniqueWords = new Set(words);
    if (uniqueWords.size === 1) {
      reasons.push("Excessive identical word repetition");
      return {
        isSpam: true,
        spamScore: 80,
        classification: "Suspicious Repetition",
        abusiveContent: false,
        reasons,
      };
    }
  }

  // Clean civic report
  return {
    isSpam: false,
    spamScore: 3,
    classification: "Valid",
    abusiveContent: false,
    reasons: ["Legitimate civic grievance pattern validated"],
  };
}
