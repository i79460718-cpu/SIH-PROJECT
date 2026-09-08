import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "nav.report": { en: "Report Issue", hi: "समस्या दर्ज करें" },
  "nav.issues": { en: "Live Issues", hi: "सक्रिय शिकायतें" },
  "nav.map": { en: "Issue Map", hi: "शिकायत मानचित्र" },
  "nav.ai": { en: "AI Intelligence", hi: "एआई इंटेलिजेंस" },
  "nav.officer": { en: "Officer Portal", hi: "अधिकारी पोर्टल" },
  "nav.track": { en: "Track Complaint", hi: "शिकायत ट्रैक करें" },

  // Hero
  "hero.title1": { en: "One Issue.", hi: "एक समस्या।" },
  "hero.title2": { en: "One Record.", hi: "एक रिकॉर्ड।" },
  "hero.title3": { en: "Faster Resolution.", hi: "तेज़ समाधान।" },
  "hero.desc": {
    en: "AI-powered grievance intelligence that detects spam, merges duplicate complaints and connects citizens, departments and field officers in real time.",
    hi: "एआई-संचालित जन शिकायत प्रणाली जो स्पैम हटाती है, एक जैसी शिकायतों को जोड़ती है और नागरिकों, विभागों व फील्ड अधिकारियों को रीयल-टाइम में जोड़ती है।"
  },
  "hero.cta.report": { en: "Report an Issue", hi: "समस्या दर्ज करें" },
  "hero.cta.track": { en: "Track Complaint", hi: "शिकायत स्थिति देखें" },

  // Metrics
  "metric.reportsReceived": { en: "Reports Received", hi: "प्राप्त शिकायतें" },
  "metric.duplicatesMerged": { en: "Duplicates Merged", hi: "समेकित डुप्लिकेट्स" },
  "metric.spamBlocked": { en: "Spam Reports Blocked", hi: "रोके गए स्पैम" },
  "metric.resolvedToday": { en: "Resolved Today", hi: "आज समाधान" },
  "metric.resolutionRate": { en: "Resolution Rate", hi: "समाधान दर" },

  // Statuses
  "status.Reported": { en: "Reported", hi: "दर्ज की गई" },
  "status.AI Verified": { en: "AI Verified", hi: "एआई सत्यापित" },
  "status.Routed": { en: "Routed", hi: "विभाग प्रेषित" },
  "status.Officer Assigned": { en: "Officer Assigned", hi: "अधिकारी नियुक्त" },
  "status.Accepted": { en: "Accepted", hi: "स्वीकृत" },
  "status.Work Started": { en: "Work Started", hi: "कार्य प्रगति पर" },
  "status.Resolved - Awaiting Verification": { en: "Awaiting Verification", hi: "सत्यापन हेतु लंबित" },
  "status.Resolved": { en: "Resolved", hi: "समाधान संपन्न" },
  "status.Escalated": { en: "Escalated", hi: "उच्चाधिकारी को प्रेषित" },

  // Priorities
  "priority.CRITICAL": { en: "CRITICAL", hi: "अति-गंभीर" },
  "priority.HIGH": { en: "HIGH", hi: "उच्च" },
  "priority.MEDIUM": { en: "MEDIUM", hi: "मध्यम" },
  "priority.LOW": { en: "LOW", hi: "सामान्य" },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("jansamvad_lang") as Language) || "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("jansamvad_lang", newLang);
  };

  const t = (key: string): string => {
    return DICTIONARY[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
