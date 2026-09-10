import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DICTIONARY } from "./translations";

export type Language = "auto" | "en" | "hi" | "nag" | "kho" | "kru" | "mun" | "sat" | "ho" | "bn";

export const districtLanguageSuggestions: Record<string, Language[]> = {
  "Ranchi": ["hi", "nag", "mun", "kru"],
  "Jamshedpur": ["hi", "ho", "sat", "mun"],
  "Dhanbad": ["hi", "bn", "kho"],
  "Bokaro": ["hi", "kho", "bn", "sat"],
  "Deoghar": ["hi", "sat", "bn"],
  "Hazaribagh": ["hi", "kho", "nag"],
  "default": ["hi", "en"],
};

export function getSuggestedLanguagesForDistrict(district: string): Language[] {
  return districtLanguageSuggestions[district] || districtLanguageSuggestions["default"];
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

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

  const getTranslation = (key: string, currentLang: Language): string => {
    // If auto is selected, maybe we fallback to English or user's preference based on district/IP.
    // For now, if "auto", we default logic to "en" just to prevent breakage in lookup
    const lookupLang = currentLang === "auto" ? "en" : currentLang;

    // Check if key exists at all in the core english dictionary
    const engDict = DICTIONARY["en"];
    if (!engDict || !engDict[key]) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[JANSAMVAD i18n] Missing base translation key: "${key}"`);
      }
      return key; // return key itself as ultimate fail
    }

    // Try current language directly
    const currentDict = DICTIONARY[lookupLang];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }

    // Graceful fallback system: Regional -> Hindi -> English
    if (process.env.NODE_ENV === "development") {
      console.warn(`[JANSAMVAD i18n] Missing translation for key "${key}" in language "${lookupLang}". Falling back...`);
    }

    // Fallback to Hindi if not English
    if (lookupLang !== "en") {
      const hiDict = DICTIONARY["hi"];
      if (hiDict && hiDict[key]) {
        return hiDict[key];
      }
    }

    // Ultimate fallback is English
    return engDict[key];
  };

  const t = (key: string): string => getTranslation(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
