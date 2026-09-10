import { useState, useRef, useEffect } from "react";
import { Globe2, Check, ChevronDown } from "lucide-react";
import { useLanguage, type Language } from "../lib/language-context";

const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: "auto", label: "Auto", name: "Auto Detect" },
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "HI", name: "हिन्दी (Hindi)" },
  { code: "nag", label: "NAG", name: "नागपुरी (Nagpuri)" },
  { code: "kho", label: "KHO", name: "खोरठा (Khortha)" },
  { code: "kru", label: "KRU", name: "कुड़ुख (Kurukh)" },
  { code: "mun", label: "MUN", name: "मुंडारी (Mundari)" },
  { code: "sat", label: "SAT", name: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)" },
  { code: "ho", label: "HO", name: "Ho" },
  { code: "bn", label: "BN", name: "বাংলা (Bengali)" },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[1];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50 ml-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--background)/.1)] hover:bg-[hsl(var(--background)/.2)] px-2 py-1 text-[11px] font-bold text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-1 focus:ring-offset-[hsl(var(--foreground))]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Language"
      >
        <Globe2 size={13} className="text-stone-300" />
        <span>{selected.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 origin-top-right rounded-t-none rounded-b-xl sm:rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-[4px_4px_0_hsl(var(--foreground)/.15)] animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
        >
          <div className="mb-1 px-2 pb-1 pt-1 border-b border-[hsl(var(--border))]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t("nav.language")}</p>
          </div>
          <div className="flex max-h-60 flex-col overflow-y-auto">
            {LANGUAGES.map((option) => {
              const takesAccent = option.code === lang;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="option"
                  aria-selected={takesAccent}
                  onClick={() => handleSelect(option.code)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-[hsl(var(--muted))] ${
                    takesAccent
                      ? "bg-[hsl(var(--primary)/.1)] font-bold text-[hsl(var(--primary))]"
                      : "font-semibold text-[hsl(var(--foreground))]"
                  }`}
                >
                  <span className="truncate">{option.name}</span>
                  {takesAccent && <Check size={14} strokeWidth={3} className="text-[hsl(var(--primary))]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
