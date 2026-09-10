import * as fs from 'fs';

const filePath = 'artifacts/civicforge/src/lib/language-context.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `export type Language = "auto" | "en" | "hi" | "nag" | "kho" | "kru" | "mun" | "sat" | "ho" | "bn";`;

const nextStr = `export type Language = "auto" | "en" | "hi" | "nag" | "kho" | "kru" | "mun" | "sat" | "ho" | "bn";

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
}`;

code = code.replace(targetStr, nextStr);

fs.writeFileSync(filePath, code);
