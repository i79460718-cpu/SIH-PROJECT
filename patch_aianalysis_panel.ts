import * as fs from 'fs';

const filePath = 'artifacts/civicforge/src/components/AiAnalysisPanel.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const target1 = `<p className="mono-font text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Language: {analysis.detectedLanguage} • Pre-screened
            </p>`;
const next1 = `<p className="mono-font text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Language: {analysis.detectedLanguage} {analysis.languageConfidence ? \`(\${analysis.languageConfidence}%)\` : ""} • Pre-screened
            </p>`;

code = code.replace(target1, next1);

const target2 = `        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Abusive Content</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-emerald-600">None detected</span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-500">Passed safety filter</p>
        </div>`;

const next2 = `        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mono-font text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Normalized Intent</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-xs font-bold text-[hsl(var(--foreground))]">{analysis.normalizedIntent || "Verified Civic Issue"}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-500">Cross-language meaning</p>
        </div>`;

code = code.replace(target2, next2);

fs.writeFileSync(filePath, code);
