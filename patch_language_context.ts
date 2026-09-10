import * as fs from 'fs';

const filePath = 'artifacts/civicforge/src/lib/language-context.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  `export type Language = "en" | "hi" | "nag" | "kho" | "kru" | "mun" | "sat" | "ho" | "bn";`,
  `export type Language = "auto" | "en" | "hi" | "nag" | "kho" | "kru" | "mun" | "sat" | "ho" | "bn";`
);

fs.writeFileSync(filePath, code);
