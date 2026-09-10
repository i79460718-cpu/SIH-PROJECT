import * as fs from 'fs';

const filePath = 'artifacts/civicforge/src/components/civic-shell.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `            {/* Language Switcher */}
            <div className="ml-2 flex items-center gap-1 rounded bg-white/10 p-0.5 text-[11px]">
              <Globe2 size={12} className="ml-1 text-stone-300" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={\`rounded px-1.5 py-0.5 font-bold transition-colors \${
                  lang === "en" ? "bg-[hsl(var(--primary))] text-white" : "text-stone-300 hover:text-white"
                }\`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={\`rounded px-1.5 py-0.5 font-bold transition-colors \${
                  lang === "hi" ? "bg-[hsl(var(--primary))] text-white" : "text-stone-300 hover:text-white"
                }\`}
              >
                हिन्दी
              </button>
            </div>`;

const nextStr = `            {/* Language Switcher */}
            <div className="ml-2 flex items-center gap-1 rounded bg-white/10 p-1 text-[11px]">
              <Globe2 size={12} className="ml-1 text-stone-300" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-stone-100 font-bold focus:outline-none focus:ring-0 [&>option]:bg-[hsl(var(--foreground))] [&>option]:text-[hsl(var(--background))] cursor-pointer pr-1"
                aria-label="Select Language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="nag">नागपुरी</option>
                <option value="kho">खोरठा</option>
                <option value="kru">कुड़ुख</option>
                <option value="mun">मुंडारी</option>
                <option value="sat">ᱥᱟᱱᱛᱟᱲᱤ</option>
                <option value="ho">Ho</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>`;

code = code.replace(targetStr, nextStr);

fs.writeFileSync(filePath, code);
