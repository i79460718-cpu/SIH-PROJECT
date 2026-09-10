import * as fs from 'fs';

const filePath = 'artifacts/civicforge/src/components/civic-shell.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `<select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-stone-100 font-bold focus:outline-none focus:ring-0 [&>option]:bg-[hsl(var(--foreground))] [&>option]:text-[hsl(var(--background))] cursor-pointer pr-1"
                aria-label="Select Language"
              >
                <option value="en">English</option>`;

const nextStr = `<select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-stone-100 font-bold focus:outline-none focus:ring-0 [&>option]:bg-[hsl(var(--foreground))] [&>option]:text-[hsl(var(--background))] cursor-pointer pr-1"
                aria-label="Select Language"
              >
                <option value="auto">Auto Detect</option>
                <option value="en">English</option>`;

code = code.replace(targetStr, nextStr);

fs.writeFileSync(filePath, code);
